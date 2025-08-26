/**
 * VoiceInput Component
 *
 * Componente para captura e conversão de áudio para texto
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { VoiceConfig, VoiceInputState } from '@/lib/chat/chatTypes';
import { cn } from '@/lib/utils';
import {
  ExclamationTriangleIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface VoiceInputProps {
  /** Configuração de voz */
  config?: Partial<VoiceConfig>;
  /** Callback quando transcrição é concluída */
  onTranscription?: (text: string, confidence?: number) => void;
  /** Callback para erros */
  onError?: (error: string) => void;
  /** Se está desabilitado */
  disabled?: boolean;
  /** Classes CSS customizadas */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: VoiceConfig = {
  enabled: true,
  language: 'pt-BR',
  provider: 'browser',
  settings: {
    sensitivity: 0.8,
    maxRecordingTime: 30000, // 30 segundos
    noiseCancellation: true
  }
};

const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100,
    channelCount: 1
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Componente de entrada por voz
 */
const VoiceInput: React.FC<VoiceInputProps> = ({
  config = {},
  onTranscription,
  onError,
  disabled = false,
  className
}) => {
  // Configuração final
  const voiceConfig = { ...DEFAULT_CONFIG, ...config };

  // Estados
  const [voiceState, setVoiceState] = useState<VoiceInputState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    confidence: 0,
    error: undefined
  });

  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Inicializar Speech Recognition se disponível
   */
  useEffect(() => {
    if (voiceConfig.provider === 'browser' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = voiceConfig.language;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            setVoiceState(prev => ({
              ...prev,
              transcript: finalTranscript,
              confidence: confidence || 0
            }));
          } else {
            interimTranscript += transcript;
            setVoiceState(prev => ({
              ...prev,
              transcript: interimTranscript
            }));
          }
        }

        if (finalTranscript) {
          onTranscription?.(finalTranscript, event.results[0][0].confidence);
        }
      };

      recognition.onerror = (event) => {
        const errorMessage = `Erro no reconhecimento de voz: ${event.error}`;
        setVoiceState(prev => ({ ...prev, error: errorMessage }));
        onError?.(errorMessage);
      };

      recognition.onend = () => {
        setVoiceState(prev => ({
          ...prev,
          isRecording: false,
          isProcessing: false
        }));
        stopRecording();
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [voiceConfig.language, voiceConfig.provider, onTranscription, onError]);

  /**
   * Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      stopRecording();
      cleanup();
    };
  }, []);

  // ============================================================================
  // FUNCTIONS
  // ============================================================================

  /**
   * Inicia gravação de áudio
   */
  const startRecording = useCallback(async () => {
    try {
      // Limpar estado anterior
      setVoiceState({
        isRecording: false,
        isProcessing: false,
        transcript: '',
        confidence: 0,
        error: undefined
      });

      // Solicitar permissão de microfone
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      audioStreamRef.current = stream;

      // Configurar análise de áudio para nível
      setupAudioAnalysis(stream);

      // Configurar MediaRecorder para fallback
      if (voiceConfig.provider === 'external') {
        setupMediaRecorder(stream);
      }

      // Iniciar Speech Recognition se disponível
      if (voiceConfig.provider === 'browser' && recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Atualizar estado
      setVoiceState(prev => ({
        ...prev,
        isRecording: true,
        error: undefined
      }));

      // Timer de gravação
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 100;

          // Parar automaticamente no tempo limite
          if (newTime >= (voiceConfig.settings?.maxRecordingTime || 30000)) {
            stopRecording();
            return prev;
          }

          return newTime;
        });
      }, 100);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao acessar microfone';
      setVoiceState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [voiceConfig.provider, voiceConfig.settings?.maxRecordingTime, onError]);

  /**
   * Para gravação de áudio
   */
  const stopRecording = useCallback(() => {
    // Parar Speech Recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Parar MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Limpar timers
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (audioLevelTimerRef.current) {
      clearInterval(audioLevelTimerRef.current);
      audioLevelTimerRef.current = null;
    }

    // Parar stream de áudio
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    // Atualizar estado
    setVoiceState(prev => ({
      ...prev,
      isRecording: false
    }));

    setRecordingTime(0);
    setAudioLevel(0);
  }, []);

  /**
   * Configura análise de áudio para visualização
   */
  const setupAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Monitorar nível de áudio
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      audioLevelTimerRef.current = setInterval(() => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(100, (average / 255) * 100));
        }
      }, 100);

    } catch (error) {
      console.warn('Erro ao configurar análise de áudio:', error);
    }
  }, []);

  /**
   * Configura MediaRecorder para fallback
   */
  const setupMediaRecorder = useCallback((stream: MediaStream) => {
    try {
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
        processAudioBlob();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

    } catch (error) {
      console.warn('Erro ao configurar MediaRecorder:', error);
    }
  }, []);

  /**
   * Processa blob de áudio (para API externa)
   */
  const processAudioBlob = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;

    setVoiceState(prev => ({ ...prev, isProcessing: true }));

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Aqui você implementaria a chamada para API externa
      // Por enquanto, simular processamento
      const transcript = await simulateExternalSpeechToText(audioBlob);

      if (transcript) {
        setVoiceState(prev => ({
          ...prev,
          transcript,
          confidence: 0.9,
          isProcessing: false
        }));

        onTranscription?.(transcript, 0.9);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar áudio';
      setVoiceState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false
      }));
      onError?.(errorMessage);
    } finally {
      audioChunksRef.current = [];
    }
  }, [onTranscription, onError]);

  /**
   * Limpa recursos
   */
  const cleanup = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  }, []);

  /**
   * Toggle gravação
   */
  const toggleRecording = useCallback(() => {
    if (voiceState.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [voiceState.isRecording, startRecording, stopRecording]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Renderiza botão de gravação
   */
  const renderRecordButton = () => {
    const isActive = voiceState.isRecording || voiceState.isProcessing;

    return (
      <Button
        onClick={toggleRecording}
        disabled={disabled || voiceState.isProcessing}
        variant={isActive ? "destructive" : "outline"}
        size="lg"
        className={cn(
          "h-16 w-16 rounded-full transition-all duration-200",
          isActive && "animate-pulse scale-110"
        )}
        title={voiceState.isRecording ? "Parar gravação" : "Iniciar gravação"}
      >
        {voiceState.isProcessing ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current" />
        ) : voiceState.isRecording ? (
          <StopIcon className="h-6 w-6" />
        ) : (
          <MicrophoneIcon className="h-6 w-6" />
        )}
      </Button>
    );
  };

  /**
   * Renderiza visualizador de áudio
   */
  const renderAudioVisualizer = () => {
    if (!voiceState.isRecording) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <SpeakerWaveIcon className="h-4 w-4 text-muted-foreground" />
          <Progress value={audioLevel} className="flex-1" />
          <span className="text-xs text-muted-foreground w-8">
            {Math.round(audioLevel)}%
          </span>
        </div>

        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            {Math.round(recordingTime / 1000)}s / {Math.round((voiceConfig.settings?.maxRecordingTime || 30000) / 1000)}s
          </span>
        </div>
      </div>
    );
  };

  /**
   * Renderiza transcrição
   */
  const renderTranscription = () => {
    if (!voiceState.transcript) return null;

    return (
      <div className="p-3 bg-muted rounded-md">
        <div className="flex items-start space-x-2">
          <SpeakerWaveIcon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm">{voiceState.transcript}</p>
            {voiceState.confidence > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Confiança: {Math.round(voiceState.confidence * 100)}%
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renderiza erro
   */
  const renderError = () => {
    if (!voiceState.error) return null;

    return (
      <Alert variant="destructive">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertDescription>{voiceState.error}</AlertDescription>
      </Alert>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!voiceConfig.enabled) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Record Button */}
      <div className="flex justify-center">
        {renderRecordButton()}
      </div>

      {/* Audio Visualizer */}
      {renderAudioVisualizer()}

      {/* Transcription */}
      {renderTranscription()}

      {/* Error */}
      {renderError()}

      {/* Instructions */}
      {!voiceState.isRecording && !voiceState.transcript && (
        <p className="text-center text-sm text-muted-foreground">
          Clique no microfone e fale sua mensagem
        </p>
      )}
    </div>
  );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simula conversão speech-to-text externa
 * TODO: Implementar integração real com API externa
 */
async function simulateExternalSpeechToText(audioBlob: Blob): Promise<string> {
  // Simular delay de processamento
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Retornar texto simulado
  return "Mensagem convertida de áudio via API externa (simulação)";
}

// ============================================================================
// EXPORT
// ============================================================================

export default VoiceInput;
