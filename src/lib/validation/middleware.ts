/**
 * =====================================================
 * MIDDLEWARE DE VALIDAÇÃO PARA APIs
 * =====================================================
 * Middleware para validação rigorosa em Edge Functions e APIs
 */

import { z } from "zod";
import type {
  SanitizationOptions 
} from "./utils";
import { 
  sanitizeObject, 
  validateData, 
  ValidationResult 
} from "./utils";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface ValidationMiddlewareOptions {
  sanitize?: boolean
  sanitizationOptions?: SanitizationOptions
  allowPartial?: boolean
  stripUnknown?: boolean
}

interface ApiValidationResult<T> {
  success: boolean
  data?: T
  errors?: Array<{
    field: string
    message: string
    code: string
  }>
  statusCode: number
}

interface RequestValidationConfig<T> {
  body?: z.ZodSchema<T>
  query?: z.ZodSchema<any>
  params?: z.ZodSchema<any>
  headers?: z.ZodSchema<any>
}

// ============================================================================
// MIDDLEWARE DE VALIDAÇÃO PRINCIPAL
// ============================================================================

/**
 * Cria middleware de validação para APIs
 */
export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>,
  options: ValidationMiddlewareOptions = {}
) {
  const {
    sanitize = true,
    sanitizationOptions = {},
    allowPartial = false,
    stripUnknown = true
  } = options;

  return async (data: unknown): Promise<ApiValidationResult<T>> => {
    try {
      let processedData = data;

      // Sanitizar dados se habilitado
      if (sanitize && typeof processedData === "object" && processedData !== null) {
        processedData = sanitizeObject(
          processedData as Record<string, any>, 
          sanitizationOptions
        );
      }

      // Configurar schema baseado nas opções
      let validationSchema = schema;
      
      if (allowPartial) {
        validationSchema = schema.partial() as z.ZodSchema<T>;
      }
      
      if (stripUnknown) {
        validationSchema = validationSchema.strip() as z.ZodSchema<T>;
      }

      // Validar dados
      const result = validateData(validationSchema, processedData);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          statusCode: 200
        };
      } else {
        return {
          success: false,
          errors: result.errors,
          statusCode: 400
        };
      }
    } catch (error) {
      console.error("Erro no middleware de validação:", error);
      
      return {
        success: false,
        errors: [{
          field: "system",
          message: "Erro interno de validação",
          code: "VALIDATION_ERROR"
        }],
        statusCode: 500
      };
    }
  };
}

/**
 * Middleware para validação de requisições HTTP completas
 */
export function createRequestValidationMiddleware<T>(
  config: RequestValidationConfig<T>
) {
  return async (request: {
    body?: unknown
    query?: unknown
    params?: unknown
    headers?: unknown
  }): Promise<{
    success: boolean
    data?: {
      body?: T
      query?: any
      params?: any
      headers?: any
    }
    errors?: Array<{
      field: string
      message: string
      code: string
      source: "body" | "query" | "params" | "headers"
    }>
    statusCode: number
  }> => {
    const validatedData: any = {};
    const allErrors: any[] = [];

    // Validar body
    if (config.body && request.body !== undefined) {
      const bodyValidation = await createValidationMiddleware(config.body);
      const bodyResult = await bodyValidation(request.body);
      
      if (bodyResult.success) {
        validatedData.body = bodyResult.data;
      } else {
        allErrors.push(...(bodyResult.errors || []).map(error => ({
          ...error,
          source: "body" as const
        })));
      }
    }

    // Validar query parameters
    if (config.query && request.query !== undefined) {
      const queryValidation = await createValidationMiddleware(config.query);
      const queryResult = await queryValidation(request.query);
      
      if (queryResult.success) {
        validatedData.query = queryResult.data;
      } else {
        allErrors.push(...(queryResult.errors || []).map(error => ({
          ...error,
          source: "query" as const
        })));
      }
    }

    // Validar path parameters
    if (config.params && request.params !== undefined) {
      const paramsValidation = await createValidationMiddleware(config.params);
      const paramsResult = await paramsValidation(request.params);
      
      if (paramsResult.success) {
        validatedData.params = paramsResult.data;
      } else {
        allErrors.push(...(paramsResult.errors || []).map(error => ({
          ...error,
          source: "params" as const
        })));
      }
    }

    // Validar headers
    if (config.headers && request.headers !== undefined) {
      const headersValidation = await createValidationMiddleware(config.headers);
      const headersResult = await headersValidation(request.headers);
      
      if (headersResult.success) {
        validatedData.headers = headersResult.data;
      } else {
        allErrors.push(...(headersResult.errors || []).map(error => ({
          ...error,
          source: "headers" as const
        })));
      }
    }

    if (allErrors.length > 0) {
      return {
        success: false,
        errors: allErrors,
        statusCode: 400
      };
    }

    return {
      success: true,
      data: validatedData,
      statusCode: 200
    };
  };
}

// ============================================================================
// UTILITÁRIOS PARA EDGE FUNCTIONS
// ============================================================================

/**
 * Wrapper para Edge Functions com validação automática
 */
export function withValidation<TBody, TQuery = any, TParams = any>(
  config: RequestValidationConfig<TBody>,
  handler: (validatedData: {
    body?: TBody
    query?: TQuery
    params?: TParams
    headers?: any
  }) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    try {
      // Extrair dados da requisição
      const url = new URL(request.url);
      const requestData: any = {};

      // Body (se presente)
      if (request.method !== "GET" && request.method !== "HEAD") {
        try {
          const contentType = request.headers.get("content-type") || "";
          
          if (contentType.includes("application/json")) {
            requestData.body = await request.json();
          } else if (contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await request.formData();
            requestData.body = Object.fromEntries(formData.entries());
          }
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: "Invalid request body",
              message: "Could not parse request body"
            }),
            { 
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      }

      // Query parameters
      requestData.query = Object.fromEntries(url.searchParams.entries());

      // Headers (filtrar apenas os necessários)
      requestData.headers = Object.fromEntries(
        Array.from(request.headers.entries())
      );

      // Validar requisição
      const validator = createRequestValidationMiddleware(config);
      const validationResult = await validator(requestData);

      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            error: "Validation failed",
            details: validationResult.errors
          }),
          { 
            status: validationResult.statusCode,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Executar handler com dados validados
      return await handler(validationResult.data!);
      
    } catch (error) {
      console.error("Erro na Edge Function:", error);
      
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: "An unexpected error occurred"
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  };
}

/**
 * Middleware específico para validação de autenticação
 */
export function withAuth<T>(
  validationConfig: RequestValidationConfig<T>,
  handler: (validatedData: any, user: any) => Promise<Response>
) {
  return withValidation(validationConfig, async (validatedData) => {
    // Verificar token de autenticação
    const authHeader = validatedData.headers?.authorization;
    
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Missing or invalid authorization header"
        }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    // Aqui você validaria o token JWT
    // Por simplicidade, assumindo que o token é válido
    const user = { id: "user-id", email: "user@example.com" };

    return await handler(validatedData, user);
  });
}

// ============================================================================
// SCHEMAS PARA VALIDAÇÃO DE REQUISIÇÕES COMUNS
// ============================================================================

// Schema para paginação
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc")
});

// Schema para filtros de busca
export const SearchSchema = z.object({
  q: z.string().max(100).optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

// Schema para headers comuns
export const CommonHeadersSchema = z.object({
  "content-type": z.string().optional(),
  "user-agent": z.string().optional(),
  "x-forwarded-for": z.string().optional(),
  authorization: z.string().optional()
});

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

/*
// Exemplo 1: Edge Function simples com validação de body
export const createPatientFunction = withValidation(
  { body: PatientSchema },
  async ({ body }) => {
    // body já está validado e tipado como Patient
    const patient = await createPatient(body!)
    
    return new Response(
      JSON.stringify({ success: true, data: patient }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
)

// Exemplo 2: Edge Function com validação completa
export const searchPatientsFunction = withValidation(
  {
    query: SearchSchema.merge(PaginationSchema),
    headers: CommonHeadersSchema
  },
  async ({ query }) => {
    const patients = await searchPatients(query!)
    
    return new Response(
      JSON.stringify({ success: true, data: patients }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
)

// Exemplo 3: Edge Function com autenticação
export const updatePatientFunction = withAuth(
  {
    body: PatientSchema.partial(),
    params: z.object({ id: z.string().uuid() })
  },
  async ({ body, params }, user) => {
    const updatedPatient = await updatePatient(params!.id, body!, user)
    
    return new Response(
      JSON.stringify({ success: true, data: updatedPatient }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
)
*/