/**
 * 0machine Laser Expert — Client Fallback Knowledge Engine
 * Used when Supabase Edge Function is unreachable or DEEPSEEK_API_KEY is not configured.
 */

export interface FallbackResponse {
    content: string;
    isOffTopic?: boolean;
}

const OFF_TOPIC_REFUSAL = "I am specialized exclusively in laser cutting, woodworking, CNC fabrication, and 0machine tools. I cannot assist with unrelated topics.";

export function getLaserExpertFallback(userQuery: string): FallbackResponse {
    const q = userQuery.toLowerCase().trim();

    // ─── OFF-TOPIC CHECK ───────────────────────────────────────────────
    const offTopicKeywords = [
        'recipe', 'cooking', 'politics', 'president', 'sports', 'football', 'soccer',
        'movie', 'song', 'crypto', 'bitcoin', 'health', 'doctor', 'medicine',
        'travel', 'hotel', 'weather', 'joke', 'capital of', 'who is', 'game'
    ];
    
    // Check if query is completely off-topic and doesn't contain laser/wood terms
    const laserKeywords = ['laser', 'wood', 'cut', 'engrave', 'cnc', 'mdf', 'plywood', 'acrylic', 'speed', 'power', 'kerf', '0machine', 'lightburn', 'dxf', 'svg', 'air assist', 'lens', 'spindle'];
    const hasLaserTerm = laserKeywords.some(k => q.includes(k));
    const hasOffTopicTerm = offTopicKeywords.some(k => q.includes(k));

    if (hasOffTopicTerm && !hasLaserTerm) {
        return { content: OFF_TOPIC_REFUSAL, isOffTopic: true };
    }

    // ─── 1. PLYWOOD & WOOD CUTTING ─────────────────────────────────────
    if (q.includes('plywood') || q.includes('baltic birch') || q.includes('6mm') || q.includes('3mm') || q.includes('4mm')) {
        return {
            content: `### 🪵 Plywood Laser Cutting Recommended Settings

Here are optimal baseline parameters for cutting high-grade plywood (e.g., Baltic Birch, Poplar):

• **3mm Plywood (CO2 80W)**:
  - Speed: 22 mm/s
  - Power: 65%
  - Air Assist: HIGH (20-30 PSI)
  - Passes: 1

• **6mm Plywood (CO2 80W)**:
  - Speed: 10 - 12 mm/s
  - Power: 78% - 82%
  - Air Assist: HIGH
  - Passes: 1

• **Diode Laser (20W Optical)**:
  - 3mm Plywood: 200 mm/min at 90% power (1 pass)
  - 6mm Plywood: 120 mm/min at 100% power (2 passes)

💡 **Pro Tip**: Use strong Air Assist to prevent charring on the surface, and ensure your material is flat with honeycomb pin clamps.`
        };
    }

    // ─── 2. ENGRAVING TROUBLESHOOTING ──────────────────────────────────
    if (q.includes('engrav') || q.includes('dark') || q.includes('burn') || q.includes('black') || q.includes('smoke')) {
        return {
            content: `### ⚡ Laser Engraving Quality & Burn Troubleshooting

If your engraving appears too dark, burnt, or fuzzy:

1. **Increase Speed & Reduce Power**:
   - High power at slow speed charrs the wood fibers. Try raising speed by 25% and reducing power to 15–20%.
2. **Use Air Assist at LOW Pressure**:
   - Heavy air assist blows ash into the micro-grooves. Use light air assist to clear smoke without driving residue into the wood grain.
3. **Defocus slightly (+1mm to +2mm)**:
   - Defocusing creates a slightly wider beam waist for smoother raster fills without line gaps.
4. **Use Painter's Tape / Masking**:
   - Apply paper masking tape over the wood before engraving to catch smoke halos, then peel post-engrave.`
        };
    }

    // ─── 3. PRICING & COST CALCULATION ─────────────────────────────────
    if (q.includes('price') || q.includes('cost') || q.includes('quote') || q.includes('calc') || q.includes('money') || q.includes('charge')) {
        return {
            content: `### 💰 How to Price Laser & CNC Workshop Projects

To guarantee profitability for your workshop, use this industry formula (available in your **0machine Cost Calculator**):

$$\\text{Total Price} = (\\text{Material Cost} \\times 1.25) + (\\text{Machine Time (hrs)} \\times \\text{Hourly Rate}) + \\text{Design/Prep Fee}$$

• **Material Cost + 25% Markup**: Covers waste, handling, and shipping.
• **Machine Hourly Rate**: $45 - $85/hr (includes electricity, tube wear, exhaust filters).
• **Vector File Setup**: $15 - $35 flat fee for file cleaning & nesting.

👉 You can use the **Cost Calculator** tab in 0machine to auto-calculate instant quotes with exact kerf yield!`
        };
    }

    // ─── 4. ACRYLIC CUTTING & ENGRAVING ────────────────────────────────
    if (q.includes('acrylic') || q.includes('plexiglass') || q.includes('perspex')) {
        return {
            content: `### 🎯 Acrylic (PMMA) Laser Processing Settings

• **Cast Acrylic vs. Extruded**:
  - **Cast Acrylic**: Best for frosted white engraving and clean flame-polished cut edges.
  - **Extruded Acrylic**: Cuts fast, but melts and engraves clear/grey (not bright white).

• **Cutting 3mm Acrylic (CO2 80W)**:
  - Speed: 15 mm/s
  - Power: 60%
  - Frequency: 5000 - 10000 Hz
  - Air Assist: LOW (prevents frosty edges)

• **Engraving Acrylic**:
  - Mirror/Reverse engrave on the back side of clear acrylic for a smooth front surface!`
        };
    }

    // ─── 5. CNC FEEDS & SPEEDS ─────────────────────────────────────────
    if (q.includes('cnc') || q.includes('feed') || q.includes('speed') || q.includes('rpm') || q.includes('spindle') || q.includes('bit')) {
        return {
            content: `### 🔧 CNC Router Feeds & Speeds for Woodworking

• **Softwood / MDF (1/4" Compression Bit)**:
  - Spindle Speed: 18,000 RPM
  - Feed Rate: 150 - 200 inches/min (3800 - 5000 mm/min)
  - Pass Depth: 0.25" (1x D)

• **Hardwood (Oak / Walnut - 1/4" Downcut Bit)**:
  - Spindle Speed: 16,000 RPM
  - Feed Rate: 100 - 120 inches/min (2500 - 3000 mm/min)
  - Pass Depth: 0.125" (0.5x D)

💡 **Bit Selection**: Use *Downcut* bits for clean top surfaces, *Upcut* bits for deep pocket chip evacuation, and *Compression* bits for double-sided clean edges on sheet goods.`
        };
    }

    // ─── DEFAULT GENERAL EXPERT RESPONSE ────────────────────────────────
    return {
        content: `### 🤖 0machine Laser & Workshop Technical Guide

I am ready to assist with your workshop operations. Here are areas I can help with right now:

1. **Laser Cutting & Engraving Parameters**: CO2, Diode & Fiber laser speed/power settings for plywood, MDF, acrylic, leather, and hardwoods.
2. **Troubleshooting**: Fixing burn marks, tube alignment issues, lens focus, kerf gaps, and air assist optimization.
3. **0machine Workshop Tools**: Calculating quotes in **Cost Calculator**, estimating sheet yield in **Nesting Estimator**, and managing materials.
4. **CNC Routers**: Spindle RPM, feed rates, pass depths, and bit selection (upcut/downcut/compression).

What specific material or machine setting would you like me to analyze?`
    };
}
