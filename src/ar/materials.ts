import * as THREE from 'three';
import { ELEMENTS, type ElementId } from '../theme';
import { VERTEX, FRAGMENT_HEAD } from './shaders/common';
import { FIRE } from './shaders/fire';
import { ICE } from './shaders/ice';
import { EARTH } from './shaders/earth';
import { WATER } from './shaders/water';

const FRAG: Record<ElementId, string> = { fire: FIRE, ice: ICE, earth: EARTH, water: WATER };

export function createElementMaterial(id: ElementId): THREE.ShaderMaterial {
  const accent = ELEMENTS.find((e) => e.id === id)!.accent;
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT_HEAD + FRAG[id],
    uniforms: {
      uTime: { value: 0 },
      uDetail: { value: 2 },
      // Raw sRGB components: the shader has no colorspace conversion on output.
      uAccent: { value: new THREE.Color().setStyle(accent, THREE.LinearSRGBColorSpace) },
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: false,
  });
}
