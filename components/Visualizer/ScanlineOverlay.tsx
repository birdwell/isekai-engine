import React from 'react';

export const ScanlineOverlay: React.FC = () => {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] z-10 bg-[length:100%_4px] pointer-events-none opacity-30 mix-blend-overlay"></div>
      <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] z-10 pointer-events-none"></div>
    </>
  );
};
