/**
 * Hook for template preview functionality
 */

import { useState, useCallback, useEffect } from 'react'
import { 
  NotificationTemplateInput, 
  TemplateError, 
  TemplateProcessingResult,
  TemplateSampleData,
  UseTemplatePreviewReturn,
  DEFAULT_SAMPLE_DATA
} from '@/types/notificationTemplates'
import { processTemplate, generateSampleData } from '@/utils/templateProcessor'

/**
 * Hook for template preview with real-time updates
 */
export const useTemplatePreview = (): UseTemplatePreviewReturn => {
  const [preview, setPreview] = useState<TemplateProcessingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<TemplateError | null>(null)

  /**
   * Generates preview for a template with sample data
   */
  const generatePreview = useCallback(async (
    template: NotificationTemplateInput, 
    sampleData?: TemplateSampleData
  ): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Generating template preview...', template.name)
      
      // Use provided sample data or default
      const data = sampleData || generateSampleData()
      
      // Add small delay to simulate processing (for better UX)
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Process the template
      const result = processTemplate(template, data)
      
      console.log('✅ Preview generated:', {
        success: result.success,
        errors: result.errors.length,
        warnings: result.warnings.length
      })
      
      setPreview(result)
      
      // Set error if processing failed
      if (!result.success && result.errors.length > 0) {
        setError(result.errors[0])
      }
      
    } catch (err) {
      console.error('❌ Error generating preview:', err)
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar preview'
      const templateError: TemplateError = {
        type: 'processing_error' as any,
        message: errorMessage
      }
      
      setError(templateError)
      setPreview(null)
      
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Clears the current preview
   */
  const clearPreview = useCallback(() => {
    console.log('🧹 Clearing template preview')
    setPreview(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    preview,
    loading,
    error,
    generatePreview,
    clearPreview
  }
}

/**
 * Hook for automatic template preview with debouncing
 */
export const useAutoTemplatePreview = (
  template: NotificationTemplateInput | null,
  sampleData?: TemplateSampleData,
  debounceMs: number = 500
): UseTemplatePreviewReturn => {
  const { preview, loading, error, generatePreview, clearPreview } = useTemplatePreview()
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Auto-generate preview when template changes
  useEffect(() => {
    if (!template) {
      clearPreview()
      return
    }

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Set new debounced timer
    const timer = setTimeout(() => {
      generatePreview(template, sampleData)
    }, debounceMs)

    setDebounceTimer(timer)

    // Cleanup
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [template, sampleData, debounceMs, generatePreview, clearPreview])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return {
    preview,
    loading,
    error,
    generatePreview,
    clearPreview
  }
}

/**
 * Hook for template validation without full preview
 */
export const useTemplateValidation = () => {
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    errors: TemplateError[]
    warnings: string[]
  } | null>(null)

  const validateTemplate = useCallback((template: NotificationTemplateInput) => {
    console.log('🔍 Validating template...', template.name)
    
    const result = processTemplate(template, DEFAULT_SAMPLE_DATA)
    
    setValidationResult({
      isValid: result.success,
      errors: result.errors,
      warnings: result.warnings
    })
    
    return result.success
  }, [])

  const clearValidation = useCallback(() => {
    setValidationResult(null)
  }, [])

  return {
    validationResult,
    validateTemplate,
    clearValidation
  }
}

/**
 * Hook for managing multiple template previews (for comparison)
 */
export const useMultipleTemplatePreviews = () => {
  const [previews, setPreviews] = useState<Map<string, TemplateProcessingResult>>(new Map())
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Map<string, TemplateError>>(new Map())

  const generatePreview = useCallback(async (
    templateId: string,
    template: NotificationTemplateInput,
    sampleData?: TemplateSampleData
  ) => {
    try {
      setLoading(prev => new Set([...prev, templateId]))
      setErrors(prev => {
        const newErrors = new Map(prev)
        newErrors.delete(templateId)
        return newErrors
      })

      const data = sampleData || generateSampleData()
      const result = processTemplate(template, data)

      setPreviews(prev => new Map([...prev, [templateId, result]]))

      if (!result.success && result.errors.length > 0) {
        setErrors(prev => new Map([...prev, [templateId, result.errors[0]]]))
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar preview'
      const templateError: TemplateError = {
        type: 'processing_error' as any,
        message: errorMessage
      }
      
      setErrors(prev => new Map([...prev, [templateId, templateError]]))
      
    } finally {
      setLoading(prev => {
        const newLoading = new Set(prev)
        newLoading.delete(templateId)
        return newLoading
      })
    }
  }, [])

  const clearPreview = useCallback((templateId: string) => {
    setPreviews(prev => {
      const newPreviews = new Map(prev)
      newPreviews.delete(templateId)
      return newPreviews
    })
    
    setErrors(prev => {
      const newErrors = new Map(prev)
      newErrors.delete(templateId)
      return newErrors
    })
    
    setLoading(prev => {
      const newLoading = new Set(prev)
      newLoading.delete(templateId)
      return newLoading
    })
  }, [])

  const clearAllPreviews = useCallback(() => {
    setPreviews(new Map())
    setErrors(new Map())
    setLoading(new Set())
  }, [])

  const getPreview = useCallback((templateId: string) => {
    return previews.get(templateId) || null
  }, [previews])

  const getError = useCallback((templateId: string) => {
    return errors.get(templateId) || null
  }, [errors])

  const isLoading = useCallback((templateId: string) => {
    return loading.has(templateId)
  }, [loading])

  return {
    generatePreview,
    clearPreview,
    clearAllPreviews,
    getPreview,
    getError,
    isLoading,
    previewCount: previews.size
  }
}