'use client';

import { useEffect, type RefObject } from 'react';
import {
  DEGRADE_WINDOW_FRAMES,
  FRAME_BUDGET_MS,
  MAX_DEVICE_PIXEL_RATIO,
  RESIZE_REBUILD_THRESHOLD_PX,
  starCountForWidth,
} from '@/config/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { GLOW_SCALE, GLOW_SPRITE_SIZE, STAR_LAYERS, type StarLayerId } from './starPresets';

/**
 * 星空渲染器（PRD 5.3 / TECH_DESIGN T1）
 *
 * 性能设计的核心是「把每帧的工作量压到一个 drawImage + 少量闪烁星」：
 *  1. 所有不闪烁的星点在初始化时一次性画进离屏画布（base），此后每帧只 drawImage 一次；
 *  2. 只有数量封顶的闪烁星（约 30 颗）需要逐帧绘制，且靠 globalAlpha 调制，不重建渐变；
 *  3. 光晕用一张 32px 的径向渐变贴图缩放得到，避免每帧 createRadialGradient；
 *  4. 全程不使用 shadowBlur / filter —— 这两个是 canvas 上最贵的绘制路径。
 *
 * 降级链路是单向的：连续掉帧 → 关闭闪烁并切换为完全静态 → 不再尝试恢复动画。
 */

type Star = {
  layer: StarLayerId;
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
  twinkling: boolean;
  /** 闪烁相位，随机取值以避免所有星点同步呼吸 */
  phase: number;
  /** 闪烁角速度（弧度/秒） */
  speed: number;
};

type StarScene = {
  stars: Star[];
  /** 预渲染的非闪烁星，每帧只做一次 drawImage */
  base: HTMLCanvasElement;
  /** 光晕贴图，只生成一次 */
  sprite: HTMLCanvasElement;
  width: number;
  height: number;
  dpr: number;
};

type LayerColors = Record<StarLayerId, string>;

/* ==================== 纯函数部分（不依赖 DOM 状态，便于单独推演） ==================== */

/**
 * 读取 token 定义的颜色；画布读不到 CSS 变量，只能运行时取计算值。
 *
 * 逐层遍历而不是按下标取值：STAR_LAYERS 是普通数组，在
 * noUncheckedIndexedAccess 下 `STAR_LAYERS[0]` 的类型是「可能 undefined」；
 * 遍历还能让颜色兜底值始终只来自 starPresets 里那一份定义。
 */
function readLayerColors(): LayerColors {
  const styles = getComputedStyle(document.documentElement);
  const colors: LayerColors = { far: '#ffffff', mid: '#ffffff', near: '#ffffff' };

  for (const layer of STAR_LAYERS) {
    colors[layer.id] = styles.getPropertyValue(layer.colorToken).trim() || layer.fallbackColor;
  }

  return colors;
}

function parseHexColor(value: string): { r: number; g: number; b: number } | null {
  const matched = /^#?([\da-f]{6})$/i.exec(value.trim());
  const hex = matched?.[1];
  if (!hex) return null;

  const int = Number.parseInt(hex, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function createGlowSprite(color: string): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = GLOW_SPRITE_SIZE;
  sprite.height = GLOW_SPRITE_SIZE;

  const ctx = sprite.getContext('2d');
  if (!ctx) return sprite;

  const half = GLOW_SPRITE_SIZE / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  const rgb = parseHexColor(color);
  const stops: ReadonlyArray<readonly [number, number]> = [
    [0, 0.5],
    [0.35, 0.14],
    [1, 0],
  ];

  for (const [position, alpha] of stops) {
    gradient.addColorStop(
      position,
      rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : 'rgba(255, 255, 255, 0)',
    );
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GLOW_SPRITE_SIZE, GLOW_SPRITE_SIZE);
  return sprite;
}

function randomBetween(range: readonly [number, number]): number {
  const [min, max] = range;
  return min + Math.random() * (max - min);
}

/**
 * 按层生成星点。闪烁名额直接取该层前 N 颗 —— 位置本来就是随机分布的，
 * 因此「前 N 颗」等价于随机抽样，比再写一套抽样逻辑更不容易出错。
 */
function createStars(count: number, width: number, height: number, colors: LayerColors): Star[] {
  const stars: Star[] = [];
  let remaining = count;

  STAR_LAYERS.forEach((layer, index) => {
    const isLastLayer = index === STAR_LAYERS.length - 1;
    const layerCount = isLastLayer ? remaining : Math.min(remaining, Math.round(count * layer.ratio));
    remaining -= layerCount;

    for (let i = 0; i < layerCount; i += 1) {
      const twinkling = i < layer.maxTwinkling && layer.twinkleSpeed !== undefined;

      stars.push({
        layer: layer.id,
        x: Math.random() * width,
        y: Math.random() * height,
        radius: randomBetween(layer.radius),
        alpha: randomBetween(layer.alpha),
        color: colors[layer.id],
        twinkling,
        phase: Math.random() * Math.PI * 2,
        speed: layer.twinkleSpeed ? randomBetween(layer.twinkleSpeed) : 0,
      });
    }
  });

  return stars;
}

/** 把不闪烁的星点一次性画进离屏画布：同层共用一次 fillStyle，减少状态切换 */
function createBaseCanvas(
  stars: Star[],
  width: number,
  height: number,
  dpr: number,
): HTMLCanvasElement {
  const base = document.createElement('canvas');
  base.width = Math.max(1, Math.round(width * dpr));
  base.height = Math.max(1, Math.round(height * dpr));

  const ctx = base.getContext('2d');
  if (!ctx) return base;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  for (const layer of STAR_LAYERS) {
    const layerStars = stars.filter((star) => star.layer === layer.id && !star.twinkling);
    const color = layerStars[0]?.color;
    if (layerStars.length === 0 || color === undefined) continue;

    // 该层所有星点共用一种颜色，因此 fillStyle 只需设置一次
    ctx.fillStyle = color;

    for (const star of layerStars) {
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
  return base;
}

/* ==================== 渲染器 ==================== */

export function useStarRenderer(canvasRef: RefObject<HTMLCanvasElement | null>) {
  // 该状态只作为「系统设置变化时重跑 effect」的触发器；
  // 初次是否动画直接同步读取 matchMedia，避免默认 false 导致先动画一帧再变静止的闪烁感。
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // 拿不到 2D 上下文就放弃星点：CSS 星云仍在，页面氛围与可读性不受影响
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const colors = readLayerColors();
    const sprite = createGlowSprite(colors.near);

    let scene: StarScene | null = null;
    let rafId = 0;
    let frames = 0;
    let accumulated = 0;
    let lastTimestamp = 0;
    let animating = false;
    /** 降级后永久为 false，不再尝试恢复动画 */
    let allowAnimation = !prefersReducedMotion;

    // 下面一律用「箭头函数 + const」而不是 function 声明。
    // 原因：函数声明会被提升，TS 在闭包内不再沿用上方对 ctx / canvas 的判空收窄，
    // 会把它们重新当作可能为 null；用 const 箭头函数可在保持同一执行顺序的前提下拿到收窄结果。
    const paint = (timestamp: number, withTwinkle: boolean) => {
      if (!scene) return;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, scene.base.width, scene.base.height);
      ctx.drawImage(scene.base, 0, 0);

      // 闪烁星数量被封顶，这里的逐帧绘制开销是可控的
      ctx.setTransform(scene.dpr, 0, 0, scene.dpr, 0, 0);
      for (const star of scene.stars) {
        if (!star.twinkling) continue;

        const alpha = withTwinkle
          ? star.alpha * (0.6 + 0.4 * Math.sin((timestamp / 1000) * star.speed + star.phase))
          : star.alpha;

        const glowSize = star.radius * GLOW_SCALE * 2;
        ctx.globalAlpha = alpha * 0.7;
        ctx.drawImage(scene.sprite, star.x - glowSize / 2, star.y - glowSize / 2, glowSize, glowSize);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    const drawStatic = () => {
      paint(0, false);
    };

    const stopLoop = () => {
      animating = false;
      if (rafId !== 0) cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const startLoop = () => {
      if (animating || !allowAnimation || scene === null) return;
      animating = true;
      lastTimestamp = 0;
      frames = 0;
      accumulated = 0;
      rafId = requestAnimationFrame(loop);
    };

    const degrade = () => {
      allowAnimation = false;
      stopLoop();
      drawStatic();
    };

    const loop = (timestamp: number) => {
      if (!scene || !allowAnimation) {
        animating = false;
        return;
      }

      // 第一帧没有可用的 delta，跳过统计
      const delta = lastTimestamp === 0 ? 0 : timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (delta > 0) {
        accumulated += delta;
        frames += 1;
      }

      if (frames >= DEGRADE_WINDOW_FRAMES) {
        const average = accumulated / frames;
        frames = 0;
        accumulated = 0;
        if (average > FRAME_BUDGET_MS) {
          degrade();
          return;
        }
      }

      paint(timestamp, true);
      rafId = requestAnimationFrame(loop);
    };

    const rebuild = (width: number, height: number) => {
      stopLoop();

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));

      const stars = createStars(starCountForWidth(window.innerWidth), width, height, colors);
      scene = {
        stars,
        base: createBaseCanvas(stars, width, height, dpr),
        sprite,
        width,
        height,
        dpr,
      };

      if (allowAnimation) {
        startLoop();
      } else {
        drawStatic();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopLoop();
      } else {
        startLoop();
      }
    };

    // 首次用元素实际尺寸建立场景；随后的 resize 回调若在阈值内会被忽略，
    // 从而避免移动端地址栏伸缩引起的反复重建。
    const initialRect = canvas.getBoundingClientRect();
    rebuild(initialRect.width || window.innerWidth, initialRect.height || window.innerHeight);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      if (
        scene !== null &&
        Math.abs(width - scene.width) < RESIZE_REBUILD_THRESHOLD_PX &&
        Math.abs(height - scene.height) < RESIZE_REBUILD_THRESHOLD_PX
      ) {
        return;
      }

      rebuild(width, height);
    });
    resizeObserver.observe(canvas);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopLoop();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      scene = null;
    };
  }, [canvasRef, reducedMotion]);
}
