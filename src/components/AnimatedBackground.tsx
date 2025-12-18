import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const AnimatedBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Create floating particles
    const particles: HTMLDivElement[] = [];
    const particleCount = 50;

    if (containerRef.current) {
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute rounded-full opacity-20 blur-sm';
        
        // Random colors
        const colors = ['#6366f1', '#9333ea', '#ec4899', '#3b82f6'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.backgroundColor = color;
        particle.style.width = `${Math.random() * 4 + 2}px`;
        particle.style.height = particle.style.width;
        
        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        containerRef.current.appendChild(particle);
        particles.push(particle);
      }

      particlesRef.current = particles;

      // Animate particles with GSAP
      particles.forEach((particle, index) => {
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;
        
        gsap.to(particle, {
          x: Math.random() * 200 - 100,
          y: Math.random() * 200 - 100,
          duration: duration,
          delay: delay,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // Floating animation
        gsap.to(particle, {
          y: '+=50',
          duration: duration * 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
        });
      });
    }

    return () => {
      particles.forEach(particle => particle.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    />
  );
};

