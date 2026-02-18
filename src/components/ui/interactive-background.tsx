"use client";

import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  layer: number;
  size: number;
  opacity: number;
}

type QualityLevel = 'low' | 'medium' | 'high';

interface InteractiveBackgroundProps {
  quality?: QualityLevel;
  className?: string;
}

const QUALITY_PRESETS = {
  low: {
    particleCount: 40,
    connectionDistance: 100,
    targetFPS: 30,
    dpr: 1,
  },
  medium: {
    particleCount: 70,
    connectionDistance: 130,
    targetFPS: 45,
    dpr: 1.5,
  },
  high: {
    particleCount: 120,
    connectionDistance: 150,
    targetFPS: 60,
    dpr: 2,
  },
};

export function InteractiveBackground({ 
  quality = 'medium',
  className = ''
}: InteractiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isActive: false });
  const animationRef = useRef<number>();
  const lastFrameTimeRef = useRef(0);
  const [isSupported, setIsSupported] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Check for Canvas support
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) {
      setIsSupported(false);
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      setIsSupported(false);
      return;
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsPaused(true);
      return;
    }

    const preset = QUALITY_PRESETS[quality];
    const frameInterval = 1000 / preset.targetFPS;

    // Setup canvas
    const setupCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, preset.dpr);
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      ctx.scale(dpr, dpr);
      
      return { width: rect.width, height: rect.height };
    };

    const { width, height } = setupCanvas();

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = Array.from({ length: preset.particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        layer: Math.floor(Math.random() * 3), // 0, 1, 2 for parallax
        size: Math.random() * 1.5 + 1,
        opacity: Math.random() * 0.4 + 0.3,
      }));
    };

    initParticles();

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        isActive: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.isActive = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Animation loop
    const animate = (currentTime: number) => {
      if (!ctx || isPaused) return;

      // FPS throttling
      const elapsed = currentTime - lastFrameTimeRef.current;
      if (elapsed < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      lastFrameTimeRef.current = currentTime - (elapsed % frameInterval);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Mouse interaction with parallax
        if (mouse.isActive) {
          const dx = mouse.x - particle.x;
          const dy = mouse.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 200;

          if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            const parallaxFactor = 0.5 + particle.layer * 0.25; // 0.5x, 0.75x, 1x
            const angle = Math.atan2(dy, dx);
            
            particle.vx -= Math.cos(angle) * force * 0.15 * parallaxFactor;
            particle.vy -= Math.sin(angle) * force * 0.15 * parallaxFactor;
          }
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Friction
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Boundaries
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;
        particle.x = Math.max(0, Math.min(width, particle.x));
        particle.y = Math.max(0, Math.min(height, particle.y));

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(77, 182, 232, ${particle.opacity})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < preset.connectionDistance) {
            const opacity = (1 - distance / preset.connectionDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(77, 182, 232, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Mouse connection
        if (mouse.isActive) {
          const dx = mouse.x - particle.x;
          const dy = mouse.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 200;

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.3;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(77, 182, 232, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Resize handler
    const handleResize = () => {
      const { width: newWidth, height: newHeight } = setupCanvas();
      // Adjust particle positions
      particles.forEach(particle => {
        particle.x = (particle.x / width) * newWidth;
        particle.y = (particle.y / height) * newHeight;
      });
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [quality, isPaused]);

  // CSS-only fallback
  if (!isSupported || isPaused) {
    return (
      <div 
        className={`fixed inset-0 pointer-events-none ${className}`}
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(77, 182, 232, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(77, 182, 232, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 50% 20%, rgba(77, 182, 232, 0.02) 0%, transparent 50%)
          `,
          zIndex: 0,
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
