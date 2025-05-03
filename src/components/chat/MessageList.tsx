import React from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  className?: string;
}

export function MessageList({ messages, className = '' }: MessageListProps) {
  const { user } = useAuth();

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {messages.map((message) => {
        const isSender = message.sender_id === user?.id;
        return (
          <div
            key={message.id}
            className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                isSender
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${isSender ? 'text-blue-100' : 'text-gray-500'}`}>
                {format(new Date(message.created_at), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}