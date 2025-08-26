/**
 * MessageInput Component
 *
 * Componente de entrada de mensagens com funcionalidades avançadas
 */

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { validateAndSanitizeMessage } from '@/lib/chat/chatValidation';
import { cn } from '@/lib/utils';
import {
  MicrophoneIcon,
  PaperAirplaneIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface MessageInputProps {
  /** Placeholder do input */
  placeholder?: string;
  /** Se está desabilitado */
  disabled?: boolean;
  /** Se deve habilitar entrada por voz */
  enableVoice?: boolean;
  /** Callback para envio de mensagem */
  onSendMessage: (content: string, isVoice?: boolean) => void;
  /** Classes CSS customizadas */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_MESSAGE_LENGTH = 1000;
const DEBOUNCE_DELAY = 300;

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Input de mensagens com funcionalidades avançadas
 */
const MessageInput: React.FC<MessageInputProps> = ({
  placeholder = "Digite sua mensagem...",
  disabled = false,
  enableVoice = false,
  onSendMessage,
  className
}) => {
  // Estados
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const debounceRef = useRef<NodeJS.Timeout>();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Auto-resize do textarea
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  /**
   * Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Valida mensagem em tempo real
   */
  const validateMessage = useCallback((content: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (content.trim()) {
        const validation = validateAndSanitizeMessage(content);
        setValidationError(validation.success ? null : validation.error || 'Mensagem inválida');
      } else {
        setValidationError(null);
      }
    }, DEBOUNCE_DELAY);
  }, []);

  /**
   * Manipula mudança no textarea
   */
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    // Limitar tamanho
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setMessage(value);
      validateMessage(value);
    }
  }, [validateMessage]);

  /**
   * Manipula teclas pressionadas
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, []);

  /**
   * Envia mensagem de texto
   */
  const handleSendMessage = useCallback(() => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || disabled || validationError) {
      return;
    }

    // Validar novamente antes de enviar
    const validation = validateAndSanitizeMessage(trimmedMessage);
    if (!validation.success) {
      setValidationError(validation.error || 'Mensagem inválida');
      return;
    }

    // Enviar mensagem
    onSendMessage(validation.data!, false);

    // Limpar input
    setMessage('');
    setValidationError(null);

    // Focar no textarea
    textareaRef.current?.focus();
  }, [message, disabled, validationError, onSendMessage]);

  /**
   * Inicia gravação de voz
   */
  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        processVoiceRecording();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      setValidationError('Erro ao acessar microfone. Verifique as permissões.');
    }
  }, []);

  /**
   * Para gravação de voz
   */
  const stopVoiceRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  /**
   * Processa gravação de voz
   */
  const processVoiceRecording = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;

    setIsProcessingVoice(true);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Aqui você implementaria a conversão speech-to-text
      // Por enquanto, vamos simular com um placeholder
      const transcription = await simulateSpeechToText(audioBlob);

      if (transcription) {
        setMessage(transcription);
        validateMessage(transcription);
      }

    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      setValidationError('Erro ao processar áudio. Tente novamente.');
    } finally {
      setIsProcessingVoice(false);
      audioChunksRef.current = [];
    }
  }, [validateMessage]);

  /**
   * Toggle gravação de voz
   */
  const toggleVoiceRecording = useCallback(() => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  }, [isRecording, startVoiceRecording, stopVoiceRecording]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Renderiza contador de caracteres
   */
  const renderCharacterCount = () => {
    const count = message.length;
    const isNearLimit = count > MAX_MESSAGE_LENGTH * 0.8;

    return (
      <span className={cn(
        "text-xs",
        isNearLimit ? "text-warning" : "text-muted-foreground"
      )}>
        {count}/{MAX_MESSAGE_LENGTH}
      </span>
    );
  };

  /**
   * Renderiza botão de voz
   */
  const renderVoiceButton = () => {
    if (!enableVoice) return null;

    return (
      <Button
        type="button"
        variant={isRecording ? "destructive" : "ghost"}
        size="sm"
        onClick={toggleVoiceRecording}
        disabled={disabled || isProcessingVoice}
        className={cn(
          "h-8 w-8 p-0",
          isRecording && "animate-pulse"
        )}
        title={isRecording ? "Parar gravação" : "Gravar mensagem"}
      >
        {isProcessingVoice ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        ) : isRecording ? (
          <StopIcon className="h-4 w-4" />
        ) : (
          <MicrophoneIcon className="h-4 w-4" />
        )}
      </Button>
    );
  };

  /**
   * Renderiza botão de envio
   */
  const renderSendButton = () => {
    const canSend = message.trim() && !disabled && !validationError;

    return (
      <Button
        type="submit"
        size="sm"
        onClick={handleSendMessage}
        disabled={!canSend}
        className="h-8 w-8 p-0"
        title="Enviar mensagem (Enter)"
      >
        <PaperAirplaneIcon className="h-4 w-4" />
      </Button>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn("p-3 space-y-2", className)}>
      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Textarea */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Gravando..." : placeholder}
            disabled={disabled || isRecording || isProcessingVoice}
            className={cn(
              "min-h-[40px] max-h-[120px] resize-none",
              "transition-all duration-200",
              validationError && "border-destructive focus-visible:ring-destructive",
              isRecording && "bg-destructive/5 border-destructive/50"
            )}
            rows={1}
          />

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-2 right-2 flex items-center space-x-1 text-destructive">
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
              <span className="text-xs font-medium">REC</span>
            </div>
          )}
        </div>

        {/* Voice Button */}
        {renderVoiceButton()}

        {/* Send Button */}
        {renderSendButton()}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        {/* Error Message */}
        {validationError ? (
          <span className="text-destructive">{validationError}</span>
        ) : isProcessingVoice ? (
          <span className="text-muted-foreground">Processando áudio...</span>
        ) : (
          <span className="text-muted-foreground">
            {enableVoice ? "Digite ou grave sua mensagem" : "Digite sua mensagem"}
          </span>
        )}

        {/* Character Count */}
        {renderCharacterCount()}
      </div>
    </div>
  );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simula conversão speech-to-text
 * TODO: Implementar integração real com API de speech-to-text
 */
async function simulateSpeechToText(audioBlob: Blob): Promise<string | null> {
  // Simular delay de processamento
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Retornar texto simulado
  return "Mensagem convertida de áudio (simulação)";
}

// ============================================================================
// EXPORT
// ============================================================================

export default MessageInput;
