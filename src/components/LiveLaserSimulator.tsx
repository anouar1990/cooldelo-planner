import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, Linking } from 'react-native';
import Svg, { Rect, Path, Circle, Defs, RadialGradient, Stop, Line, G } from 'react-native-svg';
import { 
  Play, Pause, RotateCcw, UploadCloud, MessageCircle, FileText, 
  CheckCircle, AlertTriangle, Sparkles, ChevronDown, RefreshCw, Minus, Plus, Monitor 
} from 'lucide-react-native';
import { useWorkshop } from '../context/WorkshopContext';

interface Spark {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Point {
  x: number;
  y: number;
}

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  len: number;
}

interface PathItem {
  d: string;
  stroke?: string;
}

interface CustomJob {
  fileName: string;
  rawPaths: PathItem[];
  segments: Segment[];
  totalCutLen: number;
  scale: number;
  tx: number;
  ty: number;
  widthMm: number;
  heightMm: number;
  totalLengthMm: number;
  estTimeSec: number;
  originalWidthMm: number;
  originalHeightMm: number;
  originalLengthMm: number;
}

const MATERIALS = [
  { id: 'mdf3', name: 'MDF 3mm', costPerSqM: 6.0, cutSpeedMmPerSec: 25 },
  { id: 'plywood4', name: 'Birch Plywood 4mm', costPerSqM: 14.0, cutSpeedMmPerSec: 20 },
  { id: 'acrylic3', name: 'Cast Acrylic 3mm', costPerSqM: 26.0, cutSpeedMmPerSec: 18 },
  { id: 'metal1', name: 'Stainless Steel 1.5mm', costPerSqM: 42.0, cutSpeedMmPerSec: 8 },
];

// Fallback presets if no file is uploaded
const PRESETS = [
  {
    id: 'gear',
    name: 'Precision Gear',
    material: 'MDF 3mm',
    widthMm: 120,
    heightMm: 120,
    totalLengthMm: 1240,
    estTimeSec: 42,
    points: [
      { x: 150, y: 40 }, { x: 165, y: 45 }, { x: 175, y: 35 }, { x: 185, y: 50 },
      { x: 200, y: 50 }, { x: 205, y: 68 }, { x: 220, y: 75 }, { x: 215, y: 95 },
      { x: 228, y: 110 }, { x: 215, y: 125 }, { x: 220, y: 145 }, { x: 205, y: 152 },
      { x: 200, y: 170 }, { x: 185, y: 170 }, { x: 175, y: 185 }, { x: 165, y: 175 },
      { x: 150, y: 180 }, { x: 135, y: 175 }, { x: 125, y: 185 }, { x: 115, y: 170 },
      { x: 100, y: 170 }, { x: 95, y: 152 }, { x: 80, y: 145 }, { x: 85, y: 125 },
      { x: 72, y: 110 }, { x: 85, y: 95 }, { x: 80, y: 75 }, { x: 95, y: 68 },
      { x: 100, y: 50 }, { x: 115, y: 50 }, { x: 125, y: 35 }, { x: 135, y: 45 },
      { x: 150, y: 40 }
    ]
  },
  {
    id: 'hinge',
    name: 'Living Hinge',
    material: 'Birch Plywood 4mm',
    widthMm: 220,
    heightMm: 140,
    totalLengthMm: 2850,
    estTimeSec: 75,
    points: [
      { x: 60, y: 50 }, { x: 240, y: 50 }, { x: 240, y: 170 }, { x: 60, y: 170 }, { x: 60, y: 50 },
      { x: 90, y: 65 }, { x: 90, y: 155 }, { x: 120, y: 65 }, { x: 120, y: 155 },
      { x: 150, y: 65 }, { x: 150, y: 155 }, { x: 180, y: 65 }, { x: 180, y: 155 },
      { x: 210, y: 65 }, { x: 210, y: 155 }
    ]
  },
  {
    id: 'logo',
    name: '0Machine Emblem',
    material: 'Cast Acrylic 3mm',
    widthMm: 180,
    heightMm: 160,
    totalLengthMm: 1920,
    estTimeSec: 58,
    points: [
      { x: 70, y: 60 }, { x: 150, y: 45 }, { x: 230, y: 60 }, { x: 210, y: 140 },
      { x: 150, y: 175 }, { x: 90, y: 140 }, { x: 70, y: 60 }, { x: 150, y: 90 },
      { x: 190, y: 110 }, { x: 150, y: 140 }, { x: 110, y: 110 }, { x: 150, y: 90 }
    ]
  }
];

function getPresetGeometry(preset: typeof PRESETS[0]) {
  const pts = preset.points;
  const segments: Segment[] = [];
  let totalLen = 0;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const len = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    segments.push({ x1: pts[i - 1].x, y1: pts[i - 1].y, x2: pts[i].x, y2: pts[i].y, len });
    totalLen += len;
    d += ` L ${pts[i].x} ${pts[i].y}`;
  }
  return {
    rawPaths: [{ d, stroke: 'rgba(255, 255, 255, 0.25)' }],
    segments,
    totalCutLen: totalLen,
    scale: 1.0,
    tx: 0,
    ty: 0,
  };
}

// Convert various SVG shapes (paths, polygons, polylines, rects, circles, ellipses, lines) into standard SVG path items with colors
function svgToPaths(svgText: string): PathItem[] {
  const results: PathItem[] = [];
  const tagRegex = /<(\/)?(g|path|polygon|polyline|rect|circle|ellipse|line)\b([^>]*)>/gi;
  let match;
  const groupStrokeStack: (string | null)[] = [];

  const normalizeColor = (stroke: string | null | undefined): string => {
    if (!stroke) return 'rgba(255, 255, 255, 0.25)';
    const s = stroke.toLowerCase().trim();
    if (s === 'red' || s === '#f00' || s === '#ff0000' || s.startsWith('rgb(255, 0, 0)')) return '#FF4444';
    if (s === 'blue' || s === '#00f' || s === '#0000ff' || s.startsWith('rgb(0, 0, 255)')) return '#4488FF';
    if (s === 'none' || s === 'transparent') return 'none';
    if (s === 'black' || s === '#000' || s === '#000000') return 'rgba(255, 255, 255, 0.25)';
    return stroke;
  };

  while ((match = tagRegex.exec(svgText)) !== null) {
    const isClosing = !!match[1];
    const tagName = match[2].toLowerCase();
    const attrs = match[3];

    if (tagName === 'g') {
      if (isClosing) {
        groupStrokeStack.pop();
      } else {
        const strokeMatch = attrs.match(/\bstroke=["']([^"']*)["']/i) ||
                            attrs.match(/style=["'][^"']*stroke:\s*([^;"]+)/i);
        groupStrokeStack.push(strokeMatch ? strokeMatch[1].trim() : null);
      }
      continue;
    }

    if (isClosing) continue;

    const elemStrokeMatch = attrs.match(/\bstroke=["']([^"']*)["']/i) ||
                           attrs.match(/style=["'][^"']*stroke:\s*([^;"]+)/i);
    const parentStroke = groupStrokeStack.slice().reverse().find(s => s != null);
    const stroke = normalizeColor(elemStrokeMatch ? elemStrokeMatch[1].trim() : parentStroke);

    if (tagName === 'path') {
      const dMatch = attrs.match(/\bd=["']([^"']*)["']/i);
      if (dMatch && dMatch[1]) {
        results.push({ d: dMatch[1], stroke });
      }
    } else if (tagName === 'polygon' || tagName === 'polyline') {
      const pts = attrs.match(/points=["']([^"']*)["']/i)?.[1].trim().split(/[\s,]+/).map(Number) || [];
      if (pts.length >= 4) {
        let d = `M ${pts[0]} ${pts[1]}`;
        for (let i = 2; i < pts.length - 1; i += 2) d += ` L ${pts[i]} ${pts[i + 1]}`;
        if (tagName === 'polygon') d += ' Z';
        results.push({ d, stroke });
      }
    } else if (tagName === 'rect') {
      const w = parseFloat(attrs.match(/\bwidth=["']([\d.]+)["']/i)?.[1] || '0');
      const h = parseFloat(attrs.match(/\bheight=["']([\d.]+)["']/i)?.[1] || '0');
      const x = parseFloat(attrs.match(/\bx=["']([\d.]+)["']/i)?.[1] || '0');
      const y = parseFloat(attrs.match(/\by=["']([\d.]+)["']/i)?.[1] || '0');
      if (w > 0 && h > 0) {
        results.push({ d: `M ${x} ${y} h ${w} v ${h} h ${-w} Z`, stroke });
      }
    } else if (tagName === 'circle') {
      const cx = parseFloat(attrs.match(/\bcx=["']([\d.]+)["']/i)?.[1] || '0');
      const cy = parseFloat(attrs.match(/\bcy=["']([\d.]+)["']/i)?.[1] || '0');
      const r = parseFloat(attrs.match(/\br=["']([\d.]+)["']/i)?.[1] || '0');
      if (r > 0) {
        results.push({ d: `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`, stroke });
      }
    } else if (tagName === 'ellipse') {
      const cx = parseFloat(attrs.match(/\bcx=["']([\d.]+)["']/i)?.[1] || '0');
      const cy = parseFloat(attrs.match(/\bcy=["']([\d.]+)["']/i)?.[1] || '0');
      const rx = parseFloat(attrs.match(/\brx=["']([\d.]+)["']/i)?.[1] || '0');
      const ry = parseFloat(attrs.match(/\bry=["']([\d.]+)["']/i)?.[1] || '0');
      if (rx > 0 && ry > 0) {
        results.push({ d: `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`, stroke });
      }
    } else if (tagName === 'line') {
      const x1 = parseFloat(attrs.match(/\bx1=["']([\d.]+)["']/i)?.[1] || '0');
      const y1 = parseFloat(attrs.match(/\by1=["']([\d.]+)["']/i)?.[1] || '0');
      const x2 = parseFloat(attrs.match(/\bx2=["']([\d.]+)["']/i)?.[1] || '0');
      const y2 = parseFloat(attrs.match(/\by2=["']([\d.]+)["']/i)?.[1] || '0');
      results.push({ d: `M ${x1} ${y1} L ${x2} ${y2}`, stroke });
    }
  }

  return results;
}

// Subdivide SVG curves into smooth linear segments for high-fidelity laser motion
function sampleCubicBezier(
  p0: Point, p1: Point, p2: Point, p3: Point,
  addSeg: (x1: number, y1: number, x2: number, y2: number) => void,
  steps = 10
) {
  let prev = p0;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const mt = 1 - t;
    const x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x;
    const y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y;
    addSeg(prev.x, prev.y, x, y);
    prev = { x, y };
  }
}

function sampleQuadBezier(
  p0: Point, p1: Point, p2: Point,
  addSeg: (x1: number, y1: number, x2: number, y2: number) => void,
  steps = 8
) {
  let prev = p0;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const mt = 1 - t;
    const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
    const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
    addSeg(prev.x, prev.y, x, y);
    prev = { x, y };
  }
}

function sampleArc(
  x0: number, y0: number, rx: number, ry: number,
  xAxisRotationDeg: number, largeArcFlag: boolean, sweepFlag: boolean,
  x1: number, y1: number,
  addSeg: (x1: number, y1: number, x2: number, y2: number) => void,
  steps = 12
) {
  if (rx === 0 || ry === 0 || (x0 === x1 && y0 === y1)) {
    addSeg(x0, y0, x1, y1);
    return;
  }
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const phi = ((xAxisRotationDeg % 360) * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx2 = (x0 - x1) / 2;
  const dy2 = (y0 - y1) / 2;
  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  let lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const sqrtL = Math.sqrt(lambda);
    rx *= sqrtL;
    ry *= sqrtL;
  }

  const sign = largeArcFlag !== sweepFlag ? 1 : -1;
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const sq = Math.sqrt(Math.max(0, num / (den || 1)));
  const cxp = sign * sq * ((rx * y1p) / ry);
  const cyp = sign * sq * ((-ry * x1p) / rx);

  const cx = cosPhi * cxp - sinPhi * cyp + (x0 + x1) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y0 + y1) / 2;

  const vectorAngle = (ux: number, uy: number, vx: number, vy: number) => {
    const s = ux * vy - uy * vx < 0 ? -1 : 1;
    const dot = ux * vx + uy * vy;
    const mag = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    return s * Math.acos(Math.max(-1, Math.min(1, dot / (mag || 1))));
  };

  const theta1 = vectorAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dTheta = vectorAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);

  if (!sweepFlag && dTheta > 0) dTheta -= 2 * Math.PI;
  if (sweepFlag && dTheta < 0) dTheta += 2 * Math.PI;

  let prev = { x: x0, y: y0 };
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const th = theta1 + t * dTheta;
    const cosTh = Math.cos(th);
    const sinTh = Math.sin(th);
    const x = cosPhi * rx * cosTh - sinPhi * ry * sinTh + cx;
    const y = sinPhi * rx * cosTh + cosPhi * ry * sinTh + cy;
    addSeg(prev.x, prev.y, x, y);
    prev = { x, y };
  }
}

// Parse SVG paths into high-precision laser line segments and bounding geometry
function parsePathsToSegments(rawPaths: PathItem[]) {
  const segments: Segment[] = [];
  let totalCutLen = 0;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  const updateBounds = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  const addSeg = (x1: number, y1: number, x2: number, y2: number) => {
    updateBounds(x1, y1);
    updateBounds(x2, y2);
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len > 0.0001) {
      segments.push({ x1, y1, x2, y2, len });
      totalCutLen += len;
    }
  };

  const tokenRegex = /([a-df-z])|([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/gi;

  rawPaths.forEach(item => {
    const d = item.d;
    let match;
    const tokens: (string | number)[] = [];
    while ((match = tokenRegex.exec(d)) !== null) {
      if (match[1]) tokens.push(match[1]);
      else if (match[2]) tokens.push(parseFloat(match[2]));
    }

    let curX = 0, curY = 0;
    let startX = 0, startY = 0;
    let lastCpX = 0, lastCpY = 0;
    let lastCmd = '';

    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      if (typeof token === 'string') {
        const cmd = token;
        i++;
        const isRel = cmd === cmd.toLowerCase();
        const upper = cmd.toUpperCase();

        if (upper === 'M') {
          let first = true;
          while (i < tokens.length && typeof tokens[i] === 'number') {
            const numX = tokens[i] as number;
            const numY = tokens[i + 1] as number;
            const x = isRel && !first ? curX + numX : (isRel ? curX + numX : numX);
            const y = isRel && !first ? curY + numY : (isRel ? curY + numY : numY);
            i += 2;
            if (first) {
              curX = x; curY = y;
              startX = x; startY = y;
              updateBounds(x, y);
              first = false;
            } else {
              addSeg(curX, curY, x, y);
              curX = x; curY = y;
            }
          }
          lastCmd = upper;
        } else if (upper === 'L') {
          while (i < tokens.length && typeof tokens[i] === 'number') {
            const numX = tokens[i] as number;
            const numY = tokens[i + 1] as number;
            const x = isRel ? curX + numX : numX;
            const y = isRel ? curY + numY : numY;
            i += 2;
            addSeg(curX, curY, x, y);
            curX = x; curY = y;
          }
          lastCmd = upper;
        } else if (upper === 'H') {
          while (i < tokens.length && typeof tokens[i] === 'number') {
            const numX = tokens[i] as number;
            const x = isRel ? curX + numX : numX;
            i++;
            addSeg(curX, curY, x, curY);
            curX = x;
          }
          lastCmd = upper;
        } else if (upper === 'V') {
          while (i < tokens.length && typeof tokens[i] === 'number') {
            const numY = tokens[i] as number;
            const y = isRel ? curY + numY : numY;
            i++;
            addSeg(curX, curY, curX, y);
            curY = y;
          }
          lastCmd = upper;
        } else if (upper === 'C') {
          while (i < tokens.length && typeof tokens[i] === 'number') {
            const cp1x = isRel ? curX + (tokens[i] as number) : (tokens[i] as number);
            const cp1y = isRel ? curY + (tokens[i + 1] as number) : (tokens[i + 1] as number);
            const cp2x = isRel ? curX + (tokens[i + 2] as number) : (tokens[i + 2] as number);
            const cp2y = isRel ? curY + (tokens[i + 3] as number) : (tokens[i + 3] as number);
            const x = isRel ? curX + (tokens[i + 4] as number) : (tokens[i + 4] as number);
            const y = isRel ? curY + (tokens[i + 5] as number) : (tokens[i + 5] as number);
            i += 6;
            sampleCubicBezier({ x: curX, y: curY }, { x: cp1x, y: cp1y }, { x: cp2x, y: cp2y }, { x, y }, addSeg, 10);
            curX = x; curY = y;
            lastCpX = cp2x; lastCpY = cp2y;
          }
          lastCmd = upper;
        } else if (upper === 'S') {
          while (i < tokens.length && typeof tokens[i] === 'number') {
            let cp1x = curX, cp1y = curY;
            if (lastCmd === 'C' || lastCmd === 'S') {
              cp1x = 2 * curX - lastCpX;
              cp1y = 2 * curY - lastCpY;
            }
            const cp2x = isRel ? curX + (tokens[i] as number) : (tokens[i] as number);
            const cp2y = isRel ? curY + (tokens[i + 1] as number) : (tokens[i + 1] as number);
            const x = isRel ? curX + (tokens[i + 2] as number) : (tokens[i + 2] as number);
            const y = isRel ? curY + (tokens[i + 3] as number) : (tokens[i + 3] as number);
            i += 4;
            sampleCubicBezier({ x: curX, y: curY }, { x: cp1x, y: cp1y }, { x: cp2x, y: cp2y }, { x, y }, addSeg, 10);
            curX = x; curY = y;
            lastCpX = cp2x; lastCpY = cp2y;
          }
          lastCmd = upper;
        } else if (upper === 'Q') {
          while (i < tokens.length && typeof tokens[i] === 'number') {
            const cp1x = isRel ? curX + (tokens[i] as number) : (tokens[i] as number);
            const cp1y = isRel ? curY + (tokens[i + 1] as number) : (tokens[i + 1] as number);
            const x = isRel ? curX + (tokens[i + 2] as number) : (tokens[i + 2] as number);
            const y = isRel ? curY + (tokens[i + 3] as number) : (tokens[i + 3] as number);
            i += 4;
            sampleQuadBezier({ x: curX, y: curY }, { x: cp1x, y: cp1y }, { x, y }, addSeg, 8);
            curX = x; curY = y;
            lastCpX = cp1x; lastCpY = cp1y;
          }
          lastCmd = upper;
        } else if (upper === 'T') {
          while (i < tokens.length && typeof tokens[i] === 'number') {
            let cp1x = curX, cp1y = curY;
            if (lastCmd === 'Q' || lastCmd === 'T') {
              cp1x = 2 * curX - lastCpX;
              cp1y = 2 * curY - lastCpY;
            }
            const x = isRel ? curX + (tokens[i] as number) : (tokens[i] as number);
            const y = isRel ? curY + (tokens[i + 1] as number) : (tokens[i + 1] as number);
            i += 2;
            sampleQuadBezier({ x: curX, y: curY }, { x: cp1x, y: cp1y }, { x, y }, addSeg, 8);
            curX = x; curY = y;
            lastCpX = cp1x; lastCpY = cp1y;
          }
          lastCmd = upper;
        } else if (upper === 'A') {
          while (i < tokens.length && typeof tokens[i] === 'number') {
            const rx = tokens[i] as number;
            const ry = tokens[i + 1] as number;
            const rot = tokens[i + 2] as number;
            const large = !!(tokens[i + 3] as number);
            const sweep = !!(tokens[i + 4] as number);
            const x = isRel ? curX + (tokens[i + 5] as number) : (tokens[i + 5] as number);
            const y = isRel ? curY + (tokens[i + 6] as number) : (tokens[i + 6] as number);
            i += 7;
            sampleArc(curX, curY, rx, ry, rot, large, sweep, x, y, addSeg, 12);
            curX = x; curY = y;
          }
          lastCmd = upper;
        } else if (upper === 'Z') {
          addSeg(curX, curY, startX, startY);
          curX = startX; curY = startY;
          lastCmd = upper;
        }
      } else {
        i++;
      }
    }
  });

  if (minX === Infinity) {
    minX = 0; maxX = 100; minY = 0; maxY = 100;
  }

  const rawW = Math.max(10, maxX - minX);
  const rawH = Math.max(10, maxY - minY);

  const targetW = 250;
  const targetH = 150;
  const scale = Math.min(targetW / rawW, targetH / rawH);
  const tx = 25 + (targetW - rawW * scale) / 2 - minX * scale;
  const ty = 25 + (targetH - rawH * scale) / 2 - minY * scale;

  return { segments, totalCutLen, minX, maxX, minY, maxY, rawW, rawH, scale, tx, ty };
}

export function LiveLaserSimulator() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { profile } = useWorkshop();
  const currency = profile.currency || '$';

  // Presets vs Custom uploaded file
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [customJob, setCustomJob] = useState<CustomJob | null>(null);
  const [customWidthMm, setCustomWidthMm] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0]);
  const [marginMultiplier, setMarginMultiplier] = useState(1.5); // 50% realistic markup

  // Simulation controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [cutProgress, setCutProgress] = useState(0); // 0 to 1
  const [sparks, setSparks] = useState<Spark[]>([]);

  const fileInputRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const progressRef = useRef<number>(0);

  // Active Preset Geometry
  const activePreset = PRESETS[activePresetIndex];
  const activePresetGeometry = getPresetGeometry(activePreset);

  // Unified Active Job
  const activeJob = customJob || {
    fileName: activePreset.name,
    rawPaths: activePresetGeometry.rawPaths,
    segments: activePresetGeometry.segments,
    totalCutLen: activePresetGeometry.totalCutLen,
    scale: 1.0,
    tx: 0,
    ty: 0,
    widthMm: activePreset.widthMm,
    heightMm: activePreset.heightMm,
    totalLengthMm: activePreset.totalLengthMm,
    estTimeSec: activePreset.estTimeSec,
    originalWidthMm: activePreset.widthMm,
    originalHeightMm: activePreset.heightMm,
    originalLengthMm: activePreset.totalLengthMm,
  };

  // Scaling logic
  const origW = activeJob.originalWidthMm;
  const origH = activeJob.originalHeightMm;
  const origLen = activeJob.originalLengthMm;

  const currentScale = customJob && customWidthMm ? customWidthMm / origW : 1.0;
  const widthMm = Math.round(origW * currentScale);
  const heightMm = Math.round(origH * currentScale);
  const totalLengthMm = Math.round(origLen * currentScale);

  // Realistic Workshop Machine Timing
  const cutSpeed = selectedMaterial.cutSpeedMmPerSec || 25;
  const cuttingTimeSec = totalLengthMm / cutSpeed;
  const estTimeSec = Math.max(15, Math.round(cuttingTimeSec * 1.15 + 10));

  // Financial calculations
  const partAreaSqM = Math.max(0.005, (widthMm * heightMm) / 1000000);
  const materialCost = Number((partAreaSqM * selectedMaterial.costPerSqM * 1.25).toFixed(2));
  const machineHourRate = 30; // $30/hour
  const machineRunCost = Number(((estTimeSec / 3600) * machineHourRate).toFixed(2));
  const setupFee = 2.0;
  const baseCost = materialCost + machineRunCost + setupFee;
  const suggestedQuote = Math.max(5, Math.ceil(baseCost * marginMultiplier));

  // Laser Tracking along exact segments
  const segments = activeJob.segments;
  const totalCutLen = activeJob.totalCutLen;
  const targetDist = cutProgress * Math.max(1, totalCutLen);

  let accumulated = 0;
  let activeSegIdx = 0;
  let segFraction = 0;

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (accumulated + s.len >= targetDist || i === segments.length - 1) {
      activeSegIdx = i;
      segFraction = s.len > 0.001 ? Math.min(1, Math.max(0, (targetDist - accumulated) / s.len)) : 1;
      break;
    }
    accumulated += s.len;
  }

  const curSeg = segments[activeSegIdx] || segments[0] || { x1: 150, y1: 100, x2: 150, y2: 100, len: 0 };
  const laserRawX = curSeg.x1 + (curSeg.x2 - curSeg.x1) * segFraction;
  const laserRawY = curSeg.y1 + (curSeg.y2 - curSeg.y1) * segFraction;

  const laserX = activeJob.tx + laserRawX * activeJob.scale;
  const laserY = activeJob.ty + laserRawY * activeJob.scale;

  // Build Cut Path (Glowing Neon Lime) without connecting disconnected contours!
  let cutD = '';
  let lastX = -99999, lastY = -99999;
  const limit = Math.min(activeSegIdx, segments.length - 1);

  for (let i = 0; i <= limit; i++) {
    const s = segments[i];
    const isLast = i === activeSegIdx;
    const ex = isLast ? laserRawX : s.x2;
    const ey = isLast ? laserRawY : s.y2;

    if (Math.abs(s.x1 - lastX) > 0.01 || Math.abs(s.y1 - lastY) > 0.01) {
      cutD += ` M ${s.x1.toFixed(2)} ${s.y1.toFixed(2)}`;
    }
    cutD += ` L ${ex.toFixed(2)} ${ey.toFixed(2)}`;
    lastX = ex;
    lastY = ey;
  }

  // SVG / DXF Parser functions
  const parseSvgContent = (text: string, fileName: string) => {
    try {
      const rawPaths = svgToPaths(text);
      if (rawPaths.length === 0) {
        alert("Could not extract vector lines from this file. Please ensure it contains vector lines.");
        return;
      }

      const geo = parsePathsToSegments(rawPaths);
      if (geo.segments.length === 0) {
        alert("No valid cut segments found in SVG.");
        return;
      }

      // Check explicit SVG width / height attributes with units
      let physicalScale = 1.0;
      const svgTagMatch = text.match(/<svg[^>]*>/i);
      let foundExplicitUnit = false;

      if (svgTagMatch) {
        const svgTag = svgTagMatch[0];
        const wAttr = svgTag.match(/\bwidth=["']([^"']+)["']/i);
        if (wAttr) {
          const valStr = wAttr[1].trim();
          const num = parseFloat(valStr);
          if (!isNaN(num) && num > 0) {
            if (valStr.endsWith('mm')) {
              physicalScale = num / geo.rawW;
              foundExplicitUnit = true;
            } else if (valStr.endsWith('cm')) {
              physicalScale = (num * 10) / geo.rawW;
              foundExplicitUnit = true;
            } else if (valStr.endsWith('in')) {
              physicalScale = (num * 25.4) / geo.rawW;
              foundExplicitUnit = true;
            }
          }
        }
      }

      // Smart auto-detection for 0.1mm CAD units vs 96 DPI
      if (!foundExplicitUnit) {
        if (geo.rawW > 1000) {
          if (geo.rawW / 10 <= 600) {
            physicalScale = 0.1; // 0.1 mm units
          } else {
            physicalScale = 25.4 / 96; // 96 DPI
          }
        } else if (geo.rawW > 500) {
          physicalScale = 25.4 / 96;
        } else {
          physicalScale = 1.0;
        }
      }

      const detectedWidthMm = Math.max(50, Math.round(geo.rawW * physicalScale));
      const detectedHeightMm = Math.max(50, Math.round(geo.rawH * physicalScale));
      const realCutMm = Math.max(150, Math.round(geo.totalCutLen * physicalScale));

      const cutSpeedMmPerSec = selectedMaterial.cutSpeedMmPerSec || 25;
      const cuttingTimeSec = realCutMm / cutSpeedMmPerSec;
      const initialTimeSec = Math.max(15, Math.round(cuttingTimeSec * 1.15 + 10));

      setCustomJob({
        fileName: fileName.replace(/\.[^/.]+$/, ''),
        rawPaths,
        segments: geo.segments,
        totalCutLen: geo.totalCutLen,
        scale: geo.scale,
        tx: geo.tx,
        ty: geo.ty,
        widthMm: detectedWidthMm,
        heightMm: detectedHeightMm,
        totalLengthMm: realCutMm,
        estTimeSec: initialTimeSec,
        originalWidthMm: detectedWidthMm,
        originalHeightMm: detectedHeightMm,
        originalLengthMm: realCutMm,
      });

      setCustomWidthMm(detectedWidthMm);
      handleReset();
    } catch {
      alert("Error parsing vector file. Please try another SVG.");
    }
  };

  const parseDxfContent = (text: string, fileName: string) => {
    try {
      const lines = text.split(/\r?\n/).map(l => l.trim());
      const rawPaths: PathItem[] = [];
      let i = 0;

      while (i < lines.length - 1) {
        const code = lines[i];
        const val = lines[i + 1];
        if (code === '0') {
          const entityType = val.toUpperCase();
          i += 2;
          const entityData: { [k: string]: string[] } = {};
          while (i < lines.length - 1 && lines[i] !== '0') {
            const c = lines[i];
            const v = lines[i + 1];
            if (!entityData[c]) entityData[c] = [];
            entityData[c].push(v);
            i += 2;
          }

          if (entityType === 'LINE') {
            const x1 = parseFloat(entityData['10']?.[0] || '0');
            const y1 = parseFloat(entityData['20']?.[0] || '0');
            const x2 = parseFloat(entityData['11']?.[0] || '0');
            const y2 = parseFloat(entityData['21']?.[0] || '0');
            if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
              rawPaths.push({ d: `M ${x1} ${y1} L ${x2} ${y2}`, stroke: '#FF4444' });
            }
          } else if (entityType === 'CIRCLE') {
            const cx = parseFloat(entityData['10']?.[0] || '0');
            const cy = parseFloat(entityData['20']?.[0] || '0');
            const r = parseFloat(entityData['40']?.[0] || '0');
            if (r > 0) {
              rawPaths.push({
                d: `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`,
                stroke: '#FF4444',
              });
            }
          } else if (entityType === 'ARC') {
            const cx = parseFloat(entityData['10']?.[0] || '0');
            const cy = parseFloat(entityData['20']?.[0] || '0');
            const r = parseFloat(entityData['40']?.[0] || '0');
            const sa = (parseFloat(entityData['50']?.[0] || '0') * Math.PI) / 180;
            const ea = (parseFloat(entityData['51']?.[0] || '0') * Math.PI) / 180;
            if (r > 0) {
              const x1 = cx + r * Math.cos(sa);
              const y1 = cy + r * Math.sin(sa);
              const x2 = cx + r * Math.cos(ea);
              const y2 = cy + r * Math.sin(ea);
              let diff = ea - sa;
              if (diff < 0) diff += 2 * Math.PI;
              const large = diff > Math.PI ? 1 : 0;
              rawPaths.push({
                d: `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
                stroke: '#FF4444',
              });
            }
          } else if (entityType === 'LWPOLYLINE') {
            const xs = (entityData['10'] || []).map(Number);
            const ys = (entityData['20'] || []).map(Number);
            const isClosed = (parseInt(entityData['70']?.[0] || '0', 10) & 1) === 1;
            if (xs.length > 0 && xs.length === ys.length) {
              let d = `M ${xs[0]} ${ys[0]}`;
              for (let k = 1; k < xs.length; k++) {
                d += ` L ${xs[k]} ${ys[k]}`;
              }
              if (isClosed) d += ' Z';
              rawPaths.push({ d, stroke: '#FF4444' });
            }
          }
        } else {
          i += 2;
        }
      }

      if (rawPaths.length === 0) {
        alert("DXF file contains no supported 2D vector entities.");
        return;
      }

      const geo = parsePathsToSegments(rawPaths);
      let physicalScale = 1.0;
      if (geo.rawW > 1000) {
        physicalScale = geo.rawW / 10 <= 600 ? 0.1 : 25.4 / 96;
      }

      const detectedWidthMm = Math.max(50, Math.round(geo.rawW * physicalScale));
      const detectedHeightMm = Math.max(50, Math.round(geo.rawH * physicalScale));
      const realCutMm = Math.max(150, Math.round(geo.totalCutLen * physicalScale));

      const cutSpeedMmPerSec = selectedMaterial.cutSpeedMmPerSec || 25;
      const initialTimeSec = Math.max(15, Math.round((realCutMm / cutSpeedMmPerSec) * 1.15 + 10));

      setCustomJob({
        fileName: fileName.replace(/\.[^/.]+$/, ''),
        rawPaths,
        segments: geo.segments,
        totalCutLen: geo.totalCutLen,
        scale: geo.scale,
        tx: geo.tx,
        ty: geo.ty,
        widthMm: detectedWidthMm,
        heightMm: detectedHeightMm,
        totalLengthMm: realCutMm,
        estTimeSec: initialTimeSec,
        originalWidthMm: detectedWidthMm,
        originalHeightMm: detectedHeightMm,
        originalLengthMm: realCutMm,
      });

      setCustomWidthMm(detectedWidthMm);
      handleReset();
    } catch {
      alert("Error parsing DXF file.");
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (file.name.toLowerCase().endsWith('.dxf')) {
        parseDxfContent(content, file.name);
      } else {
        parseSvgContent(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  // WhatsApp Quote Sender
  const sendWhatsAppQuote = () => {
    const jobName = customJob ? customJob.fileName : activePreset.name;
    const timeStr = `${Math.floor(estTimeSec / 60)}m ${estTimeSec % 60}s`;
    const dimCmStr = `${(widthMm / 10).toFixed(1).replace('.0', '')}cm × ${(heightMm / 10).toFixed(1).replace('.0', '')}cm`;
    const cutLengthM = (totalLengthMm / 1000).toFixed(2);

    let text = `*QUOTATION — ${profile.workshopName || '0MACHINE WORKSHOP'}*\n\n`;
    text += `Hello! Here is the quote for cutting your file:\n\n`;
    text += `📁 *Project:* ${jobName}\n`;
    text += `📐 *Dimensions:* ${dimCmStr}\n`;
    text += `🪵 *Material:* ${selectedMaterial.name}\n`;
    text += `📏 *Cut Length:* ${cutLengthM}m\n`;
    text += `⏱ *Est. Machine Runtime:* ${timeStr}\n`;
    text += `💰 *Total Price:* *${currency}${suggestedQuote}*\n\n`;
    text += `Status: Ready for production. Please confirm to start!\n`;
    text += `_Generated via 0Machine Instant Analyzer_`;

    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/?text=${encoded}`;

    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  // Animation Loop: 60fps laser simulation with sparks
  useEffect(() => {
    const loop = () => {
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying) {
        const step = (dt / 10) * speedMultiplier;
        progressRef.current = (progressRef.current + step) % 1;
        setCutProgress(progressRef.current);

        // Spawn dynamic sparks
        const newSparks: Spark[] = [];
        const sparkCount = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < sparkCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 45 + 20;
          newSparks.push({
            id: Math.random(),
            x: laserX,
            y: laserY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed + 15,
            life: 0,
            maxLife: Math.random() * 0.35 + 0.15,
            color: Math.random() > 0.4 ? '#B1FA63' : '#FE7733',
          });
        }

        setSparks(prev => {
          return [...prev, ...newSparks]
            .map(s => ({
              ...s,
              x: s.x + s.vx * dt,
              y: s.y + s.vy * dt,
              life: s.life + dt,
            }))
            .filter(s => s.life < s.maxLife)
            .slice(-35);
        });
      } else {
        setSparks(prev => prev.filter(s => s.life < s.maxLife));
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = Date.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speedMultiplier, laserX, laserY]);

  const handleReset = () => {
    progressRef.current = 0;
    setCutProgress(0);
    setSparks([]);
  };

  return (
    <View style={styles.card}>
      {/* Hidden File Input for Web */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          accept=".svg,.dxf"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
      )}

      {/* Header telemetry row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.statusPulseWrap}>
            <View style={[styles.statusPulse, { backgroundColor: isPlaying ? '#B1FA63' : '#F59E0B' }]} />
            <Text style={styles.simulatorTag}>
              {customJob ? `CUSTOM FILE ANALYZER: ${customJob.fileName}` : 'INSTANT LASER ANALYZER'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={styles.simulatorTitle}>Virtual Honeycomb Bed & Drop Zone</Text>
            {!isDesktop && (
              <View style={styles.mobilePcHint}>
                <Monitor size={11} color="#B1FA63" strokeWidth={2.2} />
                <Text style={styles.mobilePcHintText}>PC Drop Zone</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Pills / Presets */}
        <View style={styles.headerRightActions}>
          {customJob ? (
            <TouchableOpacity
              onPress={() => {
                setCustomJob(null);
                setCustomWidthMm(null);
                handleReset();
              }}
              style={styles.clearFileBtn}
            >
              <RefreshCw size={13} color="#FE7733" />
              <Text style={styles.clearFileText}>Clear File</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.presetPills}>
              {PRESETS.map((p, idx) => {
                const isActive = idx === activePresetIndex;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      setActivePresetIndex(idx);
                      handleReset();
                    }}
                    style={[styles.presetPill, isActive && styles.presetPillActive]}
                  >
                    <Text style={[styles.presetPillText, isActive && styles.presetPillTextActive]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Upload Button */}
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === 'web' && fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            style={styles.uploadBtn}
            activeOpacity={0.8}
          >
            <UploadCloud size={15} color="#111317" />
            <Text style={styles.uploadBtnText}>Upload SVG / DXF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Simulation Viewport & Telemetry Panel */}
      <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
        {/* Honeycomb Canvas with Drag & Drop Listener */}
        <View 
          style={[styles.bedContainer, isDragging && styles.bedContainerDragging]}
          // @ts-ignore - HTML5 Drag & Drop on web
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          // @ts-ignore
          onDragLeave={() => setIsDragging(false)}
          // @ts-ignore
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer?.files?.[0];
            if (file) handleFileUpload(file);
          }}
        >
          <Svg viewBox="0 0 300 200" style={styles.svgCanvas}>
            <Defs>
              <RadialGradient id="laserGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#B1FA63" stopOpacity="0.95" />
                <Stop offset="40%" stopColor="#FE7733" stopOpacity="0.5" />
                <Stop offset="100%" stopColor="#111317" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Bed Background */}
            <Rect x="0" y="0" width="300" height="200" fill="#0C0E12" rx="12" />

            {/* Honeycomb Grid Coordinates */}
            {Array.from({ length: 9 }).map((_, i) => (
              <Line
                key={`h-${i}`}
                x1="0"
                y1={i * 25}
                x2="300"
                y2={i * 25}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
              />
            ))}
            {Array.from({ length: 13 }).map((_, i) => (
              <Line
                key={`v-${i}`}
                x1={i * 25}
                y1="0"
                x2={i * 25}
                y2="200"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
              />
            ))}

            {/* Exact Vector Graphics Rendering with Transform */}
            <G transform={`translate(${activeJob.tx}, ${activeJob.ty}) scale(${activeJob.scale})`}>
              {/* Blueprint Outline (All original paths rendered faithfully with original colors: Red for Cut, Blue for Engrave) */}
              {activeJob.rawPaths.map((p, idx) => (
                <Path
                  key={`bp-${idx}`}
                  d={p.d}
                  fill="none"
                  stroke={p.stroke || 'rgba(255, 255, 255, 0.22)'}
                  strokeWidth={1.2 / activeJob.scale}
                />
              ))}

              {/* Laser Cut Path (Glowing Neon Lime along exact contours) */}
              {cutD ? (
                <Path
                  d={cutD}
                  fill="none"
                  stroke="#B1FA63"
                  strokeWidth={2.4 / activeJob.scale}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </G>

            {/* Laser Nozzle Outer Glow */}
            <Circle
              cx={laserX}
              cy={laserY}
              r="14"
              fill="url(#laserGlow)"
            />

            {/* Laser Guide Ring */}
            <Circle
              cx={laserX}
              cy={laserY}
              r="7"
              fill="none"
              stroke="#FE7733"
              strokeWidth="1.2"
              strokeDasharray="2,2"
            />

            {/* Superheated Center Spark Dot */}
            <Circle
              cx={laserX}
              cy={laserY}
              r="2.5"
              fill="#FFFFFF"
            />

            {/* Dynamic Sparks */}
            {sparks.map(s => (
              <Circle
                key={s.id}
                cx={s.x}
                cy={s.y}
                r={1.6 * (1 - s.life / s.maxLife)}
                fill={s.color}
                opacity={1 - s.life / s.maxLife}
              />
            ))}
          </Svg>

          {/* Quick HUD overlay in corner of bed */}
          <View style={styles.bedHud}>
            <Text style={styles.bedHudText}>
              {customJob ? `DIMENSIONS: ${(widthMm / 10).toFixed(1).replace('.0', '')} × ${(heightMm / 10).toFixed(1).replace('.0', '')} CM` : 'BED: 1300 × 900 MM'}
            </Text>
            <Text style={[styles.bedHudText, { color: '#B1FA63' }]}>
              {customJob ? `LINEAR DIST: ${(totalLengthMm / 1000).toFixed(2)}M` : 'AIR ASSIST: ON (2.4 BAR)'}
            </Text>
          </View>

          {/* Drag Overlay Hint */}
          {isDragging && (
            <View style={styles.dragOverlay}>
              <UploadCloud size={36} color="#B1FA63" />
              <Text style={styles.dragOverlayText}>Drop SVG / DXF file to analyze</Text>
            </View>
          )}
        </View>

        {/* Real-time Telemetry & Instant Job Costing Panel */}
        <View style={styles.telemetryPanel}>
          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.telemetryLabel}>CUT SIMULATION</Text>
              <Text style={styles.progressPercent}>{Math.round(cutProgress * 100)}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${cutProgress * 100}%` }]} />
            </View>
          </View>

          {/* Real-Time Spec Grid */}
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryBox}>
              <Text style={styles.telemetryBoxLabel}>MACHINE TIME</Text>
              <Text style={[styles.telemetryBoxVal, { color: '#B1FA63' }]}>
                {Math.floor(estTimeSec / 60)}m {estTimeSec % 60}s
              </Text>
            </View>
            <View style={styles.telemetryBox}>
              <Text style={styles.telemetryBoxLabel}>MATERIAL COST</Text>
              <Text style={styles.telemetryBoxVal}>{currency}{materialCost}</Text>
            </View>
            <View style={styles.telemetryBox}>
              <Text style={styles.telemetryBoxLabel}>CUT LENGTH</Text>
              <Text style={styles.telemetryBoxVal}>{(totalLengthMm / 1000).toFixed(2)}m</Text>
            </View>
            <View style={styles.telemetryBox}>
              <Text style={styles.telemetryBoxLabel}>RECOMMENDED QUOTE</Text>
              <Text style={[styles.telemetryBoxVal, { color: '#B1FA63', fontSize: 16 }]}>
                {currency}{suggestedQuote}
              </Text>
            </View>
          </View>

          {/* Part Dimensions & Scaler */}
          <View style={styles.sizeSection}>
            <View style={styles.sizeHeaderRow}>
              <Text style={styles.sizeSectionLabel}>PART SIZE</Text>
              <Text style={styles.dimensionValue}>
                {(widthMm / 10).toFixed(1).replace('.0', '')}cm × {(heightMm / 10).toFixed(1).replace('.0', '')}cm
              </Text>
            </View>
            <View style={styles.sizePresetsRow}>
              {customJob && (
                <TouchableOpacity
                  onPress={() => setCustomWidthMm(customJob.originalWidthMm)}
                  style={[styles.sizePill, (!customWidthMm || customWidthMm === customJob.originalWidthMm) && styles.sizePillActive]}
                >
                  <Text style={[styles.sizePillText, (!customWidthMm || customWidthMm === customJob.originalWidthMm) && styles.sizePillActiveText]}>
                    Auto ({(customJob.originalWidthMm / 10).toFixed(1).replace('.0', '')}cm)
                  </Text>
                </TouchableOpacity>
              )}
              {[150, 200, 300, 400].map(targetMm => {
                const isActive = customWidthMm === targetMm;
                return (
                  <TouchableOpacity
                    key={targetMm}
                    onPress={() => setCustomWidthMm(targetMm)}
                    style={[styles.sizePill, isActive && styles.sizePillActive]}
                  >
                    <Text style={[styles.sizePillText, isActive && styles.sizePillActiveText]}>
                      {targetMm / 10}cm
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <View style={styles.stepperWrap}>
                <TouchableOpacity
                  onPress={() => setCustomWidthMm(Math.max(50, widthMm - 20))}
                  style={styles.stepperBtn}
                  accessibilityLabel="Decrease width"
                >
                  <Minus size={11} color="#8B95A8" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCustomWidthMm(Math.min(1200, widthMm + 20))}
                  style={styles.stepperBtn}
                  accessibilityLabel="Increase width"
                >
                  <Plus size={11} color="#8B95A8" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Material Selector Row */}
          <View style={styles.materialSelectRow}>
            <Text style={styles.materialSelectLabel}>Material:</Text>
            <View style={styles.materialPills}>
              {MATERIALS.map(m => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setSelectedMaterial(m)}
                  style={[styles.matPill, selectedMaterial.id === m.id && styles.matPillActive]}
                >
                  <Text style={[styles.matPillText, selectedMaterial.id === m.id && styles.matPillTextActive]}>
                    {m.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Row: Playback + WhatsApp Quote Button */}
          <View style={styles.bottomActionsRow}>
            <View style={styles.playbackBtns}>
              <TouchableOpacity
                onPress={() => setIsPlaying(!isPlaying)}
                style={[styles.actionBtn, isPlaying && styles.actionBtnActive]}
                accessibilityLabel={isPlaying ? "Pause simulation" : "Start simulation"}
              >
                {isPlaying ? <Pause size={14} color="#111317" /> : <Play size={14} color="#FFFFFF" />}
                <Text style={[styles.actionBtnText, isPlaying && styles.actionBtnTextActive]}>
                  {isPlaying ? 'Pause' : 'Simulate'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReset}
                style={styles.iconActionBtn}
                accessibilityLabel="Reset cut"
              >
                <RotateCcw size={14} color="#8B95A8" />
              </TouchableOpacity>
            </View>

            {/* Send Quote via WhatsApp Button */}
            <TouchableOpacity
              onPress={sendWhatsAppQuote}
              style={styles.whatsAppQuoteBtn}
              activeOpacity={0.8}
            >
              <MessageCircle size={15} color="#FFFFFF" />
              <Text style={styles.whatsAppQuoteBtnText}>Send Quote</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16191E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      } as any,
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  titleWrap: {
    gap: 4,
  },
  statusPulseWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  simulatorTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8B95A8',
    letterSpacing: 1.2,
  },
  simulatorTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  mobilePcHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(177, 250, 99, 0.1)',
    borderColor: 'rgba(177, 250, 99, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mobilePcHintText: {
    color: '#B1FA63',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  presetPills: {
    flexDirection: 'row',
    gap: 6,
  },
  presetPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetPillActive: {
    backgroundColor: 'rgba(177, 250, 99, 0.12)',
    borderColor: 'rgba(177, 250, 99, 0.35)',
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B95A8',
  },
  presetPillTextActive: {
    color: '#B1FA63',
    fontWeight: '700',
  },
  clearFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(254, 119, 51, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(254, 119, 51, 0.35)',
  },
  clearFileText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FE7733',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#B1FA63',
  },
  uploadBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111317',
  },
  mainLayout: {
    gap: 16,
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  bedContainer: {
    flex: 1,
    minHeight: 220,
    backgroundColor: '#0C0E12',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bedContainerDragging: {
    borderColor: '#B1FA63',
    backgroundColor: 'rgba(177, 250, 99, 0.05)',
  },
  svgCanvas: {
    width: '100%',
    height: 220,
  },
  bedHud: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  bedHudText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.8,
  },
  dragOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 19, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  dragOverlayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  telemetryPanel: {
    flex: 1,
    backgroundColor: '#121418',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14,
    justifyContent: 'space-between',
    gap: 12,
  },
  progressSection: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8B95A8',
    letterSpacing: 1,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B1FA63',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#B1FA63',
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  telemetryBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  telemetryBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8B95A8',
    marginBottom: 2,
  },
  telemetryBoxVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sizeSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  sizeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sizeSectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8B95A8',
    letterSpacing: 0.8,
  },
  dimensionValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B1FA63',
  },
  sizePresetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  sizePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sizePillActive: {
    backgroundColor: 'rgba(177, 250, 99, 0.15)',
    borderColor: 'rgba(177, 250, 99, 0.35)',
  },
  sizePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B95A8',
  },
  sizePillActiveText: {
    color: '#B1FA63',
    fontWeight: '700',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  stepperBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  materialSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  materialSelectLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B95A8',
  },
  materialPills: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  matPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  matPillActive: {
    backgroundColor: 'rgba(177, 250, 99, 0.15)',
    borderColor: 'rgba(177, 250, 99, 0.35)',
  },
  matPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B95A8',
  },
  matPillTextActive: {
    color: '#B1FA63',
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 4,
  },
  playbackBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1E2228',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBtnActive: {
    backgroundColor: '#B1FA63',
    borderColor: '#B1FA63',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnTextActive: {
    color: '#111317',
  },
  iconActionBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  whatsAppQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#25D366',
  },
  whatsAppQuoteBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
