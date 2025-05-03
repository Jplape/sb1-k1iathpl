import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles } from 'lucide-react';

interface AdDescriptionProps {
  description: string;
  descriptionAI?: string;
}

export function AdDescription({ description, descriptionAI }: AdDescriptionProps) {
  const content = descriptionAI || description;

  return (
    <div className="prose max-w-none dark:prose-invert" itemProp="description">
      {descriptionAI && (
        <div className="mb-4 flex items-center gap-2 text-brand">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Description générée par IA</span>
        </div>
      )}
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}