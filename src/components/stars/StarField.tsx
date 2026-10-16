'use client';

import { useRef } from 'react';
import { useStarRenderer } from './useStarRenderer';

/**
 * 星空背景层（PRD F-010 ~ F-014）
 *
 * 结构分两层，责任分明：
 *  - 星云底色是纯 CSS，不依赖 JS —— 画布初始化失败或用户禁用 JS 时依然有氛围；
 *  - 星点由 Canvas 绘制，在空闲时接管，因此不会和首屏 LCP 抢主线程（TECH_DESIGN T2）。
 *
 * 整个组件对辅助技术隐藏：它不含任何信息，只是氛围（AGENTS.md 4.3 第 7 条）。
 */
export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useStarRenderer(canvasRef);

  return (
    <div className="star-field" aria-hidden="true">
      <div className="star-field__nebula" />
      <canvas ref={canvasRef} className="star-field__canvas" />
    </div>
  );
}
