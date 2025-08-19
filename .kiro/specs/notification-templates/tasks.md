# Implementation Plan

## 1. Database Setup and Migration

- [x] 1.1 Create database migration script
  - Create notification_templates table with all required fields
  - Implement RLS policies for admin-only access
  - Add updated_at trigger functionality
  - Create indexes for performance optimization
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 1.2 Insert default templates
  - Create default email confirmation template
  - Create default WhatsApp reminder template
  - Verify template structure and variable syntax
  - Test template retrieval and activation
  - _Requirements: 7.2, 7.3_

- [x] 1.3 Update Supabase types
  - Generate TypeScript types for notification_templates table
  - Add types to src/integrations/supabase/types.ts
  - Verify type safety for all CRUD operations
  - _Requirements: 9.1, 9.2_

## 2. Core Types and Utilities

- [x] 2.1 Create notification template types
  - Define NotificationTemplate interface
  - Define NotificationTemplateInput interface
  - Define TemplateVariable interface with metadata
  - Create validation rules and error types
  - _Requirements: 2.2, 3.2, 5.4_

- [x] 2.2 Implement template processing utilities
  - Create variable substitution function
  - Implement template validation logic
  - Add variable syntax validation
  - Create sample data generator for preview
  - _Requirements: 9.3, 10.2, 10.4_

- [x] 2.3 Define available variables
  - Create EMAIL_VARIABLES constant with all available variables
  - Create WHATSAPP_VARIABLES constant with platform-specific variables
  - Add variable descriptions and examples
  - Implement variable categorization (patient, event, system)
  - _Requirements: 6.2, 6.3, 6.4_

## 3. Database Hooks and API Layer

- [x] 3.1 Create useNotificationTemplates hook
  - Implement CRUD operations for templates
  - Add real-time subscriptions for template changes
  - Implement filtering by type (email/whatsapp)
  - Add error handling and loading states
  - _Requirements: 1.3, 2.1, 3.1_

- [x] 3.2 Create useTemplatePreview hook
  - Implement template preview with sample data
  - Add real-time preview updates
  - Implement variable validation and highlighting
  - Add error detection for invalid variables
  - _Requirements: 10.1, 10.3, 10.5_

- [x] 3.3 Add template management to admin hooks
  - Update useAdminMetrics to include template counts
  - Add template-related activities to useRecentActivity
  - Implement template validation in form hooks
  - _Requirements: 1.1, 3.3, 5.5_

## 4. Core Components Development

- [x] 4.1 Create VariablesHelper component
  - Display available variables by category
  - Implement variable insertion on click
  - Add variable descriptions and tooltips
  - Create responsive layout for variable list
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 4.2 Create TemplatePreview component
  - Implement real-time preview with sample data
  - Add syntax highlighting for variables
  - Display validation errors and warnings
  - Create responsive preview layout
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 4.3 Create TemplateForm component
  - Implement form fields for name, subject, content
  - Add form validation with real-time feedback
  - Integrate VariablesHelper and TemplatePreview
  - Add save/cancel functionality with loading states
  - _Requirements: 2.1, 2.2, 3.1, 3.2_

## 5. Main Templates Management Interface

- [x] 5.1 Create TemplatesList component
  - Display templates in a responsive table/grid
  - Add filtering and sorting capabilities
  - Implement action buttons (Edit, Duplicate, Delete)
  - Add activation toggle with immediate feedback
  - _Requirements: 1.2, 4.1, 5.1, 5.2_

- [x] 5.2 Create NotificationTemplatesCard component
  - Design card layout for admin dashboard
  - Implement Email/WhatsApp tabs
  - Add "Novo Template" button
  - Integrate TemplatesList for each tab
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 5.3 Implement template management modals
  - Create modal for template creation
  - Create modal for template editing
  - Add confirmation dialogs for deletion
  - Implement modal state management
  - _Requirements: 2.1, 3.1, 5.3_

## 6. Dashboard Integration

- [x] 6.1 Add NotificationTemplatesCard to Admin dashboard
  - Integrate card into "Operações Principais" section
  - Ensure responsive layout with existing cards
  - Add proper spacing and visual hierarchy
  - Test card functionality within dashboard context
  - _Requirements: 1.1, 1.4_

- [x] 6.2 Update QuickActions component
  - Modify "Enviar Lembretes" button behavior
  - Remove direct email/WhatsApp logic from frontend
  - Add loading states and success feedback
  - Implement error handling for template-related issues
  - _Requirements: 7.1, 7.4_

- [x] 6.3 Add templates metrics to dashboard
  - Display template counts in admin metrics
  - Show active/inactive template status
  - Add recent template activities to activity feed
  - _Requirements: 1.1, 8.5_

## 7. Edge Functions Integration

- [x] 7.1 Create trigger-reminders Edge Function
  - Implement secure endpoint for reminder triggering
  - Add authentication and authorization checks
  - Implement queue management for batch processing
  - Add comprehensive error handling and logging
  - _Requirements: 7.1, 8.4_

- [x] 7.2 Update email Edge Function
  - Modify to fetch templates from database by name
  - Implement variable substitution logic
  - Add fallback for missing templates
  - Maintain backward compatibility during transition
  - _Requirements: 9.1, 9.3, 9.4_

- [x] 7.3 Update WhatsApp Edge Function
  - Modify to fetch templates from database by name
  - Implement WhatsApp-specific variable processing
  - Add template validation for WhatsApp format
  - Ensure proper error handling and fallbacks
  - _Requirements: 9.2, 9.3, 9.5_

## 8. Template Processing and Variables

- [x] 8.1 Implement variable substitution engine
  - Create robust regex-based variable replacement
  - Add support for nested variables and conditionals
  - Implement error handling for missing data
  - Add validation for variable syntax
  - _Requirements: 9.3, 10.4_

- [x] 8.2 Create data fetching for variables
  - Implement patient data retrieval for variables
  - Add event data fetching with proper joins
  - Create system variable generation (links, dates)
  - Add caching for frequently accessed data
  - _Requirements: 9.5, 7.3_

- [x] 8.3 Add template validation and testing
  - Create template syntax validator
  - Implement variable existence checking
  - Add template rendering tests with sample data
  - Create validation feedback for admin interface
  - _Requirements: 10.3, 10.4_

## 9. Security and Permissions

- [x] 9.1 Implement RLS policies testing
  - Test admin-only access to templates
  - Verify non-admin users cannot access templates
  - Test policy enforcement across all operations
  - Add audit logging for template operations
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 9.2 Add input validation and sanitization
  - Implement server-side template content validation
  - Add XSS prevention for template content
  - Validate variable syntax and prevent injection
  - Add rate limiting for template operations
  - _Requirements: 8.3, 8.5_

- [x] 9.3 Secure Edge Function template access
  - Add authentication checks in Edge Functions
  - Implement template access logging
  - Add rate limiting for template processing
  - Ensure secure variable data access
  - _Requirements: 8.4, 8.5_

## 10. Testing and Quality Assurance

- [x] 10.1 Write unit tests for template processing
  - Test variable substitution accuracy
  - Test error handling for invalid templates
  - Test validation rules and edge cases
  - Test template CRUD operations
  - _Requirements: 2.2, 3.2, 9.3_

- [x] 10.2 Write integration tests for components
  - Test template form submission and validation
  - Test template list operations (CRUD)
  - Test preview functionality with real data
  - Test admin dashboard integration
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 10.3 Write E2E tests for complete workflows
  - Test complete template creation workflow
  - Test template editing and activation
  - Test message sending with custom templates
  - Test error scenarios and recovery
  - _Requirements: 7.1, 7.2, 7.3_

## 11. Documentation and Deployment

- [x] 11.1 Create user documentation
  - Write admin guide for template management
  - Document available variables and usage
  - Create troubleshooting guide for common issues
  - Add examples of effective templates
  - _Requirements: 6.1, 6.5_

- [x] 11.2 Create developer documentation
  - Document template processing architecture
  - Add API documentation for Edge Functions
  - Document variable system and extension points
  - Create deployment and migration guides
  - _Requirements: 9.1, 9.2_

- [x] 11.3 Prepare production deployment
  - Run database migration in production
  - Deploy updated Edge Functions
  - Test complete system integration
  - Monitor system performance and errors
  - _Requirements: 7.1, 8.1, 8.5_