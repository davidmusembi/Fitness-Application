'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ScreenProtection() {
  const { data: session } = useSession();

  useEffect(() => {
    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent keyboard shortcuts for screenshots
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen, Win+Shift+S, etc.
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && e.key === 's') ||
        (e.ctrlKey && e.shiftKey && e.key === 's')
      ) {
        e.preventDefault();
        alert('Screenshots are disabled to protect content.');
        return false;
      }
    };

    // Detect if screen capture API is being used
    const detectScreenCapture = () => {
      if (typeof navigator !== 'undefined' && 'mediaDevices' in navigator) {
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
        
        if (originalGetDisplayMedia) {
          (navigator.mediaDevices as any).getDisplayMedia = function(...args: any[]) {
            console.warn('Screen recording attempt detected');
            alert('Screen recording is not allowed on this platform.');
            throw new Error('Screen recording is not permitted');
          };
        }
      }
    };

    // Add blur detection to detect when user switches away (possible recording)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Silent check
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    detectScreenCapture();

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Add watermark for logged-in users
  if (session?.user) {
    return (
      <div className="fixed bottom-4 right-4 pointer-events-none select-none opacity-20 text-xs font-mono z-50">
        {session.user.email} | {new Date().toLocaleString()}
      </div>
    );
  }

  return null;
}
