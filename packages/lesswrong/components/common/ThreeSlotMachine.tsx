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
import { currencyRewards, twelveVirtues, voteRewards } from '@/lib/loot/unlocks';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import shuffle from 'lodash/shuffle';

interface CylinderState {
  currentSpeed: number;
  targetAngle: number | null;
  status: "rest" | "spinning" | "stopping";
}

interface ThreeSlotMachineProps {
  textureUrls: string[];
  winningItemIndices: number[]; // Index in textureUrls for each cylinder to land on
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

function createCanvasTexture(textures: THREE.Texture[]) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Failed to get 2D context for combining textures");
    // Handle error appropriately, maybe return or throw
    return;
  }

  let totalHeight = 0;
  let maxWidth = 0;
  const imageElements = textures.map((tex) => tex.image); // Get HTMLImageElements

  imageElements.forEach((img) => {
    if (img) {
      // Ensure images are loaded (though loadAsync should handle this)
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          console.warn("Image for cylinder 0 strip has zero dimensions:", img.src);
      }
      totalHeight += img.height;
      maxWidth = Math.max(maxWidth, img.width);
    } else {
        console.warn("Missing image element for a cylinder 0 texture");
    }
  });

  if (maxWidth === 0 || totalHeight === 0) {
    console.error("Could not determine dimensions for combined cylinder texture.");
    // Dispose loaded textures before returning
    textures.forEach(tex => tex.dispose());
    return;
  }

  canvas.width = maxWidth;
  canvas.height = totalHeight;

  // Fill the canvas background with white before drawing images
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let currentY = 0;
  imageElements.forEach((img) => {
    if (img) {
      ctx.drawImage(img, 0, currentY, img.width, img.height);
      currentY += img.height;
    }
  });

  // Create the canvas texture
  const generatedCanvasTexture = new THREE.CanvasTexture(canvas);
  // Configure the texture similarly to how others were configured
  generatedCanvasTexture.wrapS = THREE.RepeatWrapping;
  generatedCanvasTexture.wrapT = THREE.RepeatWrapping;
  generatedCanvasTexture.repeat.set(1, 1);
  generatedCanvasTexture.center.set(0.5, 0.5);
  generatedCanvasTexture.rotation = Math.PI * 3/2; // Change from Math.PI/2 to Math.PI*3/2

  // Dispose the individual image textures now that they're on the canvas
  textures.forEach((tex) => tex.dispose());

  return generatedCanvasTexture;
}

const ThreeSlotMachine: React.FC<ThreeSlotMachineProps> = ({
  textureUrls,
  winningItemIndices,
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
  const currentGlobalStateRef = useRef<"rest" | "spinning" | "stopping">("rest");
  const restAnglesRef = useRef<number[]>([]);
  const phaseOffsetsRef = useRef<number[]>([]);
  const wobbleStartTimeRef = useRef<number>(0);
  const spinTimeoutRef = useRef<number | null>(null);
  const stopTimeoutsRef = useRef<Array<number | null>>([]);

  const [isInitialized, setIsInitialized] = useState(false);

  // --- Helper Functions ---

  const getSegmentAngle = useCallback(
    (segment: number, symbolsInReel?: number): number => {
      const numSymbols = symbolsInReel ?? symbolsPerReel;
      if (numSymbols <= 0) return 0; // Avoid division by zero
      const segmentAngle = (2 * Math.PI) / numSymbols;
      const offset = segmentAngle / 2; // Angle to the center of the segment from its start

      // Calculate the rotation needed to bring the *center* of the desired segment
      // to the front-facing position (which we'll define as angle 0 after initial mesh/texture rotations).
      // The angle of the center of the k-th segment is (k * segmentAngle + offset).
      // We need to rotate by the negative of this angle to bring it to 0.
      return -(segment * segmentAngle + offset);
    },
    [symbolsPerReel]
  );

  const storeRestAngles = useCallback(() => {
    restAnglesRef.current = cylindersRef.current.map((c) => c.rotation.x);
  }, []);

  const finalizeSpin = useCallback(() => {
    console.log("Finalizing spin");
    currentGlobalStateRef.current = "rest";
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
        case "spinning":
          cylinder.rotation.x += state.currentSpeed * deltaTime;
          allCylindersResting = false;
          break;

        case "stopping":
          if (state.targetAngle !== null) {
            const diff = state.targetAngle - cylinder.rotation.x;

            // Use a smaller tolerance for stopping to ensure smoothness
            if (Math.abs(diff) < 0.001) {
              cylinder.rotation.x = state.targetAngle; // Snap to final angle
              state.status = "rest";
              console.log(`Cylinder ${i} reached target and is resting.`);
            } else {
              // Exponential decay towards the target angle
              // 'decelerationEase' controls the rate. Higher values -> faster stop.
              // The factor ensures frame-rate independence.
              const decayFactor = 1.0 - Math.exp(-decelerationEase * deltaTime);

              // Calculate the movement step based on the remaining difference
              const moveStep = diff * decayFactor;

              cylinder.rotation.x += moveStep;
              allCylindersResting = false;

              // Optional: Update currentSpeed if it's used elsewhere,
              // though it's not directly used for movement in this approach.
              // state.currentSpeed = Math.abs(moveStep / deltaTime);
            }
          } else {
            // Still waiting for target angle to be set
            allCylindersResting = false;
          }
          break;

        case "rest":
          if (currentGlobalStateRef.current === "rest") {
            // Apply wobble effect when globally resting
            const wobbleElapsed = currentTime - wobbleStartTimeRef.current;
            // Ease in the wobble effect
            const wobbleEaseFactor = Math.min(1, wobbleElapsed / 1.0); // 1 second ease-in
            const currentAmplitude = wobbleAmplitude * wobbleEaseFactor;
            cylinder.rotation.x =
              restAnglesRef.current[i] +
              currentAmplitude * Math.sin(currentTime * wobbleFrequency + phaseOffsetsRef.current[i]);
          }
          // If globally stopping, a resting cylinder stays put until the global state becomes 'rest'
          else if (currentGlobalStateRef.current === "stopping") {
            // Hold position
          } else {
            // If globally spinning, should not be in rest state (error?)
            console.warn(`Cylinder ${i} in REST state while global state is ${currentGlobalStateRef.current}`);
          }
          break;
      }
    });

    // Check if the overall spin should be finalized
    if (currentGlobalStateRef.current === "stopping" && allCylindersResting) {
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

  // Vote strength rewards
  const cylinder0ImageUrls = shuffle([
    ...filterNonnull(voteRewards.map(reward => reward.imagePath)),
    // Add other stuff
  ]);

  // Primary "unique" rewards
  const cylinder1ImageUrls = shuffle([
    ...filterNonnull(twelveVirtues.map(virtue => virtue.imagePath)),
    // Add other stuff
  ]);

  // Marginal currency rewards
  const cylinder2ImageUrls = shuffle([
    ...filterNonnull(currencyRewards.map(reward => reward.imagePath)),
    // Add other stuff
  ]);

  const allCylinderImageUrls = [
    cylinder0ImageUrls,
    cylinder1ImageUrls,
    cylinder2ImageUrls,
  ];

  // --- Initialization Effect ---

  useEffect(() => {
    console.log("ThreeSlotMachine: Init effect running");
    if (!mountRef.current || textureUrls.length === 0) {
      console.log("ThreeSlotMachine: Mount ref not ready or no texture URLs");
      return;
    }
    // Ensure we have enough texture URLs for the required cylinders
    if (textureUrls.length < cylinderCount) {
      console.error(
        `ThreeSlotMachine: Not enough textureUrls (${textureUrls.length}) provided for cylinderCount (${cylinderCount}).`
      );
      return; // Stop initialization
    }
    if (winningItemIndices.length !== cylinderCount) {
      console.error(
        `ThreeSlotMachine: winningItemIndices length (${winningItemIndices.length}) does not match cylinderCount (${cylinderCount}).`
      );
      return;
    }
    const container = mountRef.current;
    let currentRenderer: THREE.WebGLRenderer | null = null; // To use in cleanup
    let generatedCanvasTexture: THREE.CanvasTexture | null = null; // To dispose later
    const generatedCanvasTextures: Array<THREE.CanvasTexture | undefined> = [];

    // 1. Setup Scene, Camera, Renderer
    sceneRef.current = new THREE.Scene();
    const { clientWidth: width, clientHeight: height } = container;
    const aspectRatio = width / height;
    const cameraSize = cameraDistance / 2;
    cameraRef.current = new THREE.OrthographicCamera(
      -cameraSize * aspectRatio,
      cameraSize * aspectRatio,
      cameraSize,
      -cameraSize,
      0.1,
      1000
    );
    cameraRef.current.position.z = cameraDistance;
    sceneRef.current.add(cameraRef.current);

    // Add Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6); // Soft white light
    sceneRef.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
    directionalLight.position.set(0, 1, 1); // Position the light
    sceneRef.current.add(directionalLight);

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Use alpha for transparency
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.setSize(width, height);
    rendererRef.current.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(rendererRef.current.domElement);
    currentRenderer = rendererRef.current; // Assign for cleanup

    // 2. Define Texture URLs and Load Assets
    const loader = new THREE.TextureLoader();

    // Create promises to load all assets
    const cylinder0ImagePromises = cylinder0ImageUrls.map((url) => loader.loadAsync(url));
    const cylinder1ImagePromises = cylinder1ImageUrls.map((url) => loader.loadAsync(url));
    const cylinder2ImagePromises = cylinder2ImageUrls.map((url) => loader.loadAsync(url));

    Promise.all([...cylinder0ImagePromises, ...cylinder1ImagePromises, ...cylinder2ImagePromises])
      .then((loadedAssets) => {
        console.log("ThreeSlotMachine: All textures loaded");

        const cylinder0ImageTextures = loadedAssets.slice(0, cylinder0ImageUrls.length); // THREE.Textures for cylinder 0 images
        const cylinder1ImageTextures = loadedAssets.slice(cylinder0ImageUrls.length, cylinder0ImageUrls.length + cylinder1ImageUrls.length); // THREE.Textures for cylinder 1 images
        const cylinder2ImageTextures = loadedAssets.slice(cylinder0ImageUrls.length + cylinder1ImageUrls.length); // THREE.Textures for cylinder 2 images

        // 3. Create Combined Texture Strips for Cylinders
        generatedCanvasTextures.push(
          createCanvasTexture(cylinder0ImageTextures),
          createCanvasTexture(cylinder1ImageTextures),
          createCanvasTexture(cylinder2ImageTextures),
        );

        // Store the final textures to be used for each cylinder
        const finalCylinderTextures = [...generatedCanvasTextures];

        // 4. Create Cylinders
        cylindersRef.current = []; // Clear previous cylinders if any
        cylinderStatesRef.current = [];
        phaseOffsetsRef.current = [];

        for (let i = 0; i < cylinderCount; i++) {
          const texture = finalCylinderTextures[i];
          if (!texture) {
             console.error(`Texture missing for cylinder index ${i}`);
             continue; // Skip this cylinder
          }

          // Apply standard configuration consistently to ALL textures
          // Ensures canvas textures and loaded textures behave the same way.
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(1, 1);
          texture.center.set(0.5, 0.5);

          const material = new THREE.MeshStandardMaterial({
            map: texture,
            color: new THREE.Color(0xffffff),
            side: THREE.DoubleSide,
            metalness: 0.1,
            roughness: 0.7,
          });

          // Scale the circumference based on the number of symbols in the cylinder
          const radius = (0.75 / 4) * allCylinderImageUrls[i].length
          const height = 1;

          const dimensions = [radius, radius, height] as const;

          const geometry = new THREE.CylinderGeometry(
            ...dimensions,
            radialSegments,
            1, // Height segments = 1
            true // Open-ended
          );

          const cylinder = new THREE.Mesh(geometry, material);
          cylinder.rotation.z = Math.PI / 2; // Orient cylinder mesh axis to be horizontal (along X)

          // --- EDIT: Set initial rotation so the 0th item faces the front ---
          // Use the actual number of symbols for this specific cylinder if available
          const symbolsInThisReel = allCylinderImageUrls[i]?.length ?? symbolsPerReel;
          cylinder.rotation.x = getSegmentAngle(0, symbolsInThisReel);
          // --- END EDIT ---

          sceneRef.current?.add(cylinder);
          cylindersRef.current.push(cylinder);

          // Initialize state for this cylinder
          cylinderStatesRef.current.push({
            currentSpeed: baseSpinSpeed,
            targetAngle: null, // Initial target is null
            status: "rest",
          });
          // Initialize wobble phase offset
          phaseOffsetsRef.current.push(Math.random() * Math.PI * 2);
        }

        // Dispose of the geometry template now that it's cloned
        // geometry.dispose();

        // 5. Position Cylinders
        positionCylinders(cameraRef.current!);

        // 6. Set Initial State (Store the calculated initial rotations)
        storeRestAngles(); // This will now store the correct front-facing angles
        wobbleStartTimeRef.current = clockRef.current.getElapsedTime();
        currentGlobalStateRef.current = "rest";

        // 7. Start Animation Loop
        animate();
        setIsInitialized(true);
        console.log("ThreeSlotMachine: Initialization complete");
      })
      .catch((error) => {
        console.error("ThreeSlotMachine: Failed to load or process textures", error);
        // Clean up renderer if initialization failed mid-way
        if (currentRenderer && currentRenderer.domElement.parentNode) {
            currentRenderer.domElement.parentNode.removeChild(currentRenderer.domElement);
            currentRenderer.dispose();
            rendererRef.current = null;
        }
      });

    // 8. Setup Resize Observer
    if (mountRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = window.setTimeout(onResize, 150);
      });
      resizeObserverRef.current.observe(mountRef.current);
    }

    // 9. Cleanup Function
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

      if (generatedCanvasTextures.length > 0) {
        generatedCanvasTextures.forEach((tex) => tex?.dispose());
      }

      // Dispose of Three.js objects
      // Dispose the generated canvas texture first if it exists
      if (generatedCanvasTexture) {
        console.log("Disposing generated canvas texture");
        generatedCanvasTexture.dispose();
        generatedCanvasTexture = null;
      }

      cylindersRef.current.forEach((cylinder, index) => {
        if (cylinder.geometry) cylinder.geometry.dispose();
        if (cylinder.material) {
          if (Array.isArray(cylinder.material)) {
            cylinder.material.forEach((mat) => {
              // Check if material has a map property before disposing
              if ("map" in mat && mat.map instanceof THREE.Texture) {
                 // Avoid double-disposing the canvas texture for cylinder 0
                 if (!(index === 0 && mat.map === generatedCanvasTexture)) {
                    mat.map.dispose();
                 }
              }
              mat.dispose();
            });
          } else {
            // Single material
            const mat = cylinder.material as THREE.Material & { map?: THREE.Texture };
            if (mat.map) {
              // Avoid double-disposing the canvas texture for cylinder 0
              // Note: The check `mat.map === generatedCanvasTexture` might be unreliable after state changes,
              // so we rely on disposing it separately before this loop.
              // We only dispose maps for cylinders *other* than the first here.
              if (index > 0) {
                 mat.map.dispose();
              }
            }
            mat.dispose();
          }
        }
        sceneRef.current?.remove(cylinder);
      });
      cylindersRef.current = [];

      // Dispose other resources (lights, scene?) if necessary, though often managed by disposing renderer/removing from parent

      if (currentRenderer) {
        currentRenderer.dispose(); // Dispose renderer context
        if (currentRenderer.domElement.parentNode) {
          currentRenderer.domElement.parentNode.removeChild(currentRenderer.domElement);
        }
      }
      rendererRef.current = null;
      sceneRef.current = null; // Let scene be garbage collected
      cameraRef.current = null;
      setIsInitialized(false);
      console.log("ThreeSlotMachine: Cleanup complete");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textureUrls, cylinderCount]); // Only re-run if textureUrls or cylinderCount change

  // --- Spin Trigger Effect ---

  useEffect(() => {
    // Dependencies are listed at the end
    // const spinTimeoutRef = useRef<number | null>(null); // Moved outside
    // const stopTimeoutsRef = useRef<Array<number | null>>([]); // Moved outside

    if (startSpin && isInitialized && currentGlobalStateRef.current === "rest") {
      console.log("ThreeSlotMachine: Spin triggered!");
      currentGlobalStateRef.current = "spinning";
      wobbleStartTimeRef.current = Infinity; // Stop wobble immediately

      // Reset target angles and set status to spinning for all cylinders
      cylinderStatesRef.current.forEach((state) => {
        state.currentSpeed = baseSpinSpeed * spinAccelFactor;
        state.targetAngle = null; // Clear previous target
        state.status = "spinning";
      });

      // --- Set timeout to begin the stopping sequence after a delay ---
      spinTimeoutRef.current = window.setTimeout(() => {
        if (currentGlobalStateRef.current !== "spinning") return; // Abort if state changed

        console.log("ThreeSlotMachine: Initiating stopping sequence...");
        currentGlobalStateRef.current = "stopping";

        cylindersRef.current.forEach((cylinder, i) => {
          // Delay the stopping of each subsequent cylinder
          const stopDelay = i * cylinderStopDelayMs;
          stopTimeoutsRef.current[i] = window.setTimeout(() => {
            // Ensure we are still in the stopping phase before setting target
            if (currentGlobalStateRef.current !== "stopping") return;

            const state = cylinderStatesRef.current[i];
            if (!state || state.status !== "spinning") return; // Only stop spinning cylinders

            // --- Calculate target angle for this specific cylinder ---
            let winningIndex = winningItemIndices[i];
            if (winningIndex === undefined || winningIndex < 0 || winningIndex >= symbolsPerReel) {
              console.error(`Invalid winning index ${winningIndex} for cylinder ${i}. Defaulting to 0.`);
              winningIndex = 0;
            }
            const baseTargetAngle = getSegmentAngle(winningIndex, allCylinderImageUrls[i].length);

            // Calculate the final angle ensuring it's ahead of the current rotation
            const currentRotation = cylinder.rotation.x;
            // Ensure at least 2-3 full spins happen *during* stopping phase
            const requiredRevolutions = Math.ceil(currentRotation / (2 * Math.PI)) + 2;
            const finalTargetAngle = requiredRevolutions * 2 * Math.PI + baseTargetAngle;

            // Ensure target angle is always 'ahead' of current rotation in the positive direction
            // (The above calculation should handle this, but a check could be added if needed)
            // while (finalTargetAngle < currentRotation + Math.PI) { ... }

            console.log(
              `Cylinder ${i}: TargetIdx=${winningIndex}, BaseAngle=${baseTargetAngle.toFixed(
                2
              )}, CurrentRot=${currentRotation.toFixed(
                2
              )}, RequiredRevs=${requiredRevolutions}, Setting target angle ${finalTargetAngle.toFixed(2)}`
            );
            state.targetAngle = finalTargetAngle;
            state.status = "stopping";
            // The speed for deceleration is handled within the animate loop
          }, stopDelay);
        });
      }, 1500); // Delay before starting the stopping sequence (e.g., 1.5 seconds of free spin)

      // Cleanup timeouts if effect re-runs or component unmounts
      return () => {
        console.log("ThreeSlotMachine: Spin trigger effect cleanup");
        if (spinTimeoutRef.current) {
          clearTimeout(spinTimeoutRef.current);
          spinTimeoutRef.current = null;
        }
        stopTimeoutsRef.current.forEach((timeoutId) => {
          if (timeoutId) clearTimeout(timeoutId);
        });
        stopTimeoutsRef.current = [];
        // // Optional: Decide if cancelling a spin should reset state immediately
        // if (currentGlobalStateRef.current !== 'rest') {
        //     console.log("Resetting state due to spin cancellation/re-trigger");
        //     currentGlobalStateRef.current = 'rest';
        //     cylinderStatesRef.current.forEach(state => state.status = 'rest');
        //     storeRestAngles(); // Store current rotation as new rest angle
        // }
      };
    } else if (startSpin && !isInitialized) {
      console.warn("ThreeSlotMachine: Spin triggered but not initialized yet.");
    } else if (startSpin && currentGlobalStateRef.current !== "rest") {
      console.warn("ThreeSlotMachine: Spin triggered but not in rest state.");
    }

    // Explicitly return undefined if the main condition isn't met to avoid implicit return of cleanup
    return undefined;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    startSpin,
    isInitialized,
    winningItemIndices,
    cylinderCount,
    baseSpinSpeed,
    spinAccelFactor,
    cylinderStopDelayMs,
    symbolsPerReel,
    getSegmentAngle,
  ]); // Ensure all dependencies used are listed

  return <div ref={mountRef} style={{ width: "100%", height: "100%", overflow: "hidden" }} />;
};

export default ThreeSlotMachine;
