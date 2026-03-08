'use client';

import { ChatMessage } from '@/hooks/useSocket';
import { useRef, useEffect } from 'react';

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserId: number | undefined;
  onClearHistory: () => void;
  t: any; // translations
}

export default function ChatMessageList({
  messages,
  currentUserId,
  onClearHistory,
  t
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 추가될 때 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="absolute top-4 bottom-4 left-4 right-4 overflow-y-auto space-y-2 pointer-events-none z-10">
      {/* 채팅 지우기 버튼 */}
      {messages.length > 0 && (
        <div className="flex justify-end mb-2 pointer-events-auto">
          <button
            onClick={onClearHistory}
            className="bg-gray-800/70 hover:bg-gray-700/70 text-gray-300 text-xs px-3 py-1 rounded-full backdrop-blur-sm transition-colors"
          >
            🗑️ {t.clearChatHistory || '채팅 기록 지우기'}
          </button>
        </div>
      )}

      {/* 메시지 목록 */}
      {messages.map((msg) => {
          const isMyMessage = msg.senderId === currentUserId;

          return (
            <div
              key={msg.id}
              className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} pointer-events-auto`}
            >
              <div className={`max-w-xs ${isMyMessage ? 'bg-blue-600/90' : 'bg-gray-800/90'} backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg`}>
                <p className="text-white text-sm">{msg.message}</p>
              </div>
            </div>
          );
        })}
      <div ref={messagesEndRef} />
    </div>
  );
}
