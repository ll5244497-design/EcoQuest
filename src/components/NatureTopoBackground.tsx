import React, { useEffect, useRef } from 'react';

interface NatureTopoBackgroundProps {
  className?: string;
  theme?: 'dark' | 'light' | 'adaptive';
}

/**
 * Nature Topographical & Spore Flow Background Engine
 * Inspired by uAvionix's live radar/contour elevation flow and Superlocal's understated spatial elegance.
 * Procedurally draws undulating elevation isolines, gentle nature wind vectors,
 * and glowing botanical spores in real time.
 */
export const NatureTopoBackground: React.FC<NatureTopoBackgroundProps> = ({
  className = '',
  theme = 'adaptive',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse parallax tracking
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initSpores();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // Drifting Forest Spores
    interface Spore {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      baseAlpha: number;
      pulseSpeed: number;
      pulsePhase: number;
    }

    let spores: Spore[] = [];
    const sporeCount = 42;

    const initSpores = () => {
      spores = [];
      for (let i = 0; i < sporeCount; i++) {
        spores.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35 + 0.15, // gentle drift rightward
          vy: (Math.random() - 0.5) * 0.25 - 0.1,  // slight upward buoyancy
          size: Math.random() * 2.2 + 0.8,
          alpha: Math.random() * 0.5 + 0.2,
          baseAlpha: Math.random() * 0.4 + 0.2,
          pulseSpeed: Math.random() * 0.03 + 0.015,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    initSpores();

    let time = 0;

    // Render loop
    const render = () => {
      time += 0.007;

      // Smooth mouse parallax interpolation
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;
      const normMouseX = (mouseX / width - 0.5) * 60;
      const normMouseY = (mouseY / height - 0.5) * 40;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Organic Topographic Contour Isolines (uAvionix terrain flow)
      const contourLinesCount = 9;
      const stepY = height / (contourLinesCount + 1);

      ctx.save();
      for (let i = 0; i < contourLinesCount; i++) {
        const baseY = (i + 1) * stepY + Math.sin(time * 0.8 + i) * 12;
        const phase = time * 0.6 + i * 0.75;
        const lineParallax = (i / contourLinesCount) * 0.5;

        ctx.beginPath();
        const segments = 28;
        const stepX = width / segments;

        for (let j = 0; j <= segments; j++) {
          const x = j * stepX;
          // Harmonic wave equation simulating mountain contour terrain
          const wave1 = Math.sin(x * 0.0028 + phase) * 32;
          const wave2 = Math.cos(x * 0.0055 - time * 0.4 + i) * 18;
          const wave3 = Math.sin((x + normMouseX * lineParallax) * 0.0015 + time * 0.2) * 14;
          const y = baseY + wave1 + wave2 + wave3 + normMouseY * lineParallax;

          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Topo isoline style: Whisper-thin architectural line
        const lineAlpha = (0.055 + Math.sin(time * 0.4 + i) * 0.02) * (1 - i / (contourLinesCount * 1.6));
        ctx.strokeStyle = `rgba(30, 60, 45, ${lineAlpha.toFixed(3)})`;
        ctx.lineWidth = i % 3 === 0 ? 1.5 : 1.0;
        ctx.stroke();

        // Subtle topographic height annotation tick on prime contours
        if (i % 3 === 0) {
          const tickX = ((width * 0.25 + i * 140 + time * 15) % (width * 0.8)) + width * 0.1;
          const tickWave =
            Math.sin(tickX * 0.0028 + phase) * 32 +
            Math.cos(tickX * 0.0055 - time * 0.4 + i) * 18 +
            Math.sin((tickX + normMouseX * lineParallax) * 0.0015 + time * 0.2) * 14;
          const tickY = baseY + tickWave + normMouseY * lineParallax;

          ctx.fillStyle = `rgba(30, 60, 45, ${(lineAlpha * 1.8).toFixed(3)})`;
          ctx.font = '500 9px "JetBrains Mono", monospace';
          ctx.fillText(`+${(i * 120 + 340)}m`, tickX, tickY - 5);
        }
      }
      ctx.restore();

      // 2. Draw Gentle Drifting Botanical Spores
      ctx.save();
      for (let i = 0; i < spores.length; i++) {
        const s = spores[i];

        // Move spore
        s.x += s.vx;
        s.y += s.vy;
        s.pulsePhase += s.pulseSpeed;

        // Wrap around bounds
        if (s.x > width + 20) s.x = -10;
        if (s.x < -20) s.x = width + 10;
        if (s.y > height + 20) s.y = -10;
        if (s.y < -20) s.y = height + 10;

        const currentAlpha = s.baseAlpha + Math.sin(s.pulsePhase) * 0.15;

        // Soft radial spore glow
        const rad = s.size * 2.8;
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rad);
        grad.addColorStop(0, `rgba(16, 185, 129, ${Math.max(0, currentAlpha).toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(52, 211, 153, ${(currentAlpha * 0.4).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ opacity: 0.85 }}
    />
  );
};
