import { useCallback, useEffect, useRef, useState } from 'react';

export interface Tilt {
  /** Left-right tilt in degrees, clamped. */
  gamma: number;
  /** Front-back tilt in degrees, clamped. */
  beta: number;
  /** Compass heading in degrees. */
  heading: number;
}

const INITIAL: Tilt = { gamma: 0, beta: 0, heading: 0 };

type PermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported';

interface DeviceTilt {
  tilt: React.MutableRefObject<Tilt>;
  permission: PermissionState;
  request: () => Promise<void>;
}

interface OrientationPermissionEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/**
 * Device orientation for the AR parallax. iOS gates this behind an explicit
 * permission request that must come from a tap, so we never auto-request.
 */
export function useDeviceTilt(): DeviceTilt {
  const tilt = useRef<Tilt>({ ...INITIAL });
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const listening = useRef(false);

  const handle = useCallback((event: DeviceOrientationEvent) => {
    const gamma = event.gamma ?? 0;
    const beta = event.beta ?? 0;
    // webkitCompassHeading is iOS-only; fall back to the raw alpha value.
    const source = event as DeviceOrientationEvent & { webkitCompassHeading?: number };
    const heading = source.webkitCompassHeading ?? (event.alpha ? 360 - event.alpha : 0);

    tilt.current = {
      gamma: Math.max(-32, Math.min(32, gamma)),
      beta: Math.max(-32, Math.min(32, beta - 60)),
      heading,
    };
  }, []);

  const attach = useCallback(() => {
    if (listening.current) return;
    listening.current = true;
    window.addEventListener('deviceorientation', handle, true);
  }, [handle]);

  const request = useCallback(async () => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      setPermission('unsupported');
      return;
    }

    const target = DeviceOrientationEvent as unknown as OrientationPermissionEvent;
    if (typeof target.requestPermission === 'function') {
      try {
        const result = await target.requestPermission();
        if (result !== 'granted') {
          setPermission('denied');
          return;
        }
      } catch {
        setPermission('denied');
        return;
      }
    }

    setPermission('granted');
    attach();
  }, [attach]);

  useEffect(
    () => () => {
      window.removeEventListener('deviceorientation', handle, true);
      listening.current = false;
    },
    [handle]
  );

  return { tilt, permission, request };
}
