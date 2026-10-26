import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'live' | 'denied' | 'unsupported';

interface CameraStream {
  videoRef: React.RefObject<HTMLVideoElement>;
  status: CameraStatus;
  error: string;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * Rear-camera passthrough. Requires a secure context, which GitHub Pages
 * provides. iOS Safari refuses getUserMedia without a user gesture, so `start`
 * is always wired to a tap.
 */
export function useCameraStream(): CameraStream {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState('');

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      setError('This browser exposes no camera API');
      return;
    }

    setStatus('requesting');
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.muted = true;
        await video.play().catch(() => undefined);
      }
      setStatus('live');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Camera unavailable';
      setStatus(message.toLowerCase().includes('denied') ? 'denied' : 'unsupported');
      setError(message);
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { videoRef, status, error, start, stop };
}
