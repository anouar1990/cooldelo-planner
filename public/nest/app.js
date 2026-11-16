/**
 * 0machine Auto-Nesting UI & Canvas Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // Canvas setup
    const canvas = document.getElementById('nestCanvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('canvasContainer');

    // Workspace & Canvas State
    let zoom = 0.85;
    let panX = 40;
    let panY = 40;
    let activeTool = 'select'; // 'select' | 'pan'
    let selectedSheetPlacementIndex = -1; // Index in nester.bestResult.sheets[currentSheetIndex].placements
    let isDraggingPart = false;
    let isPanning = false;
    let dragStartSheetPt = { x: 0, y: 0 };
    let hasCollision = false;
    let startX = 0, startY = 0;
    let partSearchQuery = '';

    // Initialize Nester
    const nester = new Nester({
        sheetWidth: 1000,
        sheetHeight: 600,
        spacing: 4,
        margin: 8,
        rotations: 4,
        maxGenerations: 50
    });
    window.nester = nester;

    // Color Palette based on 0machine & Neon Accents
    const colorPalette = [
        '#FE7733', '#FF925C', '#6366F1', '#38BDF8', 
        '#10B981', '#F59E0B', '#EC4899', '#A855F7'
    ];

    // Presets library: Industrial parts for CNC/Laser/Plasma
    const presetParts = [
        {
            name: 'Gantry Frame (Cutout)',
            polygon: [
                { x: 0, y: 0 }, { x: 260, y: 0 }, { x: 260, y: 190 }, { x: 0, y: 190 }
            ],
            holes: [
                [
                    { x: 45, y: 35 }, { x: 215, y: 35 }, { x: 215, y: 155 }, { x: 45, y: 155 }
                ]
            ],
            quantity: 2,
            color: '#EC4899'
        },
        {
            name: 'Mount Flange (Hollow)',
            polygon: [
                { x: 45, y: 0 }, { x: 135, y: 0 }, { x: 180, y: 45 },
                { x: 180, y: 135 }, { x: 135, y: 180 }, { x: 45, y: 180 },
                { x: 0, y: 135 }, { x: 0, y: 45 }
            ],
            holes: [
                [
                    { x: 45, y: 45 }, { x: 135, y: 45 }, { x: 135, y: 135 }, { x: 45, y: 135 }
                ]
            ],
            quantity: 2,
            color: '#F59E0B'
        },
        {
            name: 'L-Bracket 90-Deg',
            polygon: [
                { x: 0, y: 0 }, { x: 140, y: 0 }, { x: 140, y: 40 },
                { x: 45, y: 40 }, { x: 45, y: 140 }, { x: 0, y: 140 }
            ],
            quantity: 4,
            color: '#FE7733'
        },
        {
            name: 'Gusset Plate',
            polygon: [
                { x: 0, y: 0 }, { x: 110, y: 0 }, { x: 110, y: 50 },
                { x: 50, y: 110 }, { x: 0, y: 110 }
            ],
            quantity: 4,
            color: '#FF925C'
        },
        {
            name: 'Hex Flange',
            polygon: [
                { x: 40, y: 0 }, { x: 80, y: 0 }, { x: 120, y: 35 },
                { x: 100, y: 80 }, { x: 20, y: 80 }, { x: 0, y: 35 }
            ],
            quantity: 4,
            color: '#6366F1'
        },
        {
            name: 'Motor Mount',
            polygon: [
                { x: 0, y: 25 }, { x: 30, y: 25 }, { x: 30, y: 0 },
                { x: 90, y: 0 }, { x: 90, y: 25 }, { x: 120, y: 25 },
                { x: 120, y: 85 }, { x: 0, y: 85 }
            ],
            quantity: 4,
            color: '#38BDF8'
        },
        {
            name: 'Cam Arm',
            polygon: [
                { x: 0, y: 15 }, { x: 35, y: 0 }, { x: 150, y: 10 },
                { x: 165, y: 35 }, { x: 135, y: 55 }, { x: 25, y: 45 }
            ],
            quantity: 4,
            color: '#10B981'
        }
    ];

    // Load presets initially
    presetParts.forEach(p => nester.addPart(p));

    // UI Elements
    const partsListEl = document.getElementById('partsList');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const statusPill = document.getElementById('statusPill');
    const statusText = document.getElementById('statusText');

    // Toolbar Tools & View Controls
    const toolSelectBtn = document.getElementById('toolSelectBtn');
    const toolPanBtn = document.getElementById('toolPanBtn');
    const fitSheetBtn = document.getElementById('fitSheetBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const toolbarPartActions = document.getElementById('toolbarPartActions');
    const toolbarRotateBtn = document.getElementById('toolbarRotateBtn');
    const toolbarDeleteBtn = document.getElementById('toolbarDeleteBtn');

    // Left Sidebar Elements
    const addDesignBtn = document.getElementById('addDesignBtn');
    const designsCountBadge = document.getElementById('designsCountBadge');
    const totalItemsSummary = document.getElementById('totalItemsSummary');
    const partSearchInput = document.getElementById('partSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const emptyPartsState = document.getElementById('emptyPartsState');

    // Right Sidebar Inspector Elements
    const sheetInspectorMode = document.getElementById('sheetInspectorMode');
    const partInspectorMode = document.getElementById('partInspectorMode');
    const deselectPartBtn = document.getElementById('deselectPartBtn');
    const deselectPartBottomBtn = document.getElementById('deselectPartBottomBtn');
    const inspectorTitleText = document.getElementById('inspectorTitleText');

    // Inspector Part Elements
    const selectedPartName = document.getElementById('selectedPartName');
    const selectedPartDims = document.getElementById('selectedPartDims');
    const selectedPartX = document.getElementById('selectedPartX');
    const selectedPartY = document.getElementById('selectedPartY');
    const selectedPartRotationVal = document.getElementById('selectedPartRotationVal');
    const selectedPartLockToggle = document.getElementById('selectedPartLockToggle');
    const inspectorPartPreview = document.getElementById('inspectorPartPreview');
    const rotatePartBtn = document.getElementById('rotatePartBtn');
    const deletePartFromSheetBtn = document.getElementById('deletePartFromSheetBtn');

    // Controls
    const sheetWidthInput = document.getElementById('sheetWidth');
    const sheetHeightInput = document.getElementById('sheetHeight');
    const spacingSlider = document.getElementById('spacingSlider');
    const spacingVal = document.getElementById('spacingVal');
    const marginSlider = document.getElementById('marginSlider');
    const marginVal = document.getElementById('marginVal');
    const rotationsSelect = document.getElementById('rotationsSelect');
    const useHolesToggle = document.getElementById('useHolesToggle');
    const commonLineToggle = document.getElementById('commonLineToggle');

    // Cost Calculator & Devis Elements
    const costCalc = new CostCalculator();
    const materialSelect = document.getElementById('materialSelect');
    const thicknessSelect = document.getElementById('thicknessSelect');
    const devisSavingsPill = document.getElementById('devisSavingsPill');
    const devisTotalMAD = document.getElementById('devisTotalMAD');
    const devisUnitPart = document.getElementById('devisUnitPart');
    const printDevisBtn = document.getElementById('printDevisBtn');

    // HUD Elements
    const hudEfficiency = document.getElementById('hudEfficiency');
    const hudPlaced = document.getElementById('hudPlaced');
    const hudSharedCut = document.getElementById('hudSharedCut');
    const hudSheetCount = document.getElementById('hudSheetCount');
    const hudSheetDisplay = document.getElementById('hudSheetDisplay');
    const prevSheetBtn = document.getElementById('prevSheetBtn');
    const nextSheetBtn = document.getElementById('nextSheetBtn');
    let currentSheetIndex = 0;

    // Convert Screen (Client) coordinates to Sheet coordinates (mm)
    function screenToSheet(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left - panX) / zoom,
            y: (clientY - rect.top - panY) / zoom
        };
    }

    // Auto fit sheet into canvas viewport
    function fitToView() {
        const sw = nester.config.sheetWidth;
        const sh = nester.config.sheetHeight;
        const padding = 50;
        const availableW = canvas.width - padding * 2;
        const availableH = canvas.height - padding * 2;
        if (availableW <= 0 || availableH <= 0) return;
        zoom = Math.min(availableW / sw, availableH / sh, 1.4);
        panX = (canvas.width - sw * zoom) / 2;
        panY = (canvas.height - sh * zoom) / 2;
        draw();
    }

    function updateSheetPagination() {
        const totalSheets = (nester.bestResult && nester.bestResult.sheets && nester.bestResult.sheets.length) || 1;
        if (currentSheetIndex >= totalSheets) {
            currentSheetIndex = Math.max(0, totalSheets - 1);
        }
        if (currentSheetIndex < 0) {
            currentSheetIndex = 0;
        }
        if (hudSheetDisplay) {
            hudSheetDisplay.textContent = `${currentSheetIndex + 1} / ${totalSheets}`;
        }
        if (hudSheetCount) {
            hudSheetCount.textContent = `${totalSheets}`;
        }
        if (prevSheetBtn) {
            prevSheetBtn.disabled = currentSheetIndex <= 0;
        }
        if (nextSheetBtn) {
            nextSheetBtn.disabled = currentSheetIndex >= totalSheets - 1;
        }
    }

    // Render Contextual Right Inspector (Sheet Settings vs Selected Part)
    function renderInspector() {
        const sheet = nester.bestResult && nester.bestResult.sheets && nester.bestResult.sheets[currentSheetIndex];
        const p = (sheet && sheet.placements && selectedSheetPlacementIndex >= 0 && selectedSheetPlacementIndex < sheet.placements.length)
            ? sheet.placements[selectedSheetPlacementIndex]
            : null;

        if (p) {
            // Mode B: Part Inspector
            if (sheetInspectorMode) sheetInspectorMode.style.display = 'none';
            if (partInspectorMode) partInspectorMode.style.display = 'flex';
            if (deselectPartBtn) deselectPartBtn.style.display = 'block';
            if (inspectorTitleText) inspectorTitleText.textContent = 'Selected Design';
            if (toolbarPartActions) {
                toolbarPartActions.style.opacity = '1';
                toolbarPartActions.style.pointerEvents = 'auto';
            }

            if (selectedPartName) selectedPartName.value = p.name || 'Design';
            const w = Math.round(p.bounds ? p.bounds.width : 0);
            const h = Math.round(p.bounds ? p.bounds.height : 0);
            if (selectedPartDims) selectedPartDims.textContent = `${w} × ${h} mm`;
            if (selectedPartX) selectedPartX.value = Math.round(p.x);
            if (selectedPartY) selectedPartY.value = Math.round(p.y);
            if (selectedPartRotationVal) selectedPartRotationVal.textContent = `${Math.round(p.rotation || 0)}°`;
            if (selectedPartLockToggle) selectedPartLockToggle.checked = !!p.locked;

            // Highlight rotation button
            const curRot = Math.round(p.rotation || 0) % 360;
            document.querySelectorAll('.rot-quick-btn').forEach(btn => {
                const deg = parseInt(btn.dataset.deg);
                btn.classList.toggle('active', deg === curRot);
            });

            // Mini SVG Preview in Inspector
            if (inspectorPartPreview && p.polygon && p.polygon.length > 2) {
                const minX = p.bounds ? p.bounds.minX : 0;
                const minY = p.bounds ? p.bounds.minY : 0;
                const pw = Math.max(1, p.bounds ? p.bounds.width : 50);
                const ph = Math.max(1, p.bounds ? p.bounds.height : 50);
                const pts = p.polygon.map(pt => `${pt.x - minX},${pt.y - minY}`).join(' ');
                inspectorPartPreview.innerHTML = `
                    <svg width="44" height="44" viewBox="0 0 ${pw} ${ph}">
                        <polygon points="${pts}" fill="${p.color || '#FE7733'}" fill-opacity="0.35" stroke="${p.color || '#FE7733'}" stroke-width="2" />
                    </svg>
                `;
            }
        } else {
            // Mode A: Sheet & Material Inspector
            if (sheetInspectorMode) sheetInspectorMode.style.display = 'flex';
            if (partInspectorMode) partInspectorMode.style.display = 'none';
            if (deselectPartBtn) deselectPartBtn.style.display = 'none';
            if (inspectorTitleText) inspectorTitleText.textContent = 'Sheet & Material';
            if (toolbarPartActions) {
                toolbarPartActions.style.opacity = '0.4';
                toolbarPartActions.style.pointerEvents = 'none';
            }
        }
    }

    function deselectCurrentPart() {
        selectedSheetPlacementIndex = -1;
        hasCollision = false;
        const collisionBadge = document.getElementById('canvasCollisionWarning');
        if (collisionBadge) collisionBadge.style.display = 'none';
        renderInspector();
        renderPartsList();
        draw();
    }

    if (deselectPartBtn) deselectPartBtn.addEventListener('click', deselectCurrentPart);
    if (deselectPartBottomBtn) deselectPartBottomBtn.addEventListener('click', deselectCurrentPart);

    // Rotate Selected Part
    function rotateSelectedPart(deltaDeg) {
        const sheet = nester.bestResult && nester.bestResult.sheets && nester.bestResult.sheets[currentSheetIndex];
        const p = (sheet && sheet.placements && selectedSheetPlacementIndex >= 0) ? sheet.placements[selectedSheetPlacementIndex] : null;
        if (!p || !p.polygon || p.polygon.length < 3) return;

        const cx = (p.bounds.minX + p.bounds.maxX) / 2;
        const cy = (p.bounds.minY + p.bounds.maxY) / 2;
        const rad = (deltaDeg * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        p.polygon.forEach(pt => {
            const relX = pt.x - cx;
            const relY = pt.y - cy;
            pt.x = cx + relX * cos - relY * sin;
            pt.y = cy + relX * sin + relY * cos;
        });

        if (p.polygon.holes) {
            p.polygon.holes.forEach(hole => {
                hole.forEach(pt => {
                    const relX = pt.x - cx;
                    const relY = pt.y - cy;
                    pt.x = cx + relX * cos - relY * sin;
                    pt.y = cy + relX * sin + relY * cos;
                });
            });
        }

        // Recompute bounds
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        p.polygon.forEach(pt => {
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.y > maxY) maxY = pt.y;
        });

        p.bounds = { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
        p.rotation = ((p.rotation || 0) + deltaDeg + 360) % 360;
        p.x = minX;
        p.y = minY;

        checkPlacementCollision(p, currentSheet);
        renderInspector();
        draw();
    }

    if (toolbarRotateBtn) toolbarRotateBtn.addEventListener('click', () => rotateSelectedPart(90));
    if (rotatePartBtn) rotatePartBtn.addEventListener('click', () => rotateSelectedPart(90));

    // Quick Rotation Buttons in Inspector (0°, 90°, 180°, 270°)
    document.querySelectorAll('.rot-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetDeg = parseInt(btn.dataset.deg) || 0;
            const sheet = nester.bestResult && nester.bestResult.sheets && nester.bestResult.sheets[currentSheetIndex];
            const p = (sheet && sheet.placements && selectedSheetPlacementIndex >= 0) ? sheet.placements[selectedSheetPlacementIndex] : null;
            if (p) {
                const currentDeg = Math.round(p.rotation || 0) % 360;
                let delta = targetDeg - currentDeg;
                if (delta < 0) delta += 360;
                rotateSelectedPart(delta);
            }
        });
    });

    // Delete Selected Placement from Sheet
    function deleteSelectedPlacement() {
        const sheet = nester.bestResult && nester.bestResult.sheets && nester.bestResult.sheets[currentSheetIndex];
        if (sheet && sheet.placements && selectedSheetPlacementIndex >= 0) {
            sheet.placements.splice(selectedSheetPlacementIndex, 1);
            selectedSheetPlacementIndex = -1;
            hasCollision = false;
            const collisionBadge = document.getElementById('canvasCollisionWarning');
            if (collisionBadge) collisionBadge.style.display = 'none';
            renderInspector();
            updateDevis();
            draw();
        }
    }

    if (toolbarDeleteBtn) toolbarDeleteBtn.addEventListener('click', deleteSelectedPlacement);
    if (deletePartFromSheetBtn) deletePartFromSheetBtn.addEventListener('click', deleteSelectedPlacement);

    // Edit Selected Part Name & Coordinates
    if (selectedPartName) {
        selectedPartName.addEventListener('input', (e) => {
            const sheet = nester.bestResult && nester.bestResult.sheets && nester.bestResult.sheets[currentSheetIndex];
            const p = (sheet && sheet.placements && selectedSheetPlacementIndex >= 0) ? sheet.placements[selectedSheetPlacementIndex] : null;
            if (p) {
                p.name = e.target.value;
                draw();
            }
        });
    }

    if (selectedPartX) {
        selectedPartX.addEventListener('change', (e) => {
            const newX = parseFloat(e.target.value) || 0;
            const sheet = nester.bestResult && nester.bestResult.sheets && nester.bestResult.sheets[currentSheetIndex];
            const p = (sheet && sheet.placements && selectedSheetPlacementIndex >= 0) ? sheet.placements[selectedSheetPlacementIndex] : null;
            if (p) {
                const dx = newX - p.x;
                p.x += dx;
                p.polygon.forEach(pt => pt.x += dx);
                if (p.polygon.holes) p.polygon.holes.forEach(h => h.forEach(pt => pt.x += dx));
                if (p.bounds) { p.bounds.minX += dx; p.bounds.maxX += dx; }
                checkPlacementCollision(p, currentSheet);
                draw();
            }
        });
    }

    if (selectedPartY) {
        selectedPartY.addEventListener('change', (e) => {
            const newY = parseFloat(e.target.value) || 0;
            const sheet = nester.bestResult && nester.bestResult.sheets && nester.bestResult.sheets[currentSheetIndex];
            const p = (sheet && sheet.placements && selectedSheetPlacementIndex >= 0) ? sheet.placements[selectedSheetPlacementIndex] : null;
            if (p) {
                const dy = newY - p.y;
                p.y += dy;
                p.polygon.forEach(pt => pt.y += dy);
                if (p.polygon.holes) p.polygon.holes.forEach(h => h.forEach(pt => pt.y += dy));
                if (p.bounds) { p.bounds.minY += dy; p.bounds.maxY += dy; }
                checkPlacementCollision(p, currentSheet);
                draw();
            }
        });
    }

    if (selectedPartLockToggle) {
        selectedPartLockToggle.addEventListener('change', (e) => {
            const sheet = nester.bestResult && nester.bestResult.sheets && nester.bestResult.sheets[currentSheetIndex];
            const p = (sheet && sheet.placements && selectedSheetPlacementIndex >= 0) ? sheet.placements[selectedSheetPlacementIndex] : null;
            if (p) {
                p.locked = e.target.checked;
                draw();
            }
        });
    }

    // Collision & Boundary Checker
    function checkPlacementCollision(p, sheet) {
        const margin = nester.config.margin || 8;
        const sw = nester.config.sheetWidth || 1000;
        const sh = nester.config.sheetHeight || 600;

        let outOfBounds = false;
        if (p.bounds) {
            if (p.bounds.minX < margin || p.bounds.minY < margin || p.bounds.maxX > sw - margin || p.bounds.maxY > sh - margin) {
                outOfBounds = true;
            }
        }

        let overlaps = false;
        if (sheet && sheet.placements) {
            for (let i = 0; i < sheet.placements.length; i++) {
                if (i === selectedSheetPlacementIndex) continue;
                const other = sheet.placements[i];
                if (p.bounds && other.bounds) {
                    if (p.bounds.maxX < other.bounds.minX || p.bounds.minX > other.bounds.maxX ||
                        p.bounds.maxY < other.bounds.minY || p.bounds.minY > other.bounds.maxY) {
                        continue;
                    }
                }
                if (GeometryUtil.intersectPolygons && GeometryUtil.intersectPolygons(p.polygon, other.polygon)) {
                    overlaps = true;
                    break;
                }
            }
        }

        hasCollision = outOfBounds || overlaps;
        const collisionBadge = document.getElementById('canvasCollisionWarning');
        const collisionText = document.getElementById('canvasCollisionText');
        if (collisionBadge && collisionText) {
            if (hasCollision) {
                collisionBadge.style.display = 'flex';
                collisionText.textContent = outOfBounds && overlaps ? '⚠️ Overlap & Outside Sheet Margin' :
                                            outOfBounds ? '⚠️ Part Outside Sheet Margin' : '⚠️ Parts Colliding / Overlapping';
            } else {
                collisionBadge.style.display = 'none';
            }
        }
    }

    // Tool Buttons: Select vs Pan
    if (toolSelectBtn) {
        toolSelectBtn.addEventListener('click', () => {
            activeTool = 'select';
            toolSelectBtn.classList.add('active');
            if (toolPanBtn) toolPanBtn.classList.remove('active');
            container.classList.remove('tool-pan');
        });
    }

    if (toolPanBtn) {
        toolPanBtn.addEventListener('click', () => {
            activeTool = 'pan';
            toolPanBtn.classList.add('active');
            if (toolSelectBtn) toolSelectBtn.classList.remove('active');
            container.classList.add('tool-pan');
        });
    }

    // View Action Buttons: Fit Sheet, Zoom In, Zoom Out
    if (fitSheetBtn) {
        fitSheetBtn.addEventListener('click', () => fitToView());
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            const newZoom = Math.min(3.0, zoom * 1.25);
            panX = canvas.width / 2 - (canvas.width / 2 - panX) * (newZoom / zoom);
            panY = canvas.height / 2 - (canvas.height / 2 - panY) * (newZoom / zoom);
            zoom = newZoom;
            draw();
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            const newZoom = Math.max(0.2, zoom * 0.8);
            panX = canvas.width / 2 - (canvas.width / 2 - panX) * (newZoom / zoom);
            panY = canvas.height / 2 - (canvas.height / 2 - panY) * (newZoom / zoom);
            zoom = newZoom;
            draw();
        });
    }

    // Sheet Preset Size Buttons
    document.querySelectorAll('.preset-size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const w = parseInt(btn.dataset.w);
            const h = parseInt(btn.dataset.h);
            if (w && h) {
                if (sheetWidthInput) sheetWidthInput.value = w;
                if (sheetHeightInput) sheetHeightInput.value = h;
                nester.setConfig({ sheetWidth: w, sheetHeight: h });
                document.querySelectorAll('.preset-size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                fitToView();
                updateDevis();
            }
        });
    });

    // Left Sidebar: Add Design Button
    if (addDesignBtn) {
        addDesignBtn.addEventListener('click', () => {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.click();
        });
    }

    // Left Sidebar: Search Filter
    if (partSearchInput) {
        partSearchInput.addEventListener('input', (e) => {
            partSearchQuery = e.target.value.toLowerCase().trim();
            if (clearSearchBtn) {
                clearSearchBtn.style.display = partSearchQuery ? 'block' : 'none';
            }
            renderPartsList();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (partSearchInput) partSearchInput.value = '';
            partSearchQuery = '';
            clearSearchBtn.style.display = 'none';
            renderPartsList();
        });
    }

    // Workflow Stepper Interactive Guidance
    const step1 = document.getElementById('step1Indicator');
    const step2 = document.getElementById('step2Indicator');
    const step3 = document.getElementById('step3Indicator');
    const step4 = document.getElementById('step4Indicator');
    const step5 = document.getElementById('step5Indicator');

    function setWorkflowStep(stepNum) {
        [step1, step2, step3, step4, step5].forEach((st, idx) => {
            if (st) st.classList.toggle('active', idx + 1 === stepNum);
        });
    }

    if (step1) step1.addEventListener('click', () => {
        setWorkflowStep(1);
        if (addDesignBtn) addDesignBtn.click();
    });
    if (step2) step2.addEventListener('click', () => {
        setWorkflowStep(2);
        deselectCurrentPart();
        if (sheetWidthInput) sheetWidthInput.focus();
    });
    if (step3) step3.addEventListener('click', () => {
        setWorkflowStep(3);
        if (startBtn && !startBtn.disabled) startBtn.click();
    });
    if (step4) step4.addEventListener('click', () => {
        setWorkflowStep(4);
        deselectCurrentPart();
        const card = document.querySelector('.efficiency-summary-card');
        if (card) card.scrollIntoView({ behavior: 'smooth' });
    });
    if (step5) step5.addEventListener('click', () => {
        setWorkflowStep(5);
        if (exportBtn) exportBtn.click();
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        // Prevent shortcuts when typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedSheetPlacementIndex >= 0) {
                e.preventDefault();
                deleteSelectedPlacement();
            }
        } else if (e.key === 'r' || e.key === 'R') {
            if (selectedSheetPlacementIndex >= 0) {
                e.preventDefault();
                rotateSelectedPart(90);
            }
        } else if (e.key === 'Escape') {
            deselectCurrentPart();
        } else if (e.key === 'f' || e.key === 'F') {
            fitToView();
        } else if (e.key === '1') {
            if (toolSelectBtn) toolSelectBtn.click();
        } else if (e.key === '2') {
            if (toolPanBtn) toolPanBtn.click();
        }
    });

    // Parse URL Search Parameters from 0machine App Nesting Yield launcher
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const pSw = parseInt(urlParams.get('sw'));
        const pSh = parseInt(urlParams.get('sh'));
        const pSp = parseFloat(urlParams.get('sp'));
        const pMg = parseFloat(urlParams.get('margin') || urlParams.get('mg'));
        const pPw = parseFloat(urlParams.get('pw'));
        const pPh = parseFloat(urlParams.get('ph'));
        const pQty = parseInt(urlParams.get('qty'));

        if (pSw && pSw > 0) {
            nester.config.sheetWidth = pSw;
            if (sheetWidthInput) sheetWidthInput.value = pSw;
        }
        if (pSh && pSh > 0) {
            nester.config.sheetHeight = pSh;
            if (sheetHeightInput) sheetHeightInput.value = pSh;
        }
        if (!isNaN(pSp) && pSp >= 0) {
            nester.config.spacing = pSp;
            if (spacingSlider) spacingSlider.value = pSp;
            if (spacingVal) spacingVal.textContent = `${pSp} mm`;
        }
        if (!isNaN(pMg) && pMg >= 0) {
            nester.config.margin = pMg;
            if (marginSlider) marginSlider.value = pMg;
            if (marginVal) marginVal.textContent = `${pMg} mm`;
        }
        if (pPw > 0 && pPh > 0 && pQty > 0) {
            nester.clearParts();
            const color = colorPalette[0];
            nester.addPart({
                name: `Part ${pPw}x${pPh}mm`,
                polygon: [
                    { x: 0, y: 0 }, { x: pPw, y: 0 }, { x: pPw, y: pPh }, { x: 0, y: pPh }
                ],
                quantity: pQty,
                color: color
            });
        }
    } catch (e) {
        // Ignore URL parsing errors
    }

    // Resize Canvas to fit container
    function resizeCanvas() {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        fitToView();
    }
    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 80);

    // Pan & Zoom handlers
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
        const newZoom = Math.max(0.15, Math.min(3.5, zoom * zoomFactor));

        // Zoom relative to mouse position
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        panX = mouseX - (mouseX - panX) * (newZoom / zoom);
        panY = mouseY - (mouseY - panY) * (newZoom / zoom);
        zoom = newZoom;
        draw();
    }, { passive: false });

    // Interactive Mouse Handlers on Canvas (Select & Drag vs Pan)
    container.addEventListener('mousedown', (e) => {
        const isMiddleClick = (e.button === 1);
        const isSpaceDown = e.spaceKey;

        if (activeTool === 'pan' || isMiddleClick || isSpaceDown) {
            isPanning = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
            return;
        }

        // Tool is 'select': perform Hit-testing on sheet placements
        const sheetPt = screenToSheet(e.clientX, e.clientY);
        const sheet = nester.bestResult && nester.bestResult.sheets && nester.bestResult.sheets[currentSheetIndex];

        if (sheet && sheet.placements && sheet.placements.length > 0) {
            // Test from top to bottom (reverse order)
            let hitIdx = -1;
            for (let i = sheet.placements.length - 1; i >= 0; i--) {
                const p = sheet.placements[i];
                if (GeometryUtil.pointInPolygon(sheetPt, p.polygon)) {
                    hitIdx = i;
                    break;
                }
            }

            if (hitIdx >= 0) {
                selectedSheetPlacementIndex = hitIdx;
                isDraggingPart = true;
                dragStartSheetPt = { x: sheetPt.x, y: sheetPt.y };
                hasCollision = false;
                renderInspector();
                renderPartsList();
                draw();
                return;
            }
        }

        // Clicked outside any part: deselect and fallback to canvas pan
        selectedSheetPlacementIndex = -1;
        hasCollision = false;
        const collisionBadge = document.getElementById('canvasCollisionWarning');
        if (collisionBadge) collisionBadge.style.display = 'none';
        renderInspector();
        renderPartsList();

        isPanning = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        draw();
    });

    window.addEventListener('mousemove', (e) => {
        if (isDraggingPart && selectedSheetPlacementIndex >= 0) {
            const sheet = nester.bestResult && nester.bestResult.sheets && nester.bestResult.sheets[currentSheetIndex];
            const p = sheet ? sheet.placements[selectedSheetPlacementIndex] : null;
            if (p) {
                const currentSheetPt = screenToSheet(e.clientX, e.clientY);
                const dx = currentSheetPt.x - dragStartSheetPt.x;
                const dy = currentSheetPt.y - dragStartSheetPt.y;
                dragStartSheetPt = currentSheetPt;

                p.x += dx;
                p.y += dy;
                p.polygon.forEach(pt => { pt.x += dx; pt.y += dy; });
                if (p.polygon.holes) {
                    p.polygon.holes.forEach(hole => hole.forEach(pt => { pt.x += dx; pt.y += dy; }));
                }
                if (p.bounds) {
                    p.bounds.minX += dx; p.bounds.maxX += dx;
                    p.bounds.minY += dy; p.bounds.maxY += dy;
                }

                // Real-time Collision & Boundary Check
                checkPlacementCollision(p, sheet);

                // Update Inspector inputs live
                if (selectedPartX) selectedPartX.value = Math.round(p.x);
                if (selectedPartY) selectedPartY.value = Math.round(p.y);

                draw();
            }
        } else if (isPanning) {
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            draw();
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDraggingPart) {
            isDraggingPart = false;
            if (nester.bestResult) {
                updateDevis();
            }
            draw();
        }
        isPanning = false;
    });

    // Render Parts List in Left Sidebar
    function renderPartsList() {
        if (!partsListEl) return;
        partsListEl.innerHTML = '';

        let displayedCount = 0;
        let totalItems = 0;

        nester.parts.forEach((part, index) => {
            totalItems += (part.quantity || 1);

            // Filter by search query if present
            if (partSearchQuery && !part.name.toLowerCase().includes(partSearchQuery)) {
                return;
            }
            displayedCount++;

            const itemEl = document.createElement('div');
            itemEl.className = 'part-item';
            const hasHoles = part.holes && part.holes.length > 0;
            const hollowBadge = hasHoles ? `<span style="color:var(--accent);font-size:10px;font-weight:700;margin-left:4px;">[Hollow]</span>` : '';

            // Check if this part matches currently selected placement
            const sheet = nester.bestResult && nester.bestResult.sheets && nester.bestResult.sheets[currentSheetIndex];
            const selPl = (sheet && sheet.placements && selectedSheetPlacementIndex >= 0) ? sheet.placements[selectedSheetPlacementIndex] : null;
            if (selPl && selPl.name === part.name) {
                itemEl.classList.add('selected');
            }

            itemEl.innerHTML = `
                <div class="part-preview">
                    <svg width="32" height="32" viewBox="0 0 ${part.bounds.width || 50} ${part.bounds.height || 50}">
                        <polygon points="${part.polygon.map(p => `${p.x},${p.y}`).join(' ')}"
                                 fill="${part.color}" fill-opacity="0.35" stroke="${part.color}" stroke-width="2" />
                    </svg>
                </div>
                <div class="part-info">
                    <div class="part-name" title="${part.name}">${part.name} ${hollowBadge}</div>
                    <div class="part-meta">${Math.round(part.bounds.width)} × ${Math.round(part.bounds.height)} mm</div>
                </div>
                <div class="quantity-control">
                    <button class="qty-btn" data-action="dec" data-index="${index}" title="Decrease quantity">-</button>
                    <span class="qty-val">${part.quantity}</span>
                    <button class="qty-btn" data-action="inc" data-index="${index}" title="Increase quantity">+</button>
                </div>
                <button class="part-delete-btn" data-index="${index}" title="Delete design layer" aria-label="Delete design layer">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            `;

            // Click part card to select its placed counterpart on canvas
            itemEl.addEventListener('click', (e) => {
                if (e.target.closest('.qty-btn') || e.target.closest('.part-delete-btn')) return;
                if (sheet && sheet.placements) {
                    const foundIdx = sheet.placements.findIndex(p => p.name === part.name);
                    if (foundIdx >= 0) {
                        selectedSheetPlacementIndex = foundIdx;
                        renderInspector();
                        renderPartsList();
                        draw();
                    }
                }
            });

            partsListEl.appendChild(itemEl);
        });

        // Update badge and summary counters
        if (designsCountBadge) designsCountBadge.textContent = nester.parts.length;
        if (totalItemsSummary) totalItemsSummary.textContent = `${totalItems} total parts`;
        if (emptyPartsState) {
            emptyPartsState.style.display = (nester.parts.length === 0) ? 'flex' : 'none';
        }

        // Qty buttons
        partsListEl.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                const action = btn.dataset.action;
                if (action === 'inc') {
                    nester.parts[idx].quantity++;
                } else if (action === 'dec' && nester.parts[idx].quantity > 0) {
                    nester.parts[idx].quantity--;
                }
                renderPartsList();
            });
        });

        // Delete buttons
        partsListEl.querySelectorAll('.part-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                if (idx >= 0 && idx < nester.parts.length) {
                    nester.parts.splice(idx, 1);
                    nester.stopNesting();
                    nester.bestResult = null;
                    currentSheetIndex = 0;
                    selectedSheetPlacementIndex = -1;
                    updateSheetPagination();
                    if (hudEfficiency) hudEfficiency.innerHTML = `0<span>%</span>`;
                    if (hudPlaced) hudPlaced.textContent = '0 / 0';
                    if (hudSharedCut) hudSharedCut.innerHTML = `0<span>mm</span>`;
                    updateDevis(null);
                    renderInspector();
                    renderPartsList();
                    draw();
                }
            });
        });
    }

    // Canvas Drawing Function — Clean Industrial Workspace with Part Highlights & Handles
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        // Apply pan and zoom
        ctx.translate(panX, panY);
        ctx.scale(zoom, zoom);

        const sw = nester.config.sheetWidth;
        const sh = nester.config.sheetHeight;

        // Draw Sheet Drop Shadow & Background (Crisp Industrial White Sheet)
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, sw, sh);
        ctx.restore();

        // Draw Sheet Grid (50mm steps)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= sw; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, sh);
            ctx.stroke();
        }
        for (let y = 0; y <= sh; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(sw, y);
            ctx.stroke();
        }

        // Draw Margin boundary (Dashed Orange Line)
        const m = nester.config.margin;
        ctx.strokeStyle = 'rgba(254, 119, 51, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(m, m, sw - 2 * m, sh - 2 * m);
        ctx.setLineDash([]);

        // Draw Outer Sheet Boundary with 0machine Industrial Accent
        ctx.strokeStyle = '#FE7733';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(0, 0, sw, sh);

        // Draw Dimensions Label (Dark Slate for crisp contrast on white)
        ctx.fillStyle = '#1F2937';
        ctx.font = '600 13px Inter, sans-serif';
        ctx.fillText(`${sw} mm`, sw / 2 - 25, -12);
        ctx.fillText(`${sh} mm`, -55, sh / 2);

        // Draw Placed Parts if available
        if (nester.bestResult && nester.bestResult.sheets.length > 0) {
            const sheetIdx = Math.min(currentSheetIndex, nester.bestResult.sheets.length - 1);
            const sheet = nester.bestResult.sheets[sheetIdx]; // Active sheet

            sheet.placements.forEach((p, idx) => {
                ctx.save();
                const isSelected = (idx === selectedSheetPlacementIndex);

                // Normal Part Fill
                ctx.fillStyle = isSelected && hasCollision ? 'rgba(239, 68, 68, 0.35)' :
                                isSelected ? 'rgba(0, 210, 255, 0.3)' : p.color;
                ctx.globalAlpha = isSelected ? 0.9 : 0.22;

                ctx.beginPath();
                // Outer polygon
                ctx.moveTo(p.polygon[0].x, p.polygon[0].y);
                for (let i = 1; i < p.polygon.length; i++) {
                    ctx.lineTo(p.polygon[i].x, p.polygon[i].y);
                }
                ctx.closePath();

                // Cutout holes
                if (p.polygon.holes && p.polygon.holes.length > 0) {
                    p.polygon.holes.forEach(hole => {
                        ctx.moveTo(hole[0].x, hole[0].y);
                        for (let i = 1; i < hole.length; i++) {
                            ctx.lineTo(hole[i].x, hole[i].y);
                        }
                        ctx.closePath();
                    });
                }
                ctx.fill('evenodd');

                // Part Stroke
                ctx.globalAlpha = 0.95;
                ctx.strokeStyle = isSelected && hasCollision ? '#EF4444' :
                                  isSelected ? '#00D2FF' : p.color;
                ctx.lineWidth = isSelected ? 2.5 : 1.8;
                ctx.beginPath();
                ctx.moveTo(p.polygon[0].x, p.polygon[0].y);
                for (let i = 1; i < p.polygon.length; i++) {
                    ctx.lineTo(p.polygon[i].x, p.polygon[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                // Draw hole outlines with dashed accent line
                if (p.polygon.holes && p.polygon.holes.length > 0) {
                    ctx.save();
                    ctx.strokeStyle = '#FE7733';
                    ctx.lineWidth = 1.2;
                    ctx.setLineDash([3, 3]);
                    p.polygon.holes.forEach(hole => {
                        ctx.beginPath();
                        ctx.moveTo(hole[0].x, hole[0].y);
                        for (let i = 1; i < hole.length; i++) {
                            ctx.lineTo(hole[i].x, hole[i].y);
                        }
                        ctx.closePath();
                        ctx.stroke();
                    });
                    ctx.restore();
                }

                // Part label & index (Dark text for high contrast on white sheet)
                ctx.fillStyle = '#0F172A';
                ctx.font = 'bold 11px Inter, sans-serif';
                const lockIcon = p.locked ? ' 🔒' : '';
                const labelText = p.isInsideHole ? `#${idx + 1} ★${lockIcon}` : `#${idx + 1}${lockIcon}`;
                ctx.fillText(labelText, p.x + 8, p.y + 14);

                // If SELECTED: Draw Professional Bounding Contour, Sizing Corners & Rotation Handle
                if (isSelected && p.bounds) {
                    ctx.save();
                    const b = p.bounds;

                    // Bounding Box Rectangle
                    ctx.strokeStyle = hasCollision ? '#EF4444' : '#00D2FF';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 4]);
                    ctx.strokeRect(b.minX, b.minY, b.width, b.height);
                    ctx.setLineDash([]);

                    // 4 Corner Square Handles
                    ctx.fillStyle = '#FFFFFF';
                    ctx.strokeStyle = hasCollision ? '#EF4444' : '#00D2FF';
                    ctx.lineWidth = 2;
                    const handleSize = 6;
                    [
                        { x: b.minX, y: b.minY },
                        { x: b.maxX, y: b.minY },
                        { x: b.maxX, y: b.maxY },
                        { x: b.minX, y: b.maxY }
                    ].forEach(pt => {
                        ctx.fillRect(pt.x - handleSize / 2, pt.y - handleSize / 2, handleSize, handleSize);
                        ctx.strokeRect(pt.x - handleSize / 2, pt.y - handleSize / 2, handleSize, handleSize);
                    });

                    // Top Rotation Stem & Circular Handle
                    const topCenterX = (b.minX + b.maxX) / 2;
                    const rotHandleY = b.minY - 18;
                    ctx.beginPath();
                    ctx.moveTo(topCenterX, b.minY);
                    ctx.lineTo(topCenterX, rotHandleY);
                    ctx.strokeStyle = hasCollision ? '#EF4444' : '#00D2FF';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(topCenterX, rotHandleY, 5, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fill();
                    ctx.stroke();

                    // Dimension Tag on Bounding Box
                    ctx.fillStyle = '#0F172A';
                    ctx.font = '600 10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${Math.round(b.width)} mm`, topCenterX, b.maxY + 14);

                    ctx.restore();
                }

                ctx.restore();
            });

            // Highlight Common-Line Laser Twin Cuts with glowing cyan stroke
            if (nester.config.commonLine !== false && sheet.sharedSegments && sheet.sharedSegments.length > 0) {
                ctx.save();
                ctx.strokeStyle = '#38BDF8';
                ctx.lineWidth = 3.5;
                ctx.shadowColor = 'rgba(56, 189, 248, 0.9)';
                ctx.shadowBlur = 10;
                ctx.lineCap = 'round';
                sheet.sharedSegments.forEach(seg => {
                    ctx.beginPath();
                    ctx.moveTo(seg.p1.x, seg.p1.y);
                    ctx.lineTo(seg.p2.x, seg.p2.y);
                    ctx.stroke();
                });
                ctx.restore();
            }
        }

        ctx.restore();
    }

    // Real-time Devis Quotation Updater
    function updateDevis(currentResult) {
        const result = currentResult || nester.bestResult;
        const materialId = materialSelect ? materialSelect.value : 'steel';
        const thickness = thicknessSelect ? parseFloat(thicknessSelect.value) : 2.0;

        const sheetWidth = nester.config.sheetWidth || 1000;
        const sheetHeight = nester.config.sheetHeight || 600;
        const sheetCount = result && result.sheets ? Math.max(1, result.sheets.length) : 1;
        const totalPlacedArea = result ? (result.totalPlacedArea || 0) : 0;
        const totalPartsCount = result ? (result.totalPlaced || 0) : 0;
        const totalPerimeterMm = result ? (result.totalPerimeterMm || 0) : 0;
        const sharedCutMm = (nester.config.commonLine !== false && result) ? (result.sharedCutMm || 0) : 0;

        const quote = costCalc.calculate({
            materialId,
            thickness,
            sheetWidth,
            sheetHeight,
            sheetCount,
            totalPlacedArea,
            totalPartsCount,
            totalPerimeterMm,
            sharedCutMm
        });

        if (devisSavingsPill) devisSavingsPill.textContent = `Saved: ${quote.savedMoneyMAD} MAD`;
        if (devisTotalMAD) devisTotalMAD.innerHTML = `${quote.totalCostMAD} <span style="font-size: 12px; font-weight: 500;">DH</span>`;
        if (devisUnitPart) devisUnitPart.textContent = `${quote.unitPricePerPart} MAD / part`;
    }

    // Real-time Progress Callback
    nester.onProgress = (result, generation) => {
        if (hudEfficiency) hudEfficiency.innerHTML = `${result.compactEfficiency}<span>%</span>`;
        if (hudPlaced) hudPlaced.textContent = `${result.totalPlaced} / ${result.totalItems}`;
        if (hudSharedCut) hudSharedCut.innerHTML = `${result.sharedCutMm || 0} mm`;
        updateSheetPagination();
        updateDevis(result);
        draw();
    };

    // Controls Event Listeners
    if (spacingSlider) {
        spacingSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (spacingVal) spacingVal.textContent = `${val} mm`;
            nester.setConfig({ spacing: val });
        });
    }

    if (marginSlider) {
        marginSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (marginVal) marginVal.textContent = `${val} mm`;
            nester.setConfig({ margin: val });
            draw();
        });
    }

    if (sheetWidthInput) {
        sheetWidthInput.addEventListener('change', (e) => {
            nester.setConfig({ sheetWidth: parseInt(e.target.value) || 1000 });
            fitToView();
            updateDevis();
        });
    }

    if (sheetHeightInput) {
        sheetHeightInput.addEventListener('change', (e) => {
            nester.setConfig({ sheetHeight: parseInt(e.target.value) || 600 });
            fitToView();
            updateDevis();
        });
    }

    if (rotationsSelect) {
        rotationsSelect.addEventListener('change', (e) => {
            nester.setConfig({ rotations: parseInt(e.target.value) || 4 });
        });
    }

    if (useHolesToggle) {
        useHolesToggle.addEventListener('change', (e) => {
            nester.setConfig({ useHoles: e.target.checked });
        });
    }

    if (commonLineToggle) {
        commonLineToggle.addEventListener('change', (e) => {
            nester.setConfig({ commonLine: e.target.checked });
            if (nester.bestResult) {
                updateDevis();
                draw();
            }
        });
    }

    // Material & Thickness Selectors
    if (materialSelect) {
        materialSelect.addEventListener('change', () => updateDevis());
    }
    if (thicknessSelect) {
        thicknessSelect.addEventListener('change', () => updateDevis());
    }

    // Print Official Devis
    if (printDevisBtn) {
        printDevisBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Start / Stop Nesting
    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            startBtn.disabled = true;
            if (stopBtn) stopBtn.disabled = false;
            if (statusPill) statusPill.querySelector('.pulse-dot').classList.add('working');
            if (statusText) statusText.textContent = 'Optimizing Layout...';
            setWorkflowStep(3);

            await nester.startNesting();

            startBtn.disabled = false;
            if (stopBtn) stopBtn.disabled = true;
            if (statusPill) statusPill.querySelector('.pulse-dot').classList.remove('working');
            if (statusText) statusText.textContent = 'Nesting Ready';
            setWorkflowStep(4);
            updateSheetPagination();
            renderInspector();
            draw();
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            nester.stopNesting();
            if (startBtn) startBtn.disabled = false;
            stopBtn.disabled = true;
            if (statusPill) statusPill.querySelector('.pulse-dot').classList.remove('working');
            if (statusText) statusText.textContent = 'Paused';
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            nester.stopNesting();
            nester.bestResult = null;
            currentSheetIndex = 0;
            selectedSheetPlacementIndex = -1;
            hasCollision = false;
            const collisionBadge = document.getElementById('canvasCollisionWarning');
            if (collisionBadge) collisionBadge.style.display = 'none';
            updateSheetPagination();
            if (hudEfficiency) hudEfficiency.innerHTML = `0<span>%</span>`;
            if (hudPlaced) hudPlaced.textContent = '0 / 0';
            if (hudSharedCut) hudSharedCut.innerHTML = `0<span>mm</span>`;
            updateDevis(null);
            renderInspector();
            renderPartsList();
            fitToView();
        });
    }

    // Sheet Pagination Buttons
    if (prevSheetBtn) {
        prevSheetBtn.addEventListener('click', () => {
            if (currentSheetIndex > 0) {
                currentSheetIndex--;
                selectedSheetPlacementIndex = -1;
                updateSheetPagination();
                renderInspector();
                draw();
            }
        });
    }

    if (nextSheetBtn) {
        nextSheetBtn.addEventListener('click', () => {
            const totalSheets = (nester.bestResult && nester.bestResult.sheets && nester.bestResult.sheets.length) || 1;
            if (currentSheetIndex < totalSheets - 1) {
                currentSheetIndex++;
                selectedSheetPlacementIndex = -1;
                updateSheetPagination();
                renderInspector();
                draw();
            }
        });
    }

    // Export SVG
    exportBtn.addEventListener('click', () => {
        if (!nester.bestResult || !nester.bestResult.sheets || nester.bestResult.sheets.length === 0) {
            alert('Please run nesting before exporting.');
            return;
        }
        const sheetIdx = Math.min(currentSheetIndex, nester.bestResult.sheets.length - 1);
        const svgContent = nester.exportSVG(sheetIdx);
        if (!svgContent) {
            alert('Please run nesting before exporting.');
            return;
        }
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `0machine_nest_sheet${sheetIdx + 1}_${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // SVG Drag & Drop File Upload
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#FE7733';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'rgba(254, 119, 51, 0.3)';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'rgba(254, 119, 51, 0.3)';
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    function handleFileUpload(file) {
        const lowerName = file.name.toLowerCase();
        if (!lowerName.endsWith('.svg') && !lowerName.endsWith('.dxf')) {
            alert('Please upload an SVG or DXF file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            if (lowerName.endsWith('.dxf')) {
                parseAndAddDxf(content, baseName);
            } else {
                parseAndAddSvg(content, baseName);
            }
        };
        reader.readAsText(file);
    }

    function parseAndAddDxf(dxfContent, baseName) {
        const dxfParser = new DxfParser();
        const extracted = dxfParser.parse(dxfContent, baseName);
        if (extracted.length === 0) {
            alert('No closed 2D polylines or contours found in this DXF.');
            return;
        }

        extracted.forEach((p) => {
            const color = colorPalette[nester.parts.length % colorPalette.length];
            nester.addPart({
                name: p.name,
                polygon: p.polygon,
                holes: p.holes || [],
                quantity: 2,
                color: color
            });
        });

        renderPartsList();
        fitToView();
    }

    function parseAndAddSvg(svgContent, baseName) {
        if (typeof SvgImporter !== 'undefined' && SvgImporter.parseSvgString) {
            try {
                const result = SvgImporter.parseSvgString(svgContent, baseName);
                if (result && result.parts && result.parts.length > 0) {
                    let added = 0;
                    result.parts.forEach((p) => {
                        const contours = (p.contours && p.contours.length > 0) ? p.contours :
                                         (p.geometry && p.geometry.contours && p.geometry.contours.length > 0) ? p.geometry.contours :
                                         p.polygon ? [p.polygon] : [];
                        if (contours.length === 0) return;

                        const allHoles = p.holes || (p.geometry && p.geometry.holes) || [];

                        if (contours.length === 1) {
                            const poly = contours[0];
                            if (!poly || !Array.isArray(poly) || poly.length < 3) return;
                            const color = colorPalette[nester.parts.length % colorPalette.length];
                            nester.addPart({
                                name: p.name || baseName,
                                polygon: poly,
                                holes: allHoles,
                                quantity: 2,
                                color: color
                            });
                            added++;
                        } else {
                            // Multiple disjoint outer contours: add each so no shape is silently dropped
                            contours.forEach((cPoly, cIdx) => {
                                if (!cPoly || !Array.isArray(cPoly) || cPoly.length < 3) return;
                                const subHoles = allHoles.filter(h => {
                                    return h.length > 0 && GeometryUtil.pointInPolygon(h[0], cPoly);
                                });
                                const color = colorPalette[nester.parts.length % colorPalette.length];
                                nester.addPart({
                                    name: `${p.name || baseName} #${cIdx + 1}`,
                                    polygon: cPoly,
                                    holes: subHoles,
                                    quantity: 2,
                                    color: color
                                });
                                added++;
                            });
                        }
                    });

                    if (added > 0) {
                        renderPartsList();
                        fitToView();
                        return;
                    }
                }
                if (result && result.errors && result.errors.length > 0) {
                    console.warn('[SVG Importer] Errors:', result.errors);
                }
            } catch (err) {
                console.warn('[SVG Importer] Advanced parser fallback triggered:', err);
            }
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        const paths = doc.querySelectorAll('path, polygon, rect');

        let added = 0;
        paths.forEach((el, i) => {
            let poly = [];
            if (el.tagName.toLowerCase() === 'path') {
                const d = el.getAttribute('d');
                poly = GeometryUtil.svgPathToPolygon(d);
            } else if (el.tagName.toLowerCase() === 'polygon') {
                const pts = el.getAttribute('points').trim().split(/\s+|,/);
                for (let p = 0; p < pts.length; p += 2) {
                    poly.push({ x: parseFloat(pts[p]), y: parseFloat(pts[p + 1]) });
                }
            } else if (el.tagName.toLowerCase() === 'rect') {
                const w = parseFloat(el.getAttribute('width'));
                const h = parseFloat(el.getAttribute('height'));
                poly = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
            }

            if (poly && poly.length >= 3) {
                const color = colorPalette[nester.parts.length % colorPalette.length];
                nester.addPart({
                    name: `${baseName} #${i + 1}`,
                    polygon: poly,
                    quantity: 2,
                    color: color
                });
                added++;
            }
        });

        if (added > 0) {
            renderPartsList();
            fitToView();
        } else {
            alert('No valid 2D shapes found in this SVG.');
        }
    }

    // Load Sample DXF Button
    const loadSampleDxfBtn = document.getElementById('loadSampleDxfBtn');
    if (loadSampleDxfBtn) {
        loadSampleDxfBtn.addEventListener('click', async () => {
            try {
                const [r1, r2] = await Promise.all([
                    fetch('samples/sample_bracket.dxf').then(r => r.text()),
                    fetch('samples/sample_flange.dxf').then(r => r.text())
                ]);
                parseAndAddDxf(r1, 'DXF Bracket');
                parseAndAddDxf(r2, 'DXF Motor Flange');
            } catch (err) {
                console.error('Failed to load sample DXF:', err);
            }
        });
    }

    // Load Sample SVG Button
    const loadSampleSvgBtn = document.getElementById('loadSampleSvgBtn');
    if (loadSampleSvgBtn) {
        loadSampleSvgBtn.addEventListener('click', async () => {
            try {
                const [s1, s2] = await Promise.all([
                    fetch('samples/sample_gears.svg').then(r => r.text()),
                    fetch('samples/sample_enclosure.svg').then(r => r.text())
                ]);
                parseAndAddSvg(s1, 'Spur Gear');
                parseAndAddSvg(s2, 'Enclosure Mount');
            } catch (err) {
                console.error('Failed to load sample SVG:', err);
            }
        });
    }

    // ==========================================
    // 0machine LaserAI Studio Controller
    // ==========================================
    const laserAiEngine = new LaserAiEngine();
    let currentLaserPart = null;
    let currentUploadedImage = null;
    let activeAiMode = 'standard';

    const laserAiModal = document.getElementById('laserAiModal');
    const openLaserAiBtn = document.getElementById('openLaserAiBtn');
    const openLaserAiSidebarBtn = document.getElementById('openLaserAiSidebarBtn');
    const closeLaserAiModalBtn = document.getElementById('closeLaserAiModalBtn');

    const tabPromptBtn = document.getElementById('tabPromptBtn');
    const tabTraceBtn = document.getElementById('tabTraceBtn');
    const aiPromptSection = document.getElementById('aiPromptSection');
    const aiTraceSection = document.getElementById('aiTraceSection');

    const aiPromptInput = document.getElementById('aiPromptInput');
    const targetSizeSlider = document.getElementById('targetSizeSlider');
    const targetSizeVal = document.getElementById('targetSizeVal');
    const generateLaserBtn = document.getElementById('generateLaserBtn');

    const tracerDropzone = document.getElementById('tracerDropzone');
    const tracerFileInput = document.getElementById('tracerFileInput');
    const thresholdSlider = document.getElementById('thresholdSlider');
    const thresholdVal = document.getElementById('thresholdVal');
    const smoothingSlider = document.getElementById('smoothingSlider');
    const smoothingVal = document.getElementById('smoothingVal');
    const speckleSlider = document.getElementById('speckleSlider');
    const speckleVal = document.getElementById('speckleVal');
    const invertColorsCheck = document.getElementById('invertColorsCheck');
    const retraceBtn = document.getElementById('retraceBtn');

    const studioPreviewCanvas = document.getElementById('studioPreviewCanvas');
    const studioLoadingOverlay = document.getElementById('studioLoadingOverlay');
    const studioLoadingText = document.getElementById('studioLoadingText');

    const statDim = document.getElementById('statDim');
    const statPerimeter = document.getElementById('statPerimeter');
    const statHoles = document.getElementById('statHoles');
    const statCost = document.getElementById('statCost');

    const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const apiKeyStatus = document.getElementById('apiKeyStatus');

    const addToNestBtn = document.getElementById('addToNestBtn');
    const exportLaserSvgBtn = document.getElementById('exportLaserSvgBtn');
    const exportLaserDxfBtn = document.getElementById('exportLaserDxfBtn');

    // Google AI Studio API Key Storage
    const savedApiKey = localStorage.getItem('0machine_gemini_api_key');
    if (savedApiKey && geminiApiKeyInput) {
        geminiApiKeyInput.value = savedApiKey;
        updateApiKeyBadge(true);
    }

    function updateApiKeyBadge(hasKey) {
        if (!apiKeyStatus) return;
        if (hasKey) {
            apiKeyStatus.textContent = "Connected (Imagen 3)";
            apiKeyStatus.className = "api-status-badge connected";
        } else {
            apiKeyStatus.textContent = "Offline Presets";
            apiKeyStatus.className = "api-status-badge";
        }
    }

    if (saveApiKeyBtn && geminiApiKeyInput) {
        saveApiKeyBtn.addEventListener('click', () => {
            const val = geminiApiKeyInput.value.trim();
            if (val) {
                localStorage.setItem('0machine_gemini_api_key', val);
                updateApiKeyBadge(true);
                showStudioLoading("Connected to Google AI Studio! Testing Imagen 3...");
                triggerAiGeneration();
            } else {
                localStorage.removeItem('0machine_gemini_api_key');
                updateApiKeyBadge(false);
            }
        });
    }

    // Open/Close Modal
    function openLaserAiModal() {
        if (!laserAiModal) return;
        laserAiModal.classList.add('active');
        if (!currentLaserPart) {
            triggerAiGeneration();
        } else {
            renderStudioPreview(currentLaserPart);
        }
    }

    function closeLaserAiModal() {
        if (!laserAiModal) return;
        laserAiModal.classList.remove('active');
    }

    if (openLaserAiBtn) openLaserAiBtn.addEventListener('click', openLaserAiModal);
    if (openLaserAiSidebarBtn) openLaserAiSidebarBtn.addEventListener('click', openLaserAiModal);
    if (closeLaserAiModalBtn) {
        closeLaserAiModalBtn.addEventListener('click', () => {
            if (laserAiModal && laserAiModal.classList.contains('standalone-mode')) {
                laserAiModal.classList.remove('standalone-mode');
            }
            closeLaserAiModal();
        });
    }

    // Auto-open LaserAI modal if URL parameter ?tool=laserai or ?modal=ai is present
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tool') === 'laserai' || urlParams.get('modal') === 'ai') {
            if (laserAiModal) {
                laserAiModal.classList.add('standalone-mode');
                laserAiModal.classList.add('active');
            }
        }
    } catch (e) {
        // Ignore URL parsing errors in non-browser environments
    }

    // Close on escape or outside click
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && laserAiModal && laserAiModal.classList.contains('active')) {
            if (!laserAiModal.classList.contains('standalone-mode')) {
                closeLaserAiModal();
            }
        }
    });

    laserAiModal.addEventListener('click', (e) => {
        if (e.target === laserAiModal && !laserAiModal.classList.contains('standalone-mode')) {
            closeLaserAiModal();
        }
    });

    // Tab Navigation
    tabPromptBtn.addEventListener('click', () => {
        tabPromptBtn.classList.add('active');
        tabTraceBtn.classList.remove('active');
        aiPromptSection.style.display = 'flex';
        aiTraceSection.style.display = 'none';
    });

    tabTraceBtn.addEventListener('click', () => {
        tabTraceBtn.classList.add('active');
        tabPromptBtn.classList.remove('active');
        aiPromptSection.style.display = 'none';
        aiTraceSection.style.display = 'flex';
    });

    // Laser Mode Selection
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            activeAiMode = card.getAttribute('data-mode') || 'standard';
            triggerAiGeneration();
        });
    });

    // Preset Pills
    document.querySelectorAll('.preset-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const preset = pill.getAttribute('data-preset');
            if (preset === 'eagle') {
                aiPromptInput.value = 'Imperial eagle woodcut emblem';
                setMode('standard');
            } else if (preset === 'wolf') {
                aiPromptInput.value = 'Geometric wolf head stencil';
                setMode('connected-stencil');
            } else if (preset === 'gear') {
                aiPromptInput.value = 'Precision industrial gear medallion';
                setMode('keychain-medallion');
            } else if (preset === 'plaque') {
                aiPromptInput.value = '0machine lab family sign established 2026';
                setMode('standard');
            } else if (preset === 'mountain') {
                aiPromptInput.value = 'Three peaks mountain layered scene';
                setMode('layered-scene');
            }
            triggerAiGeneration();
        });
    });

    function setMode(modeName) {
        activeAiMode = modeName;
        document.querySelectorAll('.mode-card').forEach(c => {
            if (c.getAttribute('data-mode') === modeName) {
                c.classList.add('active');
            } else {
                c.classList.remove('active');
            }
        });
    }

    // Sliders
    targetSizeSlider.addEventListener('input', () => {
        targetSizeVal.textContent = `${targetSizeSlider.value} mm`;
    });
    targetSizeSlider.addEventListener('change', () => {
        if (currentLaserPart) {
            triggerAiGeneration();
        }
    });

    thresholdSlider.addEventListener('input', () => {
        thresholdVal.textContent = thresholdSlider.value;
    });

    smoothingSlider.addEventListener('input', () => {
        smoothingVal.textContent = smoothingSlider.value;
    });

    speckleSlider.addEventListener('input', () => {
        speckleVal.textContent = `${speckleSlider.value} px`;
    });

    // Image Upload & Tracing
    tracerDropzone.addEventListener('click', () => tracerFileInput.click());
    tracerFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleTracerImage(e.target.files[0]);
        }
    });

    tracerDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        tracerDropzone.style.borderColor = 'var(--accent)';
    });

    tracerDropzone.addEventListener('dragleave', () => {
        tracerDropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    });

    tracerDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        tracerDropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleTracerImage(e.dataTransfer.files[0]);
        }
    });

    function handleTracerImage(file) {
        currentUploadedImage = file;
        triggerImageTrace();
    }

    if (retraceBtn) {
        retraceBtn.addEventListener('click', () => {
            if (currentUploadedImage) {
                triggerImageTrace();
            } else {
                triggerAiGeneration();
            }
        });
    }

    // AI Generation Runner
    async function triggerAiGeneration() {
        showStudioLoading("Generating Laser CAD vectors...");
        const prompt = aiPromptInput.value || "Imperial eagle woodcut emblem";
        const targetWidth = parseFloat(targetSizeSlider.value) || 120;
        const apiKey = localStorage.getItem('0machine_gemini_api_key') || (geminiApiKeyInput ? geminiApiKeyInput.value.trim() : null);

        try {
            const result = await laserAiEngine.generateFromPrompt(prompt, activeAiMode, {
                apiKey: apiKey,
                targetWidthMm: targetWidth,
                smoothing: parseFloat(smoothingSlider.value) || 1.5,
                speckleFilter: parseInt(speckleSlider.value) || 12
            });
            currentLaserPart = result;
            renderStudioPreview(result);
        } catch (err) {
            console.error("AI Generation failed:", err);
            alert("Generation failed: " + err.message);
        } finally {
            hideStudioLoading();
        }
    }

    // Image Trace Runner
    async function triggerImageTrace() {
        if (!currentUploadedImage) return;
        showStudioLoading("Extracting vector contours & holes...");
        try {
            const result = await laserAiEngine.traceImage(currentUploadedImage, {
                threshold: parseInt(thresholdSlider.value) || 128,
                smoothing: parseFloat(smoothingSlider.value) || 1.5,
                speckleFilter: parseInt(speckleSlider.value) || 12,
                invert: invertColorsCheck.checked,
                targetWidthMm: parseFloat(targetSizeSlider.value) || 120,
                mode: activeAiMode,
                name: currentUploadedImage.name.replace(/\.[^/.]+$/, "")
            });
            currentLaserPart = result;
            renderStudioPreview(result);
        } catch (err) {
            console.error("Trace failed:", err);
            alert("Trace failed: " + err.message);
        } finally {
            hideStudioLoading();
        }
    }

    if (generateLaserBtn) {
        generateLaserBtn.addEventListener('click', triggerAiGeneration);
    }

    function showStudioLoading(text) {
        if (studioLoadingText) studioLoadingText.textContent = text;
        if (studioLoadingOverlay) studioLoadingOverlay.style.display = 'flex';
    }

    function hideStudioLoading() {
        if (studioLoadingOverlay) studioLoadingOverlay.style.display = 'none';
    }

    // Render CAD Vector Preview
    function renderStudioPreview(part) {
        if (!part || !studioPreviewCanvas) return;
        const ctx = studioPreviewCanvas.getContext('2d');
        const cw = studioPreviewCanvas.width = 600;
        const ch = studioPreviewCanvas.height = 460;

        ctx.clearRect(0, 0, cw, ch);

        // Dark CAD Background
        ctx.fillStyle = '#06070B';
        ctx.fillRect(0, 0, cw, ch);

        // Draw Millimeter Engineering Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const gridStep = 25;
        for (let x = 0; x < cw; x += gridStep) {
            ctx.beginPath();
            ctx.moveTo(x, 0); ctx.lineTo(x, ch);
            ctx.stroke();
        }
        for (let y = 0; y < ch; y += gridStep) {
            ctx.beginPath();
            ctx.moveTo(0, y); ctx.lineTo(cw, y);
            ctx.stroke();
        }

        const poly = part.polygon;
        const holes = part.holes || [];
        if (!poly || poly.length < 3) return;

        // Bounding Box
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        poly.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });

        const partW = maxX - minX || 1;
        const partH = maxY - minY || 1;

        // Auto-scale with 40px margin
        const margin = 50;
        const scale = Math.min((cw - margin * 2) / partW, (ch - margin * 2) / partH);
        const offsetX = (cw - partW * scale) / 2 - minX * scale;
        const offsetY = (ch - partH * scale) / 2 - minY * scale;

        const toScreen = (p) => ({
            x: p.x * scale + offsetX,
            y: p.y * scale + offsetY
        });

        // 1. Draw Subtle Part Fill (Wood / Steel look)
        ctx.save();
        ctx.beginPath();
        const p0 = toScreen(poly[0]);
        ctx.moveTo(p0.x, p0.y);
        poly.slice(1).forEach(p => {
            const sp = toScreen(p);
            ctx.lineTo(sp.x, sp.y);
        });
        ctx.closePath();

        // Cutout holes in fill using evenodd rule
        holes.forEach(hole => {
            if (hole.length > 2) {
                const hp0 = toScreen(hole[0]);
                ctx.moveTo(hp0.x, hp0.y);
                hole.slice(1).forEach(p => {
                    const sp = toScreen(p);
                    ctx.lineTo(sp.x, sp.y);
                });
                ctx.closePath();
            }
        });

        ctx.fillStyle = 'rgba(254, 119, 51, 0.08)';
        ctx.fill('evenodd');
        ctx.restore();

        // 2. Draw Outer Cut Contour (Neon Laser Red #FF0055)
        ctx.save();
        ctx.shadowColor = 'rgba(255, 0, 85, 0.5)';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#FF0055';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        poly.slice(1).forEach(p => {
            const sp = toScreen(p);
            ctx.lineTo(sp.x, sp.y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // 3. Draw Internal Cutouts / Holes (Cyan #00D2FF)
        ctx.save();
        ctx.shadowColor = 'rgba(0, 210, 255, 0.4)';
        ctx.shadowBlur = 6;
        ctx.strokeStyle = '#00D2FF';
        ctx.lineWidth = 1.8;
        holes.forEach(hole => {
            if (hole.length > 2) {
                ctx.beginPath();
                const hp0 = toScreen(hole[0]);
                ctx.moveTo(hp0.x, hp0.y);
                hole.slice(1).forEach(p => {
                    const sp = toScreen(p);
                    ctx.lineTo(sp.x, sp.y);
                });
                ctx.closePath();
                ctx.stroke();
            }
        });
        ctx.restore();

        // 4. Draw CAD Dimension Callouts
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';

        // Bottom width dimension
        const botY = maxY * scale + offsetY + 20;
        ctx.fillText(`W: ${part.stats.width} mm`, cw / 2, botY);

        // Left height dimension
        ctx.save();
        ctx.translate(minX * scale + offsetX - 18, ch / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`H: ${part.stats.height} mm`, 0, 0);
        ctx.restore();

        ctx.restore();

        // Update Telemetry HUD
        if (statDim) statDim.textContent = `${part.stats.width} x ${part.stats.height} mm`;
        if (statPerimeter) statPerimeter.textContent = `${part.stats.cutPerimeterMm} mm`;
        if (statHoles) statHoles.textContent = `${part.stats.holesCount} Cutout${part.stats.holesCount === 1 ? '' : 's'}`;
        if (statCost) statCost.textContent = `${part.stats.estCostMad} MAD`;
    }

    // Add to Active Nesting Inventory
    if (addToNestBtn) {
        addToNestBtn.addEventListener('click', () => {
            if (!currentLaserPart) return;

            const color = colorPalette[nester.parts.length % colorPalette.length];
            nester.addPart({
                name: currentLaserPart.name || 'Laser_AI_Part',
                polygon: currentLaserPart.polygon,
                holes: currentLaserPart.holes || [],
                quantity: 2,
                color: color
            });

            renderPartsList();
            fitToView();
            closeLaserAiModal();

            // Status message
            const statusText = document.getElementById('statusText');
            if (statusText) statusText.textContent = `Added "${currentLaserPart.name}" to Nest!`;
        });
    }

    // Export Laser SVG
    if (exportLaserSvgBtn) {
        exportLaserSvgBtn.addEventListener('click', () => {
            if (!currentLaserPart || !currentLaserPart.svgString) return;
            downloadFile(currentLaserPart.svgString, `${currentLaserPart.name || 'laser_part'}.svg`, 'image/svg+xml');
        });
    }

    // Export CAD DXF
    if (exportLaserDxfBtn) {
        exportLaserDxfBtn.addEventListener('click', () => {
            if (!currentLaserPart || !currentLaserPart.dxfString) return;
            downloadFile(currentLaserPart.dxfString, `${currentLaserPart.name || 'laser_part'}.dxf`, 'application/dxf');
        });
    }

    function downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Initial render
    renderPartsList();
    renderInspector();
    draw();
});

