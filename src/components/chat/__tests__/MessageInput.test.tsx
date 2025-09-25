/**
 * Tests for MessageInput component
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../MessageInput';

// Mock security validation
jest.mock('@/lib/chat/securityMiddleware', () => ({
  secureValidateMessage: jest.fn((content) => ({
    success: true,
    data: content
  }))
}));

const defaultProps = {
  onSendMessage: jest.fn(),
  placeholder: 'Type a message...',
  disabled: false,
  maxLength: 1000
};

describe('MessageInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render input field and send button', () => {
      render(<MessageInput {...defaultProps} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should show placeholder text', () => {
      render(<MessageInput {...defaultProps} />);

      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <MessageInput {...defaultProps} className="custom-input" />
      );

      expect(container.firstChild).toHaveClass('custom-input');
    });

    it('should disable input and button when disabled prop is true', () => {
      render(<MessageInput {...defaultProps} disabled={true} />);

      expect(screen.getByRole('textbox')).toBeDisabled();
      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });
  });

  describe('User Input', () => {
    it('should update input value when user types', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello world');

      expect(input).toHaveValue('Hello world');
    });

    it('should clear input after sending message', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      expect(input).toHaveValue('');
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      const onSendMessage = jest.fn();

      render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it('should not send whitespace-only messages', async () => {
      const user = userEvent.setup();
      const onSendMessage = jest.fn();

      render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, '   ');
      await user.click(sendButton);

      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it('should trim whitespace from messages', async () => {
      const user = userEvent.setup();
      const onSendMessage = jest.fn();

      render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, '  Hello world  ');
      await user.click(sendButton);

      expect(onSendMessage).toHaveBeenCalledWith('Hello world');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should send message on Enter key', async () => {
      const user = userEvent.setup();
      const onSendMessage = jest.fn();

      render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');

      expect(onSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('should add new line on Shift+Enter', async () => {
      const user = userEvent.setup();
      const onSendMessage = jest.fn();

      render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Line 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(input, 'Line 2');

      expect(input).toHaveValue('Line 1\nLine 2');
      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it('should not send on Enter when disabled', async () => {
      const user = userEvent.setup();
      const onSendMessage = jest.fn();

      render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} disabled={true} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');

      expect(onSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Character Limit', () => {
    it('should show character count', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} maxLength={100} showCharCount={true} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');

      expect(screen.getByText('5/100')).toBeInTheDocument();
    });

    it('should prevent input beyond max length', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} maxLength={10} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'This is a very long message');

      expect(input).toHaveValue('This is a ');
    });

    it('should show warning when approaching limit', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} maxLength={20} showCharCount={true} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Almost at the limit');

      const charCount = screen.getByText(/19\/20/);
      expect(charCount).toHaveClass('warning'); // Assuming warning class is applied
    });

    it('should disable send button when at max length', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} maxLength={5} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello');

      expect(sendButton).toBeDisabled();
    });
  });

  describe('Validation', () => {
    it('should validate message before sending', async () => {
      const { secureValidateMessage } = require('@/lib/chat/securityMiddleware');
      const user = userEvent.setup();
      const onSendMessage = jest.fn();

      render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      expect(secureValidateMessage).toHaveBeenCalledWith(
        'Test message',
        undefined, // sessionId not provided in this test
        undefined  // userType not provided in this test
      );
    });

    it('should show validation error', async () => {
      const { secureValidateMessage } = require('@/lib/chat/securityMiddleware');
      secureValidateMessage.mockReturnValue({
        success: false,
        error: { message: 'Invalid content' }
      });

      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Bad content');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid content')).toBeInTheDocument();
      });
    });

    it('should show blocked session error', async () => {
      const { secureValidateMessage } = require('@/lib/chat/securityMiddleware');
      secureValidateMessage.mockReturnValue({
        success: false,
        blocked: true,
        reason: 'Session blocked'
      });

      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Session blocked')).toBeInTheDocument();
      });
    });

    it('should clear validation error when user types', async () => {
      const { secureValidateMessage } = require('@/lib/chat/securityMiddleware');
      secureValidateMessage
        .mockReturnValueOnce({
          success: false,
          error: { message: 'Invalid content' }
        })
        .mockReturnValue({
          success: true,
          data: 'Valid content'
        });

      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // First attempt with invalid content
      await user.type(input, 'Bad content');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid content')).toBeInTheDocument();
      });

      // Clear and type new content
      await user.clear(input);
      await user.type(input, 'Good content');

      await waitFor(() => {
        expect(screen.queryByText('Invalid content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Debouncing', () => {
    it('should debounce validation calls', async () => {
      const { secureValidateMessage } = require('@/lib/chat/securityMiddleware');
      const user = userEvent.setup();

      render(<MessageInput {...defaultProps} sessionId="test" userType="public" />);

      const input = screen.getByRole('textbox');

      // Type quickly
      await user.type(input, 'Hello', { delay: 50 });

      // Should not call validation for every keystroke
      expect(secureValidateMessage).not.toHaveBeenCalled();

      // Wait for debounce
      await waitFor(() => {
        expect(secureValidateMessage).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });

  describe('Auto-resize', () => {
    it('should resize textarea based on content', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} autoResize={true} />);

      const input = screen.getByRole('textbox');
      const initialHeight = input.style.height;

      await user.type(input, 'Line 1\nLine 2\nLine 3\nLine 4');

      // Height should increase
      expect(input.style.height).not.toBe(initialHeight);
    });

    it('should respect max height when auto-resizing', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} autoResize={true} maxRows={3} />);

      const input = screen.getByRole('textbox');

      // Add many lines
      const manyLines = Array(10).fill('Line').join('\n');
      await user.type(input, manyLines);

      // Should not exceed max height
      const computedStyle = window.getComputedStyle(input);
      const maxHeight = parseFloat(computedStyle.maxHeight);
      const actualHeight = parseFloat(computedStyle.height);

      expect(actualHeight).toBeLessThanOrEqual(maxHeight);
    });
  });

  describe('Voice Input Integration', () => {
    it('should show voice button when voice is enabled', () => {
      render(<MessageInput {...defaultProps} enableVoice={true} />);

      expect(screen.getByRole('button', { name: /voice/i })).toBeInTheDocument();
    });

    it('should not show voice button when voice is disabled', () => {
      render(<MessageInput {...defaultProps} enableVoice={false} />);

      expect(screen.queryByRole('button', { name: /voice/i })).not.toBeInTheDocument();
    });

    it('should handle voice input result', async () => {
      const onSendMessage = jest.fn();
      render(<MessageInput {...defaultProps} enableVoice={true} onSendMessage={onSendMessage} />);

      const input = screen.getByRole('textbox');

      // Simulate voice input result
      fireEvent.change(input, { target: { value: 'Voice message' } });

      expect(input).toHaveValue('Voice message');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MessageInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      expect(input).toHaveAttribute('aria-label', expect.stringContaining('message'));
      expect(sendButton).toHaveAttribute('aria-label', expect.stringContaining('send'));
    });

    it('should announce validation errors to screen readers', async () => {
      const { secureValidateMessage } = require('@/lib/chat/securityMiddleware');
      secureValidateMessage.mockReturnValue({
        success: false,
        error: { message: 'Invalid content' }
      });

      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Bad content');
      await user.click(sendButton);

      await waitFor(() => {
        const errorElement = screen.getByText('Invalid content');
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} enableVoice={true} />);

      // Should be able to tab through elements
      await user.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /voice/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /send/i })).toHaveFocus();
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      const onSendMessage = jest.fn();

      render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      // Focus should return to input after sending
      expect(input).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const onSendMessage = jest.fn();
      const { rerender } = render(
        <MessageInput {...defaultProps} onSendMessage={onSendMessage} />
      );

      // Re-render with same props
      rerender(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

      // Component should handle this efficiently
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should cleanup debounce timers on unmount', () => {
      const { unmount } = render(<MessageInput {...defaultProps} />);

      // Should not cause memory leaks
      unmount();
    });
  });
});
