import React, { useState, useCallback, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  velocity: number;
}

interface ParticleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

const ParticleButton: React.FC<ParticleButtonProps> = ({ children, className = '', variant = 'primary', onClick, ...props }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isPressed, setIsPressed] = useState(false);

  // Generate random particles
  const spawnParticles = (rect: DOMRect) => {
    const newParticles: Particle[] = [];
    const colors = ['#60A5FA', '#34D399', '#FBBF24', '#F87171'];
    
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: rect.width / 2,
        y: rect.height / 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 2,
        angle: Math.random() * 360,
        velocity: Math.random() * 8 + 2,
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    // Cleanup particles after animation
    setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        spawnParticles(rect);
    }
    
    // Haptic feedback simulation (if supported by browser/device)
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }

    if (onClick) onClick(e);
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  const getVariantClasses = () => {
    switch(variant) {
        case 'secondary': return 'bg-slate-700 hover:bg-slate-600 text-white';
        case 'danger': return 'bg-red-500 hover:bg-red-600 text-white';
        default: return 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30';
    }
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-visible rounded-xl px-6 py-3 font-semibold transition-all duration-100 ease-in-out transform
        ${isPressed ? 'scale-95' : 'scale-100 hover:scale-[1.02]'}
        ${getVariantClasses()}
        ${className}
      `}
      {...props}
    >
      {/* Particle Rendering */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full pointer-events-none opacity-0 animate-[particle-explode_0.6s_ease-out_forwards]"
          style={{
            left: p.x,
            top: p.y,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            '--tw-translate-x': `${Math.cos(p.angle * Math.PI / 180) * p.velocity * 15}px`,
            '--tw-translate-y': `${Math.sin(p.angle * Math.PI / 180) * p.velocity * 15}px`,
          } as React.CSSProperties}
        />
      ))}
      <span className="relative z-10">{children}</span>
      <style>{`
        @keyframes particle-explode {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tw-translate-x), var(--tw-translate-y)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
};

export default ParticleButton;