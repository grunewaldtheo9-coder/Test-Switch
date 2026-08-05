import type { CubeAPI } from '../../electron/preload';

declare global {
  interface Window {
    cube: CubeAPI;
  }
}

export {};
