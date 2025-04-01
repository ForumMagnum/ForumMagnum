/* eslint-disable no-mixed-operators */
/* eslint-disable no-console */
/*

MIT License

Copyright (c) 2024 ux-ui.pro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface CylinderState {
  currentSpeed: number;
  targetAngle: number | null;
  status: 'rest' | 'spinning' | 'stopping';
}

interface ThreeSlotMachineProps {
  textureUrls: string[];
  winningItemIndex: number; // Index in textureUrls to land on
  startSpin: boolean; // Signal to start the spin
  onSpinComplete: () => void; // Callback when animation finishes
  cylinderCount?: number;
  symbolsPerReel?: number; // Should match textureUrls.length
  baseSpinSpeed?: number;
  spinAccelFactor?: number;
  cylinderStopDelayMs?: number;
  decelerationEase?: number;
  cameraDistance?: number;
  geometryDimensions?: [number, number, number];
  radialSegments?: number;
  wobbleAmplitude?: number;
  wobbleFrequency?: number;
}

const ThreeSlotMachine: React.FC<ThreeSlotMachineProps> = ({
  textureUrls,
  winningItemIndex,
  startSpin,
  onSpinComplete,
  cylinderCount = 3,
  symbolsPerReel = textureUrls.length, // Default to using all textures
  baseSpinSpeed = 1,
  spinAccelFactor = 30,
  cylinderStopDelayMs = 250,
  decelerationEase = 1.5,
  cameraDistance = 5, // Adjusted default
  geometryDimensions = [0.75, 0.75, 1], // Adjusted default
  radialSegments = 32, // Smoother default
  wobbleAmplitude = 0.05, // Subtle wobble
  wobbleFrequency = 1.5,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const cylindersRef = useRef<THREE.Mesh[]>([]);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const animationFrameIdRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const resizeTimeoutRef = useRef<number | null>(null);

  // Refs for mutable state used within the animation loop (avoids re-renders)
  const cylinderStatesRef = useRef<CylinderState[]>([]);
  const currentGlobalStateRef = useRef<'rest' | 'spinning' | 'stopping'>('rest');
  const restAnglesRef = useRef<number[]>([]);
  const phaseOffsetsRef = useRef<number[]>([]);
  const wobbleStartTimeRef = useRef<number>(0);

  const [isInitialized, setIsInitialized] = useState(false);

  // --- Helper Functions ---

  const getSegmentAngle = useCallback((segment: number): number => {
    // segment is 0-indexed (from winningItemIndex)
    const segmentAngle = (2 * Math.PI) / symbolsPerReel;
    const offset = segmentAngle / 2; // Center the segment visually
    // Adjust calculation for 0-based index and desired front-facing orientation
    return Math.PI / 2 - (segment * segmentAngle + offset);
  }, [symbolsPerReel]);

  const storeRestAngles = useCallback(() => {
    restAnglesRef.current = cylindersRef.current.map(c => c.rotation.x);
  }, []);

  const finalizeSpin = useCallback(() => {
    console.log("Finalizing spin");
    currentGlobalStateRef.current = 'rest';
    storeRestAngles();
    wobbleStartTimeRef.current = clockRef.current.getElapsedTime();
    onSpinComplete(); // Notify parent component
  }, [onSpinComplete, storeRestAngles]);

  // --- Animation Loop ---

  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const deltaTime = clockRef.current.getDelta();
    const currentTime = clockRef.current.getElapsedTime();

    let allCylindersResting = true;

    cylindersRef.current.forEach((cylinder, i) => {
      const state = cylinderStatesRef.current[i];
      if (!state) return; // Should not happen if initialized correctly

      switch (state.status) {
        case 'spinning':
          cylinder.rotation.x += state.currentSpeed * deltaTime;
          allCylindersResting = false;
          break;

        case 'stopping':
          if (state.targetAngle !== null) {
            const diff = state.targetAngle - cylinder.rotation.x;
            // Normalize diff to be within -PI to PI for comparison, though targetAngle includes rotations
             const normalizedDiff = (diff + Math.PI) % (2 * Math.PI) - Math.PI;


            if (Math.abs(diff) < 0.01) { // Tolerance for stopping
              cylinder.rotation.x = state.targetAngle;
              state.status = 'rest';
              console.log(`Cylinder ${i} reached target and is resting.`);
            } else {
               // Smoother deceleration: approach target angle
               const speedReductionFactor = Math.max(0.1, Math.min(1, Math.pow(Math.abs(normalizedDiff) / Math.PI, 0.5))); // Slow down more aggressively near target
               const speed = state.currentSpeed * speedReductionFactor * decelerationEase;
               const moveStep = Math.sign(diff) * Math.min(Math.abs(diff), speed * deltaTime); // Don't overshoot

               cylinder.rotation.x += moveStep;
               allCylindersResting = false;
            }
          } else {
              allCylindersResting = false; // Still waiting for target angle
          }
          break;

        case 'rest':
          if (currentGlobalStateRef.current === 'rest') {
             // Apply wobble effect when globally resting
            const wobbleElapsed = currentTime - wobbleStartTimeRef.current;
            // Ease in the wobble effect
            const wobbleEaseFactor = Math.min(1, wobbleElapsed / 1.0); // 1 second ease-in
            const currentAmplitude = wobbleAmplitude * wobbleEaseFactor;
            cylinder.rotation.x = restAnglesRef.current[i] +
                                  currentAmplitude * Math.sin(currentTime * wobbleFrequency + phaseOffsetsRef.current[i]);

          }
          // If globally stopping, a resting cylinder stays put until the global state becomes 'rest'
           else if (currentGlobalStateRef.current === 'stopping') {
               // Hold position
           }
           else { // If globally spinning, should not be in rest state (error?)
               console.warn(`Cylinder ${i} in REST state while global state is ${currentGlobalStateRef.current}`);
           }
          break;
      }
    });

    // Check if the overall spin should be finalized
    if (currentGlobalStateRef.current === 'stopping' && allCylindersResting) {
      finalizeSpin();
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationFrameIdRef.current = requestAnimationFrame(animate);

  }, [finalizeSpin, wobbleAmplitude, wobbleFrequency, decelerationEase]);

  // --- Resize Handling ---
    const positionCylinders = useCallback((camera: THREE.OrthographicCamera) => {
        const totalWidth = camera.right - camera.left;
        const count = cylindersRef.current.length;
        if (count === 0) return;

        const cylinderWidthFactor = 0.8; // How much of the available space each cylinder occupies visually
        const spacingFactor = 0.1; // Spacing relative to cylinder width

        const effectiveWidthPerCylinder = totalWidth / count;
        const scale = effectiveWidthPerCylinder * cylinderWidthFactor;
        const spacing = scale * spacingFactor;

        // Recalculate total occupied width to center the group
        const totalOccupiedWidth = count * scale + (count > 0 ? (count - 1) * spacing : 0);
        const startX = camera.left + (totalWidth - totalOccupiedWidth) / 2 + scale / 2;

        cylindersRef.current.forEach((cylinder, index) => {
          cylinder.scale.set(scale, scale, scale);
          // Adjust position based on scale and spacing
          cylinder.position.x = startX + index * (scale + spacing);
          // Center vertically (assuming camera looks along Z)
          cylinder.position.y = 0;
        });
     }, []);


  const onResize = useCallback(() => {
    if (!rendererRef.current || !cameraRef.current || !mountRef.current) return;

    const { clientWidth: w, clientHeight: h } = mountRef.current;
    if (w === 0 || h === 0) return; // Avoid division by zero if element is hidden

    const aspectRatio = w / h;
    // Adjust camera bounds based on aspect ratio to maintain consistent view
    // We want the vertical size (top - bottom) to remain relatively constant. Let's use 'cameraSize' for half the vertical height.
    const cameraSize = cameraDistance / 2; // Adjust this factor based on desired vertical view

    cameraRef.current.left = -cameraSize * aspectRatio;
    cameraRef.current.right = cameraSize * aspectRatio;
    cameraRef.current.top = cameraSize;
    cameraRef.current.bottom = -cameraSize;
    cameraRef.current.updateProjectionMatrix();

    rendererRef.current.setSize(w, h);
    positionCylinders(cameraRef.current); // Reposition cylinders after resize

  }, [cameraDistance, positionCylinders]);

  // --- Initialization Effect ---

  useEffect(() => {
    console.log("ThreeSlotMachine: Init effect running");
    if (!mountRef.current || textureUrls.length === 0) {
        console.log("ThreeSlotMachine: Mount ref not ready or no texture URLs");
        return;
    }
    const container = mountRef.current;
    let currentRenderer: THREE.WebGLRenderer | null = null; // To use in cleanup

    // 1. Setup Scene, Camera, Renderer
    sceneRef.current = new THREE.Scene();
    const { clientWidth: width, clientHeight: height } = container;
    const aspectRatio = width / height;
    const cameraSize = cameraDistance / 2;
    cameraRef.current = new THREE.OrthographicCamera(
        -cameraSize * aspectRatio, cameraSize * aspectRatio,
        cameraSize, -cameraSize,
        0.1, 1000
    );
    cameraRef.current.position.z = cameraDistance;
    sceneRef.current.add(cameraRef.current);

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Use alpha for transparency
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.setSize(width, height);
    rendererRef.current.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(rendererRef.current.domElement);
    currentRenderer = rendererRef.current; // Assign for cleanup

    // 2. Load Textures
    const loader = new THREE.TextureLoader();
    const texturePromises = textureUrls.map(url => loader.loadAsync(url));

    Promise.all(texturePromises).then(textures => {
      console.log("ThreeSlotMachine: Textures loaded");
      // 3. Create Cylinders
      const geometry = new THREE.CylinderGeometry(
        ...geometryDimensions,
        radialSegments,
        1, // Height segments = 1
        true // Open-ended
      );

      cylindersRef.current = []; // Clear previous cylinders if any
      cylinderStatesRef.current = [];
      phaseOffsetsRef.current = [];

      for (let i = 0; i < cylinderCount; i++) {
        // Cycle through textures if fewer textures than cylinders
        const texture = textures[i % textures.length];
        texture.wrapS = THREE.RepeatWrapping; // Ensure texture wraps correctly
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1); // Adjust UV repeat if needed, default is (1,1)
        // Rotate texture if necessary (depends on how image is mapped)
        texture.center.set(0.5, 0.5);
        texture.rotation = Math.PI / 2 ; // Adjust if texture appears sideways


        const material = new THREE.MeshBasicMaterial({
             map: texture,
             side: THREE.DoubleSide, // Render inside and outside
             transparent: true // Needed if texture has alpha
        });

        const cylinder = new THREE.Mesh(geometry.clone(), material); // Clone geometry
        // Rotate cylinder mesh to orient it correctly for spinning around X-axis
        cylinder.rotation.z = Math.PI / 2;

        sceneRef.current?.add(cylinder);
        cylindersRef.current.push(cylinder);

        // Initialize state for this cylinder
        cylinderStatesRef.current.push({
          currentSpeed: baseSpinSpeed,
          targetAngle: null,
          status: 'rest',
        });
         // Initialize wobble phase offset
        phaseOffsetsRef.current.push(Math.random() * Math.PI * 2);
      }

      // 4. Position Cylinders
      positionCylinders(cameraRef.current!); // Position based on initial camera setup

      // 5. Set Initial State
       storeRestAngles();
       wobbleStartTimeRef.current = clockRef.current.getElapsedTime();
       currentGlobalStateRef.current = 'rest';

      // 6. Start Animation Loop
      animate();
      setIsInitialized(true);
      console.log("ThreeSlotMachine: Initialization complete");

    }).catch(error => {
        console.error("ThreeSlotMachine: Failed to load textures", error);
    });

    // 7. Setup Resize Observer
    if (mountRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
             if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
             resizeTimeoutRef.current = window.setTimeout(onResize, 150);
        });
        resizeObserverRef.current.observe(mountRef.current);
    }


    // 8. Cleanup Function
    return () => {
      console.log("ThreeSlotMachine: Cleanup running");
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (resizeTimeoutRef.current) {
         clearTimeout(resizeTimeoutRef.current);
      }
      if (resizeObserverRef.current) {
         resizeObserverRef.current.disconnect();
      }

      // Dispose of Three.js objects
      cylindersRef.current.forEach(cylinder => {
        if (cylinder.geometry) cylinder.geometry.dispose();
        if (cylinder.material) {
          // If material is an array
          if (Array.isArray(cylinder.material)) {
            cylinder.material.forEach(mat => {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            });
          } else { // Single material
            if (cylinder.material.map) cylinder.material.map.dispose();
            cylinder.material.dispose();
          }
        }
        sceneRef.current?.remove(cylinder);
      });
      cylindersRef.current = [];

      if (currentRenderer) {
        currentRenderer.dispose(); // Dispose renderer context
         if (currentRenderer.domElement.parentNode) {
             currentRenderer.domElement.parentNode.removeChild(currentRenderer.domElement);
         }
      }
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      setIsInitialized(false);
      console.log("ThreeSlotMachine: Cleanup complete");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textureUrls]); // Rerun effect if textureUrls change (IMPORTANT: Ensure this array is stable or memoized in parent)

  // --- Spin Trigger Effect ---

  useEffect(() => {
    // Add dependencies to the dependency array of this useEffect hook
    const deps = [startSpin, isInitialized, winningItemIndex, cylinderCount, baseSpinSpeed, spinAccelFactor, cylinderStopDelayMs, getSegmentAngle, decelerationEase];

    if (startSpin && isInitialized && currentGlobalStateRef.current === 'rest') {
      console.log("ThreeSlotMachine: Spin triggered!");
      currentGlobalStateRef.current = 'spinning';

      // Reset target angles and set status to spinning
      cylinderStatesRef.current.forEach((state) => {
        state.currentSpeed = baseSpinSpeed * spinAccelFactor;
        state.targetAngle = null; // Clear previous target
        state.status = 'spinning';
      });

      // Set timeout to begin the stopping sequence
      const stoppingTimeout = setTimeout(() => {
        if (currentGlobalStateRef.current !== 'spinning') return; // Abort if state changed

        console.log("ThreeSlotMachine: Initiating stopping sequence...");
        currentGlobalStateRef.current = 'stopping';

        cylindersRef.current.forEach((cylinder, i) => {
          // Delay the stopping of each subsequent cylinder
          const stopDelay = i * cylinderStopDelayMs;
          const stopTimeout = setTimeout(() => {
             // Ensure we are still in the stopping phase before setting target
             if (currentGlobalStateRef.current !== 'stopping') return;

            const state = cylinderStatesRef.current[i];
            if (!state || state.status !== 'spinning') return; // Only stop spinning cylinders

            const targetSegmentIndex = winningItemIndex; // All stop at the same winning index
            const targetAngleRaw = getSegmentAngle(targetSegmentIndex);

            // Calculate the final angle ensuring it's ahead of the current rotation
            const currentRotations = Math.floor(cylinder.rotation.x / (2 * Math.PI));
            // Ensure at least 1-2 full spins past the current position before stopping
            const requiredRotations = currentRotations + 2;
            let finalTargetAngle = targetAngleRaw + requiredRotations * 2 * Math.PI;

             // Ensure target angle is always 'ahead\' of current rotation in the positive direction
             while (finalTargetAngle < cylinder.rotation.x + Math.PI) { // Add PI buffer to ensure forward momentum needed
                 finalTargetAngle += 2 * Math.PI;
             }


            console.log(`Cylinder ${i}: Setting target angle ${finalTargetAngle} (Segment: ${targetSegmentIndex})`);
            state.targetAngle = finalTargetAngle;
            state.status = 'stopping';
             // The speed for deceleration is handled within the animate loop based on distance to target
          }, stopDelay);

           // Store timeout ID for potential cleanup if component unmounts during stopping sequence
           // (Requires more complex state/ref management - omitted for brevity but consider if needed)
        });
      }, 1500); // Delay before starting the stopping sequence (e.g., 1.5 seconds of free spin)

       // Cleanup timeout if component unmounts or spin is somehow reset
       return () => clearTimeout(stoppingTimeout);

    } else if (startSpin && !isInitialized) {
        console.warn("ThreeSlotMachine: Spin triggered but not initialized yet.");
    } else if (startSpin && currentGlobalStateRef.current !== 'rest') {
        console.warn("ThreeSlotMachine: Spin triggered but not in rest state.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSpin, isInitialized, winningItemIndex, cylinderCount, baseSpinSpeed, spinAccelFactor, cylinderStopDelayMs, getSegmentAngle, decelerationEase]);


  return <div ref={mountRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />;
};

export default ThreeSlotMachine;
