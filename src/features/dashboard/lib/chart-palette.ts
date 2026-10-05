/*
 * [user-ui] 看板图表配色读取主题 token（本仓库新增文件，非官方代码）。
 *
 * 官方图表用 VChart 内置色板，不跟随站点主题（审计 6.3 #4）。这里从 CSS 变量
 * --chart-1..5（定义在 src/styles/brand.css，明暗两套）读取品牌色，转成 VChart
 * 能直接使用的 #rrggbb。读不到 token 时（测试环境、非浏览器）返回 null，由调用方回退到
 * 官方色板。
 *
 * 注意：构建时 CSS 会把 oklch() 转写成 lab()（浏览器里读到的是 lab 值），开发/测试中可能是
 * oklch() 或十六进制，三种写法都支持。
 *
 * 顺序与扩展（用 dataviz 色板校验脚本核对过）：
 * - 顺序取 1, 2, 4, 3, 5：品牌 token 里 chart-2（石板蓝）与 chart-3（青）相邻时
 *   正常视力与色弱模拟下都难以区分，把 chart-4（铁锈）插在中间后相邻色对全部达标。
 * - 系列超过 5 个时，不循环复用同一颜色，而是追加 5 个同色相、不同明度的派生色
 *   （浅色 token 变深、深色 token 变浅），共 10 色；更多系列由图表本身归入"其他"。
 */

interface Oklch {
  l: number
  c: number
  h: number
}

type LinearRgb = [number, number, number]

/** 读取顺序：见文件头说明。 */
export const CHART_PALETTE_TOKENS = [
  '--chart-1',
  '--chart-2',
  '--chart-4',
  '--chart-3',
  '--chart-5',
] as const

const DERIVED_LIGHTNESS_SHIFT = 0.15
const DERIVED_LIGHTNESS_PIVOT = 0.6

const NUMBER = String.raw`([+-]?(?:\d+\.?\d*|\.\d+))`
const ALPHA = String.raw`(?:\s*\/\s*[+-]?(?:\d+\.?\d*|\.\d+)%?)?`
const OKLCH_PATTERN = new RegExp(
  String.raw`^oklch\(\s*${NUMBER}(%?)\s+${NUMBER}(%?)\s+${NUMBER}(?:deg)?${ALPHA}\s*\)$`,
  'i'
)
const LAB_PATTERN = new RegExp(
  String.raw`^lab\(\s*${NUMBER}(%?)\s+${NUMBER}\s+${NUMBER}${ALPHA}\s*\)$`,
  'i'
)
const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function srgbToLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4)
}

function linearToSrgb(channel: number): number {
  const value = clamp01(channel)
  return value <= 0.0031308
    ? 12.92 * value
    : 1.055 * Math.pow(value, 1 / 2.4) - 0.055
}

function linearRgbToOklch(rgb: LinearRgb): Oklch {
  const [r, g, b] = rgb
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const hue = (Math.atan2(okB, okA) * 180) / Math.PI

  return {
    l: okL,
    c: Math.sqrt(okA * okA + okB * okB),
    h: hue < 0 ? hue + 360 : hue,
  }
}

function hexToLinearRgb(hex: string): LinearRgb {
  const raw = hex.slice(1)
  const full = raw.length === 3 ? [...raw].map((ch) => ch + ch).join('') : raw
  const value = Number.parseInt(full, 16)
  return [
    srgbToLinear(((value >> 16) & 255) / 255),
    srgbToLinear(((value >> 8) & 255) / 255),
    srgbToLinear((value & 255) / 255),
  ]
}

/** CSS lab()（CIE Lab，D50 白点）→ 线性 sRGB（D65），矩阵取自 CSS Color 4。 */
function labToLinearRgb(lightness: number, a: number, b: number): LinearRgb {
  const epsilon = 216 / 24389
  const kappa = 24389 / 27
  const fy = (lightness + 16) / 116
  const fx = fy + a / 500
  const fz = fy - b / 200
  const xr = fx ** 3 > epsilon ? fx ** 3 : (116 * fx - 16) / kappa
  const yr = lightness > kappa * epsilon ? fy ** 3 : lightness / kappa
  const zr = fz ** 3 > epsilon ? fz ** 3 : (116 * fz - 16) / kappa
  // D50 参考白
  const x50 = (xr * 0.3457) / 0.3585
  const y50 = yr
  const z50 = (zr * (1 - 0.3457 - 0.3585)) / 0.3585
  // Bradford：D50 → D65
  const x =
    0.955473421488075 * x50 -
    0.02309845494876471 * y50 +
    0.06325924320057072 * z50
  const y =
    -0.0283697093338637 * x50 +
    1.0099953980813041 * y50 +
    0.021041441191917323 * z50
  const z =
    0.012314014864481998 * x50 -
    0.020507649298898964 * y50 +
    1.330365926242124 * z50
  return [
    3.2409699419045226 * x - 1.537383177570094 * y - 0.4986107602930034 * z,
    -0.9692436362808796 * x + 1.8759675015077202 * y + 0.04155505740717559 * z,
    0.05563007969699366 * x - 0.20397695888897652 * y + 1.0569715142428786 * z,
  ]
}

export function oklchToHex(color: Oklch): string {
  const hueRad = (color.h * Math.PI) / 180
  const a = color.c * Math.cos(hueRad)
  const b = color.c * Math.sin(hueRad)

  const l = Math.pow(color.l + 0.3963377774 * a + 0.2158037573 * b, 3)
  const m = Math.pow(color.l - 0.1055613458 * a - 0.0638541728 * b, 3)
  const s = Math.pow(color.l - 0.0894841775 * a - 1.291485548 * b, 3)

  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]

  return `#${channels
    .map((channel) =>
      Math.round(linearToSrgb(channel) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}

/** 解析 token 的值：支持 oklch()、lab() 与 #rgb / #rrggbb，其他写法返回 null。 */
export function parseCssColor(value: string): Oklch | null {
  const trimmed = value.trim()
  if (HEX_PATTERN.test(trimmed)) {
    return linearRgbToOklch(hexToLinearRgb(trimmed))
  }

  const lab = LAB_PATTERN.exec(trimmed)
  if (lab) {
    // lab() 的 L 用百分比或 0–100 的数字表示，两者数值相同
    const parts = [Number(lab[1]), Number(lab[3]), Number(lab[4])]
    if (!parts.every(Number.isFinite)) return null
    return linearRgbToOklch(labToLinearRgb(parts[0], parts[1], parts[2]))
  }

  const oklch = OKLCH_PATTERN.exec(trimmed)
  if (!oklch) return null
  const l = Number(oklch[1]) / (oklch[2] ? 100 : 1)
  // CSS：oklch 的 C 用百分比时 100% = 0.4
  const c = oklch[4] ? (Number(oklch[3]) * 0.4) / 100 : Number(oklch[3])
  const h = Number(oklch[5])
  if (![l, c, h].every(Number.isFinite)) return null
  return { l, c, h }
}

function readCssVariable(name: string, root?: Element): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return ''
  }
  const element = root ?? document.documentElement
  return window.getComputedStyle(element).getPropertyValue(name)
}

/**
 * 读取当前主题下的图表色板（10 色，#rrggbb）。任一 token 缺失或无法解析时返回 null。
 */
export function readChartPalette(root?: Element): string[] | null {
  const base: Oklch[] = []
  for (const token of CHART_PALETTE_TOKENS) {
    const parsed = parseCssColor(readCssVariable(token, root))
    if (!parsed) return null
    base.push(parsed)
  }

  const derived = base.map((color) => ({
    ...color,
    l:
      color.l >= DERIVED_LIGHTNESS_PIVOT
        ? color.l - DERIVED_LIGHTNESS_SHIFT
        : color.l + DERIVED_LIGHTNESS_SHIFT,
  }))

  return [...base, ...derived].map(oklchToHex)
}

/** 读取单个主题颜色 token（如 --muted-foreground），用于图表文字；无法解析时返回 null。 */
export function readThemeColor(token: string, root?: Element): string | null {
  const parsed = parseCssColor(readCssVariable(token, root))
  return parsed ? oklchToHex(parsed) : null
}
