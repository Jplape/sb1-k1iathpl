import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import type { Conversation } from '../../types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  className?: string;
}

export function ConversationList({
  conversations,
  selectedId,
  className = '',
}: ConversationListProps) {
  return (
    <div className={`divide-y divide-gray-200 ${className}`}>
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          to={`/messages/${conversation.id}`}
          className={`block p-4 hover:bg-gray-50 ${
            selectedId === conversation.id ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {conversation.product?.title || 'Deleted Product'}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {conversation.last_message?.content || 'No messages yet'}
              </p>
            </div>
            <div className="text-xs text-gray-500">
              {conversation.last_message?.created_at
                ? format(new Date(conversation.last_message.created_at), 'MMM d')
                : format(new Date(conversation.created_at), 'MMM d')}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}