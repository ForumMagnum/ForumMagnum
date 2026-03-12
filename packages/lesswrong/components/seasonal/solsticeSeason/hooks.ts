import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createDayNightShaderMaterial } from './shader';
import { CONTRAST_AMOUNT, BRIGHTNESS_BOOST, BRIGHTNESS_ADD, DEFAULT_SUN_POSITION } from './solsticeSeasonConstants';
import { findMeshWithTexture } from './utils';
import { PointOfView } from './types';

export const useGlobeDayNightMaterial = (): React.MutableRefObject<any> => {
  const globeMaterialRef = useRef<any>(null);
  useEffect(() => {
    globeMaterialRef.current = createDayNightShaderMaterial(CONTRAST_AMOUNT, BRIGHTNESS_BOOST, BRIGHTNESS_ADD);
    return () => {
      if (globeMaterialRef.current && typeof globeMaterialRef.current.dispose === 'function') {
        globeMaterialRef.current.dispose();
      }
    };
  }, []);
  return globeMaterialRef;
};

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
    
    const loadTexture = (url: string | undefined, uniformName: 'dayTexture' | 'nightTexture' | 'luminosityTexture') => {
      if (!url || !globeMaterialRef.current) return;
      loader.load(
        url,
        (texture: THREE.Texture) => {
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
        (error: Error) => {
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
