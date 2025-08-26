/**
 * Template processing utilities for notification templates
 */

import type { 
  NotificationTemplateInput, 
  TemplateError, 
  TemplateProcessingResult, 
  TemplateSampleData,
  TemplateValidationRules} from "@/types/notificationTemplates";
import { 
  DEFAULT_SAMPLE_DATA,
  TemplateErrorType
} from "@/types/notificationTemplates";

// Validation rules for templates
export const templateValidationRules: TemplateValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9_-]+$/,
    message: "Nome deve conter apenas letras, números, _ e - (3-100 caracteres)"
  },
  subject: {
    required: (type: string) => type === "email",
    maxLength: 200,
    message: "Assunto é obrigatório para templates de email (máx. 200 caracteres)"
  },
  content: {
    required: true,
    minLength: 10,
    maxLength: 5000,
    message: "Conteúdo deve ter entre 10 e 5000 caracteres"
  }
};

// Regular expression to find template variables
const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;
const CONDITIONAL_REGEX = /\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

// Available variables for templates
export const AVAILABLE_VARIABLES = {
  patient_name: "Nome completo do paciente",
  patient_email: "Email do paciente",
  event_title: "Título do evento",
  event_date: "Data do evento (formato DD/MM/YYYY)",
  event_time: "Horário do evento (formato HH:MM - HH:MM)",
  event_location: "Nome do local do evento",
  event_address: "Endereço completo do evento",
  event_city: "Cidade do evento",
  confirmation_link: "Link para confirmação de presença",
  unsubscribe_link: "Link para descadastro"
};

/**
 * Validates a template according to the defined rules
 */
export function validateTemplate(template: NotificationTemplateInput): TemplateError[] {
  const errors: TemplateError[] = [];

  // Validate name
  if (!template.name) {
    errors.push({
      type: TemplateErrorType.VALIDATION_ERROR,
      message: "Nome é obrigatório",
      field: "name"
    });
  } else if (template.name.length < templateValidationRules.name.minLength) {
    errors.push({
      type: TemplateErrorType.VALIDATION_ERROR,
      message: `Nome deve ter pelo menos ${templateValidationRules.name.minLength} caracteres`,
      field: "name"
    });
  } else if (template.name.length > templateValidationRules.name.maxLength) {
    errors.push({
      type: TemplateErrorType.VALIDATION_ERROR,
      message: `Nome deve ter no máximo ${templateValidationRules.name.maxLength} caracteres`,
      field: "name"
    });
  } else if (!templateValidationRules.name.pattern.test(template.name)) {
    errors.push({
      type: TemplateErrorType.VALIDATION_ERROR,
      message: templateValidationRules.name.message,
      field: "name"
    });
  }

  // Validate subject (required for email)
  if (template.type === "email") {
    if (!template.subject || template.subject.trim() === "") {
      errors.push({
        type: TemplateErrorType.VALIDATION_ERROR,
        message: "Assunto é obrigatório para templates de email",
        field: "subject"
      });
    } else if (template.subject.length > templateValidationRules.subject.maxLength) {
      errors.push({
        type: TemplateErrorType.VALIDATION_ERROR,
        message: `Assunto deve ter no máximo ${templateValidationRules.subject.maxLength} caracteres`,
        field: "subject"
      });
    }
  }

  // SMS specific validation
  if (template.type === "sms" && template.content.length > 1600) {
    errors.push({
      type: TemplateErrorType.VALIDATION_ERROR,
      message: "SMS deve ter no máximo 1600 caracteres",
      field: "content"
    });
  }

  // Validate content
  if (!template.content || template.content.trim() === "") {
    errors.push({
      type: TemplateErrorType.VALIDATION_ERROR,
      message: "Conteúdo é obrigatório",
      field: "content"
    });
  } else if (template.content.length < templateValidationRules.content.minLength) {
    errors.push({
      type: TemplateErrorType.VALIDATION_ERROR,
      message: `Conteúdo deve ter pelo menos ${templateValidationRules.content.minLength} caracteres`,
      field: "content"
    });
  } else if (template.content.length > templateValidationRules.content.maxLength) {
    errors.push({
      type: TemplateErrorType.VALIDATION_ERROR,
      message: `Conteúdo deve ter no máximo ${templateValidationRules.content.maxLength} caracteres`,
      field: "content"
    });
  }

  return errors;
}

/**
 * Extracts variables from template content
 */
export function extractVariables(content: string): string[] {
  const variables: string[] = [];
  const matches = content.matchAll(VARIABLE_REGEX);
  
  for (const match of matches) {
    const variable = match[1].trim();
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }
  
  return variables;
}

/**
 * Validates variables in template content
 */
export function validateVariables(content: string, subject?: string): TemplateError[] {
  const errors: TemplateError[] = [];
  const allContent = `${subject || ""} ${content}`;
  const variables = extractVariables(allContent);
  
  for (const variable of variables) {
    if (!Object.prototype.hasOwnProperty.call(AVAILABLE_VARIABLES, variable)) {
      errors.push({
        type: TemplateErrorType.VARIABLE_ERROR,
        message: `Variável desconhecida: {{${variable}}}`,
        field: "content",
        details: `Variáveis disponíveis: ${Object.keys(AVAILABLE_VARIABLES).join(", ")}`
      });
    }
  }
  
  return errors;
}

/**
 * Processes conditional blocks in template content
 */
function processConditionals(content: string, data: TemplateSampleData): string {
  return content.replace(CONDITIONAL_REGEX, (match, variable, innerContent) => {
    const value = data[variable as keyof TemplateSampleData];
    return value ? innerContent : "";
  });
}

/**
 * Substitutes variables in template content with actual data
 */
export function substituteVariables(content: string, data: TemplateSampleData): string {
  // First process conditional blocks
  let processedContent = processConditionals(content, data);
  
  // Then substitute regular variables
  processedContent = processedContent.replace(VARIABLE_REGEX, (match, variable) => {
    const key = variable.trim() as keyof TemplateSampleData;
    const value = data[key];
    
    if (value !== undefined && value !== null) {
      return String(value);
    }
    
    // Return original placeholder if variable not found
    return match;
  });
  
  return processedContent;
}

/**
 * Processes a complete template with data substitution
 */
export function processTemplate(
  template: NotificationTemplateInput, 
  data: TemplateSampleData = DEFAULT_SAMPLE_DATA
): TemplateProcessingResult {
  const errors: TemplateError[] = [];
  const warnings: string[] = [];
  
  // Validate template structure
  const validationErrors = validateTemplate(template);
  errors.push(...validationErrors);
  
  // Validate variables
  const variableErrors = validateVariables(template.content, template.subject);
  errors.push(...variableErrors);
  
  // If there are critical errors, return early
  if (errors.length > 0) {
    return {
      success: false,
      processedContent: template.content,
      processedSubject: template.subject,
      errors,
      warnings
    };
  }
  
  try {
    // Process content
    const processedContent = substituteVariables(template.content, data);
    
    // Process subject (if exists)
    let processedSubject: string | undefined;
    if (template.subject) {
      processedSubject = substituteVariables(template.subject, data);
    }
    
    // Check for unprocessed variables (warnings)
    const remainingVariables = extractVariables(processedContent);
    if (remainingVariables.length > 0) {
      warnings.push(`Variáveis não processadas: ${remainingVariables.map(v => `{{${v}}}`).join(", ")}`);
    }
    
    return {
      success: true,
      processedContent,
      processedSubject,
      errors: [],
      warnings
    };
    
  } catch (error) {
    errors.push({
      type: TemplateErrorType.PROCESSING_ERROR,
      message: "Erro ao processar template",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
    
    return {
      success: false,
      processedContent: template.content,
      processedSubject: template.subject,
      errors,
      warnings
    };
  }
}

/**
 * Generates sample data for template preview
 */
export function generateSampleData(overrides: Partial<TemplateSampleData> = {}): TemplateSampleData {
  return {
    ...DEFAULT_SAMPLE_DATA,
    ...overrides
  };
}

/**
 * Sanitizes template content to prevent XSS
 */
export function sanitizeTemplateContent(content: string): string {
  // Basic HTML entity encoding for safety
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Formats template content for display
 */
export function formatTemplateForDisplay(content: string): string {
  // Convert line breaks to HTML breaks for display
  return content
    .replace(/
/g, "<br>")
    .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
}

/**
 * Estimates template processing time based on content complexity
 */
export function estimateProcessingTime(template: NotificationTemplateInput): number {
  const baseTime = 100; // Base processing time in ms
  const contentLength = template.content.length;
  const variableCount = extractVariables(template.content).length;
  
  // Estimate based on content length and variable count
  return baseTime + (contentLength * 0.1) + (variableCount * 50);
}

/**
 * Checks if template has required variables for its type
 */
export function checkRequiredVariables(template: NotificationTemplateInput): TemplateError[] {
  const errors: TemplateError[] = [];
  const variables = extractVariables(template.content);
  
  // For email templates, event_title is typically required
  if (template.type === "email" && !variables.includes("event_title")) {
    errors.push({
      type: TemplateErrorType.VARIABLE_ERROR,
      message: "Template de email deveria incluir {{event_title}}",
      field: "content",
      details: "Esta é uma recomendação para melhor experiência do usuário"
    });
  }
  
  // For WhatsApp templates, patient_name is typically required
  if (template.type === "whatsapp" && !variables.includes("patient_name")) {
    errors.push({
      type: TemplateErrorType.VARIABLE_ERROR,
      message: "Template de WhatsApp deveria incluir {{patient_name}}",
      field: "content",
      details: "Esta é uma recomendação para personalização da mensagem"
    });
  }
  
  return errors;
}