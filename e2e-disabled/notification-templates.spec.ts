/**
 * End-to-end tests for notification templates feature
 */

import { test, expect } from '@playwright/test'

test.describe('Notification Templates E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin page
    await page.goto('/admin')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('Template Management', () => {
    test('should create a new email template', async ({ page }) => {
      // Find and click the notification templates card
      await page.click('[data-testid="notification-templates-card"]')
      
      // Click new template button
      await page.click('button:has-text("Novo Template")')
      
      // Fill template form
      await page.fill('[data-testid="template-name-input"]', 'e2e_test_email')
      await page.fill('[data-testid="template-subject-input"]', 'E2E Test Email')
      await page.fill('[data-testid="template-content-input"]', 'Hello {{patient_name}}, your event {{event_title}} is scheduled for {{event_date}}.')
      
      // Save template
      await page.click('button:has-text("Salvar")')
      
      // Verify template was created
      await expect(page.locator('text=e2e_test_email')).toBeVisible()
      await expect(page.locator('text=Ativo')).toBeVisible()
    })

    test('should create a new WhatsApp template', async ({ page }) => {
      // Navigate to WhatsApp tab
      await page.click('[data-testid="notification-templates-card"]')
      await page.click('button:has-text("WhatsApp")')
      
      // Click new template button
      await page.click('button:has-text("Novo Template")')
      
      // Fill template form (no subject for WhatsApp)
      await page.fill('[data-testid="template-name-input"]', 'e2e_test_whatsapp')
      await page.fill('[data-testid="template-content-input"]', '🔔 Olá {{patient_name}}! Lembrete: {{event_title}} em {{event_date}} às {{event_time}}. Local: {{event_location}}')
      
      // Save template
      await page.click('button:has-text("Salvar")')
      
      // Verify template was created
      await expect(page.locator('text=e2e_test_whatsapp')).toBeVisible()
    })

    test('should edit an existing template', async ({ page }) => {
      // First create a template
      await page.click('[data-testid="notification-templates-card"]')
      await page.click('button:has-text("Novo Template")')
      
      await page.fill('[data-testid="template-name-input"]', 'edit_test_template')
      await page.fill('[data-testid="template-subject-input"]', 'Original Subject')
      await page.fill('[data-testid="template-content-input"]', 'Original content {{patient_name}}')
      
      await page.click('button:has-text("Salvar")')
      
      // Wait for template to appear
      await expect(page.locator('text=edit_test_template')).toBeVisible()
      
      // Click edit button
      await page.click('[data-testid="edit-template-button"]')
      
      // Modify template
      await page.fill('[data-testid="template-subject-input"]', 'Updated Subject')
      await page.fill('[data-testid="template-content-input"]', 'Updated content {{patient_name}} for {{event_title}}')
      
      // Save changes
      await page.click('button:has-text("Salvar")')
      
      // Verify changes were saved
      await page.click('[data-testid="edit-template-button"]')
      await expect(page.locator('[data-testid="template-subject-input"]')).toHaveValue('Updated Subject')
    })

    test('should delete a template', async ({ page }) => {
      // First create a template
      await page.click('[data-testid="notification-templates-card"]')
      await page.click('button:has-text("Novo Template")')
      
      await page.fill('[data-testid="template-name-input"]', 'delete_test_template')
      await page.fill('[data-testid="template-subject-input"]', 'Delete Test')
      await page.fill('[data-testid="template-content-input"]', 'This template will be deleted {{patient_name}}')
      
      await page.click('button:has-text("Salvar")')
      
      // Wait for template to appear
      await expect(page.locator('text=delete_test_template')).toBeVisible()
      
      // Click delete button
      await page.click('[data-testid="delete-template-button"]')
      
      // Confirm deletion
      await page.click('button:has-text("Confirmar")')
      
      // Verify template was deleted
      await expect(page.locator('text=delete_test_template')).not.toBeVisible()
    })

    test('should toggle template active status', async ({ page }) => {
      // First create a template
      await page.click('[data-testid="notification-templates-card"]')
      await page.click('button:has-text("Novo Template")')
      
      await page.fill('[data-testid="template-name-input"]', 'toggle_test_template')
      await page.fill('[data-testid="template-subject-input"]', 'Toggle Test')
      await page.fill('[data-testid="template-content-input"]', 'Toggle status test {{patient_name}}')
      
      await page.click('button:has-text("Salvar")')
      
      // Wait for template to appear
      await expect(page.locator('text=toggle_test_template')).toBeVisible()
      await expect(page.locator('text=Ativo')).toBeVisible()
      
      // Toggle to inactive
      await page.click('[data-testid="toggle-active-button"]')
      
      // Verify status changed
      await expect(page.locator('text=Inativo')).toBeVisible()
      
      // Toggle back to active
      await page.click('[data-testid="toggle-active-button"]')
      
      // Verify status changed back
      await expect(page.locator('text=Ativo')).toBeVisible()
    })
  })

  test.describe('Template Preview', () => {
    test('should show real-time preview while editing', async ({ page }) => {
      await page.click('[data-testid="notification-templates-card"]')
      await page.click('button:has-text("Novo Template")')
      
      // Fill template form
      await page.fill('[data-testid="template-name-input"]', 'preview_test')
      await page.fill('[data-testid="template-subject-input"]', 'Preview: {{event_title}}')
      await page.fill('[data-testid="template-content-input"]', 'Hello {{patient_name}}, welcome to {{event_title}}!')
      
      // Check preview updates
      await expect(page.locator('[data-testid="template-preview"]')).toContainText('Preview: Sample Event')
      await expect(page.locator('[data-testid="template-preview"]')).toContainText('Hello John Doe, welcome to Sample Event!')
    })

    test('should show validation errors in preview', async ({ page }) => {
      await page.click('[data-testid="notification-templates-card"]')
      await page.click('button:has-text("Novo Template")')
      
      // Fill template with invalid variable
      await page.fill('[data-testid="template-name-input"]', 'error_test')
      await page.fill('[data-testid="template-subject-input"]', 'Error Test')
      await page.fill('[data-testid="template-content-input"]', 'Hello {{invalid_variable}}!')
      
      // Check error is shown
      await expect(page.locator('[data-testid="template-errors"]')).toContainText('Variável desconhecida')
    })
  })

  test.describe('Variables Helper', () => {
    test('should insert variables when clicked', async ({ page }) => {
      await page.click('[data-testid="notification-templates-card"]')
      await page.click('button:has-text("Novo Template")')
      
      // Click on a variable in the helper
      await page.click('[data-testid="variable-patient_name"]')
      
      // Check variable was inserted
      await expect(page.locator('[data-testid="template-content-input"]')).toHaveValue('{{patient_name}}')
      
      // Click another variable
      await page.click('[data-testid="variable-event_title"]')
      
      // Check both variables are present
      await expect(page.locator('[data-testid="template-content-input"]')).toHaveValue('{{patient_name}}{{event_title}}')
    })

    test('should show variable descriptions on hover', async ({ page }) => {
      await page.click('[data-testid="notification-templates-card"]')
      await page.click('button:has-text("Novo Template")')
      
      // Hover over a variable
      await page.hover('[data-testid="variable-patient_name"]')
      
      // Check tooltip appears
      await expect(page.locator('[data-testid="variable-tooltip"]')).toContainText('Nome completo do paciente')
    })
  })

  test.describe('Template Validation', () => {
    test('should prevent saving invalid templates', async ({ page }) => {
      await page.click('[data-testid="notification-templates-card"]')
      await page.click('button:has-text("Novo Template")')
      
      // Try to save without required fields
      await page.click('button:has-text("Salvar")')
      
      // Check validation errors appear
      await expect(page.locator('[data-testid="validation-errors"]')).toContainText('Nome é obrigatório')
      
      // Fill name but leave content empty
      await page.fill('[data-testid="template-name-input"]', 'validation_test')
      await page.click('button:has-text("Salvar")')
      
      // Check content validation error
      await expect(page.locator('[data-testid="validation-errors"]')).toContainText('Conteúdo é obrigatório')
    })

    test('should validate template name format', async ({ page }) => {
      await page.click('[data-testid="notification-templates-card"]')
      await page.click('button:has-text("Novo Template")')
      
      // Enter invalid name
      await page.fill('[data-testid="template-name-input"]', 'invalid name!')
      await page.fill('[data-testid="template-subject-input"]', 'Test')
      await page.fill('[data-testid="template-content-input"]', 'Test content')
      
      await page.click('button:has-text("Salvar")')
      
      // Check name validation error
      await expect(page.locator('[data-testid="validation-errors"]')).toContainText('apenas letras, números, _ e -')
    })
  })

  test.describe('Message Sending Integration', () => {
    test('should trigger reminder sending with templates', async ({ page }) => {
      // Navigate to quick actions
      await page.click('[data-testid="quick-actions-card"]')
      
      // Click send reminders button
      await page.click('button:has-text("Enviar Lembretes")')
      
      // Check confirmation dialog
      await expect(page.locator('[data-testid="send-reminders-dialog"]')).toBeVisible()
      
      // Confirm sending
      await page.click('button:has-text("Confirmar Envio")')
      
      // Check success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Lembretes enviados com sucesso')
    })

    test('should handle template errors during sending', async ({ page }) => {
      // Mock API to return template error
      await page.route('**/functions/v1/trigger-reminders', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Template not found'
          })
        })
      })
      
      await page.click('[data-testid="quick-actions-card"]')
      await page.click('button:has-text("Enviar Lembretes")')
      await page.click('button:has-text("Confirmar Envio")')
      
      // Check error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Template not found')
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.click('[data-testid="notification-templates-card"]')
      
      // Check mobile layout
      await expect(page.locator('[data-testid="mobile-template-list"]')).toBeVisible()
      
      // Create template on mobile
      await page.click('button:has-text("Novo Template")')
      
      // Check mobile form layout
      await expect(page.locator('[data-testid="mobile-template-form"]')).toBeVisible()
      
      // Fill and save
      await page.fill('[data-testid="template-name-input"]', 'mobile_test')
      await page.fill('[data-testid="template-subject-input"]', 'Mobile Test')
      await page.fill('[data-testid="template-content-input"]', 'Mobile template {{patient_name}}')
      
      await page.click('button:has-text("Salvar")')
      
      // Verify template was created
      await expect(page.locator('text=mobile_test')).toBeVisible()
    })

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await page.click('[data-testid="notification-templates-card"]')
      
      // Check tablet layout adapts properly
      await expect(page.locator('[data-testid="tablet-template-grid"]')).toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('should load templates quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await page.click('[data-testid="notification-templates-card"]')
      
      // Wait for templates to load
      await page.waitForSelector('[data-testid="templates-list"]')
      
      const loadTime = Date.now() - startTime
      
      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000)
    })

    test('should handle large number of templates', async ({ page }) => {
      // Mock API to return many templates
      await page.route('**/rest/v1/notification_templates*', route => {
        const templates = Array.from({ length: 100 }, (_, i) => ({
          id: `template_${i}`,
          name: `template_${i}`,
          type: 'email',
          subject: `Subject ${i}`,
          content: `Content ${i} {{patient_name}}`,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(templates)
        })
      })
      
      await page.click('[data-testid="notification-templates-card"]')
      
      // Check virtual scrolling or pagination works
      await expect(page.locator('[data-testid="templates-list"]')).toBeVisible()
      
      // Should show first batch of templates
      await expect(page.locator('text=template_0')).toBeVisible()
      
      // Scroll to load more
      await page.evaluate(() => {
        document.querySelector('[data-testid="templates-list"]')?.scrollTo(0, 1000)
      })
      
      // Should load more templates
      await expect(page.locator('text=template_10')).toBeVisible()
    })
  })
})