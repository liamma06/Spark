import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

import { useAudioAnalysis } from '../hooks/useAudioAnalysis';

interface DoctorModelProps {
  playAnimation?: boolean;
  onAnimationComplete?: () => void;
  audioElement?: HTMLAudioElement | null;
}

export function DoctorModel({ playAnimation, onAnimationComplete, audioElement }: DoctorModelProps) {
  const group = useRef<THREE.Group>(null);
  const [previousPlayState, setPreviousPlayState] = useState(false);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const talkingActionRef = useRef<THREE.AnimationAction | null>(null);
  const jawBoneRef = useRef<THREE.Bone | null>(null);
  const originalJawRotationRef = useRef<THREE.Euler | null>(null);
  
  // Use DoctorM.glb (male doctor) - you can change to DoctorF.glb if preferred
  // Use scene directly from useGLTF - do NOT clone as it breaks animations
  const { scene, animations } = useGLTF('/DoctorM.glb');
  
  const { actions, mixer } = useAnimations(animations || [], group);
  
  // Analyze audio for lip sync
  const audioAmplitude = useAudioAnalysis(audioElement || null);

  // Get all available animation names - use animations array as source of truth
  const animationNames = animations?.map(clip => clip.name) || [];
  
  // Find jaw bone in the scene and store original rotation
  useEffect(() => {
    if (!scene) return;
    
    scene.traverse((child) => {
      if (child instanceof THREE.Bone && child.name.toLowerCase() === 'jaw') {
        jawBoneRef.current = child;
        // Store original rotation to preserve animation-based rotation
        originalJawRotationRef.current = new THREE.Euler(
          child.rotation.x,
          child.rotation.y,
          child.rotation.z
        );
        console.log('✅ Jaw bone found:', child.name, 'Original rotation:', {
          x: child.rotation.x,
          y: child.rotation.y,
          z: child.rotation.z
        });
      }
    });
    
    if (!jawBoneRef.current) {
      console.warn('⚠️ Jaw bone not found. Make sure the bone is named "jaw" in the model.');
      // Try to find it with different case variations
      scene.traverse((child) => {
        if (child instanceof THREE.Bone) {
          console.log('Available bone:', child.name);
        }
      });
    }
  }, [scene]);

  // Proper material setup and model configuration - runs after scene loads
  useEffect(() => {
    if (!scene) return;
    
    // Verify scene structure and calculate bounds
    const meshes: THREE.Mesh[] = [];
    const bounds = new THREE.Box3();
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child);
        bounds.expandByObject(child);
        
        // Configure materials following the working implementation pattern
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach((mat) => {
            // Ensure proper texture encoding
            if (mat.map) {
              mat.map.colorSpace = THREE.SRGBColorSpace;
            }
            
            // Set material properties for proper rendering
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.roughness = 0.6;
              mat.metalness = 0.0;
              
              // Force opaque rendering - disable transparency
              mat.transparent = false;
              mat.opacity = 1.0;
              mat.alphaTest = 0;
              mat.depthWrite = true;
              mat.side = THREE.FrontSide;
              
              // Remove alpha map if present
              if (mat.alphaMap) {
                mat.alphaMap = null;
              }
              
              mat.envMapIntensity = 1;
              mat.needsUpdate = true;
            } else if (mat instanceof THREE.MeshBasicMaterial ||
                       mat instanceof THREE.MeshPhysicalMaterial ||
                       mat instanceof THREE.MeshLambertMaterial) {
              // Ensure other material types are also properly configured
              if (mat.map) {
                mat.map.colorSpace = THREE.SRGBColorSpace;
              }
              mat.needsUpdate = true;
            }
          });
        }
      }
    });
    
    // Debug: Log scene structure
    if (!bounds.isEmpty() && meshes.length > 0) {
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      
      console.log('✅ Scene loaded:', {
        meshes: meshes.length,
        bounds: {
          min: bounds.min.toArray(),
          max: bounds.max.toArray(),
          size: size.toArray(),
          center: center.toArray()
        },
        animations: animationNames.length
      });
    } else {
      if (meshes.length === 0) {
        console.warn('⚠️ No meshes found in scene!');
      }
      if (bounds.isEmpty()) {
        console.warn('⚠️ Scene bounds are empty - model may not be visible');
      }
    }
  }, [scene, animationNames.length]);
  
  // Debug logging for animations
  useEffect(() => {
    if (animations && animations.length > 0) {
      console.log('✅ Animations loaded:', animationNames);
    } else {
      console.warn('⚠️ No animations found in GLB file. Check if DoctorM.glb has animations.');
    }
  }, [animations, animationNames]);
  
  // Set up idle animation on mount and when animations become available
  useEffect(() => {
    if (!animations || animations.length === 0 || !mixer || !actions) {
      return;
    }
    
    // Find idle animation (case-insensitive search for "idle")
    const idleName = animationNames.find(name => 
      name.toLowerCase().includes('idle')
    );
    
    if (!idleName) {
      return;
    }
    
    const idleAction = actions[idleName];
    
    if (idleAction && !idleActionRef.current) {
      idleActionRef.current = idleAction;
      idleAction.setLoop(THREE.LoopRepeat, Infinity);
      idleAction.reset();
      idleAction.setEffectiveWeight(1);
      idleAction.play();
      console.log('Idle animation started:', idleName);
    }
  }, [animations, mixer, animationNames, actions]);

  // Handle talking animation trigger
  useEffect(() => {
    // Only trigger when playAnimation changes from false to true
    if (playAnimation && !previousPlayState && animationNames.length > 0 && mixer) {
      // Get talking animations (Talk1, Talk2)
      const talkingAnimationNames = animationNames.filter(name => 
        name.toLowerCase().includes('talk')
      );
      const talkingAnimations = talkingAnimationNames
        .map(name => actions[name])
        .filter(action => action !== null && action !== undefined);
      
      console.log('Animation trigger - available animations:', animationNames);
      console.log('Talking animations found:', talkingAnimations.length, talkingAnimationNames);
      
      if (talkingAnimations.length > 0) {
        // Pick a random talking animation
        const randomTalkingAction = talkingAnimations[
          Math.floor(Math.random() * talkingAnimations.length)
        ];
        
        if (randomTalkingAction) {
          console.log('Playing talking animation');
          randomTalkingAction.setLoop(THREE.LoopOnce, 1);
          randomTalkingAction.reset();
          randomTalkingAction.play();
          
          // Smooth crossfade from idle to talking (0.3 second transition)
          if (idleActionRef.current && idleActionRef.current.isRunning()) {
            idleActionRef.current.crossFadeTo(randomTalkingAction, 0.3, false);
          } else {
            randomTalkingAction.fadeIn(0.3);
          }
          
          talkingActionRef.current = randomTalkingAction;
          setPreviousPlayState(true);
        }
      } else {
        console.warn('No talking animations found! Available:', animationNames);
      }
    } else if (!playAnimation && previousPlayState) {
      // Reset state when animation is turned off
      setPreviousPlayState(false);
    }
  }, [playAnimation, previousPlayState, animationNames, actions, mixer, onAnimationComplete]);

  // Update mixer and check animation states
  useFrame((_, delta) => {
    // Update the animation mixer with slower speed (0.8x speed)
    if (mixer) {
      mixer.update(delta * 0.5);
    }
    
    // Check if talking animation has finished
    if (talkingActionRef.current) {
      const talkingAction = talkingActionRef.current;
      // Check if the animation has finished (time >= duration for LoopOnce)
      if (talkingAction.loop === THREE.LoopOnce && talkingAction.time >= talkingAction.getClip().duration) {
        // Smooth crossfade back to idle (0.3 second transition)
        if (idleActionRef.current) {
          idleActionRef.current.reset();
          idleActionRef.current.setLoop(THREE.LoopRepeat, Infinity);
          idleActionRef.current.play();
          
          // Crossfade from talking to idle
          talkingAction.crossFadeTo(idleActionRef.current, 0.3, false);
        } else {
          // Fallback: fade out talking if no idle action
          talkingAction.fadeOut(0.3);
        }
        
        talkingActionRef.current = null;
        onAnimationComplete?.();
      }
    }
    
    // Ensure idle animation is always playing when not talking
    if (!talkingActionRef.current && idleActionRef.current && !idleActionRef.current.isRunning()) {
      idleActionRef.current.reset();
      idleActionRef.current.setLoop(THREE.LoopRepeat, Infinity);
      idleActionRef.current.play();
    }
  });

  // Animate jaw bone based on audio amplitude
  useFrame(() => {
    if (jawBoneRef.current && originalJawRotationRef.current) {
      // Debug: Log amplitude occasionally
      if (Math.random() < 0.01) { // Log ~1% of frames
        console.log('Audio amplitude:', audioAmplitude.toFixed(3), 
                   'Jaw rotation:', jawBoneRef.current.rotation.x.toFixed(3));
      }
      
      if (audioAmplitude > 0) {
        // Rotate jaw down (open) based on audio amplitude
        // Add to original rotation to preserve any animation-based rotation
        const maxRotation = 1.2; // Maximum jaw opening in radians (increased significantly for visible movement)
        const jawRotation = audioAmplitude * maxRotation;
        
        // Add rotation to original (preserves animation, adds lip sync)
        // Try X-axis first (most common for jaw opening downward)
        jawBoneRef.current.rotation.x = originalJawRotationRef.current.x + jawRotation;
        
        // If X doesn't work, try these:
        // jawBoneRef.current.rotation.y = originalJawRotationRef.current.y + jawRotation;
        // jawBoneRef.current.rotation.z = originalJawRotationRef.current.z + jawRotation;
      } else {
        // Reset to original rotation when no audio
        if (originalJawRotationRef.current) {
          jawBoneRef.current.rotation.x = originalJawRotationRef.current.x;
          jawBoneRef.current.rotation.y = originalJawRotationRef.current.y;
          jawBoneRef.current.rotation.z = originalJawRotationRef.current.z;
        }
      }
    }
  });

  // Rotate the model slightly for better viewing
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  // Ensure scene is available before rendering
  if (!scene) {
    return null;
  }

  return (
    <group ref={group} dispose={null}>
      {/* Use scene directly from useGLTF - do NOT clone as it breaks animations */}
      <primitive object={scene} scale={[1, 1, 1]} position={[0, -1, 0]} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/DoctorM.glb');
