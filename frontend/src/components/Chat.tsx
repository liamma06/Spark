import { useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { useChat } from '../hooks/useChat';
import { cn, formatDate } from '../lib/utils';
import { DoctorModel } from './DoctorModel';

interface ChatProps {
  patientId: string;
  onEndCall?: (result: { closingMessage: string; summary: string }) => void;
  endCallRef?: React.MutableRefObject<(() => Promise<void>) | null>;
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

export function Chat({ patientId, onEndCall, endCallRef }: ChatProps) {
  const { messages, sendMessage, isLoading, audioUrl, initializeGreeting, handleEndCall } = useChat(patientId);
  const [input, setInput] = useState('');
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAssistantMessageId = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAudioUrl = useRef<string | null>(null);
  const [currentAudioElement, setCurrentAudioElement] = useState<HTMLAudioElement | null>(null);
  const greetingInitialized = useRef(false);

  // Initialize greeting on mount
  useEffect(() => {
    if (!greetingInitialized.current) {
      greetingInitialized.current = true;
      initializeGreeting();
    }
  }, [initializeGreeting]);

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
      
      // Set up audio element before playing (important for Web Audio API)
      audio.crossOrigin = 'anonymous'; // Allow CORS for audio analysis
      
      // Update state BEFORE playing so audio analysis can connect
      setCurrentAudioElement(audio);
      
      // Small delay to ensure state update and audio analysis setup
      setTimeout(() => {
        audio.play().catch((error) => {
          console.error('Failed to play audio:', error);
        });
      }, 100);
      
      // Clean up when audio finishes
      audio.addEventListener('ended', () => {
        if (audioRef.current === audio) {
          audioRef.current = null;
          setCurrentAudioElement(null); // Clear state when audio ends
        }
        URL.revokeObjectURL(audioUrl);
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setCurrentAudioElement(null);
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

  // Expose handleEndCall to parent via ref
  useEffect(() => {
    if (endCallRef) {
      endCallRef.current = async () => {
        try {
          const result = await handleEndCall(patientId);
          if (onEndCall) {
            onEndCall(result);
          }
        } catch (error) {
          console.error('Failed to end call:', error);
        }
      };
    }
  }, [handleEndCall, patientId, onEndCall, endCallRef]);

  return (
    <div className="flex h-full gap-6">
      {/* 3D Doctor Model - Left Side */}
      <div className="w-2/5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
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
            audioElement={currentAudioElement}
          />
          <Environment preset="sunset" />
        </Canvas>
      </div>

      {/* Chat Interface - Right Side */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-green-gradient-dark to-green-gradient-light">
          <h2 className="text-xl font-medium text-white">Care Companion</h2>
          <p className="text-sm text-green-100 mt-1">I'm here to help with your health questions</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-gradient-dark to-green-gradient-light flex items-center justify-center text-3xl">
                💬
              </div>
              <p className="text-lg font-medium text-slate-600 mb-1">Start a conversation</p>
              <p className="text-sm secondary-text">Describe how you're feeling today</p>
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
                  'max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-green-gradient-dark to-green-gradient-light text-white'
                    : 'bg-white text-slate-800 border border-slate-200'
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <p
                  className={cn(
                    'text-xs mt-2',
                    msg.role === 'user' ? 'text-green-100' : 'text-slate-400'
                  )}
                >
                  {formatDate(msg.createdAt)}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-5 py-3.5 shadow-sm border border-slate-200">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.15s]" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-5 border-t border-slate-200 bg-white">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe how you're feeling..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white text-slate-800 placeholder:text-slate-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-green-gradient-dark to-green-gradient-light text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            >
              {isLoading ? (
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
