import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface GradientOrbProps {
  color: string;
  size: number;
  x: number;
  y: number;
}

export const GradientOrb = ({ color, size, x, y }: GradientOrbProps) => {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orbRef.current) {
      gsap.to(orbRef.current, {
        x: `+=${Math.random() * 200 - 100}`,
        y: `+=${Math.random() * 200 - 100}`,
        duration: Math.random() * 10 + 10,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  }, []);

  return (
    <div
      ref={orbRef}
      className="absolute rounded-full blur-3xl opacity-30"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, ${color}, transparent)`,
        left: `${x}%`,
        top: `${y}%`,
      }}
    />
  );
};

