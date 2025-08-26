/**
 * Tests for Chat Security System
 */

import {
    checkRateLimit,
    containsSQLInjection,
    containsSuspiciousKeywords,
    containsXSS,
    isAllowedDomain,
    sanitizeMessageContent,
    validateAndSanitizeMessage,
    validateAndSanitizeN8nRequest,
    validateN8nResponse
} from '../chatSecurity';
import { N8nChatRequest, N8nChatResponse } from '../chatTypes';

// Mock DOMPurify
jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((content) => content.replace(/<[^>]*>/g, ''))
}));

describe('Chat Security System', () => {
  describe('Content Sanitization', () => {
    it('should sanitize basic HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeMessageContent(input);

      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello World');
    });

    it('should remove control characters', () => {
      const input = 'Hello\x00\x01\x02World';
      const result = sanitizeMessageContent(input);

      expect(result).toBe('HelloWorld');
    });

    it('should normalize whitespace', () => {
      const input = 'Hello    \n\n\n   World';
      const result = sanitizeMessageContent(input);

      expect(result).toBe('Hello World');
    });

    it('should escape HTML entities', () => {
      const input = '<>&"\'';
      const result = sanitizeMessageContent(input);

      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&amp;');
    });

    it('should handle empty and null inputs', () => {
      expect(sanitizeMessageContent('')).toBe('');
      expect(sanitizeMessageContent('   ')).toBe('');
    });
  });

  describe('XSS Detection', () => {
    it('should detect script tags', () => {
      const malicious = '<script>alert("xss")</script>';
      expect(containsXSS(malicious)).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      const malicious = 'javascript:alert("xss")';
      expect(containsXSS(malicious)).toBe(true);
    });

    it('should detect event handlers', () => {
      const malicious = '<img onerror="alert(1)" src="x">';
      expect(containsXSS(malicious)).toBe(true);
    });

    it('should detect iframe tags', () => {
      const malicious = '<iframe src="evil.com"></iframe>';
      expect(containsXSS(malicious)).toBe(true);
    });

    it('should allow safe content', () => {
      const safe = 'Hello world! How are you?';
      expect(containsXSS(safe)).toBe(false);
    });

    it('should detect data URLs', () => {
      const malicious = 'data:text/html,<script>alert(1)</script>';
      expect(containsXSS(malicious)).toBe(true);
    });
  });

  describe('SQL Injection Detection', () => {
    it('should detect basic SQL injection patterns', () => {
      const malicious = "'; DROP TABLE users; --";
      expect(containsSQLInjection(malicious)).toBe(true);
    });

    it('should detect UNION attacks', () => {
      const malicious = "1 UNION SELECT * FROM users";
      expect(containsSQLInjection(malicious)).toBe(true);
    });

    it('should detect SQL keywords', () => {
      const malicious = "SELECT password FROM users WHERE id=1";
      expect(containsSQLInjection(malicious)).toBe(true);
    });

    it('should allow normal text with SQL-like words', () => {
      const safe = "I need to select a good restaurant";
      expect(containsSQLInjection(safe)).toBe(false);
    });

    it('should detect comment patterns', () => {
      const malicious = "admin'--";
      expect(containsSQLInjection(malicious)).toBe(true);
    });
  });

  describe('Suspicious Keywords Detection', () => {
    it('should detect eval keyword', () => {
      const suspicious = 'eval("malicious code")';
      expect(containsSuspiciousKeywords(suspicious)).toBe(true);
    });

    it('should detect function keyword', () => {
      const suspicious = 'new Function("return 1")';
      expect(containsSuspiciousKeywords(suspicious)).toBe(true);
    });

    it('should detect prototype manipulation', () => {
      const suspicious = 'Object.prototype.toString';
      expect(containsSuspiciousKeywords(suspicious)).toBe(true);
    });

    it('should allow normal conversation', () => {
      const normal = 'I need help with my account';
      expect(containsSuspiciousKeywords(normal)).toBe(false);
    });
  });

  describe('Domain Validation', () => {
    beforeEach(() => {
      process.env.VITE_N8N_WEBHOOK_DOMAIN = 'allowed.com';
    });

    afterEach(() => {
      delete process.env.VITE_N8N_WEBHOOK_DOMAIN;
    });

    it('should allow configured domains', () => {
      expect(isAllowedDomain('https://allowed.com/webhook')).toBe(true);
    });

    it('should allow subdomains of configured domains', () => {
      expect(isAllowedDomain('https://api.allowed.com/webhook')).toBe(true);
    });

    it('should allow localhost', () => {
      expect(isAllowedDomain('https://localhost:3000/webhook')).toBe(true);
    });

    it('should reject unauthorized domains', () => {
      expect(isAllowedDomain('https://evil.com/webhook')).toBe(false);
    });

    it('should handle invalid URLs', () => {
      expect(isAllowedDomain('not-a-url')).toBe(false);
    });
  });

  describe('Message Validation', () => {
    it('should validate and sanitize valid message', () => {
      const result = validateAndSanitizeMessage('Hello world!');

      expect(result.success).toBe(true);
      expect(result.data).toBe('Hello world!');
    });

    it('should reject empty messages', () => {
      const result = validateAndSanitizeMessage('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('vazia');
    });

    it('should reject messages that are too long', () => {
      const longMessage = 'a'.repeat(1001);
      const result = validateAndSanitizeMessage(longMessage);

      expect(result.success).toBe(false);
      expect(result.error).toContain('longa');
    });

    it('should reject messages with XSS', () => {
      const malicious = '<script>alert("xss")</script>';
      const result = validateAndSanitizeMessage(malicious);

      expect(result.success).toBe(false);
      expect(result.error).toContain('perigoso');
    });

    it('should reject non-string input', () => {
      const result = validateAndSanitizeMessage(123 as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('string');
    });

    it('should sanitize and validate borderline content', () => {
      const input = '  <b>Hello</b> world!  ';
      const result = validateAndSanitizeMessage(input);

      expect(result.success).toBe(true);
      expect(result.data).not.toContain('<b>');
      expect(result.data).toContain('Hello world!');
    });
  });

  describe('N8n Request Validation', () => {
    const validRequest: N8nChatRequest = {
      sessionId: 'chat_public_abc123',
      message: 'Hello world',
      userType: 'public',
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'web'
      }
    };

    it('should validate valid request', () => {
      const result = validateAndSanitizeN8nRequest(validRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid session ID', () => {
      const invalidRequest = {
        ...validRequest,
        sessionId: 'invalid-session-id'
      };

      const result = validateAndSanitizeN8nRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('sessão inválido');
    });

    it('should reject invalid user type', () => {
      const invalidRequest = {
        ...validRequest,
        userType: 'invalid' as any
      };

      const result = validateAndSanitizeN8nRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('usuário inválido');
    });

    it('should reject invalid timestamp', () => {
      const invalidRequest = {
        ...validRequest,
        timestamp: 'invalid-date'
      };

      const result = validateAndSanitizeN8nRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timestamp inválido');
    });

    it('should sanitize metadata', () => {
      const requestWithMetadata = {
        ...validRequest,
        metadata: {
          userInput: '<script>alert(1)</script>',
          safeData: 'normal text'
        }
      };

      const result = validateAndSanitizeN8nRequest(requestWithMetadata);

      expect(result.success).toBe(true);
      expect(result.data?.metadata?.userInput).not.toContain('<script>');
      expect(result.data?.metadata?.safeData).toBe('normal text');
    });

    it('should handle missing metadata', () => {
      const requestWithoutMetadata = {
        sessionId: validRequest.sessionId,
        message: validRequest.message,
        userType: validRequest.userType,
        timestamp: validRequest.timestamp
      };

      const result = validateAndSanitizeN8nRequest(requestWithoutMetadata);

      expect(result.success).toBe(true);
      expect(result.data?.metadata).toEqual({});
    });
  });

  describe('N8n Response Validation', () => {
    const validResponse: N8nChatResponse = {
      success: true,
      data: {
        response: 'Hello from n8n',
        actions: [],
        sessionComplete: false
      }
    };

    it('should validate valid response', () => {
      const result = validateN8nResponse(validResponse);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject non-object response', () => {
      const result = validateN8nResponse('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('objeto');
    });

    it('should reject response without success field', () => {
      const invalidResponse = {
        data: { response: 'test' }
      };

      const result = validateN8nResponse(invalidResponse);

      expect(result.success).toBe(false);
      expect(result.error).toContain('success');
    });

    it('should sanitize response content', () => {
      const responseWithXSS = {
        success: true,
        data: {
          response: '<script>alert(1)</script>Hello',
          actions: []
        }
      };

      const result = validateN8nResponse(responseWithXSS);

      expect(result.success).toBe(true);
      expect(result.data?.data?.response).not.toContain('<script>');
      expect(result.data?.data?.response).toContain('Hello');
    });

    it('should sanitize action payloads', () => {
      const responseWithActions = {
        success: true,
        data: {
          response: 'Response',
          actions: [{
            type: 'redirect',
            payload: {
              url: 'https://safe.com',
              malicious: '<script>alert(1)</script>'
            }
          }]
        }
      };

      const result = validateN8nResponse(responseWithActions);

      expect(result.success).toBe(true);
      expect(result.data?.data?.actions?.[0].payload.malicious).not.toContain('<script>');
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Clear rate limit cache
      jest.clearAllMocks();
    });

    it('should allow requests within limit', () => {
      const result = checkRateLimit('test-user', 10, 60000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should block requests exceeding limit', () => {
      // Make requests up to the limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit('test-user-2', 10, 60000);
      }

      // This should be blocked
      const result = checkRateLimit('test-user-2', 10, 60000);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after time window', () => {
      // Make requests up to limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit('test-user-3', 10, 100); // 100ms window
      }

      // Wait for window to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          const result = checkRateLimit('test-user-3', 10, 100);
          expect(result.allowed).toBe(true);
          resolve(undefined);
        }, 150);
      });
    });

    it('should handle different users independently', () => {
      // User 1 reaches limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit('user-1', 10, 60000);
      }

      // User 2 should still be allowed
      const result = checkRateLimit('user-2', 10, 60000);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', () => {
      const result = validateAndSanitizeMessage(null as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle malformed JSON in request validation', () => {
      const result = validateAndSanitizeN8nRequest({
        sessionId: 'valid-session',
        message: 'test',
        userType: 'public',
        timestamp: new Date().toISOString(),
        metadata: { circular: {} }
      });

      // Should handle circular references gracefully
      expect(result.success).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle large messages efficiently', () => {
      const largeMessage = 'a'.repeat(999); // Just under limit
      const startTime = Date.now();

      const result = validateAndSanitizeMessage(largeMessage);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should handle many validation calls efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        validateAndSanitizeMessage(`Message ${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should handle 100 validations in under 1s
    });
  });

  describe('Edge Cases', () => {
    it('should handle unicode characters', () => {
      const unicode = '🚀 Hello 世界 🌍';
      const result = validateAndSanitizeMessage(unicode);

      expect(result.success).toBe(true);
      expect(result.data).toContain('🚀');
      expect(result.data).toContain('世界');
    });

    it('should handle mixed content', () => {
      const mixed = 'Normal text <script>bad</script> more text';
      const result = validateAndSanitizeMessage(mixed);

      expect(result.success).toBe(false); // Should be rejected due to XSS
    });

    it('should handle very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);
      expect(isAllowedDomain(longUrl)).toBe(false);
    });

    it('should handle malformed session IDs', () => {
      const malformedIds = [
        '',
        'chat_',
        'chat_public_',
        'invalid_format',
        'chat_public_' + 'a'.repeat(100)
      ];

      malformedIds.forEach(id => {
        const result = validateAndSanitizeN8nRequest({
          sessionId: id,
          message: 'test',
          userType: 'public',
          timestamp: new Date().toISOString()
        });

        expect(result.success).toBe(false);
      });
    });
  });
});
