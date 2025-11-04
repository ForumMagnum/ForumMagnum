import React, { useEffect, useState, useRef } from 'react';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const THREE = require('three');
import { createDayNightShaderMaterial } from './shader';
import { CONTRAST_AMOUNT, BRIGHTNESS_BOOST, BRIGHTNESS_ADD, ROTATION_SPEED, DEFAULT_SUN_POSITION } from './solsiceSeasonConstants';
import { findMeshWithTexture } from './utils';
import { PointOfView } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useGlobeDayNightMaterial = (): React.MutableRefObject<any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeMaterialRef = useRef<any>(null);
  useEffect(() => {
    globeMaterialRef.current = createDayNightShaderMaterial(THREE, CONTRAST_AMOUNT, BRIGHTNESS_BOOST, BRIGHTNESS_ADD);
    return () => {
      if (globeMaterialRef.current && typeof globeMaterialRef.current.dispose === 'function') {
        globeMaterialRef.current.dispose();
      }
    };
  }, []);
  return globeMaterialRef;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useGlobeReadyEffects = (
  isGlobeReady: boolean,
  globeRef: React.MutableRefObject<any>,
  globeMaterialRef: React.MutableRefObject<any>,
  dayImageUrl: string | undefined,
  nightImageUrl: string | undefined,
  luminosityImageUrl: string | undefined,
  pov: PointOfView,
  onReady?: () => void,
  onTexturesLoaded?: () => void
) => {
  const onReadyRef = useRef(onReady);
  const onTexturesLoadedRef = useRef(onTexturesLoaded);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  useEffect(() => { onTexturesLoadedRef.current = onTexturesLoaded; }, [onTexturesLoaded]);

  useEffect(() => {
    if (!isGlobeReady || !globeRef.current) return;

    const globeObj = globeRef.current;
    const globeMesh = findMeshWithTexture(globeObj.scene);
    if (globeMesh?.material && globeMaterialRef.current) {
      globeMesh.material = globeMaterialRef.current;
    }

    const loader = new THREE.TextureLoader();
    let loadedCount = 0;
    const expectedTextures = [dayImageUrl, nightImageUrl, luminosityImageUrl].filter(Boolean).length;
    
    const checkAllTexturesLoaded = () => {
      if (loadedCount >= expectedTextures) {
        onTexturesLoadedRef.current?.();
      }
    };
    
    if (expectedTextures === 0) {
      onTexturesLoadedRef.current?.();
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadTexture = (url: string | undefined, uniformName: 'dayTexture' | 'nightTexture' | 'luminosityTexture') => {
      if (!url || !globeMaterialRef.current) return;
      loader.load(
        url,
        (texture: any) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          if (globeMaterialRef.current) {
            globeMaterialRef.current.uniforms[uniformName].value = texture;
          }
          loadedCount++;
          checkAllTexturesLoaded();
        },
        undefined,
        (error: any) => {
          // eslint-disable-next-line no-console
          console.error(`Failed to load texture ${url}:`, error);
          loadedCount++;
          checkAllTexturesLoaded();
        }
      );
    };
    loadTexture(dayImageUrl, 'dayTexture');
    loadTexture(nightImageUrl, 'nightTexture');
    loadTexture(luminosityImageUrl, 'luminosityTexture');

    globeRef.current.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: pov.altitude }, 0);
    
    if (globeMaterialRef.current?.uniforms?.sunPosition) {
      globeMaterialRef.current.uniforms.sunPosition.value.set(DEFAULT_SUN_POSITION.lng, DEFAULT_SUN_POSITION.lat);
    }
    
    onReadyRef.current?.();
  }, [isGlobeReady, globeRef, globeMaterialRef, dayImageUrl, nightImageUrl, luminosityImageUrl, pov.lat, pov.lng, pov.altitude]);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useGlobeAnimation = (globeMaterialRef: React.MutableRefObject<any>, isGlobeReady: boolean, pov: PointOfView, isRotating: boolean): React.MutableRefObject<number> => {
  const rotationSpeed = ROTATION_SPEED;
  const rotationRef = useRef(0);
  const isRotatingRef = useRef(isRotating);
  const lastFrameTimeRef = useRef<number | null>(null);
  const [, setFrameCounter] = useState(0);
  
  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);
  
  useEffect(() => {
    if (!isGlobeReady || !globeMaterialRef.current) return;
    
    const animate = (currentTime: number) => {
      if (!isRotatingRef.current) return;
      
      if (lastFrameTimeRef.current !== null) {
        const deltaTime = currentTime - lastFrameTimeRef.current;
        // deltaTime is in milliseconds, convert to seconds for rotationSpeed (rad/s)
        rotationRef.current += rotationSpeed * (deltaTime / 1000);
        if (globeMaterialRef.current?.uniforms?.textureRotation) {
          globeMaterialRef.current.uniforms.textureRotation.value = rotationRef.current;
        }
      }
      lastFrameTimeRef.current = currentTime;
      setFrameCounter(n => n + 1);
      requestAnimationFrame(animate);
    };
    
    if (isRotatingRef.current) {
      lastFrameTimeRef.current = null;
      const animationFrameId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [isGlobeReady, globeMaterialRef, isRotating, rotationSpeed]);
  
  useEffect(() => {
    if (globeMaterialRef.current?.uniforms?.globeRotation) {
      globeMaterialRef.current.uniforms.globeRotation.value.set(pov.lng, pov.lat);
    }
  }, [globeMaterialRef, pov.lat, pov.lng]);
  
  return rotationRef;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFramerate = (isGlobeReady: boolean, globeRef: React.MutableRefObject<any>): number => {
  const [fps, setFps] = useState(0);
  
  useEffect(() => {
    if (!isGlobeReady || !globeRef.current) return;
    
    const renderer = globeRef.current.renderer?.();
    if (!renderer) return;
    
    let lastTime = performance.now();
    let frameCount = 0;
    const originalRender = renderer.render.bind(renderer);
    
    renderer.render = function(...args: any[]) {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      return originalRender(...args);
    };
    
    return () => { renderer.render = originalRender; };
  }, [isGlobeReady, globeRef]);
  
  return fps;
};

