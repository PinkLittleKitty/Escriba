import React from 'react';
import { useUIStore } from '../../store/useUIStore.js';

export const MobileOverlay = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

  if (!sidebarOpen) return null;

  return (
    <div
      onClick={() => setSidebarOpen(false)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        zIndex: 1400,
        cursor: 'pointer'
      }}
    />
  );
};
