import { useState, useCallback } from 'react';
import { streamChat } from '../lib/api';
import { generateId } from '../lib/utils';
import type { Message } from '../types';

export function useChat(patientId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Create placeholder for assistant message
      const assistantId = generateId();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', createdAt: new Date() },
      ]);

      // Stream the response
      const chatMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let fullContent = '';
      for await (const chunk of streamChat(chatMessages, patientId)) {
        fullContent += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullContent } : m
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Add error message
      setMessages((prev) => [
        ...prev.slice(0, -1), // Remove placeholder
        {
          id: generateId(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, patientId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, sendMessage, isLoading, clearMessages };
}
