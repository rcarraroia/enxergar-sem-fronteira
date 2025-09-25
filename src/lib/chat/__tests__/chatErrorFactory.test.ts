/**
 * Tests for Chat Error Factory
 */

import {
    CHAT_ERROR_CODES,
    CHAT_ERROR_MESSAGES,
    createChatError,
    createHistoryError,
    createSecurityError,
    createSessionError,
    createVoiceError,
    createWebhookError,
    fromChatError
} from '../chatErrorFactory';
import { ChatError, ChatErrorType } from '../chatTypes';

describe('Chat Error Factory', () => {
  describe('createChatError', () => {
    it('should create basic chat error', () => {
      const error = createChatError(
        CHAT_ERROR_CODES.INVALID_MESSAGE_CONTENT,
        'Test message'
      );

      expect(error.code).toBe(CHAT_ERROR_CODES.INVALID_MESSAGE_CONTENT);
      expect(error.message).toBe('Test message');
      expect(error.userMessage).toBe('Test message');
      expect(error.category).toBe('external_api');
      expect(error.severity).toBe('medium');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should use default message from CHAT_ERROR_MESSAGES', () => {
      const error = createChatError(CHAT_ERROR_CODES.XSS_DETECTED);

      expect(error.userMessage).toBe(CHAT_ERROR_MESSAGES[CHAT_ERROR_CODES.XSS_DETECTED]);
    });

    it('should include session and message IDs', () => {
      const error = createChatError(
        CHAT_ERROR_CODES.INVALID_MESSAGE_CONTENT,
        'Test',
        {
          sessionId: 'session-123',
          messageId: 'msg-456'
        }
      );

      expect(error.sessionId).toBe('session-123');
      expect(error.messageId).toBe('msg-456');
    });

    it('should include request and response data', () => {
      const requestData = {
        sessionId: 'test',
        message: 'hello',
        userType: 'public' as const,
        timestamp: new Date().toISOString()
      };

      const responseData = {
        success: false,
        error: { code: 'TEST', message: 'Test error' }
      };

      const error = createChatError(
        CHAT_ERROR_CODES.WEBHOOK_ERROR,
        'Test',
        {
          requestData,
          responseData
        }
      );

      expect(error.requestData).toEqual(requestData);
      expect(error.responseData).toEqual(responseData);
    });
  });

  describe('createSecurityError', () => {
    it('should create XSS error', () => {
      const error = createSecurityError(
        'xss',
        '<script>alert(1)</script>',
        'session-123'
      );

      expect(error.code).toBe(CHAT_ERROR_CODES.XSS_DETECTED);
      expect(error.category).toBe('validation');
      expect(error.severity).toBe('medium');
      expect(error.sessionId).toBe('session-123');
      expect(error.context?.securityThreatType).toBe('xss');
      expect(error.context?.suspiciousContent).toContain('<script>');
    });

    it('should create session blocked error with high severity', () => {
      const error = createSecurityError(
        'session_blocked',
        'Multiple violations',
        'session-123'
      );

      expect(error.code).toBe(CHAT_ERROR_CODES.SESSION_BLOCKED);
      expect(error.severity).toBe('high');
      expect(error.retryable).toBe(false);
    });

    it('should create rate limit error as retryable', () => {
      const error = createSecurityError(
        'rate_limit',
        'Too many requests',
        'session-123'
      );

      expect(error.code).toBe(CHAT_ERROR_CODES.RATE_LIMIT_EXCEEDED);
      expect(error.retryable).toBe(true);
      expect(error.actionable).toBe(true);
    });

    it('should include additional context', () => {
      const context = {
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1'
      };

      const error = createSecurityError(
        'suspicious_content',
        'Bad content',
        'session-123',
        context
      );

      expect(error.context?.userAgent).toBe('test-agent');
      expect(error.context?.ipAddress).toBe('127.0.0.1');
    });
  });

  describe('createWebhookError', () => {
    it('should create unreachable webhook error', () => {
      const error = createWebhookError(
        'unreachable',
        500,
        'https://webhook.com',
        'session-123'
      );

      expect(error.code).toBe(CHAT_ERROR_CODES.WEBHOOK_UNREACHABLE);
      expect(error.category).toBe('external_api');
      expect(error.retryable).toBe(true);
      expect(error.context?.statusCode).toBe(500);
      expect(error.context?.endpoint).toBe('https://webhook.com');
    });

    it('should create timeout error', () => {
      const error = createWebhookError('timeout');

      expect(error.code).toBe(CHAT_ERROR_CODES.WEBHOOK_TIMEOUT);
      expect(error.retryable).toBe(true);
    });

    it('should create auth failed error with high severity', () => {
      const error = createWebhookError('auth_failed', 401);

      expect(error.code).toBe(CHAT_ERROR_CODES.WEBHOOK_AUTH_FAILED);
      expect(error.severity).toBe('high');
      expect(error.retryable).toBe(false);
    });

    it('should include request and response data', () => {
      const requestData = {
        sessionId: 'test',
        message: 'hello',
        userType: 'public' as const,
        timestamp: new Date().toISOString()
      };

      const responseData = { error: 'Invalid request' };

      const error = createWebhookError(
        'invalid_response',
        400,
        'https://webhook.com',
        'session-123',
        requestData,
        responseData
      );

      expect(error.requestData).toEqual(requestData);
      expect(error.responseData).toEqual(responseData);
    });
  });

  describe('createSessionError', () => {
    it('should create expired session error', () => {
      const error = createSessionError('expired', 'session-123');

      expect(error.code).toBe(CHAT_ERROR_CODES.SESSION_EXPIRED);
      expect(error.category).toBe('business_logic');
      expect(error.actionable).toBe(true);
      expect(error.retryable).toBe(true);
      expect(error.sessionId).toBe('session-123');
    });

    it('should create not found session error', () => {
      const error = createSessionError('not_found', 'session-123');

      expect(error.code).toBe(CHAT_ERROR_CODES.SESSION_NOT_FOUND);
      expect(error.retryable).toBe(false);
    });

    it('should create limit reached error', () => {
      const error = createSessionError('limit_reached');

      expect(error.code).toBe(CHAT_ERROR_CODES.SESSION_LIMIT_REACHED);
      expect(error.actionable).toBe(false);
    });

    it('should include additional context', () => {
      const context = {
        maxSessions: 5,
        currentSessions: 6
      };

      const error = createSessionError('limit_reached', 'session-123', context);

      expect(error.context?.maxSessions).toBe(5);
      expect(error.context?.currentSessions).toBe(6);
    });
  });

  describe('createHistoryError', () => {
    it('should create load failed error', () => {
      const originalError = new Error('Storage error');
      const error = createHistoryError('load_failed', 'session-123', originalError);

      expect(error.code).toBe(CHAT_ERROR_CODES.HISTORY_LOAD_FAILED);
      expect(error.category).toBe('system');
      expect(error.retryable).toBe(true);
      expect(error.originalError).toBe(originalError);
      expect(error.sessionId).toBe('session-123');
    });

    it('should create save failed error', () => {
      const error = createHistoryError('save_failed', 'session-123');

      expect(error.code).toBe(CHAT_ERROR_CODES.HISTORY_SAVE_FAILED);
      expect(error.retryable).toBe(true);
    });

    it('should create corrupted error as non-retryable', () => {
      const error = createHistoryError('corrupted', 'session-123');

      expect(error.code).toBe(CHAT_ERROR_CODES.HISTORY_CORRUPTED);
      expect(error.retryable).toBe(false);
    });

    it('should include storage type in context', () => {
      const error = createHistoryError('load_failed', 'session-123');

      expect(error.context?.storageType).toBe('localStorage');
      expect(error.context?.historyErrorType).toBe('load_failed');
    });
  });

  describe('createVoiceError', () => {
    it('should create not supported error', () => {
      const error = createVoiceError('not_supported');

      expect(error.code).toBe(CHAT_ERROR_CODES.VOICE_NOT_SUPPORTED);
      expect(error.category).toBe('system');
      expect(error.actionable).toBe(false);
      expect(error.retryable).toBe(false);
    });

    it('should create access denied error', () => {
      const error = createVoiceError('access_denied');

      expect(error.code).toBe(CHAT_ERROR_CODES.MICROPHONE_ACCESS_DENIED);
      expect(error.actionable).toBe(true);
      expect(error.retryable).toBe(false);
    });

    it('should create recognition failed error as retryable', () => {
      const error = createVoiceError('recognition_failed');

      expect(error.code).toBe(CHAT_ERROR_CODES.VOICE_RECOGNITION_FAILED);
      expect(error.retryable).toBe(true);
    });

    it('should include browser support information', () => {
      // Mock browser support
      Object.defineProperty(window, 'webkitSpeechRecognition', {
        value: function() {},
        configurable: true
      });

      const error = createVoiceError('not_supported');

      expect(error.context?.browserSupport).toBe(true);

      // Cleanup
      delete (window as any).webkitSpeechRecognition;
    });

    it('should include original error and additional context', () => {
      const originalError = new Error('Microphone error');
      const context = {
        deviceId: 'mic-123',
        permissions: 'denied'
      };

      const error = createVoiceError('access_denied', originalError, context);

      expect(error.originalError).toBe(originalError);
      expect(error.context?.deviceId).toBe('mic-123');
      expect(error.context?.permissions).toBe('denied');
    });
  });

  describe('fromChatError', () => {
    it('should convert validation ChatError', () => {
      const chatError: ChatError = {
        type: ChatErrorType.VALIDATION_ERROR,
        message: 'Invalid input',
        retryable: false,
        sessionId: 'session-123',
        messageId: 'msg-456'
      };

      const appError = fromChatError(chatError);

      expect(appError.code).toBe(CHAT_ERROR_CODES.INVALID_MESSAGE_CONTENT);
      expect(appError.category).toBe('validation');
      expect(appError.message).toBe('Invalid input');
      expect(appError.sessionId).toBe('session-123');
      expect(appError.messageId).toBe('msg-456');
      expect(appError.retryable).toBe(false);
    });

    it('should convert webhook ChatError', () => {
      const chatError: ChatError = {
        type: ChatErrorType.WEBHOOK_ERROR,
        message: 'Webhook failed',
        retryable: true,
        context: {
          endpoint: 'https://webhook.com',
          statusCode: 500
        }
      };

      const appError = fromChatError(chatError);

      expect(appError.code).toBe(CHAT_ERROR_CODES.WEBHOOK_UNREACHABLE);
      expect(appError.category).toBe('external_api');
      expect(appError.retryable).toBe(true);
      expect(appError.context?.endpoint).toBe('https://webhook.com');
    });

    it('should convert session ChatError', () => {
      const chatError: ChatError = {
        type: ChatErrorType.SESSION_ERROR,
        message: 'Session expired',
        retryable: true
      };

      const appError = fromChatError(chatError);

      expect(appError.code).toBe(CHAT_ERROR_CODES.SESSION_EXPIRED);
      expect(appError.category).toBe('business_logic');
    });

    it('should convert network ChatError', () => {
      const chatError: ChatError = {
        type: ChatErrorType.NETWORK_ERROR,
        message: 'Network timeout',
        retryable: true
      };

      const appError = fromChatError(chatError);

      expect(appError.code).toBe(CHAT_ERROR_CODES.WEBHOOK_TIMEOUT);
      expect(appError.category).toBe('network');
    });

    it('should handle unknown ChatError types', () => {
      const chatError: ChatError = {
        type: 'unknown' as any,
        message: 'Unknown error',
        retryable: false
      };

      const appError = fromChatError(chatError);

      expect(appError.code).toBe(CHAT_ERROR_CODES.CHAT_SYSTEM_ERROR);
      expect(appError.category).toBe('system');
    });

    it('should preserve original error and context', () => {
      const originalError = new Error('Original');
      const context = { custom: 'data' };

      const chatError: ChatError = {
        type: ChatErrorType.VALIDATION_ERROR,
        message: 'Test error',
        retryable: false,
        originalError,
        context
      };

      const appError = fromChatError(chatError);

      expect(appError.originalError).toBe(originalError);
      expect(appError.context?.custom).toBe('data');
    });
  });

  describe('Error Code Constants', () => {
    it('should have all required error codes', () => {
      const requiredCodes = [
        'INVALID_MESSAGE_CONTENT',
        'XSS_DETECTED',
        'WEBHOOK_UNREACHABLE',
        'SESSION_BLOCKED',
        'VOICE_NOT_SUPPORTED'
      ];

      requiredCodes.forEach(code => {
        expect(CHAT_ERROR_CODES).toHaveProperty(code);
        expect(typeof CHAT_ERROR_CODES[code as keyof typeof CHAT_ERROR_CODES]).toBe('string');
      });
    });

    it('should have corresponding error messages', () => {
      Object.values(CHAT_ERROR_CODES).forEach(code => {
        expect(CHAT_ERROR_MESSAGES).toHaveProperty(code);
        expect(typeof CHAT_ERROR_MESSAGES[code as keyof typeof CHAT_ERROR_MESSAGES]).toBe('string');
      });
    });

    it('should have unique error codes', () => {
      const codes = Object.values(CHAT_ERROR_CODES);
      const uniqueCodes = new Set(codes);

      expect(codes.length).toBe(uniqueCodes.size);
    });

    it('should have meaningful error messages', () => {
      Object.entries(CHAT_ERROR_MESSAGES).forEach(([code, message]) => {
        expect(message.length).toBeGreaterThan(5);
        expect(message).not.toBe(code);
      });
    });
  });

  describe('Error Properties', () => {
    it('should set appropriate severity levels', () => {
      const securityError = createSecurityError('xss', 'test');
      const webhookError = createWebhookError('unreachable');
      const sessionError = createSessionError('expired');

      expect(['medium', 'high']).toContain(securityError.severity);
      expect(['medium', 'high']).toContain(webhookError.severity);
      expect(sessionError.severity).toBe('medium');
    });

    it('should set appropriate actionable flags', () => {
      const rateLimitError = createSecurityError('rate_limit', 'test');
      const xssError = createSecurityError('xss', 'test');
      const sessionError = createSessionError('expired');

      expect(rateLimitError.actionable).toBe(true);
      expect(xssError.actionable).toBe(true);
      expect(sessionError.actionable).toBe(true);
    });

    it('should set appropriate retryable flags', () => {
      const timeoutError = createWebhookError('timeout');
      const authError = createWebhookError('auth_failed');
      const corruptedError = createHistoryError('corrupted');

      expect(timeoutError.retryable).toBe(true);
      expect(authError.retryable).toBe(false);
      expect(corruptedError.retryable).toBe(false);
    });

    it('should include timestamp', () => {
      const error = createChatError(CHAT_ERROR_CODES.CHAT_SYSTEM_ERROR);
      const now = new Date();

      expect(error.timestamp).toBeInstanceOf(Date);
      expect(Math.abs(error.timestamp.getTime() - now.getTime())).toBeLessThan(1000);
    });
  });
});
