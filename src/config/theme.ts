/**
 * 需要被 JavaScript 共享的设计与性能常量（CSS 侧对应 src/styles/tokens.css）。
 *
 * 为什么只有这些常量放在 TS 里：颜色/圆角/间距全部由 CSS 变量承担，
 * 只有「画布渲染规模」与「性能阈值」无法写进 CSS，必须由 JS 读取。
 */

/** 星点总数按视口宽度自适应（PRD 5.3），移动端必须降到 120 以免拖垮低端机 */
export const STAR_COUNT = {
  compact: 120,
  medium: 220,
  full: 320,
} as const;

export function starCountForWidth(width: number): number {
  if (width < 768) return STAR_COUNT.compact;
  if (width < 1280) return STAR_COUNT.medium;
  return STAR_COUNT.full;
}

/** devicePixelRatio 上限：4K 屏 + 3x 缩放会让画布填充率爆炸，必须封顶 */
export const MAX_DEVICE_PIXEL_RATIO = 2;

/** 单帧耗时预算：连续超标即降级（AGENTS.md 4.3 第 5 条） */
export const FRAME_BUDGET_MS = 24;

/** 每次判定降级所统计的帧数 */
export const DEGRADE_WINDOW_FRAMES = 60;

/** 窗口尺寸变化超过该阈值才重建星图，避免移动端地址栏伸缩导致反复重建 */
export const RESIZE_REBUILD_THRESHOLD_PX = 80;
