/**
 * 星空的三层视觉参数（PRD 5.3）
 *
 * 设计意图：
 *  - 远景星密集但极暗、不闪烁，负责「密度感」；
 *  - 中景星负责「层次」，只有少量参与闪烁；
 *  - 近景星最亮、带光晕，负责「亮点」，闪烁数量也在这里封顶。
 * 闪烁星必须严格控制数量：它们在每一帧都要重新绘制，
 * 而远景星只在初始化时画一次到离屏画布，两者成本差一个数量级。
 */

export type StarLayerId = 'far' | 'mid' | 'near';

export type StarLayerPreset = {
  id: StarLayerId;
  /** 占星点总数的比例，三者之和必须为 1 */
  ratio: number;
  /** 半径范围（CSS 像素） */
  radius: readonly [number, number];
  /** 基础透明度范围 */
  alpha: readonly [number, number];
  /** 参与闪烁的星点数量上限（0 表示该层完全不闪烁） */
  maxTwinkling: number;
  /** 闪烁速度范围（弧度/秒） */
  twinkleSpeed?: readonly [number, number];
  /** 读取颜色的 CSS token 名 */
  colorToken: string;
  /** token 读取失败时的兜底颜色 */
  fallbackColor: string;
};

export const STAR_LAYERS: readonly StarLayerPreset[] = [
  {
    id: 'far',
    ratio: 0.62,
    radius: [0.4, 0.9],
    alpha: [0.16, 0.38],
    maxTwinkling: 0,
    colorToken: '--star-color-far',
    fallbackColor: '#8ea2c6',
  },
  {
    id: 'mid',
    ratio: 0.28,
    radius: [0.6, 1.2],
    alpha: [0.3, 0.6],
    maxTwinkling: 12,
    twinkleSpeed: [0.5, 1.1],
    colorToken: '--star-color-mid',
    fallbackColor: '#cfdcf5',
  },
  {
    id: 'near',
    ratio: 0.1,
    radius: [1.1, 2.1],
    alpha: [0.55, 0.95],
    maxTwinkling: 20,
    twinkleSpeed: [0.35, 0.8],
    colorToken: '--star-color-near',
    fallbackColor: '#ffffff',
  },
];

/** 光晕贴图的边长（设备像素）。贴图只生成一次，之后靠缩放复用，避免每帧创建渐变。 */
export const GLOW_SPRITE_SIZE = 32;

/** 光晕相对星点半径的放大倍数 */
export const GLOW_SCALE = 4;
