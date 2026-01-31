import { useState, useCallback, useEffect, useRef } from 'react';
import { streamChat, generateSpeech, patientsApi, closeChat } from '../lib/api';
import { generateId } from '../lib/utils';
import type { Message } from '../types';

export function useChat(patientId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const greetingInitialized = useRef(false);

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

  const clearMessages = useCallback(() => {
    setMessages([]);
    // Clean up audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    // Reset greeting flag when messages are cleared
    greetingInitialized.current = false;
  }, [audioUrl]);

  // Initialize greeting message when chat first loads
  useEffect(() => {
    // Only show greeting when there are no messages and we haven't initialized it yet
    if (messages.length === 0 && !greetingInitialized.current && patientId) {
      greetingInitialized.current = true;
      
      const initializeGreeting = async () => {
        try {
          // Fetch patient data to get their name
          let patientName: string | null = null;
          try {
            const patient = await patientsApi.getById(patientId);
            patientName = patient.name || null;
          } catch (error) {
            console.error('Failed to fetch patient data:', error);
            // Continue with generic greeting if fetch fails
          }

          // Generate greeting text
          const greetingText = patientName 
            ? `Hi ${patientName}, how can I help you?`
            : 'Hi, how can I help you?';

          // Create initial assistant message
          const greetingMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: greetingText,
            createdAt: new Date(),
          };

          // Add the greeting message
          setMessages([greetingMessage]);

          // Generate TTS audio for the greeting
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
          // If everything fails, show generic greeting without TTS
          const fallbackMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: 'Hi, how can I help you?',
            createdAt: new Date(),
          };
          setMessages([fallbackMessage]);
        }
      };

      initializeGreeting();
    }
  }, [messages.length, patientId]);

  const endChat = useCallback(async (): Promise<{ closingMessage: string; summary: string } | null> => {
    if (messages.length === 0) {
      return null;
    }

    try {
      setIsLoading(true);
      
      // Convert messages to API format
      const chatMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call close chat endpoint
      const result = await closeChat(chatMessages, patientId);
      
      // Add closing message to chat
      const closingMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: result.closingMessage,
        createdAt: new Date(),
      };
      
      setMessages((prev) => [...prev, closingMessage]);

      // Generate TTS for closing message
      try {
        const audioBlob = await generateSpeech(result.closingMessage);
        const audioUrlValue = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrlValue);
      } catch (error) {
        console.error('Failed to generate speech for closing message:', error);
        // Continue without audio
      }

      return result;
    } catch (error) {
      console.error('Failed to end chat:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [messages, patientId]);

  return { messages, sendMessage, isLoading, clearMessages, audioUrl, endChat };
}
