'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hero động nhẹ: canvas particle 2D (không phải WebGL/Three.js — giữ
 * bundle nhỏ, không tốn GPU/pin thiết bị) kết hợp CSS 3D transform
 * (perspective + rotateX/Y) trên logo mark để tạo cảm giác chiều sâu khi
 * di chuột — "3D cảm nhận được" mà không cần thư viện 3D thật.
 *
 * Tôn trọng đầy đủ:
 * - prefers-reduced-motion: tắt hẳn animation, hiện trạng thái tĩnh
 * - document.hidden: dừng vòng lặp render khi tab không hiển thị
 * - mobile: giảm số hạt để không tốn pin/CPU trên thiết bị yếu
 * - cleanup đầy đủ khi unmount: cancelAnimationFrame + gỡ mọi listener
 */
export function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  // Lazy initializer: đọc đúng giá trị thật ngay từ lần render đầu tiên
  // phía client, tránh nhấp nháy animation trước khi effect kịp chạy.
  // Guard typeof window vì component này được server-render trước (SSR)
  // — window không tồn tại lúc đó, phải trả về false an toàn.
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const handleChange = () => setReducedMotion(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    if (reducedMotion) {
      // Không chạy animation loop nào cả khi người dùng yêu cầu giảm
      // chuyển động — chỉ xoá canvas về trạng thái trống, tĩnh.
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isMobile = window.matchMedia('(max-width: 860px)').matches;

    interface Particle {
      x: number;
      y: number;
      r: number;
      vy: number;
      a: number;
    }
    let particles: Particle[] = [];

    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      const rect = c.getBoundingClientRect();
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
    }

    function initParticles() {
      const c = canvasRef.current;
      if (!c) return;
      const count = isMobile ? 26 : 60;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        r: (Math.random() * 1.1 + 0.3) * dpr,
        vy: (Math.random() * 0.06 + 0.015) * dpr,
        a: Math.random() * 0.5 + 0.12,
      }));
    }

    function draw() {
      const c = canvasRef.current;
      const context = ctx;
      if (!running || !c || !context) return;
      context.clearRect(0, 0, c.width, c.height);
      for (const p of particles) {
        p.y -= p.vy;
        if (p.y < -4) p.y = c.height + 4;
        context.beginPath();
        context.fillStyle = `rgba(180,195,255,${p.a})`;
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    resize();
    initParticles();
    raf = requestAnimationFrame(draw);

    function handleVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reducedMotion) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);

    let resizeTimer: ReturnType<typeof setTimeout>;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        initParticles();
      }, 200);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -10, y: px * 12 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        height: 220,
        borderRadius: 'var(--radius-l)',
        overflow: 'hidden',
        border: '1px solid var(--hpgk-border)',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(91,124,250,0.12), transparent 70%)',
        marginBottom: 28,
        perspective: 700,
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transformStyle: 'preserve-3d',
        }}
      >
        <svg
          width="72"
          height="72"
          viewBox="0 0 48 48"
          fill="none"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: 'transform 120ms ease-out',
            filter: 'drop-shadow(0 8px 24px rgba(91,124,250,0.35))',
          }}
        >
          <path d="M24 2 L44 13 V35 L24 46 L4 35 V13 Z" stroke="url(#hpgk-hero-g)" strokeWidth="2" />
          <path d="M24 14 L34 20 V32 L24 38 L14 32 V20 Z" stroke="url(#hpgk-hero-g)" strokeWidth="1.4" opacity="0.85" />
          <defs>
            <linearGradient id="hpgk-hero-g" x1="0" y1="0" x2="48" y2="48">
              <stop offset="0" stopColor="#5b7cfa" />
              <stop offset="1" stopColor="#8b6cf0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
