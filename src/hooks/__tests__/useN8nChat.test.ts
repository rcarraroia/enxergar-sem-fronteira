/**
 * Tests for useN8nChat hook
 */

import { ChatErrorType, N8nWebhookConfig } from '@/lib/chat/chatTypes';
import { act, renderHook } from '@testing-library/react';
import { useN8nChat } from '../useN8nChat';

// Mock the n8n client
const mockSendMessage = jest.fn();
const mockCancelRequest = jest.fn();
const mockUpdateConfig = jest.fn();
const mockTestConnection = jest.fn();

jest.mock('@/lib/chat/n8nClient', () => ({
  createN8nClient: jest.fn(() => ({
    sendMessage: mockSendMessage,
    cancelRequest: mockCancelRequest,
    updateConfig: mockUpdateConfig,
    testConnection: mockTestConnection
  })),
  createN8nRequest: jest.fn((sessionId, message, userType, metadata) => ({
    sessionId,
    message,
    userType,
    timestamp: new Date().toISOString(),
    metadata
  })),
  processN8nResponse: jest.fn((response) => ({
    message: response.data?.response || '',
    actions: response.data?.actions || [],
    shouldEndSession: response.data?.sessionComplete || false
  })),
  logN8nError: jest.fn()
}));

// Mock security middleware
jest.mock('@/lib/chat/securityMiddleware', () => ({
  secureValidateMessage: jest.fn((content) => ({
    success: true,
    data: content
  }))
}));

// Mock error handler
jest.mock('@/hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: jest.fn()
  })
}));

const mockConfig: N8nWebhookConfig = {
  publicCaptureUrl: 'https://test.com/public',
  adminSupportUrl: 'https://test.com/admin',
  timeout: 30000,
  retryAttempts: 3,
  headers: {
    'Content-Type': 'application/json'
  }
};

describe('useN8nChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useN8nChat(mockConfig));

      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.isTyping).toBe(false);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.lastResponse).toBeNull();
      expect(result.current.state.retryCount).toBe(0);
    });

    it('should create n8n client with provided config', () => {
      renderHook(() => useN8nChat(mockConfig));

      const { createN8nClient } = require('@/lib/chat/n8nClient');
      expect(createN8nClient).toHaveBeenCalledWith(mockConfig);
    });
  });

  describe('Send Message', () => {
    it('should send message successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          response: 'Hello from n8n',
          actions: [],
          sessionComplete: false
        }
      };

      mockSendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useN8nChat(mockConfig));

      let response;
      await act(async () => {
        response = await result.current.sendMessage(
          'test-session',
          'Hello world',
          'public'
        );
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.lastResponse).toEqual(mockResponse);
    });

    it('should validate message before sending', async () => {
      const { secureValidateMessage } = require('@/lib/chat/securityMiddleware');
      secureValidateMessage.mockReturnValue({
        success: false,
        error: { message: 'Invalid content' }
      });

      const { result } = renderHook(() => useN8nChat(mockConfig));

      await act(async () => {
        try {
          await result.current.sendMessage('test-session', 'bad content', 'public');
        } catch (error) {
          expect(error.type).toBe(ChatErrorType.VALIDATION_ERROR);
        }
      });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('should handle blocked session', async () => {
      const { secureValidateMessage } = require('@/lib/chat/securityMiddleware');
      secureValidateMessage.mockReturnValue({
        success: false,
        blocked: true,
        reason: 'Session blocked'
      });

      const { result } = renderHook(() => useN8nChat(mockConfig));

      await act(async () => {
        try {
          await result.current.sendMessage('test-session', 'message', 'public');
        } catch (error) {
          expect(error.type).toBe(ChatErrorType.SESSION_ERROR);
          expect(error.message).toContain('blocked');
        }
      });
    });

    it('should update loading states correctly', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockSendMessage.mockReturnValue(promise);

      const { result } = renderHook(() => useN8nChat(mockConfig));

      // Start sending
      act(() => {
        result.current.sendMessage('test-session', 'Hello', 'public');
      });

      expect(result.current.state.isLoading).toBe(true);

      // Complete sending
      await act(async () => {
        resolvePromise!({
          success: true,
          data: { response: 'Response' }
        });
        await promise;
      });

      expect(result.current.state.isLoading).toBe(false);
    });

    it('should simulate typing delay', async () => {
      const mockResponse = {
        success: true,
        data: {
          response: 'A'.repeat(100), // Long response
          actions: [],
          sessionComplete: false
        }
      };

      mockSendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useN8nChat(mockConfig));

      const startTime = Date.now();

      await act(async () => {
        await result.current.sendMessage('test-session', 'Hello', 'public');
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have some delay for typing simulation
      expect(duration).toBeGreaterThan(50);
    });

    it('should handle network errors', async () => {
      const networkError = {
        type: ChatErrorType.NETWORK_ERROR,
        message: 'Network error',
        retryable: true
      };

      mockSendMessage.mockRejectedValue(networkError);

      const { result } = renderHook(() => useN8nChat(mockConfig));

      await act(async () => {
        try {
          await result.current.sendMessage('test-session', 'Hello', 'public');
        } catch (error) {
          expect(error).toEqual(networkError);
        }
      });

      expect(result.current.state.error).toEqual(networkError);
      expect(result.current.state.isLoading).toBe(false);
    });
  });

  describe('Retry Functionality', () => {
    it('should retry failed message', async () => {
      const mockResponse = {
        success: true,
        data: { response: 'Retry successful' }
      };

      mockSendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useN8nChat(mockConfig));

      // First, send a message to set up lastRequest
      await act(async () => {
        await result.current.sendMessage('test-session', 'Hello', 'public');
      });

      // Then retry
      let retryResponse;
      await act(async () => {
        retryResponse = await result.current.retryLastMessage();
      });

      expect(retryResponse).toEqual(mockResponse);
      expect(mockSendMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle retry when no previous message exists', async () => {
      const { result } = renderHook(() => useN8nChat(mockConfig));

      let retryResponse;
      await act(async () => {
        retryResponse = await result.current.retryLastMessage();
      });

      expect(retryResponse).toBeNull();
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('should perform auto-retry for retryable errors', async () => {
      const retryableError = {
        type: ChatErrorType.NETWORK_ERROR,
        message: 'Timeout',
        retryable: true
      };

      mockSendMessage
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue({
          success: true,
          data: { response: 'Success after retry' }
        });

      const { result } = renderHook(() => useN8nChat(mockConfig));

      await act(async () => {
        await result.current.sendMessage('test-session', 'Hello', 'public', {
          autoRetry: true
        });
      });

      // Should have tried 3 times (initial + 2 retries)
      expect(mockSendMessage).toHaveBeenCalledTimes(3);
    });

    it('should not auto-retry non-retryable errors', async () => {
      const nonRetryableError = {
        type: ChatErrorType.VALIDATION_ERROR,
        message: 'Invalid input',
        retryable: false
      };

      mockSendMessage.mockRejectedValue(nonRetryableError);

      const { result } = renderHook(() => useN8nChat(mockConfig));

      await act(async () => {
        try {
          await result.current.sendMessage('test-session', 'Hello', 'public', {
            autoRetry: true
          });
        } catch (error) {
          expect(error).toEqual(nonRetryableError);
        }
      });

      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Progress Callbacks', () => {
    it('should call progress callbacks', async () => {
      const onProgress = jest.fn();
      const mockResponse = {
        success: true,
        data: { response: 'Success' }
      };

      mockSendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useN8nChat(mockConfig));

      await act(async () => {
        await result.current.sendMessage('test-session', 'Hello', 'public', {
          onProgress
        });
      });

      expect(onProgress).toHaveBeenCalledWith('sending');
      expect(onProgress).toHaveBeenCalledWith('processing');
      expect(onProgress).toHaveBeenCalledWith('receiving');
    });
  });

  describe('Connection Testing', () => {
    it('should test connection successfully', async () => {
      mockTestConnection.mockResolvedValue(true);

      const { result } = renderHook(() => useN8nChat(mockConfig));

      let isConnected;
      await act(async () => {
        isConnected = await result.current.testConnection('public');
      });

      expect(isConnected).toBe(true);
      expect(mockTestConnection).toHaveBeenCalledWith('public');
    });

    it('should handle connection test failure', async () => {
      mockTestConnection.mockResolvedValue(false);

      const { result } = renderHook(() => useN8nChat(mockConfig));

      let isConnected;
      await act(async () => {
        isConnected = await result.current.testConnection('admin');
      });

      expect(isConnected).toBe(false);
    });

    it('should handle connection test error', async () => {
      const testError = {
        type: ChatErrorType.NETWORK_ERROR,
        message: 'Connection failed'
      };

      mockTestConnection.mockRejectedValue(testError);

      const { result } = renderHook(() => useN8nChat(mockConfig));

      let isConnected;
      await act(async () => {
        isConnected = await result.current.testConnection('public');
      });

      expect(isConnected).toBe(false);
      expect(result.current.state.error).toEqual(testError);
    });
  });

  describe('Configuration Updates', () => {
    it('should update client configuration', () => {
      const { result } = renderHook(() => useN8nChat(mockConfig));

      const newConfig = {
        timeout: 60000,
        retryAttempts: 5
      };

      act(() => {
        result.current.updateConfig(newConfig);
      });

      expect(mockUpdateConfig).toHaveBeenCalledWith(newConfig);
    });
  });

  describe('Request Cancellation', () => {
    it('should cancel ongoing request', () => {
      const { result } = renderHook(() => useN8nChat(mockConfig));

      act(() => {
        result.current.cancelRequest();
      });

      expect(mockCancelRequest).toHaveBeenCalled();
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.isTyping).toBe(false);
      expect(result.current.state.error).toBeNull();
    });
  });

  describe('Error Clearing', () => {
    it('should clear current error', async () => {
      const error = {
        type: ChatErrorType.NETWORK_ERROR,
        message: 'Test error'
      };

      mockSendMessage.mockRejectedValue(error);

      const { result } = renderHook(() => useN8nChat(mockConfig));

      // Generate an error
      await act(async () => {
        try {
          await result.current.sendMessage('test-session', 'Hello', 'public');
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.state.error).toEqual(error);

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.state.error).toBeNull();
      expect(result.current.state.retryCount).toBe(0);
    });
  });

  describe('Cleanup', () => {
    it('should cancel requests on unmount', () => {
      const { unmount } = renderHook(() => useN8nChat(mockConfig));

      unmount();

      expect(mockCancelRequest).toHaveBeenCalled();
    });
  });

  describe('Custom Webhook URL', () => {
    it('should use custom webhook URL when provided', async () => {
      const customUrl = 'https://custom.webhook.com';
      const mockResponse = {
        success: true,
        data: { response: 'Custom response' }
      };

      mockSendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useN8nChat(mockConfig));

      await act(async () => {
        await result.current.sendMessage('test-session', 'Hello', 'public', {
          customWebhookUrl: customUrl
        });
      });

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.any(Object),
        customUrl
      );
    });
  });

  describe('Metadata Handling', () => {
    it('should include metadata in request', async () => {
      const metadata = {
        source: 'test',
        userId: '123'
      };

      const mockResponse = {
        success: true,
        data: { response: 'Success' }
      };

      mockSendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useN8nChat(mockConfig));

      await act(async () => {
        await result.current.sendMessage('test-session', 'Hello', 'public', {
          metadata
        });
      });

      const { createN8nRequest } = require('@/lib/chat/n8nClient');
      expect(createN8nRequest).toHaveBeenCalledWith(
        'test-session',
        'Hello',
        'public',
        metadata
      );
    });
  });
});
