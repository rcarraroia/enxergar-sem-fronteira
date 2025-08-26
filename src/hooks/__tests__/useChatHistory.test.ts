/**
 * Tests for useChatHistory hook
 */

import { ChatMessage } from '@/lib/chat/chatTypes';
import { act, renderHook } from '@testing-library/react';
import { useChatHistory } from '../useChatHistory';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock console methods to avoid noise in tests
const originalConsole = console;
beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe('useChatHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initialization', () => {
    it('should initialize with empty sessions when localStorage is empty', () => {
      const { result } = renderHook(() => useChatHistory());

      expect(result.current.sessions).toEqual({});
      expect(result.current.activeSessionId).toBeNull();
    });

    it('should load existing sessions from localStorage', () => {
      const mockSessions = {
        'session1': {
          id: 'session1',
          type: 'public' as const,
          messages: [],
          isActive: true,
          isTyping: false,
          webhookUrl: 'https://test.com',
          lastActivity: new Date(),
          metadata: {}
        }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        sessions: Object.values(mockSessions),
        version: '1.0.0',
        lastCleanup: new Date().toISOString()
      }));

      const { result } = renderHook(() => useChatHistory());

      expect(result.current.sessions).toEqual(mockSessions);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useChatHistory());

      expect(result.current.sessions).toEqual({});
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should create a new session', () => {
      const { result } = renderHook(() => useChatHistory());

      act(() => {
        const sessionId = result.current.createSession('public', 'https://test.com');
        expect(sessionId).toMatch(/^chat_public_\w+$/);
        expect(result.current.sessions[sessionId]).toBeDefined();
        expect(result.current.sessions[sessionId].type).toBe('public');
        expect(result.current.activeSessionId).toBe(sessionId);
      });
    });

    it('should switch active session', () => {
      const { result } = renderHook(() => useChatHistory());

      let sessionId1: string;
      let sessionId2: string;

      act(() => {
        sessionId1 = result.current.createSession('public', 'https://test1.com');
        sessionId2 = result.current.createSession('admin', 'https://test2.com');
      });

      expect(result.current.activeSessionId).toBe(sessionId2);

      act(() => {
        result.current.setActiveSession(sessionId1);
      });

      expect(result.current.activeSessionId).toBe(sessionId1);
    });

    it('should end a session', () => {
      const { result } = renderHook(() => useChatHistory());

      let sessionId: string;

      act(() => {
        sessionId = result.current.createSession('public', 'https://test.com');
      });

      expect(result.current.sessions[sessionId].isActive).toBe(true);

      act(() => {
        result.current.endSession(sessionId);
      });

      expect(result.current.sessions[sessionId].isActive).toBe(false);
      expect(result.current.activeSessionId).toBeNull();
    });

    it('should clear session history', () => {
      const { result } = renderHook(() => useChatHistory());

      let sessionId: string;

      act(() => {
        sessionId = result.current.createSession('public', 'https://test.com');
        result.current.addMessage(sessionId, {
          id: 'msg1',
          content: 'Test message',
          sender: 'user',
          timestamp: new Date(),
          status: 'sent'
        });
      });

      expect(result.current.sessions[sessionId].messages).toHaveLength(1);

      act(() => {
        result.current.clearHistory(sessionId);
      });

      expect(result.current.sessions[sessionId].messages).toHaveLength(0);
    });
  });

  describe('Message Management', () => {
    it('should add a message to session', () => {
      const { result } = renderHook(() => useChatHistory());

      let sessionId: string;

      act(() => {
        sessionId = result.current.createSession('public', 'https://test.com');
      });

      const message: ChatMessage = {
        id: 'msg1',
        content: 'Hello world',
        sender: 'user',
        timestamp: new Date(),
        status: 'sent'
      };

      act(() => {
        result.current.addMessage(sessionId, message);
      });

      expect(result.current.sessions[sessionId].messages).toHaveLength(1);
      expect(result.current.sessions[sessionId].messages[0]).toEqual(message);
    });

    it('should update message status', () => {
      const { result } = renderHook(() => useChatHistory());

      let sessionId: string;

      act(() => {
        sessionId = result.current.createSession('public', 'https://test.com');
        result.current.addMessage(sessionId, {
          id: 'msg1',
          content: 'Test',
          sender: 'user',
          timestamp: new Date(),
          status: 'sending'
        });
      });

      act(() => {
        result.current.updateMessageStatus(sessionId, 'msg1', 'sent');
      });

      expect(result.current.sessions[sessionId].messages[0].status).toBe('sent');
    });

    it('should set typing indicator', () => {
      const { result } = renderHook(() => useChatHistory());

      let sessionId: string;

      act(() => {
        sessionId = result.current.createSession('public', 'https://test.com');
      });

      expect(result.current.sessions[sessionId].isTyping).toBe(false);

      act(() => {
        result.current.setTyping(sessionId, true);
      });

      expect(result.current.sessions[sessionId].isTyping).toBe(true);
    });

    it('should handle non-existent session gracefully', () => {
      const { result } = renderHook(() => useChatHistory());

      act(() => {
        result.current.addMessage('non-existent', {
          id: 'msg1',
          content: 'Test',
          sender: 'user',
          timestamp: new Date(),
          status: 'sent'
        });
      });

      // Should not throw error
      expect(Object.keys(result.current.sessions)).toHaveLength(0);
    });
  });

  describe('Persistence', () => {
    it('should save sessions to localStorage when modified', () => {
      const { result } = renderHook(() => useChatHistory());

      act(() => {
        result.current.createSession('public', 'https://test.com');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chat_sessions',
        expect.stringContaining('"type":"public"')
      );
    });

    it('should cleanup expired sessions', () => {
      const expiredDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const mockSessions = {
        'session1': {
          id: 'session1',
          type: 'public' as const,
          messages: [],
          isActive: false,
          isTyping: false,
          webhookUrl: 'https://test.com',
          lastActivity: expiredDate,
          metadata: {}
        }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        sessions: Object.values(mockSessions),
        version: '1.0.0',
        lastCleanup: expiredDate.toISOString()
      }));

      const { result } = renderHook(() => useChatHistory());

      act(() => {
        result.current.cleanupExpiredSessions();
      });

      expect(Object.keys(result.current.sessions)).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage quota exceeded', () => {
      const { result } = renderHook(() => useChatHistory());

      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      act(() => {
        result.current.createSession('public', 'https://test.com');
      });

      expect(console.error).toHaveBeenCalled();
    });

    it('should validate session data structure', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        sessions: [
          {
            id: 'invalid-session',
            // Missing required fields
          }
        ],
        version: '1.0.0'
      }));

      const { result } = renderHook(() => useChatHistory());

      // Should filter out invalid sessions
      expect(Object.keys(result.current.sessions)).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should limit number of messages per session', () => {
      const { result } = renderHook(() => useChatHistory());

      let sessionId: string;

      act(() => {
        sessionId = result.current.createSession('public', 'https://test.com');
      });

      // Add more than the limit (assuming limit is 100)
      act(() => {
        for (let i = 0; i < 150; i++) {
          result.current.addMessage(sessionId, {
            id: `msg${i}`,
            content: `Message ${i}`,
            sender: 'user',
            timestamp: new Date(),
            status: 'sent'
          });
        }
      });

      // Should keep only the most recent messages
      expect(result.current.sessions[sessionId].messages.length).toBeLessThanOrEqual(100);
    });

    it('should debounce localStorage saves', async () => {
      const { result } = renderHook(() => useChatHistory());

      let sessionId: string;

      act(() => {
        sessionId = result.current.createSession('public', 'https://test.com');
      });

      // Add multiple messages quickly
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addMessage(sessionId, {
            id: `msg${i}`,
            content: `Message ${i}`,
            sender: 'user',
            timestamp: new Date(),
            status: 'sent'
          });
        }
      });

      // Should not call setItem for every message
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multi-tab Synchronization', () => {
    it('should handle storage events from other tabs', () => {
      const { result } = renderHook(() => useChatHistory());

      const newSessionData = {
        sessions: [{
          id: 'external-session',
          type: 'public' as const,
          messages: [],
          isActive: true,
          isTyping: false,
          webhookUrl: 'https://external.com',
          lastActivity: new Date(),
          metadata: {}
        }],
        version: '1.0.0',
        lastCleanup: new Date().toISOString()
      };

      // Simulate storage event from another tab
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'chat_sessions',
          newValue: JSON.stringify(newSessionData),
          storageArea: localStorage
        });
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.sessions['external-session']).toBeDefined();
    });
  });
});
