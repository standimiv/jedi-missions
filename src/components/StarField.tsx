import React, {useEffect, useRef} from 'react';
import './StarField.css';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  layer: number;
}

const STAR_COUNT = 200;
const STAR_LAYERS = 3;

const StarField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

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
        });
      }

      starsRef.current = stars;
    };

    const drawStars = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      ctx.clearRect(0, 0, width, height);

      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7;
        const finalOpacity = star.opacity * twinkle;

        if (star.layer === 3) {
          ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = star.size * 2;
        } else if (star.layer === 2) {
          ctx.fillStyle = `rgba(200, 200, 255, ${finalOpacity * 0.8})`;
          ctx.shadowColor = 'rgba(200, 200, 255, 0.5)';
          ctx.shadowBlur = star.size;
        } else {
          ctx.fillStyle = `rgba(150, 150, 200, ${finalOpacity * 0.6})`;
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        star.x += star.speed * 0.1;
        star.y += star.speed * 0.05;

        if (star.x > width + star.size) {
          star.x = -star.size;
        }
        if (star.y > height + star.size) {
          star.y = -star.size;
        }
      });
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
      if (!ctx) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      drawStars(ctx, current.width, current.height, time);
      animationRef.current = requestAnimationFrame(animate);
    };

    handleResize();
    animationRef.current = requestAnimationFrame(animate);
    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawStars(ctx, canvas.width, canvas.height, 0);
      }
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