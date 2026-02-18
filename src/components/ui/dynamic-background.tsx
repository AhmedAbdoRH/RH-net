"use client";

import React, { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

interface Orb {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  hue: number;
  speed: number;
  phase: number;
}

export const DynamicBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const mousePrevRef = useRef({ x: -1000, y: -1000 });
  const mouseSpeedRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);
  const dprRef = useRef(1);

  const initParticles = useCallback((width: number, height: number) => {
    const area = width * height;
    const particleCount = Math.min(Math.floor(area / 18000), 80);
    particlesRef.current = [];

    for (let i = 0; i < particleCount; i++) {
      const hue = 200 + Math.random() * 80; // blue-purple range
      particlesRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        baseSize: Math.random() * 1.5 + 0.5,
        hue,
        saturation: 60 + Math.random() * 30,
        lightness: 50 + Math.random() * 20,
        alpha: 0.15 + Math.random() * 0.35,
        pulseSpeed: 0.5 + Math.random() * 1.5,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Floating ambient orbs
    const orbCount = 4;
    orbsRef.current = [];
    for (let i = 0; i < orbCount; i++) {
      orbsRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        targetX: Math.random() * width,
        targetY: Math.random() * height,
        radius: 150 + Math.random() * 200,
        hue: 210 + i * 40, // spread hues: blue, indigo, purple, magenta
        speed: 0.0003 + Math.random() * 0.0005,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;

    const resizeCanvas = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(w, h);
    };

    const animate = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      timeRef.current += 0.016;
      const t = timeRef.current;

      // Calculate mouse speed
      const mdx = mouseRef.current.x - mousePrevRef.current.x;
      const mdy = mouseRef.current.y - mousePrevRef.current.y;
      const currentSpeed = Math.sqrt(mdx * mdx + mdy * mdy);
      mouseSpeedRef.current = mouseSpeedRef.current * 0.9 + currentSpeed * 0.1;
      mousePrevRef.current = { ...mouseRef.current };

      // Clear with slight fade for trails
      ctx.fillStyle = 'rgba(6, 6, 12, 0.15)';
      ctx.fillRect(0, 0, w, h);

      // Draw ambient orbs (soft glowing blobs)
      orbsRef.current.forEach((orb) => {
        orb.phase += orb.speed;

        // Slow drift
        orb.x += Math.sin(orb.phase) * 0.3;
        orb.y += Math.cos(orb.phase * 0.7) * 0.2;

        // Mouse influence on orbs
        const omDx = mouseRef.current.x - orb.x;
        const omDy = mouseRef.current.y - orb.y;
        const omDist = Math.sqrt(omDx * omDx + omDy * omDy);
        if (omDist < 400) {
          const force = (400 - omDist) / 400 * 0.008;
          orb.x += omDx * force;
          orb.y += omDy * force;
        }

        // Wrap around
        if (orb.x < -orb.radius) orb.x = w + orb.radius;
        if (orb.x > w + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = h + orb.radius;
        if (orb.y > h + orb.radius) orb.y = -orb.radius;

        const pulsingRadius = orb.radius + Math.sin(t * 0.5 + orb.phase) * 30;

        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, pulsingRadius
        );
        const hueShift = Math.sin(t * 0.3 + orb.phase) * 15;
        gradient.addColorStop(0, `hsla(${orb.hue + hueShift}, 70%, 40%, 0.06)`);
        gradient.addColorStop(0.5, `hsla(${orb.hue + hueShift}, 60%, 30%, 0.03)`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(orb.x, orb.y, pulsingRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Mouse glow
      if (mouseRef.current.x > 0 && mouseRef.current.y > 0) {
        const glowRadius = 120 + mouseSpeedRef.current * 2;
        const glowAlpha = 0.04 + Math.min(mouseSpeedRef.current * 0.003, 0.06);
        const mouseGlow = ctx.createRadialGradient(
          mouseRef.current.x, mouseRef.current.y, 0,
          mouseRef.current.x, mouseRef.current.y, glowRadius
        );
        mouseGlow.addColorStop(0, `hsla(220, 80%, 60%, ${glowAlpha})`);
        mouseGlow.addColorStop(0.5, `hsla(250, 70%, 50%, ${glowAlpha * 0.5})`);
        mouseGlow.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(mouseRef.current.x, mouseRef.current.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = mouseGlow;
        ctx.fill();
      }

      // Particles
      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const connectionDistance = 120;
      const mouseDistance = 180;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Pulse size
        p.size = p.baseSize + Math.sin(t * p.pulseSpeed + p.pulsePhase) * 0.4;

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Soft boundary wrap
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Mouse interaction
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseDistance && dist > 0) {
          const force = (mouseDistance - dist) / mouseDistance;
          const angle = Math.atan2(dy, dx);

          // Attract gently toward mouse
          p.vx += Math.cos(angle) * force * 0.015;
          p.vy += Math.sin(angle) * force * 0.015;

          // Draw connection to mouse
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mx, my);
          const lineAlpha = force * 0.15;
          ctx.strokeStyle = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${lineAlpha})`;
          ctx.lineWidth = force * 1.2;
          ctx.stroke();
        }

        // Damping
        p.vx *= 0.995;
        p.vy *= 0.995;

        // Draw particle with glow
        const glowSize = p.size * 3;
        const particleGradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, glowSize
        );
        particleGradient.addColorStop(0, `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.alpha})`);
        particleGradient.addColorStop(0.4, `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.alpha * 0.3})`);
        particleGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = particleGradient;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness + 20}%, ${p.alpha * 1.2})`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p2.x - p.x;
          const cdy = p2.y - p.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < connectionDistance) {
            const alpha = (1 - cdist / connectionDistance) * 0.08;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${(p.hue + p2.hue) / 2}, 50%, 50%, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Subtle scan line effect (very faint)
      const scanY = (t * 30) % h;
      const scanGradient = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
      scanGradient.addColorStop(0, 'transparent');
      scanGradient.addColorStop(0.5, 'rgba(100, 140, 255, 0.012)');
      scanGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanY - 2, w, 4);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-1] pointer-events-none"
      style={{ background: 'linear-gradient(135deg, #06060c 0%, #0a0a1a 40%, #0d0d1f 70%, #080818 100%)' }}
    />
  );
};
