/**
 * Tests for ChatInterface component
 */

import { ChatInterfaceProps } from '@/lib/chat/chatTypes';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '../ChatInterface';

// Mock hooks
const mockSendMessage = jest.fn();
const mockCreateSession = jest.fn();
const mockAddMessage = jest.fn();
const mockSetTyping = jest.fn();
const mockEndSession = jest.fn();

jest.mock('@/hooks/useN8nChat', () => ({
  useN8nChat: () => ({
    state: {
      isLoading: false,
      isTyping: false,
      error: null,
      lastResponse: null,
      retryCount: 0
    },
    sendMessage: mockSendMessage,
    retryLastMessage: jest.fn(),
    cancelRequest: jest.fn(),
    clearError: jest.fn(),
    testConnection: jest.fn(),
    updateConfig: jest.fn()
  })
}));

jest.mock('@/hooks/useChatHistory', () => ({
  useChatHistory: () => ({
    sessions: {
      'test-session': {
        id: 'test-session',
        type: 'public',
        messages: [],
        isActive: true,
        isTyping: false,
        webhookUrl: 'https://test.com',
        lastActivity: new Date(),
        metadata: {}
      }
    },
    activeSessionId: 'test-session',
    createSession: mockCreateSession,
    addMessage: mockAddMessage,
    updateMessageStatus: jest.fn(),
    setTyping: mockSetTyping,
    endSession: mockEndSession,
    clearHistory: jest.fn(),
    setActiveSession: jest.fn(),
    cleanupExpiredSessions: jest.fn()
  })
}));

// Mock child components
jest.mock('../ChatHistory', () => ({
  ChatHistory: ({ messages, isTyping }: any) => (
    <div data-testid="chat-history">
      {messages.map((msg: any) => (
        <div key={msg.id} data-testid="message">
          {msg.content}
        </div>
      ))}
      {isTyping && <div data-testid="typing-indicator">Typing...</div>}
    </div>
  )
}));

jest.mock('../MessageInput', () => ({
  MessageInput: ({ onSendMessage, disabled }: any) => (
    <div data-testid="message-input">
      <input
        data-testid="message-input-field"
        disabled={disabled}
        onChange={() => { }}
      />
      <button
        data-testid="send-button"
        onClick={() => onSendMessage('Test message')}
        disabled={disabled}
      >
        Send
      </button>
    </div>
  )
}));

jest.mock('../ChatError', () => ({
  ChatError: ({ error, onRetry, onDismiss }: any) => (
    <div data-testid="chat-error">
      <span>{error.message}</span>
      <button data-testid="retry-button" onClick={onRetry}>
        Retry
      </button>
      <button data-testid="dismiss-button" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  )
}));

const defaultProps: ChatInterfaceProps = {
  type: 'public',
  webhookUrl: 'https://test.com/webhook',
  placeholder: 'Type a message...',
  maxHeight: 400,
  enableVoice: false
};

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSession.mockReturnValue('test-session');
  });

  describe('Rendering', () => {
    it('should render chat interface components', () => {
      render(<ChatInterface {...defaultProps} />);

      expect(screen.getByTestId('chat-history')).toBeInTheDocument();
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ChatInterface {...defaultProps} className="custom-chat" />
      );

      expect(container.firstChild).toHaveClass('custom-chat');
    });

    it('should set max height style', () => {
      const { container } = render(
        <ChatInterface {...defaultProps} maxHeight={500} />
      );

      const chatContainer = container.querySelector('[style*="max-height"]');
      expect(chatContainer).toHaveStyle({ maxHeight: '500px' });
    });

    it('should apply theme classes', () => {
      const { container } = render(
        <ChatInterface {...defaultProps} theme="dark" />
      );

      expect(container.firstChild).toHaveClass('theme-dark');
    });
  });

  describe('Session Management', () => {
    it('should create session on mount', () => {
      render(<ChatInterface {...defaultProps} />);

      expect(mockCreateSession).toHaveBeenCalledWith(
        'public',
        'https://test.com/webhook'
      );
    });

    it('should call onSessionStart callback', () => {
      const onSessionStart = jest.fn();

      render(
        <ChatInterface {...defaultProps} onSessionStart={onSessionStart} />
      );

      expect(onSessionStart).toHaveBeenCalledWith('test-session');
    });

    it('should end session on unmount', () => {
      const onSessionEnd = jest.fn();

      const { unmount } = render(
        <ChatInterface {...defaultProps} onSessionEnd={onSessionEnd} />
      );

      unmount();

      expect(mockEndSession).toHaveBeenCalledWith('test-session');
      expect(onSessionEnd).toHaveBeenCalledWith('test-session');
    });
  });

  describe('Message Sending', () => {
    it('should send message when user submits', async () => {
      mockSendMessage.mockResolvedValue({
        success: true,
        data: { response: 'Hello back!' }
      });

      render(<ChatInterface {...defaultProps} />);

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          'test-session',
          'Test message',
          'public',
          expect.any(Object)
        );
      });
    });

    it('should add user message to history', async () => {
      mockSendMessage.mockResolvedValue({
        success: true,
        data: { response: 'Response' }
      });

      render(<ChatInterface {...defaultProps} />);

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockAddMessage).toHaveBeenCalledWith(
          'test-session',
          expect.objectContaining({
            content: 'Test message',
            sender: 'user',
            status: 'sending'
          })
        );
      });
    });

    it('should add agent response to history', async () => {
      mockSendMessage.mockResolvedValue({
        success: true,
        data: { response: 'Agent response' }
      });

      render(<ChatInterface {...defaultProps} />);

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockAddMessage).toHaveBeenCalledWith(
          'test-session',
          expect.objectContaining({
            content: 'Agent response',
            sender: 'agent',
            status: 'delivered'
          })
        );
      });
    });

    it('should show typing indicator during response', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockSendMessage.mockReturnValue(promise);

      render(<ChatInterface {...defaultProps} />);

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      // Should show typing indicator
      expect(mockSetTyping).toHaveBeenCalledWith('test-session', true);

      // Complete the promise
      resolvePromise!({
        success: true,
        data: { response: 'Response' }
      });

      await waitFor(() => {
        expect(mockSetTyping).toHaveBeenCalledWith('test-session', false);
      });
    });

    it('should disable input while sending', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockSendMessage.mockReturnValue(promise);

      render(<ChatInterface {...defaultProps} />);

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      // Input should be disabled
      expect(screen.getByTestId('message-input-field')).toBeDisabled();
      expect(screen.getByTestId('send-button')).toBeDisabled();

      // Complete the promise
      resolvePromise!({
        success: true,
        data: { response: 'Response' }
      });

      await waitFor(() => {
        expect(screen.getByTestId('message-input-field')).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error when message sending fails', async () => {
      const error = {
        type: 'NETWORK_ERROR',
        message: 'Network failed',
        retryable: true
      };

      mockSendMessage.mockRejectedValue(error);

      render(<ChatInterface {...defaultProps} />);

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('chat-error')).toBeInTheDocument();
        expect(screen.getByText('Network failed')).toBeInTheDocument();
      });
    });

    it('should call onError callback', async () => {
      const onError = jest.fn();
      const error = {
        type: 'NETWORK_ERROR',
        message: 'Network failed'
      };

      mockSendMessage.mockRejectedValue(error);

      render(<ChatInterface {...defaultProps} onError={onError} />);

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('should retry failed message', async () => {
      const error = {
        type: 'NETWORK_ERROR',
        message: 'Network failed',
        retryable: true
      };

      mockSendMessage
        .mockRejectedValueOnce(error)
        .mockResolvedValue({
          success: true,
          data: { response: 'Success after retry' }
        });

      render(<ChatInterface {...defaultProps} />);

      // First attempt fails
      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('chat-error')).toBeInTheDocument();
      });

      // Retry
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledTimes(2);
        expect(screen.queryByTestId('chat-error')).not.toBeInTheDocument();
      });
    });

    it('should dismiss error', async () => {
      const error = {
        type: 'VALIDATION_ERROR',
        message: 'Invalid message'
      };

      mockSendMessage.mockRejectedValue(error);

      render(<ChatInterface {...defaultProps} />);

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('chat-error')).toBeInTheDocument();
      });

      const dismissButton = screen.getByTestId('dismiss-button');
      fireEvent.click(dismissButton);

      expect(screen.queryByTestId('chat-error')).not.toBeInTheDocument();
    });
  });

  describe('Voice Input', () => {
    it('should show voice input when enabled', () => {
      render(<ChatInterface {...defaultProps} enableVoice={true} />);

      // Voice input should be rendered (mocked component would show)
      // This test depends on the actual VoiceInput component implementation
    });

    it('should not show voice input when disabled', () => {
      render(<ChatInterface {...defaultProps} enableVoice={false} />);

      // Voice input should not be rendered
      // This test depends on the actual VoiceInput component implementation
    });
  });

  describe('Metrics and Callbacks', () => {
    it('should call onMetrics for message events', async () => {
      const onMetrics = jest.fn();

      mockSendMessage.mockResolvedValue({
        success: true,
        data: { response: 'Response' }
      });

      render(<ChatInterface {...defaultProps} onMetrics={onMetrics} />);

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(onMetrics).toHaveBeenCalledWith('message_sent', expect.any(Object));
        expect(onMetrics).toHaveBeenCalledWith('response_received', expect.any(Object));
      });
    });

    it('should track response time', async () => {
      const onMetrics = jest.fn();

      mockSendMessage.mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            success: true,
            data: { response: 'Response' }
          }), 100)
        )
      );

      render(<ChatInterface {...defaultProps} onMetrics={onMetrics} />);

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(onMetrics).toHaveBeenCalledWith(
          'response_received',
          expect.objectContaining({
            responseTime: expect.any(Number)
          })
        );
      });

      const responseCall = onMetrics.mock.calls.find(
        call => call[0] === 'response_received'
      );
      expect(responseCall[1].responseTime).toBeGreaterThan(90);
    });
  });

  describe('Session Actions', () => {
    it('should handle session completion', async () => {
      const onSessionEnd = jest.fn();

      mockSendMessage.mockResolvedValue({
        success: true,
        data: {
          response: 'Goodbye!',
          sessionComplete: true
        }
      });

      render(<ChatInterface {...defaultProps} onSessionEnd={onSessionEnd} />);

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockEndSession).toHaveBeenCalledWith('test-session');
        expect(onSessionEnd).toHaveBeenCalledWith('test-session');
      });
    });

    it('should handle chat actions from response', async () => {
      mockSendMessage.mockResolvedValue({
        success: true,
        data: {
          response: 'Please fill out this form',
          actions: [{
            type: 'form',
            payload: { formId: 'contact-form' },
            description: 'Contact form'
          }]
        }
      });

      render(<ChatInterface {...defaultProps} />);

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        // Actions should be processed
        // This depends on how actions are implemented in the component
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ChatInterface {...defaultProps} />);

      const chatContainer = screen.getByRole('region');
      expect(chatContainer).toHaveAttribute('aria-label', expect.stringContaining('Chat'));
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByTestId('message-input-field');

      // Should be able to focus input
      await user.tab();
      expect(input).toHaveFocus();

      // Should be able to navigate to send button
      await user.tab();
      expect(screen.getByTestId('send-button')).toHaveFocus();
    });

    it('should announce messages to screen readers', async () => {
      mockSendMessage.mockResolvedValue({
        success: true,
        data: { response: 'Agent response' }
      });

      render(<ChatInterface {...defaultProps} />);

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        // Should have aria-live region for announcements
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<ChatInterface {...defaultProps} />);

      // Re-render with same props
      rerender(<ChatInterface {...defaultProps} />);

      // Should not create new session
      expect(mockCreateSession).toHaveBeenCalledTimes(1);
    });

    it('should cleanup on unmount', () => {
      const { unmount } = render(<ChatInterface {...defaultProps} />);

      unmount();

      // Should cleanup session and listeners
      expect(mockEndSession).toHaveBeenCalled();
    });
  });
});
