/**
 * 0machine CAD Vector Export Engine
 * Generates standard AutoCAD DXF R12 files and clean SVG files compatible with:
 * LightBurn, LaserGRBL, RDWorks, AutoCAD, Fusion 360, Illustrator, Inkscape.
 */

export interface Point {
    x: number;
    y: number;
}

export interface LineSegment {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    layer?: string; // 'CUT' (Red) or 'ENGRAVE' (Blue/Black)
}

export interface TextEntity {
    text: string;
    x: number;
    y: number;
    height: number;
    layer?: string;
}

export interface PolylineEntity {
    points: Point[];
    closed: boolean;
    layer?: string;
}

export interface DxfDocument {
    lines: LineSegment[];
    polylines: PolylineEntity[];
    texts: TextEntity[];
}

/**
 * Builds a valid, lightweight AutoCAD DXF (Release 12) string.
 * R12 is the universal gold standard for CNC & laser CAM software because
 * it uses simple LINE, POLYLINE, VERTEX, and TEXT entities with no complex proxy objects.
 */
export function generateDxfString(doc: DxfDocument): string {
    const lines: string[] = [];

    // Header section
    lines.push('0', 'SECTION', '2', 'HEADER');
    lines.push('9', '$ACADVER', '1', 'AC1009'); // AutoCAD R12
    lines.push('9', '$INSUNITS', '70', '4');    // Millimeters
    lines.push('0', 'ENDSEC');

    // Tables section (Layers)
    lines.push('0', 'SECTION', '2', 'TABLES');
    lines.push('0', 'TABLE', '2', 'LAYER', '70', '2');
    
    // CUT layer (Red - Color 1)
    lines.push('0', 'LAYER', '2', 'CUT', '70', '0', '62', '1', '6', 'CONTINUOUS');
    // ENGRAVE / MARK layer (Blue - Color 5)
    lines.push('0', 'LAYER', '2', 'ENGRAVE', '70', '0', '62', '5', '6', 'CONTINUOUS');
    
    lines.push('0', 'ENDTAB');
    lines.push('0', 'ENDSEC');

    // Entities section
    lines.push('0', 'SECTION', '2', 'ENTITIES');

    // Straight Lines
    for (const line of doc.lines) {
        lines.push('0', 'LINE');
        lines.push('8', line.layer || 'CUT');
        lines.push('10', line.x1.toFixed(3));
        lines.push('20', line.y1.toFixed(3));
        lines.push('30', '0.0');
        lines.push('11', line.x2.toFixed(3));
        lines.push('21', line.y2.toFixed(3));
        lines.push('31', '0.0');
    }

    // Polylines
    for (const poly of doc.polylines) {
        if (poly.points.length < 2) continue;
        lines.push('0', 'POLYLINE');
        lines.push('8', poly.layer || 'CUT');
        lines.push('66', '1'); // Followed by vertices
        lines.push('70', poly.closed ? '1' : '0');

        for (const pt of poly.points) {
            lines.push('0', 'VERTEX');
            lines.push('8', poly.layer || 'CUT');
            lines.push('10', pt.x.toFixed(3));
            lines.push('20', pt.y.toFixed(3));
            lines.push('30', '0.0');
        }

        lines.push('0', 'SEQEND');
    }

    // Text Labels
    for (const txt of doc.texts) {
        lines.push('0', 'TEXT');
        lines.push('8', txt.layer || 'ENGRAVE');
        lines.push('10', txt.x.toFixed(3));
        lines.push('20', txt.y.toFixed(3));
        lines.push('30', '0.0');
        lines.push('40', txt.height.toFixed(2));
        lines.push('1', txt.text);
    }

    lines.push('0', 'ENDSEC');
    lines.push('0', 'EOF');

    return lines.join('\r\n');
}

/**
 * Browser download helper for text-based CAD files (DXF, SVG).
 */
export function triggerFileDownload(filename: string, content: string, mimeType: string = 'application/octet-stream') {
    if (typeof window === 'undefined') return;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 200);
}
