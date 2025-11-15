import { useEffect, useRef, useState } from 'react';

interface MouseReactiveBackgroundProps {
  className?: string;
}

export function MouseReactiveBackground({ className = '' }: MouseReactiveBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 -z-10 overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
          rgba(59, 130, 246, 0.2) 0%, 
          rgba(147, 51, 234, 0.15) 30%, 
          rgba(99, 102, 241, 0.1) 60%, 
          transparent 100%)`,
        transition: 'background 0.2s ease-out',
      }}
    >
      {/* Animated gradient orbs with more reactivity */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(59, 130, 246, 0.3) 0%, 
            transparent 60%)`,
          transform: `translate(${(mousePosition.x - 50) * 0.15}px, ${(mousePosition.y - 50) * 0.15}px) scale(${1 + (mousePosition.x - 50) * 0.001})`,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease-out',
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, 
            rgba(147, 51, 234, 0.3) 0%, 
            transparent 60%)`,
          transform: `translate(${(50 - mousePosition.x) * 0.15}px, ${(50 - mousePosition.y) * 0.15}px) scale(${1 + (mousePosition.y - 50) * 0.001})`,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease-out',
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at ${50 + (mousePosition.x - 50) * 0.5}% ${50 + (mousePosition.y - 50) * 0.5}%, 
            rgba(99, 102, 241, 0.25) 0%, 
            transparent 70%)`,
          transform: `translate(${(mousePosition.x - 50) * 0.08}px, ${(mousePosition.y - 50) * 0.08}px)`,
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease-out',
        }}
      />
      
      {/* Interactive Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translate(${(mousePosition.x - 50) * 0.08}px, ${(mousePosition.y - 50) * 0.08}px) rotate(${(mousePosition.x - 50) * 0.01}deg)`,
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      
      {/* Animated particles effect */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(2px 2px at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.5), transparent),
                       radial-gradient(2px 2px at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, rgba(147, 51, 234, 0.5), transparent)`,
          backgroundSize: '100% 100%',
          transition: 'background 0.2s ease-out',
        }}
      />
    </div>
  );
}

