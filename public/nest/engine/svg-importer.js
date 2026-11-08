/**
 * 0machine SvgImporter Engine
 * Industrial-grade SVG parsing, sanitization, unit conversion (mm),
 * bezier/arc curve sampling, transform flattening, topological hole detection,
 * and multi-part decomposition.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.SvgImporter = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const DEFAULT_DPI = 96;
    const MM_PER_INCH = 25.4;
    const MM_PER_PX = MM_PER_INCH / DEFAULT_DPI; // ~0.26458333

    function pxToMm(px, dpi = DEFAULT_DPI) {
        return (px * MM_PER_INCH) / dpi;
    }

    function inchesToMm(inches) {
        return inches * MM_PER_INCH;
    }

    function cmToMm(cm) {
        return cm * 10;
    }

    function ptToMm(pt) {
        return (pt * MM_PER_INCH) / 72;
    }

    function pcToMm(pc) {
        return (pc * MM_PER_INCH) / 6;
    }

    function parseSvgLengthToMm(val, defaultValue = 0) {
        if (!val || typeof val !== 'string') return defaultValue;
        const str = val.trim();
        if (!str) return defaultValue;

        const match = str.match(/^([+-]?\d*(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*(mm|cm|in|px|pt|pc|%)?$/);
        if (!match) {
            const num = parseFloat(str);
            return isNaN(num) ? defaultValue : num * MM_PER_PX;
        }

        const num = parseFloat(match[1]);
        if (isNaN(num)) return defaultValue;
        const unit = match[2] ? match[2].toLowerCase() : 'px';

        switch (unit) {
            case 'mm': return num;
            case 'cm': return cmToMm(num);
            case 'in': return inchesToMm(num);
            case 'pt': return ptToMm(num);
            case 'pc': return pcToMm(num);
            case 'px':
            default:
                return pxToMm(num);
        }
    }

    function sanitizeSvgText(rawSvg) {
        if (!rawSvg || typeof rawSvg !== 'string') return '';
        return rawSvg
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<!ENTITY[^>]*>/gi, '')
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
            .replace(/\s+(?:href|xlink:href)\s*=\s*["']?\s*javascript:[^"'>]*["']?/gi, '');
    }

    function sanitizeSvgElement(element) {
        if (!element || !element.tagName) return false;
        const tagName = element.tagName.toLowerCase();
        const dangerous = new Set([
            'script', 'style', 'foreignobject', 'iframe', 'embed',
            'object', 'audio', 'video', 'form', 'input', 'button', 'meta', 'link'
        ]);

        if (dangerous.has(tagName)) {
            element.parentNode && element.parentNode.removeChild(element);
            return false;
        }

        if (element.attributes) {
            const attrs = Array.from(element.attributes);
            for (const attr of attrs) {
                const name = attr.name.toLowerCase();
                const val = attr.value.toLowerCase().trim();
                if (name.startsWith('on') || val.startsWith('javascript:')) {
                    element.removeAttribute(attr.name);
                }
            }
        }

        const childNodes = element.childNodes ? Array.from(element.childNodes) : [];
        for (let i = childNodes.length - 1; i >= 0; i--) {
            const child = childNodes[i];
            if (child && child.nodeType === 1) {
                sanitizeSvgElement(child);
            }
        }
        return true;
    }

    function identityMatrix() {
        return [1, 0, 0, 1, 0, 0];
    }

    function multiplyMatrix(m1, m2) {
        return [
            m1[0] * m2[0] + m1[2] * m2[1],
            m1[1] * m2[0] + m1[3] * m2[1],
            m1[0] * m2[2] + m1[2] * m2[3],
            m1[1] * m2[2] + m1[3] * m2[3],
            m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
            m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
        ];
    }

    function applyMatrixToPoint(p, m) {
        return {
            x: m[0] * p.x + m[2] * p.y + m[4],
            y: m[1] * p.x + m[3] * p.y + m[5],
        };
    }

    function parseTransformAttribute(transformStr) {
        if (!transformStr) return identityMatrix();
        let matrix = identityMatrix();
        const regex = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]+)\)/gi;
        let match;
        while ((match = regex.exec(transformStr)) !== null) {
            const type = match[1].toLowerCase();
            const args = match[2].trim().split(/[\s,]+/).map(parseFloat).filter(v => !isNaN(v));
            let m = identityMatrix();

            if (type === 'matrix' && args.length >= 6) {
                m = [args[0], args[1], args[2], args[3], args[4], args[5]];
            } else if (type === 'translate') {
                const tx = args[0] || 0;
                const ty = args.length > 1 ? args[1] : 0;
                m = [1, 0, 0, 1, tx, ty];
            } else if (type === 'scale') {
                const sx = args[0] || 1;
                const sy = args.length > 1 ? args[1] : sx;
                m = [sx, 0, 0, sy, 0, 0];
            } else if (type === 'rotate') {
                const angleDeg = args[0] || 0;
                const rad = (angleDeg * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                if (args.length >= 3) {
                    const cx = args[1], cy = args[2];
                    m = [cos, sin, -sin, cos, cx - cx * cos + cy * sin, cy - cx * sin - cy * cos];
                } else {
                    m = [cos, sin, -sin, cos, 0, 0];
                }
            }
            matrix = multiplyMatrix(matrix, m);
        }
        return matrix;
    }

    function computeBounds(points) {
        if (!points || points.length === 0) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
        }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < points.length; i++) {
            const pt = points[i];
            if (pt.x < minX) minX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y > maxY) maxY = pt.y;
        }
        return { minX, minY, maxX, maxY, width: Math.max(0, maxX - minX), height: Math.max(0, maxY - minY) };
    }

    function computeContourArea(points) {
        if (!points || points.length < 3) return 0;
        let area = 0;
        const n = points.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        return area / 2;
    }

    function computeGeometryArea(contours, holes) {
        let outerArea = 0;
        for (const c of contours) {
            outerArea += Math.abs(computeContourArea(c));
        }
        let holeArea = 0;
        for (const h of holes) {
            holeArea += Math.abs(computeContourArea(h));
        }
        return Math.max(0, outerArea - holeArea);
    }

    function isPointInPolygon(point, polygon) {
        if (!polygon || polygon.length < 3) return false;
        let inside = false;
        const x = point.x, y = point.y;
        const n = polygon.length;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    function distancePointToSegment(p, a, b) {
        let x = a.x, y = a.y, dx = b.x - x, dy = b.y - y;
        const l2 = dx * dx + dy * dy;
        if (l2 === 0) return Math.hypot(p.x - x, p.y - y);
        let t = ((p.x - x) * dx + (p.y - y) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (x + t * dx), p.y - (y + t * dy));
    }

    function doSegmentsIntersect(p1, p2, p3, p4) {
        function ccw(a, b, c) {
            return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
        }
        return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
    }

    function doPolygonsIntersect(polyA, polyB) {
        if (!polyA || !polyB || polyA.length < 3 || polyB.length < 3) return false;
        // 1. Edge-edge intersection
        for (let i = 0; i < polyA.length; i++) {
            const nextI = (i + 1) % polyA.length;
            for (let j = 0; j < polyB.length; j++) {
                const nextJ = (j + 1) % polyB.length;
                if (doSegmentsIntersect(polyA[i], polyA[nextI], polyB[j], polyB[nextJ])) {
                    return true;
                }
            }
        }
        // 2. Vertex containment
        if (isPointInPolygon(polyA[0], polyB) || isPointInPolygon(polyB[0], polyA)) {
            return true;
        }
        return false;
    }

    function minDistanceBetweenPolygons(polyA, polyB) {
        if (!polyA || !polyB || polyA.length < 3 || polyB.length < 3) return Infinity;
        if (doPolygonsIntersect(polyA, polyB)) return 0;
        let minDist = Infinity;
        for (let i = 0; i < polyA.length; i++) {
            for (let j = 0; j < polyB.length; j++) {
                const nextJ = (j + 1) % polyB.length;
                const d = distancePointToSegment(polyA[i], polyB[j], polyB[nextJ]);
                if (d < minDist) {
                    minDist = d;
                    if (minDist <= 1e-4) return 0;
                }
            }
        }
        for (let i = 0; i < polyB.length; i++) {
            for (let j = 0; j < polyA.length; j++) {
                const nextJ = (j + 1) % polyA.length;
                const d = distancePointToSegment(polyB[i], polyA[j], polyA[nextJ]);
                if (d < minDist) {
                    minDist = d;
                    if (minDist <= 1e-4) return 0;
                }
            }
        }
        return minDist;
    }

    function simplifyContour(points, tolerance = 0.05) {
        if (points.length <= 3) return points;
        const sqTolerance = tolerance * tolerance;

        function getSqDist(p1, p2) {
            const dx = p1.x - p2.x, dy = p1.y - p2.y;
            return dx * dx + dy * dy;
        }

        function getSqSegDist(p, p1, p2) {
            let x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;
            if (dx !== 0 || dy !== 0) {
                const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
                if (t > 1) {
                    x = p2.x; y = p2.y;
                } else if (t > 0) {
                    x += dx * t; y += dy * t;
                }
            }
            dx = p.x - x; dy = p.y - y;
            return dx * dx + dy * dy;
        }

        function simplifyDPStep(pts, first, last, sqTol, simplified) {
            let maxSqDist = sqTol, index = -1;
            for (let i = first + 1; i < last; i++) {
                const sqDist = getSqSegDist(pts[i], pts[first], pts[last]);
                if (sqDist > maxSqDist) {
                    index = i; maxSqDist = sqDist;
                }
            }
            if (maxSqDist > sqTol && index !== -1) {
                if (index - first > 1) simplifyDPStep(pts, first, index, sqTol, simplified);
                simplified.push(pts[index]);
                if (last - index > 1) simplifyDPStep(pts, index, last, sqTol, simplified);
            }
        }

        const simplified = [points[0]];
        simplifyDPStep(points, 0, points.length - 1, sqTolerance, simplified);
        simplified.push(points[points.length - 1]);
        return simplified;
    }

    function sampleCubicBezier(p0, p1, p2, p3, steps = 16) {
        const points = [];
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const mt3 = mt2 * mt;
            const t2 = t * t;
            const t3 = t2 * t;
            points.push({
                x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
                y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
            });
        }
        return points;
    }

    function sampleQuadraticBezier(p0, p1, p2, steps = 12) {
        const points = [];
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const mt = 1 - t;
            points.push({
                x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
                y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
            });
        }
        return points;
    }

    function sampleSvgArc(p0, rx, ry, xAxisRotationDeg, largeArcFlag, sweepFlag, p1, steps = 16) {
        if (p0.x === p1.x && p0.y === p1.y) return [];
        if (rx === 0 || ry === 0) return [{ ...p1 }];
        rx = Math.abs(rx); ry = Math.abs(ry);
        const phi = (xAxisRotationDeg * Math.PI) / 180;
        const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);

        const dx2 = (p0.x - p1.x) / 2.0;
        const dy2 = (p0.y - p1.y) / 2.0;
        const x1p = cosPhi * dx2 + sinPhi * dy2;
        const y1p = -sinPhi * dx2 + cosPhi * dy2;

        const prx = rx * rx, pry = ry * ry;
        const px1 = x1p * x1p, py1 = y1p * y1p;
        const radiiCheck = px1 / prx + py1 / pry;
        if (radiiCheck > 1) {
            rx *= Math.sqrt(radiiCheck);
            ry *= Math.sqrt(radiiCheck);
        }

        const sign = largeArcFlag === sweepFlag ? -1 : 1;
        const sq = Math.max(0, (rx * rx * (ry * ry) - rx * rx * py1 - ry * ry * px1) / (rx * rx * py1 + ry * ry * px1));
        const coef = sign * Math.sqrt(sq);
        const cxp = coef * ((rx * y1p) / ry);
        const cyp = coef * (-(ry * x1p) / rx);

        const cx = cosPhi * cxp - sinPhi * cyp + (p0.x + p1.x) / 2.0;
        const cy = sinPhi * cxp + cosPhi * cyp + (p0.y + p1.y) / 2.0;

        function angle(ux, uy, vx, vy) {
            const dot = ux * vx + uy * vy;
            const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
            let ang = Math.acos(Math.max(-1, Math.min(1, dot / (len || 1e-12))));
            if (ux * vy - uy * vx < 0) ang = -ang;
            return ang;
        }

        const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
        let deltaTheta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
        if (!sweepFlag && deltaTheta > 0) deltaTheta -= 2 * Math.PI;
        else if (sweepFlag && deltaTheta < 0) deltaTheta += 2 * Math.PI;

        const points = [];
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const ang = theta1 + t * deltaTheta;
            const x = rx * Math.cos(ang);
            const y = ry * Math.sin(ang);
            points.push({
                x: cosPhi * x - sinPhi * y + cx,
                y: sinPhi * x + cosPhi * y + cy,
            });
        }
        return points;
    }

    function sampleCircle(cx, cy, r, steps = 32) {
        const points = [];
        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * 2 * Math.PI;
            points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
        }
        points.push({ ...points[0] });
        return points;
    }

    function sampleEllipse(cx, cy, rx, ry, steps = 32) {
        const points = [];
        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * 2 * Math.PI;
            points.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
        }
        points.push({ ...points[0] });
        return points;
    }

    function tokenizePath(d) {
        const commands = [];
        if (!d) return commands;
        const regex = /([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d+\.\d+|\.\d+|\d+)(?:[eE][-+]?\d+)?)/g;
        let currentCmd = null, currentArgs = [];
        let match;
        while ((match = regex.exec(d)) !== null) {
            if (match[1]) {
                if (currentCmd) commands.push({ type: currentCmd, args: currentArgs });
                currentCmd = match[1];
                currentArgs = [];
            } else if (match[2]) {
                currentArgs.push(parseFloat(match[2]));
            }
        }
        if (currentCmd) commands.push({ type: currentCmd, args: currentArgs });
        return commands;
    }

    function parseSvgPathToContours(d) {
        const commands = tokenizePath(d);
        if (commands.length === 0) return [];
        const subPaths = [];
        let currentPolyline = [];
        let currentPoint = { x: 0, y: 0 };
        let startPoint = { x: 0, y: 0 };
        let lastCubicControl = null;
        let lastQuadControl = null;

        for (let idx = 0; idx < commands.length; idx++) {
            const cmd = commands[idx];
            const type = cmd.type;
            const args = cmd.args;
            const isRel = type === type.toLowerCase();
            const upperType = type.toUpperCase();

            let i = 0;
            while (i < args.length || upperType === 'Z') {
                if (upperType === 'Z') {
                    if (currentPolyline.length > 0) {
                        if (Math.hypot(currentPoint.x - startPoint.x, currentPoint.y - startPoint.y) > 1e-5) {
                            currentPolyline.push({ ...startPoint });
                        }
                    }
                    currentPoint = { ...startPoint };
                    lastCubicControl = null;
                    lastQuadControl = null;
                    break;
                }

                switch (upperType) {
                    case 'M': {
                        if (args.length < i + 2) { i = args.length; break; }
                        const x = isRel ? currentPoint.x + args[i] : args[i];
                        const y = isRel ? currentPoint.y + args[i + 1] : args[i + 1];
                        i += 2;
                        if (currentPolyline.length > 1) subPaths.push(currentPolyline);
                        currentPolyline = [{ x, y }];
                        currentPoint = { x, y };
                        startPoint = { x, y };
                        lastCubicControl = null;
                        lastQuadControl = null;
                        break;
                    }
                    case 'L': {
                        if (args.length < i + 2) { i = args.length; break; }
                        const x = isRel ? currentPoint.x + args[i] : args[i];
                        const y = isRel ? currentPoint.y + args[i + 1] : args[i + 1];
                        i += 2;
                        currentPoint = { x, y };
                        currentPolyline.push({ x, y });
                        lastCubicControl = null;
                        lastQuadControl = null;
                        break;
                    }
                    case 'H': {
                        if (args.length < i + 1) { i = args.length; break; }
                        const x = isRel ? currentPoint.x + args[i] : args[i];
                        i += 1;
                        currentPoint = { x, y: currentPoint.y };
                        currentPolyline.push({ ...currentPoint });
                        lastCubicControl = null;
                        lastQuadControl = null;
                        break;
                    }
                    case 'V': {
                        if (args.length < i + 1) { i = args.length; break; }
                        const y = isRel ? currentPoint.y + args[i] : args[i];
                        i += 1;
                        currentPoint = { x: currentPoint.x, y };
                        currentPolyline.push({ ...currentPoint });
                        lastCubicControl = null;
                        lastQuadControl = null;
                        break;
                    }
                    case 'C': {
                        if (args.length < i + 6) { i = args.length; break; }
                        const cp1 = { x: isRel ? currentPoint.x + args[i] : args[i], y: isRel ? currentPoint.y + args[i + 1] : args[i + 1] };
                        const cp2 = { x: isRel ? currentPoint.x + args[i + 2] : args[i + 2], y: isRel ? currentPoint.y + args[i + 3] : args[i + 3] };
                        const endP = { x: isRel ? currentPoint.x + args[i + 4] : args[i + 4], y: isRel ? currentPoint.y + args[i + 5] : args[i + 5] };
                        i += 6;
                        const pts = sampleCubicBezier(currentPoint, cp1, cp2, endP, 16);
                        pts.forEach(p => currentPolyline.push(p));
                        currentPoint = { ...endP };
                        lastCubicControl = { ...cp2 };
                        lastQuadControl = null;
                        break;
                    }
                    case 'S': {
                        if (args.length < i + 4) { i = args.length; break; }
                        let cp1;
                        if (lastCubicControl) {
                            cp1 = { x: 2 * currentPoint.x - lastCubicControl.x, y: 2 * currentPoint.y - lastCubicControl.y };
                        } else {
                            cp1 = { ...currentPoint };
                        }
                        const cp2 = { x: isRel ? currentPoint.x + args[i] : args[i], y: isRel ? currentPoint.y + args[i + 1] : args[i + 1] };
                        const endP = { x: isRel ? currentPoint.x + args[i + 2] : args[i + 2], y: isRel ? currentPoint.y + args[i + 3] : args[i + 3] };
                        i += 4;
                        const pts = sampleCubicBezier(currentPoint, cp1, cp2, endP, 16);
                        pts.forEach(p => currentPolyline.push(p));
                        currentPoint = { ...endP };
                        lastCubicControl = { ...cp2 };
                        lastQuadControl = null;
                        break;
                    }
                    case 'Q': {
                        if (args.length < i + 4) { i = args.length; break; }
                        const cp = { x: isRel ? currentPoint.x + args[i] : args[i], y: isRel ? currentPoint.y + args[i + 1] : args[i + 1] };
                        const endP = { x: isRel ? currentPoint.x + args[i + 2] : args[i + 2], y: isRel ? currentPoint.y + args[i + 3] : args[i + 3] };
                        i += 4;
                        const pts = sampleQuadraticBezier(currentPoint, cp, endP, 12);
                        pts.forEach(p => currentPolyline.push(p));
                        currentPoint = { ...endP };
                        lastQuadControl = { ...cp };
                        lastCubicControl = null;
                        break;
                    }
                    case 'T': {
                        if (args.length < i + 2) { i = args.length; break; }
                        let cp;
                        if (lastQuadControl) {
                            cp = { x: 2 * currentPoint.x - lastQuadControl.x, y: 2 * currentPoint.y - lastQuadControl.y };
                        } else {
                            cp = { ...currentPoint };
                        }
                        const endP = { x: isRel ? currentPoint.x + args[i] : args[i], y: isRel ? currentPoint.y + args[i + 1] : args[i + 1] };
                        i += 2;
                        const pts = sampleQuadraticBezier(currentPoint, cp, endP, 12);
                        pts.forEach(p => currentPolyline.push(p));
                        currentPoint = { ...endP };
                        lastQuadControl = { ...cp };
                        lastCubicControl = null;
                        break;
                    }
                    case 'A': {
                        if (args.length < i + 7) { i = args.length; break; }
                        const rx = args[i];
                        const ry = args[i + 1];
                        const xRot = args[i + 2];
                        const largeArc = args[i + 3] !== 0;
                        const sweep = args[i + 4] !== 0;
                        const endP = { x: isRel ? currentPoint.x + args[i + 5] : args[i + 5], y: isRel ? currentPoint.y + args[i + 6] : args[i + 6] };
                        i += 7;
                        const pts = sampleSvgArc(currentPoint, rx, ry, xRot, largeArc, sweep, endP, 16);
                        pts.forEach(p => currentPolyline.push(p));
                        currentPoint = { ...endP };
                        lastCubicControl = null;
                        lastQuadControl = null;
                        break;
                    }
                    default:
                        i = args.length;
                        break;
                }
            }
        }
        if (currentPolyline.length > 2) subPaths.push(currentPolyline);
        return subPaths;
    }

    const SvgImporter = {
        parseSvgString: function (rawSvg, fileName = 'design.svg') {
            const sanitizedSvg = sanitizeSvgText(rawSvg);
            if (!sanitizedSvg.trim()) {
                return { fileName, parts: [], errors: ['Invalid or empty cutting geometry.'] };
            }

            let doc;
            try {
                let ParserClass;
                if (typeof DOMParser !== 'undefined') {
                    ParserClass = DOMParser;
                } else if (typeof window !== 'undefined' && window.DOMParser) {
                    ParserClass = window.DOMParser;
                } else if (typeof globalThis !== 'undefined' && globalThis.DOMParser) {
                    ParserClass = globalThis.DOMParser;
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    ParserClass = require('@xmldom/xmldom').DOMParser;
                }
                const parser = new ParserClass();
                doc = parser.parseFromString(sanitizedSvg, 'image/svg+xml');
            } catch (e) {
                return { fileName, parts: [], errors: ['Failed to parse SVG: ' + (e.message || 'Syntax error')] };
            }

            const svgEl = doc.documentElement;
            if (!svgEl || svgEl.tagName.toLowerCase() !== 'svg') {
                return { fileName, parts: [], errors: ['Invalid SVG file: root <svg> element missing.'] };
            }

            sanitizeSvgElement(svgEl);

            let scaleToMm = MM_PER_PX;
            const widthAttr = svgEl.getAttribute('width');
            const heightAttr = svgEl.getAttribute('height');
            const viewBoxAttr = svgEl.getAttribute('viewBox');

            let viewBoxWidth = null, viewBoxHeight = null;
            if (viewBoxAttr) {
                const parts = viewBoxAttr.trim().split(/[\s,]+/).map(parseFloat);
                if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
                    viewBoxWidth = parts[2];
                    viewBoxHeight = parts[3];
                }
            }

            if (widthAttr) {
                const widthMm = parseSvgLengthToMm(widthAttr, 0);
                if (widthMm > 0 && viewBoxWidth && viewBoxWidth > 0) {
                    scaleToMm = widthMm / viewBoxWidth;
                } else if (widthMm > 0) {
                    scaleToMm = 1.0;
                }
            } else if (heightAttr) {
                const heightMm = parseSvgLengthToMm(heightAttr, 0);
                if (heightMm > 0 && viewBoxHeight && viewBoxHeight > 0) {
                    scaleToMm = heightMm / viewBoxHeight;
                } else if (heightMm > 0) {
                    scaleToMm = 1.0;
                }
            }

            const polylines = [];
            this.extractElementGeometry(svgEl, identityMatrix(), [], polylines, scaleToMm);

            if (polylines.length === 0) {
                return { fileName, parts: [], errors: ['No closed cutting paths found in SVG.'] };
            }

            const components = this.classifyTopologicalComponents(polylines);
            if (components.length === 0) {
                return { fileName, parts: [], errors: ['No outer cutting boundaries found in geometry.'] };
            }

            const candidateParts = this.groupComponentsIntoParts(components, fileName);
            return {
                fileName,
                parts: candidateParts
            };
        },

        extractElementGeometry: function (element, parentMatrix, groupStack, polylines, scaleToMm) {
            if (!element || !element.tagName) return;
            const transformAttr = element.getAttribute ? element.getAttribute('transform') : null;
            const localMatrix = parseTransformAttribute(transformAttr);
            const currentMatrix = multiplyMatrix(parentMatrix, localMatrix);
            const tagName = element.tagName.toLowerCase();
            const currentGroupStack = [...groupStack];

            if (tagName === 'g' || tagName === 'svg') {
                const id = element.getAttribute('id') || undefined;
                const label = element.getAttribute('inkscape:label') || element.getAttribute('name') || id;
                currentGroupStack.push({ id, label });
            }

            const processPoints = (ptsInSvgSpace, elemId) => {
                const mmPoints = ptsInSvgSpace.map(p => {
                    const transformed = applyMatrixToPoint(p, currentMatrix);
                    return { x: transformed.x * scaleToMm, y: transformed.y * scaleToMm };
                });
                const simplified = simplifyContour(mmPoints, 0.01);
                if (simplified.length >= 3) {
                    const area = Math.abs(computeContourArea(simplified));
                    if (area > 0.001) {
                        polylines.push({
                            points: simplified,
                            area,
                            bounds: computeBounds(simplified),
                            groupAncestors: [...currentGroupStack],
                            elementId: elemId
                        });
                    }
                }
            };

            switch (tagName) {
                case 'path': {
                    const d = element.getAttribute('d');
                    if (d) {
                        const subPaths = parseSvgPathToContours(d);
                        subPaths.forEach(sp => { if (sp.length >= 3) processPoints(sp, element.getAttribute('id')); });
                    }
                    break;
                }
                case 'rect': {
                    const x = parseFloat(element.getAttribute('x') || '0');
                    const y = parseFloat(element.getAttribute('y') || '0');
                    const w = parseFloat(element.getAttribute('width') || '0');
                    const h = parseFloat(element.getAttribute('height') || '0');
                    if (w > 0 && h > 0) {
                        processPoints([
                            { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }, { x, y }
                        ], element.getAttribute('id'));
                    }
                    break;
                }
                case 'circle': {
                    const cx = parseFloat(element.getAttribute('cx') || '0');
                    const cy = parseFloat(element.getAttribute('cy') || '0');
                    const r = parseFloat(element.getAttribute('r') || '0');
                    if (r > 0) processPoints(sampleCircle(cx, cy, r), element.getAttribute('id'));
                    break;
                }
                case 'ellipse': {
                    const cx = parseFloat(element.getAttribute('cx') || '0');
                    const cy = parseFloat(element.getAttribute('cy') || '0');
                    const rx = parseFloat(element.getAttribute('rx') || '0');
                    const ry = parseFloat(element.getAttribute('ry') || '0');
                    if (rx > 0 && ry > 0) processPoints(sampleEllipse(cx, cy, rx, ry), element.getAttribute('id'));
                    break;
                }
                case 'polygon':
                case 'polyline': {
                    const pointsStr = element.getAttribute('points');
                    if (pointsStr) {
                        const nums = pointsStr.trim().split(/[\s,]+/).map(parseFloat).filter(v => !isNaN(v));
                        const pts = [];
                        for (let i = 0; i < nums.length - 1; i += 2) {
                            pts.push({ x: nums[i], y: nums[i + 1] });
                        }
                        if (pts.length >= 3) {
                            if (tagName === 'polygon' && (pts[0].x !== pts[pts.length - 1].x || pts[0].y !== pts[pts.length - 1].y)) {
                                pts.push({ ...pts[0] });
                            }
                            processPoints(pts, element.getAttribute('id'));
                        }
                    }
                    break;
                }
            }

            const childNodes = element.children ? Array.from(element.children) : Array.from(element.childNodes || []).filter(n => n.nodeType === 1);
            for (const child of childNodes) {
                this.extractElementGeometry(child, currentMatrix, currentGroupStack, polylines, scaleToMm);
            }
        },

        classifyTopologicalComponents: function (polylines) {
            const items = [...polylines].sort((a, b) => b.area - a.area);
            const n = items.length;
            const parentIndex = new Array(n).fill(null);
            const depth = new Array(n).fill(0);

            for (let i = 0; i < n; i++) {
                const candidate = items[i];
                const cBounds = candidate.bounds;
                for (let j = i - 1; j >= 0; j--) {
                    const pBounds = items[j].bounds;
                    if (cBounds.minX >= pBounds.minX - 1e-3 && cBounds.maxX <= pBounds.maxX + 1e-3 &&
                        cBounds.minY >= pBounds.minY - 1e-3 && cBounds.maxY <= pBounds.maxY + 1e-3) {
                        const pts = candidate.points;
                        if (isPointInPolygon(pts[0], items[j].points) &&
                            isPointInPolygon(pts[Math.floor(pts.length / 2)], items[j].points)) {
                            parentIndex[i] = j;
                            depth[i] = depth[j] + 1;
                            break;
                        }
                    }
                }
            }

            const rootComponentMap = new Map();
            let compId = 0;
            for (let i = 0; i < n; i++) {
                let rootIdx = i;
                while (parentIndex[rootIdx] !== null) {
                    rootIdx = parentIndex[rootIdx];
                }
                let comp = rootComponentMap.get(rootIdx);
                if (!comp) {
                    const rootItem = items[rootIdx];
                    let pId, pName;
                    for (let g = rootItem.groupAncestors.length - 1; g >= 0; g--) {
                        const grp = rootItem.groupAncestors[g];
                        if (grp.id) { pId = grp.id; pName = grp.label || grp.id; break; }
                    }
                    comp = {
                        id: compId++,
                        outerContours: [],
                        holes: [],
                        allPoints: [],
                        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
                        area: 0,
                        primaryGroupId: pId,
                        primaryGroupName: pName
                    };
                    rootComponentMap.set(rootIdx, comp);
                }

                if (depth[i] % 2 === 0) {
                    comp.outerContours.push(items[i].points);
                } else {
                    comp.holes.push(items[i].points);
                }
            }

            const components = Array.from(rootComponentMap.values());
            for (const comp of components) {
                comp.allPoints = comp.outerContours.flat().concat(comp.holes.flat());
                comp.bounds = computeBounds(comp.allPoints);
                comp.area = computeGeometryArea(comp.outerContours, comp.holes);
            }
            return components.filter(c => c.outerContours.length > 0 && c.area > 0.001);
        },

        groupComponentsIntoParts: function (components, fileName) {
            const k = components.length;
            if (k === 0) return [];
            const parent = Array.from({ length: k }, (_, i) => i);
            const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
            const union = (i, j) => {
                const ri = find(i), rj = find(j);
                if (ri !== rj) parent[ri] = rj;
            };

            for (let i = 0; i < k; i++) {
                for (let j = i + 1; j < k; j++) {
                    const cA = components[i], cB = components[j];
                    if (cA.primaryGroupId && cB.primaryGroupId && cA.primaryGroupId === cB.primaryGroupId) {
                        union(i, j);
                        continue;
                    }
                    // Bounding overlap pre-check
                    const boundsOverlap = !(cA.bounds.maxX + 0.1 < cB.bounds.minX || cA.bounds.minX - 0.1 > cB.bounds.maxX ||
                                           cA.bounds.maxY + 0.1 < cB.bounds.minY || cA.bounds.minY - 0.1 > cB.bounds.maxY);
                    if (boundsOverlap) {
                        let touch = false;
                        for (const polyA of cA.outerContours) {
                            for (const polyB of cB.outerContours) {
                                if (doPolygonsIntersect(polyA, polyB)) {
                                    touch = true;
                                    break;
                                }
                                const dist = minDistanceBetweenPolygons(polyA, polyB);
                                if (dist <= 0.05) {
                                    touch = true;
                                    break;
                                }
                            }
                            if (touch) break;
                        }
                        if (touch) {
                            union(i, j);
                        }
                    }
                }
            }

            const partBuckets = new Map();
            for (let i = 0; i < k; i++) {
                const r = find(i);
                if (!partBuckets.has(r)) partBuckets.set(r, []);
                partBuckets.get(r).push(components[i]);
            }

            const baseName = fileName.replace(/\.[^/.]+$/, '');
            const candidateBuckets = Array.from(partBuckets.values());
            const results = [];
            let partIndex = 1;

            for (const groupComps of candidateBuckets) {
                const allContours = groupComps.flatMap(c => c.outerContours);
                const allHoles = groupComps.flatMap(c => c.holes);
                const allPts = groupComps.flatMap(c => c.allPoints);
                if (allPts.length === 0 || allContours.length === 0) continue;

                const bounds = computeBounds(allPts);
                if (bounds.width <= 0 || bounds.height <= 0) continue;

                // Normalize points to (0, 0)
                const normalizedContours = allContours.map(c =>
                    c.map(p => ({ x: p.x - bounds.minX, y: p.y - bounds.minY }))
                );
                const normalizedHoles = allHoles.map(h =>
                    h.map(p => ({ x: p.x - bounds.minX, y: p.y - bounds.minY }))
                );

                const totalArea = computeGeometryArea(normalizedContours, normalizedHoles);
                if (totalArea <= 0.001) continue;

                let partName = groupComps.find(c => c.primaryGroupName)?.primaryGroupName;
                if (!partName) {
                    partName = candidateBuckets.length === 1 ? baseName : `${baseName} #${partIndex}`;
                }

                results.push({
                    name: partName,
                    polygon: normalizedContours[0] || [],
                    holes: normalizedHoles,
                    contours: normalizedContours,
                    width: bounds.width,
                    height: bounds.height,
                    area: totalArea,
                    bounds: { minX: 0, minY: 0, maxX: bounds.width, maxY: bounds.height, width: bounds.width, height: bounds.height }
                });
                partIndex++;
            }
            return results;
        }
    };

    return SvgImporter;
}));
