import { useEffect, useState, useRef } from 'react';

/**
 * Hook to analyze audio and extract amplitude data for lip sync
 * Returns the current audio amplitude (0-1) based on volume analysis
 */
export function useAudioAnalysis(audioElement: HTMLAudioElement | null) {
  const [amplitude, setAmplitude] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioElement) {
      setAmplitude(0);
      return;
    }

    console.log('🎵 Setting up audio analysis for element:', audioElement);

    // Initialize Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    
    // Create source from audio element
    let source: MediaElementAudioSourceNode;
    try {
      source = audioContext.createMediaElementSource(audioElement);
    } catch (error) {
      console.error('Failed to create media element source:', error);
      // Audio element might already be connected - try to use existing connection
      const destination = audioContext.destination;
      // Create a gain node to tap into the audio
      const gainNode = audioContext.createGain();
      gainNode.connect(analyser);
      analyser.connect(destination);
      // We'll need to connect the audio element differently
      audioElement.addEventListener('play', () => {
        // Try to create a new source when audio plays
        try {
          const newSource = audioContext.createMediaElementSource(audioElement);
          newSource.connect(analyser);
          newSource.connect(audioContext.destination);
        } catch (e) {
          console.error('Could not create source:', e);
        }
      });
      return;
    }

    // Configure analyser for smooth amplitude detection
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    // Analyze audio in real-time
    const analyze = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      // Use time domain data for amplitude (volume) detection
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
      
      // Calculate RMS (Root Mean Square) for more accurate amplitude
      let sumSquares = 0;
      let maxValue = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const normalized = Math.abs((dataArrayRef.current[i] - 128) / 128);
        sumSquares += normalized * normalized;
        maxValue = Math.max(maxValue, normalized);
      }
      const rms = Math.sqrt(sumSquares / dataArrayRef.current.length);
      
      // Use both RMS and peak for better detection
      const combined = (rms + maxValue) / 2;
      
      // Amplify the signal for more visible jaw movement
      const amplified = Math.min(combined * 12, 1); // Multiply by 12 to amplify, cap at 1
      
      // Apply a less aggressive curve to allow more movement
      const curvedAmplitude = Math.pow(amplified, 0.3);
      
      // Debug occasionally
      if (Math.random() < 0.01) {
        console.log('🎵 Audio analysis - RMS:', rms.toFixed(3), 'Max:', maxValue.toFixed(3), 'Amplitude:', curvedAmplitude.toFixed(3));
      }
      
      setAmplitude(curvedAmplitude);

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    // Start analysis when audio plays
    const handlePlay = () => {
      console.log('🎵 Audio started playing, beginning analysis');
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('🎵 Audio context resumed');
          analyze();
        });
      } else {
        analyze();
      }
    };
    
    // Also start analysis immediately if audio is already playing
    if (!audioElement.paused) {
      console.log('🎵 Audio already playing, starting analysis immediately');
      handlePlay();
    }

    // Stop analysis when audio pauses or ends
    const handlePause = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setAmplitude(0);
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handlePause);

    // Cleanup
    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handlePause);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (source) {
        source.disconnect();
      }
      if (analyser) {
        analyser.disconnect();
      }
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
      
      setAmplitude(0);
    };
  }, [audioElement]);

  return amplitude;
}
