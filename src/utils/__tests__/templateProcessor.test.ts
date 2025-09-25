/**
 * Unit tests for template processing utilities
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRequiredVariables,
  extractVariables,
  generateSampleData,
  processTemplate,
  sanitizeTemplateContent,
  substituteVariables,
  validateTemplate,
  validateVariables
} from "../templateProcessor";
import type { NotificationTemplateInput} from "@/types/notificationTemplates";
import { DEFAULT_SAMPLE_DATA } from "@/types/notificationTemplates";

describe("Template Processing Utilities", () => {
  describe("validateTemplate", () => {
    it("should validate a correct email template", () => {
      const template: NotificationTemplateInput = {
        name: "test_email",
        type: "email",
        subject: "Test Subject",
        content: "Hello {{patient_name}}",
        is_active: true
      };

      const errors = validateTemplate(template);
      expect(errors).toHaveLength(0);
    });

    it("should validate a correct WhatsApp template", () => {
      const template: NotificationTemplateInput = {
        name: "test_whatsapp",
        type: "whatsapp",
        content: "Hello {{patient_name}}",
        is_active: true
      };

      const errors = validateTemplate(template);
      expect(errors).toHaveLength(0);
    });

    it("should require name field", () => {
      const template: NotificationTemplateInput = {
        name: "",
        type: "email",
        subject: "Test",
        content: "Hello",
        is_active: true
      };

      const errors = validateTemplate(template);
      expect(errors).toHaveLength(2); // Nome vazio + conteúdo muito curto
      expect(errors.some(e => e.field === "name")).toBe(true);
      expect(errors.some(e => e.field === "content")).toBe(true);
    });

    it("should require subject for email templates", () => {
      const template: NotificationTemplateInput = {
        name: "test_email",
        type: "email",
        content: "Hello {{patient_name}}",
        is_active: true
      };

      const errors = validateTemplate(template);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("subject");
    });

    it("should not require subject for WhatsApp templates", () => {
      const template: NotificationTemplateInput = {
        name: "test_whatsapp",
        type: "whatsapp",
        content: "Hello {{patient_name}}",
        is_active: true
      };

      const errors = validateTemplate(template);
      expect(errors).toHaveLength(0);
    });

    it("should validate name pattern", () => {
      const template: NotificationTemplateInput = {
        name: "invalid name!",
        type: "email",
        subject: "Test",
        content: "Hello",
        is_active: true
      };

      const errors = validateTemplate(template);
      expect(errors.some(e => e.field === "name")).toBe(true);
    });

    it("should validate content length", () => {
      const template: NotificationTemplateInput = {
        name: "test",
        type: "email",
        subject: "Test",
        content: "Hi", // Too short
        is_active: true
      };

      const errors = validateTemplate(template);
      expect(errors.some(e => e.field === "content")).toBe(true);
    });
  });

  describe("extractVariables", () => {
    it("should extract variables from content", () => {
      const content = "Hello {{patient_name}}, your event is {{event_title}}";
      const variables = extractVariables(content);
      
      expect(variables).toContain("patient_name");
      expect(variables).toContain("event_title");
      expect(variables).toHaveLength(2);
    });

    it("should handle duplicate variables", () => {
      const content = "Hello {{patient_name}}, {{patient_name}} welcome!";
      const variables = extractVariables(content);
      
      expect(variables).toContain("patient_name");
      expect(variables).toHaveLength(1);
    });

    it("should handle empty content", () => {
      const variables = extractVariables("");
      expect(variables).toHaveLength(0);
    });

    it("should handle content without variables", () => {
      const variables = extractVariables("Hello world");
      expect(variables).toHaveLength(0);
    });
  });

  describe("validateVariables", () => {
    it("should validate known variables", () => {
      const content = "Hello {{patient_name}}, event: {{event_title}}";
      const errors = validateVariables(content);
      
      expect(errors).toHaveLength(0);
    });

    it("should detect unknown variables", () => {
      const content = "Hello {{unknown_variable}}";
      const errors = validateVariables(content);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("unknown_variable");
    });

    it("should validate variables in both content and subject", () => {
      const subject = "Event: {{event_title}}";
      const content = "Hello {{unknown_variable}}";
      const errors = validateVariables(content, subject);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("unknown_variable");
    });
  });

  describe("substituteVariables", () => {
    it("should substitute known variables", () => {
      const content = "Hello {{patient_name}}, event: {{event_title}}";
      const result = substituteVariables(content, DEFAULT_SAMPLE_DATA);
      
      expect(result).toContain(DEFAULT_SAMPLE_DATA.patient_name);
      expect(result).toContain(DEFAULT_SAMPLE_DATA.event_title);
      expect(result).not.toContain("{{");
    });

    it("should leave unknown variables unchanged", () => {
      const content = "Hello {{unknown_variable}}";
      const result = substituteVariables(content, DEFAULT_SAMPLE_DATA);
      
      expect(result).toBe("Hello {{unknown_variable}}");
    });

    it("should handle empty data", () => {
      const content = "Hello {{patient_name}}";
      const result = substituteVariables(content, {} as any);
      
      expect(result).toBe("Hello {{patient_name}}");
    });

    it("should handle conditional blocks", () => {
      const content = "Hello {{#patient_name}}{{patient_name}}{{/patient_name}}";
      const result = substituteVariables(content, DEFAULT_SAMPLE_DATA);
      
      expect(result).toContain(DEFAULT_SAMPLE_DATA.patient_name);
    });

    it("should handle empty conditional blocks", () => {
      const content = "Hello {{#missing_field}}{{missing_field}}{{/missing_field}}";
      const result = substituteVariables(content, DEFAULT_SAMPLE_DATA);
      
      expect(result).toBe("Hello ");
    });
  });

  describe("processTemplate", () => {
    it("should process a valid template successfully", () => {
      const template: NotificationTemplateInput = {
        name: "test_email",
        type: "email",
        subject: "Event: {{event_title}}",
        content: "Hello {{patient_name}}, your event is {{event_title}}",
        is_active: true
      };

      const result = processTemplate(template);
      
      expect(result.success).toBe(true);
      expect(result.processedContent).toContain(DEFAULT_SAMPLE_DATA.patient_name);
      expect(result.processedSubject).toContain(DEFAULT_SAMPLE_DATA.event_title);
      expect(result.errors).toHaveLength(0);
    });

    it("should return errors for invalid template", () => {
      const template: NotificationTemplateInput = {
        name: "",
        type: "email",
        content: "Hi", // Too short
        is_active: true
      };

      const result = processTemplate(template);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should return warnings for unprocessed variables", () => {
      const template: NotificationTemplateInput = {
        name: "test_email",
        type: "email",
        subject: "Test",
        content: "Hello {{unknown_variable}}",
        is_active: true
      };

      const result = processTemplate(template);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should use custom sample data", () => {
      const template: NotificationTemplateInput = {
        name: "test_email",
        type: "email",
        subject: "Test",
        content: "Hello {{patient_name}}",
        is_active: true
      };

      const customData = generateSampleData({ patient_name: "Custom Name" });
      const result = processTemplate(template, customData);
      
      expect(result.processedContent).toContain("Custom Name");
    });
  });

  describe("generateSampleData", () => {
    it("should generate default sample data", () => {
      const data = generateSampleData();
      
      expect(data.patient_name).toBeDefined();
      expect(data.event_title).toBeDefined();
      expect(data.event_date).toBeDefined();
    });

    it("should override default values", () => {
      const data = generateSampleData({ patient_name: "Custom Name" });
      
      expect(data.patient_name).toBe("Custom Name");
      expect(data.event_title).toBe(DEFAULT_SAMPLE_DATA.event_title);
    });
  });

  describe("sanitizeTemplateContent", () => {
    it("should sanitize HTML entities", () => {
      const content = '<script>alert("xss")</script>';
      const sanitized = sanitizeTemplateContent(content);
      
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toContain("&lt;script&gt;");
    });

    it("should sanitize quotes", () => {
      const content = 'Hello "world" and \'test\'';
      const sanitized = sanitizeTemplateContent(content);
      
      expect(sanitized).toContain("&quot;");
      expect(sanitized).toContain("&#x27;");
    });

    it("should handle empty content", () => {
      const sanitized = sanitizeTemplateContent("");
      expect(sanitized).toBe("");
    });
  });

  describe("checkRequiredVariables", () => {
    it("should recommend event_title for email templates", () => {
      const template: NotificationTemplateInput = {
        name: "test_email",
        type: "email",
        subject: "Test",
        content: "Hello {{patient_name}}",
        is_active: true
      };

      const errors = checkRequiredVariables(template);
      
      expect(errors.some(e => e.message.includes("event_title"))).toBe(true);
    });

    it("should recommend patient_name for WhatsApp templates", () => {
      const template: NotificationTemplateInput = {
        name: "test_whatsapp",
        type: "whatsapp",
        content: "Event: {{event_title}}",
        is_active: true
      };

      const errors = checkRequiredVariables(template);
      
      expect(errors.some(e => e.message.includes("patient_name"))).toBe(true);
    });

    it("should not return errors when required variables are present", () => {
      const template: NotificationTemplateInput = {
        name: "test_email",
        type: "email",
        subject: "Test",
        content: "Hello {{patient_name}}, event: {{event_title}}",
        is_active: true
      };

      const errors = checkRequiredVariables(template);
      
      expect(errors).toHaveLength(0);
    });
  });
});