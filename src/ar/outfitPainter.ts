import type { Shape } from './outfitShapes';
import type { Pattern } from './outfits';

type Ctx = CanvasRenderingContext2D;

// Draws in the piece's own frame: x across (−r..r), y along the centreline (0..len).
function drawPattern(ctx: Ctx, p: Pattern, color: string, r: number, len: number, ink: number) {
  ctx.fillStyle = color;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = ink;
  switch (p) {
    case 'stripes':
      ctx.fillRect(-r * 0.85, -r, r * 0.18, len + 2 * r);
      ctx.fillRect(r * 0.67, -r, r * 0.18, len + 2 * r);
      break;
    case 'flames': {
      const pts: [number, number][] = [
        [-1.1, 1.3], [-1.1, 0.8], [-0.7, 0.5], [-0.45, 0.75], [-0.1, 0.3], [0.2, 0.7], [0.55, 0.45], [0.75, 0.8], [1.1, 0.6], [1.1, 1.3],
      ];
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * r, y * len) : ctx.moveTo(x * r, y * len)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'butterfly': {
      const cy = len * 0.4;
      for (const [x, y, rx, ry] of [[-0.28, -0.1, 0.28, 0.2], [0.28, -0.1, 0.28, 0.2], [-0.2, 0.18, 0.18, 0.14], [0.2, 0.18, 0.18, 0.14]]) {
        ctx.beginPath();
        ctx.ellipse(x * r, cy + y * r, rx * r, ry * r, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }
    case 'number':
      // "88" reads the same mirrored, so the selfie view never shows backwards text.
      ctx.font = `900 ${Math.round(r * 0.9)}px Inter, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(2, r * 0.06);
      ctx.strokeText('88', 0, len * 0.45);
      ctx.fillText('88', 0, len * 0.45);
      break;
    case 'mesh': {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, r * 0.04);
      ctx.beginPath();
      for (let x = -r - len; x < r + len; x += r * 0.3) {
        ctx.moveTo(x, -r);
        ctx.lineTo(x + len + 2 * r, len + r);
        ctx.moveTo(x, len + r);
        ctx.lineTo(x + len + 2 * r, -r);
      }
      ctx.stroke();
      break;
    }
    case 'zip':
      ctx.fillRect(-r * 0.03, 0, r * 0.06, len);
      ctx.fillRect(-r * 0.05, len * 0.15, r * 0.1, r * 0.18);
      break;
    case 'none':
      break;
  }
}

// Cel-shaded side: a darker band plus ink hatching on the outer third.
function shade(ctx: Ctx, r: number, len: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(r / 3, -2 * r, 2 * r, len + 4 * r);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = Math.max(1.5, r * 0.04);
  ctx.beginPath();
  for (let y = -r; y < len + 2 * r; y += r * 0.18) {
    ctx.moveTo(r * 0.55, y);
    ctx.lineTo(r * 1.3, y - r * 0.45);
  }
  ctx.stroke();
}

export function paintShapes(ctx: Ctx, shapes: Shape[], unitPx: number): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const ink = Math.max(3, 0.06 * unitPx);
  for (const s of shapes) {
    const path = new Path2D();
    s.pts.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
    path.closePath();
    ctx.fillStyle = s.fill;
    ctx.fill(path, 'evenodd');
    if (s.axis) {
      const { a, b, r } = s.axis;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      ctx.save();
      ctx.clip(path, 'evenodd');
      ctx.translate(a[0], a[1]);
      ctx.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2);
      drawPattern(ctx, s.pattern, s.patternColor, r, len, ink * 0.4);
      shade(ctx, r, len);
      ctx.restore();
    }
    ctx.strokeStyle = '#000';
    ctx.lineWidth = s.part === 'acc' ? ink * 0.5 : ink;
    ctx.stroke(path);
  }
}
