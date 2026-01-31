import { useState, useCallback } from 'react';
import { streamChat, generateSpeech, getGreeting, endCall } from '../lib/api';
import { generateId } from '../lib/utils';
import type { Message } from '../types';

export function useChat(patientId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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
      // Create placeholder for assistant message (will be updated after TTS completes)
      const assistantId = generateId();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', createdAt: new Date() },
      ]);

      // Stream the response into a buffer (don't update UI yet)
      const chatMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let fullContent = '';
      for await (const chunk of streamChat(chatMessages, patientId)) {
        fullContent += chunk;
        // Don't update messages here - buffer the content
      }
      
      // Generate speech audio from the complete response
      let audioUrlValue: string | null = null;
      if (fullContent.trim()) {
        try {
          const audioBlob = await generateSpeech(fullContent);
          audioUrlValue = URL.createObjectURL(audioBlob);
          setAudioUrl(audioUrlValue);
        } catch (error) {
          console.error('Failed to generate speech:', error);
          // Continue without audio - don't fail the chat
          // Message will still appear even if TTS fails (graceful degradation)
        }
      }
      
      // Now that both chat and TTS are complete (or TTS failed), update the message
      // This ensures the message appears and animation triggers simultaneously
      // If TTS failed, message still appears (graceful degradation)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: fullContent } : m
        )
      );
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

  const initializeGreeting = useCallback(async () => {
    // Don't initialize if there are already messages
    if (messages.length > 0) return;
    
    setIsLoading(true);
    try {
      // Get the hardcoded greeting text
      const greetingData = await getGreeting();
      const greetingText = greetingData.text;
      
      // Create the greeting message
      const greetingId = generateId();
      const greetingMessage: Message = {
        id: greetingId,
        role: 'assistant',
        content: greetingText,
        createdAt: new Date(),
      };
      
      // Add the message first
      setMessages([greetingMessage]);
      
      // Generate speech audio from the greeting
      try {
        const audioBlob = await generateSpeech(greetingText);
        const audioUrlValue = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrlValue);
      } catch (error) {
        console.error('Failed to generate speech for greeting:', error);
        // Continue without audio - message will still appear
      }
    } catch (error) {
      console.error('Failed to initialize greeting:', error);
      // Don't show error to user, just continue without greeting
    } finally {
      setIsLoading(false);
    }
  }, [messages.length]);

  const handleEndCall = useCallback(async (patientId: string): Promise<{ closingMessage: string; summary: string }> => {
    setIsLoading(true);
    try {
      // Prepare messages for summary
      const chatMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      
      // Call end call endpoint
      const result = await endCall(chatMessages, patientId);
      
      // Add closing message to chat
      const closingId = generateId();
      const closingMessage: Message = {
        id: closingId,
        role: 'assistant',
        content: result.closingMessage,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, closingMessage]);
      
      // Generate speech for closing message
      try {
        const audioBlob = await generateSpeech(result.closingMessage);
        const audioUrlValue = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrlValue);
      } catch (error) {
        console.error('Failed to generate speech for closing message:', error);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to end call:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    // Clean up audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  return { messages, sendMessage, isLoading, clearMessages, audioUrl, initializeGreeting, handleEndCall };
}
