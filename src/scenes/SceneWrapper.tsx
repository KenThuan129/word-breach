import React, { useEffect, useState } from 'react';

interface SceneWrapperProps {
  children: React.ReactNode;
  sceneKey: string;
}

/**
 * Wraps each scene with fade + scale transition on mount.
 * Uses position: fixed to take full viewport regardless of parent layout.
 */
export function SceneWrapper({ children, sceneKey }: SceneWrapperProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Double RAF ensures the browser has painted initial state before transition
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [sceneKey]);

  return (
    <div
      className={`fixed inset-0 transition-opacity duration-300 ease-out ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ zIndex: 1 }}
    >
      {children}
    </div>
  );
}