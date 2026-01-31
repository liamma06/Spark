import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface DoctorModelProps {
  playAnimation?: boolean;
  onAnimationComplete?: () => void;
}

export function DoctorModel({ playAnimation, onAnimationComplete }: DoctorModelProps) {
  const group = useRef<THREE.Group>(null);
  const [previousPlayState, setPreviousPlayState] = useState(false);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const talkingActionRef = useRef<THREE.AnimationAction | null>(null);
  
  // Use DoctorM.glb (male doctor) - you can change to DoctorF.glb if preferred
  const { scene, animations } = useGLTF('/DoctorM.glb');
  
  // Ensure materials are properly set up
  useMemo(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material) {
            // Ensure material is properly configured
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                  mat.needsUpdate = true;
                }
              });
            } else if (child.material instanceof THREE.MeshStandardMaterial || child.material instanceof THREE.MeshBasicMaterial) {
              child.material.needsUpdate = true;
            }
          }
        }
      });
    }
  }, [scene]);
  
  const { actions, mixer } = useAnimations(animations || [], group);

  // Get all available animation names - use animations array as source of truth
  const animationNames = animations?.map(clip => clip.name) || [];
  
  // Debug logging
  if (animations && animations.length > 0) {
    console.log('✅ Animations loaded:', animationNames);
  } else {
    console.warn('⚠️ No animations found in GLB file. Check if DoctorM.glb has animations.');
  }
  
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
        // Stop idle animation
        if (idleActionRef.current && idleActionRef.current.isRunning()) {
          idleActionRef.current.setEffectiveWeight(0);
          idleActionRef.current.stop();
        }

        // Pick a random talking animation
        const randomTalkingAction = talkingAnimations[
          Math.floor(Math.random() * talkingAnimations.length)
        ];
        
        if (randomTalkingAction) {
          console.log('Playing talking animation');
          talkingActionRef.current = randomTalkingAction;
          randomTalkingAction.setLoop(THREE.LoopOnce, 1);
          randomTalkingAction.reset();
          randomTalkingAction.setEffectiveWeight(1);
          randomTalkingAction.play();
          
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
    // Update the animation mixer
    if (mixer) {
      mixer.update(delta);
    }
    
    // Check if talking animation has finished
    if (talkingActionRef.current) {
      const talkingAction = talkingActionRef.current;
      // Check if the animation has finished (time >= duration for LoopOnce)
      if (talkingAction.loop === THREE.LoopOnce && talkingAction.time >= talkingAction.getClip().duration) {
        // Stop talking animation
        talkingAction.setEffectiveWeight(0);
        talkingAction.stop();
        
        // Return to idle
        if (idleActionRef.current) {
          idleActionRef.current.reset();
          idleActionRef.current.setLoop(THREE.LoopRepeat, Infinity);
          idleActionRef.current.setEffectiveWeight(1);
          idleActionRef.current.play();
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

  // Rotate the model slightly for better viewing
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} scale={[1, 1, 1]} position={[0, -1, 0]} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/DoctorM.glb');
