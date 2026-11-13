import React, {useEffect, useRef} from 'react';
import './StarField.css';

interface StarFieldProps {
  accent?: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  layer: number;
  tinted: boolean;
}

interface Streak {
  x: number;
  y: number;
  length: number;
  speed: number;
}

const STAR_COUNT = 200;
const STAR_LAYERS = 3;

const StarField: React.FC<StarFieldProps> = ({accent = '#4a90e2'}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const accentRef = useRef(accent);
  const streakRef = useRef<Streak | null>(null);
  const nextStreakAtRef = useRef(0);
  accentRef.current = accent;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initializeStars = (width: number, height: number) => {
      const stars: Star[] = [];

      for (let i = 0; i < STAR_COUNT; i++) {
        const layer = Math.floor(Math.random() * STAR_LAYERS) + 1;

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * (layer === 3 ? 4 : layer === 2 ? 3 : 2) + 1,
          opacity: Math.random() * 0.9 + 0.5,
          speed: layer === 3 ? 0.5 : layer === 2 ? 0.3 : 0.1,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          layer: layer,
          tinted: Math.random() < 0.1,
        });
      }

      starsRef.current = stars;
    };

    const drawStreak = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      let streak = streakRef.current;
      if (!streak && time >= nextStreakAtRef.current) {
        streak = {
          x: -220,
          y: Math.random() * height,
          length: 160 + Math.random() * 220,
          speed: 7 + Math.random() * 5,
        };
        streakRef.current = streak;
        nextStreakAtRef.current = time + 8000 + Math.random() * 7000;
      }
      if (!streak) {
        return;
      }

      streak.x += streak.speed;
      const gradient = ctx.createLinearGradient(streak.x - streak.length, streak.y, streak.x, streak.y);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(1, accentRef.current);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(streak.x - streak.length, streak.y);
      ctx.lineTo(streak.x, streak.y);
      ctx.stroke();

      if (streak.x - streak.length > width) {
        streakRef.current = null;
      }
    };

    const drawStars = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      time: number,
      allowStreak: boolean,
    ) => {
      ctx.clearRect(0, 0, width, height);

      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7;
        const finalOpacity = star.opacity * twinkle;

        if (star.tinted) {
          ctx.fillStyle = accentRef.current;
          ctx.globalAlpha = finalOpacity;
          ctx.shadowColor = accentRef.current;
          ctx.shadowBlur = star.size * 2;
        } else if (star.layer === 3) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = star.size * 2;
        } else if (star.layer === 2) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = `rgba(200, 200, 255, ${finalOpacity * 0.8})`;
          ctx.shadowColor = 'rgba(200, 200, 255, 0.5)';
          ctx.shadowBlur = star.size;
        } else {
          ctx.globalAlpha = 1;
          ctx.fillStyle = `rgba(150, 150, 200, ${finalOpacity * 0.6})`;
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        const drift = star.layer === 3 ? 0.45 : star.layer === 2 ? 0.18 : 0.08;
        star.x += star.speed * drift;
        star.y += star.speed * drift * 0.35;

        if (star.x > width + star.size) {
          star.x = -star.size;
        }
        if (star.y > height + star.size) {
          star.y = -star.size;
        }
      });

      if (allowStreak) {
        drawStreak(ctx, width, height, time);
      }
    };

    const handleResize = () => {
      const current = canvasRef.current;
      if (!current) return;

      const rect = current.getBoundingClientRect();
      current.width = rect.width;
      current.height = rect.height;
      initializeStars(current.width, current.height);
    };

    const animate = (time: number) => {
      const current = canvasRef.current;
      if (!current) return;

      const ctx = current.getContext('2d');
      if (!ctx) return;

      drawStars(ctx, current.width, current.height, time, true);
      animationRef.current = requestAnimationFrame(animate);
    };

    nextStreakAtRef.current = performance.now() + 6000;
    handleResize();
    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawStars(ctx, canvas.width, canvas.height, 0, false);
      }
    } else {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="starfield-container">
      <canvas
        ref={canvasRef}
        className="starfield-canvas"
        aria-hidden="true"
      />

      {/* Subtle nebula effect overlay */}
      <div className="nebula-overlay">
        <div className="nebula-cloud nebula-1"></div>
        <div className="nebula-cloud nebula-2"></div>
        <div className="nebula-cloud nebula-3"></div>
      </div>
    </div>
  );
};

export default StarField;