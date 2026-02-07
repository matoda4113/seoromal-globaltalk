'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import logger from '@/lib/logger';

// Web Speech API 타입 정의
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export function useSpeechRecognition(
  onTranscript: (text: string) => void,
  language: string = 'ko-KR'
) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // 브라우저 지원 확인
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // 계속 듣기
      recognition.interimResults = false; // 중간 결과 안 받기 (최종 결과만)
      recognition.lang = language;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results;
        const lastResult = results[results.length - 1];

        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          if (transcript) {
            logger.info('🎤 STT 인식:', transcript);
            onTranscript(transcript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        logger.error('❌ STT 오류:', {
          type: event.type,
          error: event.error,
          message: event.message,
          full: event
        });

        // no-speech, aborted 에러는 무시 (정상적인 상황)
        if (event.error === 'no-speech' || event.error === 'aborted') {
          logger.log('ℹ️ STT 일시 중지 (말 안함 or 중단됨), 재시작 안 함');
          setIsListening(false);
          return;
        }

        setIsListening(false);
      };

      recognition.onend = () => {
        logger.log('🛑 STT 종료됨');
        // continuous: true 인데도 종료될 수 있으므로, 수동으로 재시작
        // (브라우저가 자동으로 멈추는 경우가 있음)
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      logger.warn('⚠️ 브라우저가 음성 인식을 지원하지 않습니다.');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // 이미 중지된 경우 무시
        }
      }
    };
  }, [language, onTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    try {
      recognitionRef.current.start();
      setIsListening(true);
      logger.log('🎤 STT 시작');
    } catch (error) {
      logger.error('❌ STT 시작 실패:', error);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
      setIsListening(false);
      logger.log('🛑 STT 중지');
    } catch (error) {
      logger.error('❌ STT 중지 실패:', error);
    }
  }, [isListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
}
