import { useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { useChat } from '../hooks/useChat';
import { cn, formatDate } from '../lib/utils';
import { DoctorModel } from './DoctorModel';

interface ChatProps {
  patientId: string;
}

// Camera component to focus on the doctor's upper torso
function CameraFocus() {
  const { camera } = useThree();
  
  useEffect(() => {
    // Model is at [0, -1, 0], so waist is at Y=0, upper torso is at Y=0.3-0.6
    camera.position.set(0, 0.6, 1.1);
    camera.lookAt(0, 0.6, 0); // Look at upper torso area (above waist)
    camera.updateProjectionMatrix();
  }, [camera]);
  
  return null;
}

export function Chat({ patientId }: ChatProps) {
  const { messages, sendMessage, isLoading, audioUrl } = useChat(patientId);
  const [input, setInput] = useState('');
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAssistantMessageId = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAudioUrl = useRef<string | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Trigger animation when message is ready (after TTS completes)
  // Since we now buffer the response until TTS is ready, this will trigger
  // when both chat and TTS are complete, ensuring synchronization
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.role === 'assistant' &&
      lastMessage.id !== lastAssistantMessageId.current &&
      lastMessage.content.length > 0 // Message is ready (TTS has completed)
    ) {
      console.log('Triggering animation for message (after TTS ready):', lastMessage.id);
      lastAssistantMessageId.current = lastMessage.id;
      // Reset trigger first, then set to true to ensure the change is detected
      setTriggerAnimation(false);
      setTimeout(() => {
        setTriggerAnimation(true);
      }, 50);
    }
  }, [messages]);

  // Play audio when new audio URL is available
  useEffect(() => {
    if (audioUrl && audioUrl !== lastAudioUrl.current) {
      lastAudioUrl.current = audioUrl;
      
      // Clean up previous audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Create and play new audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.play().catch((error) => {
        console.error('Failed to play audio:', error);
      });
      
      // Clean up when audio finishes
      audio.addEventListener('ended', () => {
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        URL.revokeObjectURL(audioUrl);
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const handleAnimationComplete = () => {
    setTriggerAnimation(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex h-full gap-4">
      {/* 3D Doctor Model - Left Side */}
      <div className="w-1/3 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Canvas
          camera={{ position: [0, 0.4, 3.5], fov: 55 }}
          style={{ width: '100%', height: '100%' }}
        >
          <CameraFocus />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-5, 0, -5]} intensity={0.4} />
          <DoctorModel 
            playAnimation={triggerAnimation} 
            onAnimationComplete={handleAnimationComplete}
          />
          <Environment preset="sunset" />
        </Canvas>
      </div>

      {/* Chat Interface - Right Side */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">Care Companion</h2>
        <p className="text-sm text-slate-500">I'm here to help with your health questions</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-12">
            <p className="text-4xl mb-4">💬</p>
            <p>Start a conversation about how you're feeling</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                msg.role === 'user'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 text-slate-800'
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p
                className={cn(
                  'text-xs mt-1',
                  msg.role === 'user' ? 'text-sky-200' : 'text-slate-400'
                )}
              >
                {formatDate(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe how you're feeling..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
