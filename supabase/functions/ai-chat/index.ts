// supabase/functions/ai-chat/index.ts
// 0machine Laser Expert — DeepSeek AI Proxy Edge Function
// Architecture: Browser → supabase.functions.invoke('ai-chat') → DeepSeek API

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.98.0';
import { corsHeaders } from '../_shared/cors.ts';

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY') || '';
const DEEPSEEK_MODEL = Deno.env.get('DEEPSEEK_MODEL') || 'deepseek-chat';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// DeepSeek pricing (per 1M tokens) — configurable, not hardcoded in frontend
const PRICING = {
  input_price_per_1m: 0.27,   // DeepSeek Chat input
  output_price_per_1m: 1.10,  // DeepSeek Chat output
};

// Usage limits by plan
const PLAN_LIMITS: Record<string, { monthly: number; hourly: number }> = {
  free:    { monthly: 50,   hourly: 15  },
  starter: { monthly: 500,  hourly: 60  },
  pro:     { monthly: 5000, hourly: 200 },
};

// Max context messages sent to the model
const MAX_CONTEXT_MESSAGES = 20;

// Max user message length (characters)
const MAX_MESSAGE_LENGTH = 8000;

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are 0machine Laser & Workshop Expert — a specialized AI assistant built exclusively for 0machine, the all-in-one operating system for laser cutting, woodworking, and CNC workshops.

## STRICT DOMAIN BOUNDARIES — MANDATORY
You are STRICTLY LIMITED to the following topics ONLY:
1. **Laser Cutting & Engraving**: CO2 lasers, Fiber lasers, Diode lasers, LightBurn, LaserGRBL, speed/power/passes/frequency/air assist/lens focus/kerf settings, material testing, tube alignment, laser maintenance, laser safety.
2. **Woodworking & Carpentry**: Plywood (Baltic birch, commercial), MDF, hardwoods, softwoods, veneers, joinery, sanding, finishing, kerf bending, wood moisture, sheet usage, nesting optimization.
3. **CNC Fabrication**: CNC routers, spindle RPM, feed rates, plunge rates, end mills (upcut/downcut/compression), toolpaths, clearance, hold-down jigs, spoilboards.
4. **CAD/CAM Vector Design for Fabrication**: DXF, SVG, CDR, EPS, AI file formatting, node editing, tab placement, kerf compensation, vector optimization.
5. **0machine Platform & Workshop Tools**:
   - 0machine Cost Calculator (live material parsing, hourly rates, margin calculation)
   - 0machine Materials Inventory & Stock Tracker
   - 0machine Laser Presets & Machine Library
   - 0machine Nesting Estimator & Sheet Yield
   - 0machine Quote & Invoice Generators
   - 0machine Orders, Client Matching & Production Tracking

## STRICT PROHIBITION ON OUT-OF-SCOPE TOPICS
If the user asks ANY question outside of Woodworking, Laser Cutting, CNC Fabrication, Vector Design for Lasers/CNC, or 0machine tools (for example: general coding, web development, general math/science homework, politics, religion, sports, movies, cooking/recipes, health/medical, relationships, gaming, personal advice, finance/crypto, general news, travel):

You MUST respond ONLY with this exact message (translated into the user's language if not English):
"I am specialized exclusively in laser cutting, woodworking, CNC fabrication, and 0machine tools. I cannot assist with unrelated topics."

Do NOT attempt to answer any part of the off-topic prompt. Stop immediately.

## Behavior & Response Format
- Be direct, technical, and production-focused.
- Go straight to the answer without fluff or filler openers like "Sure!", "Great question!", "As an AI...".
- For machine laser settings, present data clearly:
  • Machine / Laser Type: [e.g., 80W CO2 Laser]
  • Material: [e.g., 6mm Baltic Birch Plywood]
  • Operation: [Cut / Engrave / Score]
  • Starting Speed: [mm/s]
  • Starting Power: [%]
  • Passes: [1, 2, etc.]
  • Air Assist: [ON / HIGH]
  • Note: Always test starting parameters on scrap material first.

## Safety & Accuracy
- Never guess machine specs or material settings. Recommend scrap material tests.
- Emphasize ventilation, fume extraction, and MSDS safety when working with hazardous materials (e.g. NEVER laser cut PVC/Vinyl due to toxic chlorine gas).
- Match the user's language naturally (English, French, Moroccan Darija, Arabic, Spanish).`;

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function generateRequestId(): string {
  return 'req_' + crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

function calculateCost(inputTokens: number, outputTokens: number) {
  const inputCost = (inputTokens / 1_000_000) * PRICING.input_price_per_1m;
  const outputCost = (outputTokens / 1_000_000) * PRICING.output_price_per_1m;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // ─── 1. AUTHENTICATE ───────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing authorization', 401);
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create Supabase client with user's JWT for auth verification
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const userId = user.id;

    // ─── 2. VALIDATE REQUEST ───────────────────────────────────────
    let body: { conversation_id?: string; message?: string };
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid request body', 400);
    }

    const { conversation_id, message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return errorResponse('Message is required', 400);
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return errorResponse(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`, 400);
    }

    // ─── 3. GET USER PLAN ──────────────────────────────────────────
    const { data: userSettings } = await supabaseAdmin
      .from('user_settings')
      .select('plan, subscription_status')
      .eq('user_id', userId)
      .single();

    // Admin override
    const userEmail = user.email?.toLowerCase() || '';
    const isAdmin = userEmail.endsWith('@0machine.com') ||
                    userEmail.endsWith('@cooldelo.com') ||
                    userEmail === 'anouarkharbache@gmail.com' ||
                    userEmail === 'cooldelodxf@gmail.com';

    let plan = 'free';
    if (isAdmin) {
      plan = 'pro';
    } else if (userSettings) {
      const status = userSettings.subscription_status;
      if (status === 'active' || status === 'trialing') {
        plan = userSettings.plan || 'pro';
      }
    }

    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // ─── 4. CHECK RATE LIMITS ──────────────────────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: hourlyCount } = await supabaseAdmin
      .from('ai_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo);

    if ((hourlyCount || 0) >= limits.hourly) {
      return errorResponse(
        'Rate limit exceeded. Please wait before sending more messages.',
        429
      );
    }

    // ─── 5. CHECK MONTHLY USAGE ────────────────────────────────────
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: monthlyCount } = await supabaseAdmin
      .from('ai_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString());

    if ((monthlyCount || 0) >= limits.monthly) {
      const upgradeMsg = plan === 'pro'
        ? 'You have reached your monthly AI usage limit.'
        : 'You have reached your monthly AI usage limit. Upgrade your plan for more messages.';
      return errorResponse(upgradeMsg, 429);
    }

    // ─── 6. RESOLVE CONVERSATION ───────────────────────────────────
    let conversationId = conversation_id;

    if (conversationId) {
      // Verify the conversation belongs to this user
      const { data: conv, error: convError } = await supabaseAdmin
        .from('ai_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convError || !conv) {
        return errorResponse('Conversation not found', 404);
      }
    } else {
      // Create a new conversation
      const title = message.trim().slice(0, 80) + (message.length > 80 ? '...' : '');
      const { data: newConv, error: newConvError } = await supabaseAdmin
        .from('ai_conversations')
        .insert({ user_id: userId, title })
        .select('id')
        .single();

      if (newConvError || !newConv) {
        console.error('[ai-chat] Failed to create conversation:', newConvError);
        return errorResponse('Failed to create conversation', 500);
      }

      conversationId = newConv.id;
    }

    // ─── 7. SAVE USER MESSAGE ──────────────────────────────────────
    await supabaseAdmin.from('ai_messages').insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'user',
      content: message.trim(),
    });

    // ─── 8. LOAD CONVERSATION HISTORY ──────────────────────────────
    const { data: historyMessages } = await supabaseAdmin
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(MAX_CONTEXT_MESSAGES + 1); // +1 because we just inserted the user msg

    // Build messages array for DeepSeek
    const contextMessages: Array<{ role: string; content: string }> = [];

    if (historyMessages && historyMessages.length > MAX_CONTEXT_MESSAGES) {
      // Take the most recent messages
      const recent = historyMessages.slice(-MAX_CONTEXT_MESSAGES);
      for (const msg of recent) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          contextMessages.push({ role: msg.role, content: msg.content });
        }
      }
    } else if (historyMessages) {
      for (const msg of historyMessages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          contextMessages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // ─── 9. LOAD USER CONTEXT (minimum necessary) ──────────────────
    let userContext = '';

    // Machine profiles
    const { data: machines } = await supabaseAdmin
      .from('machine_profiles')
      .select('name, type, power, speed, notes')
      .eq('user_id', userId)
      .limit(3);

    if (machines && machines.length > 0) {
      userContext += '\n\n[User Machine Profiles]\n';
      for (const m of machines) {
        userContext += `- ${m.name} | Type: ${m.type || 'N/A'} | Power: ${m.power || 'N/A'}W | Speed: ${m.speed || 'N/A'}mm/s`;
        if (m.notes) userContext += ` | Notes: ${m.notes}`;
        userContext += '\n';
      }
    }

    // Materials (summary only, not full inventory)
    const { data: materials } = await supabaseAdmin
      .from('materials')
      .select('name, type, thickness, cost_per_unit')
      .eq('user_id', userId)
      .limit(10);

    if (materials && materials.length > 0) {
      userContext += '\n[User Material Library]\n';
      for (const mat of materials) {
        userContext += `- ${mat.name} | ${mat.type} | ${mat.thickness}mm | $${mat.cost_per_unit}/unit\n`;
      }
    }

    // Build final system prompt with user context
    let finalSystemPrompt = SYSTEM_PROMPT;
    if (userContext.trim()) {
      finalSystemPrompt += `\n\n## User Context (from their 0machine account — use when relevant, never invent data beyond this)${userContext}`;
    }

    // ─── 10. CALL DEEPSEEK API ─────────────────────────────────────
    if (!DEEPSEEK_API_KEY) {
      console.error('[ai-chat] DEEPSEEK_API_KEY is not configured');
      return errorResponse('AI service is not configured. Please contact support.', 503);
    }

    const deepseekPayload = {
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        ...contextMessages,
      ],
      max_tokens: 2048,
      temperature: 0.7,
      stream: false,
    };

    let deepseekResponse: Response;
    try {
      deepseekResponse = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(deepseekPayload),
      });
    } catch (fetchError) {
      console.error('[ai-chat] DeepSeek fetch error:', fetchError);
      // Record failed usage
      await supabaseAdmin.from('ai_usage').insert({
        user_id: userId,
        conversation_id: conversationId,
        request_id: requestId,
        model: DEEPSEEK_MODEL,
        provider: 'deepseek',
        feature: 'laser_expert',
        latency_ms: Date.now() - startTime,
        status: 'error',
      });
      return errorResponse(
        'The Laser Expert is temporarily unavailable. Please try again in a moment. Your other 0machine tools are still available.',
        503
      );
    }

    if (!deepseekResponse.ok) {
      const errBody = await deepseekResponse.text().catch(() => 'Unknown error');
      console.error(`[ai-chat] DeepSeek API error ${deepseekResponse.status}:`, errBody);
      // Record failed usage
      await supabaseAdmin.from('ai_usage').insert({
        user_id: userId,
        conversation_id: conversationId,
        request_id: requestId,
        model: DEEPSEEK_MODEL,
        provider: 'deepseek',
        feature: 'laser_expert',
        latency_ms: Date.now() - startTime,
        status: 'error',
      });
      return errorResponse(
        'The Laser Expert is temporarily unavailable. Please try again in a moment. Your other 0machine tools are still available.',
        503
      );
    }

    const deepseekData = await deepseekResponse.json();
    const assistantContent = deepseekData?.choices?.[0]?.message?.content || '';
    const usage = deepseekData?.usage || {};

    if (!assistantContent) {
      return errorResponse('Empty response from AI. Please try again.', 502);
    }

    // ─── 11. SAVE ASSISTANT MESSAGE ────────────────────────────────
    await supabaseAdmin.from('ai_messages').insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'assistant',
      content: assistantContent,
      metadata: {
        model: DEEPSEEK_MODEL,
        request_id: requestId,
        tokens: usage,
      },
    });

    // ─── 12. RECORD USAGE ──────────────────────────────────────────
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || inputTokens + outputTokens;
    const costs = calculateCost(inputTokens, outputTokens);

    await supabaseAdmin.from('ai_usage').insert({
      user_id: userId,
      conversation_id: conversationId,
      request_id: requestId,
      model: DEEPSEEK_MODEL,
      provider: 'deepseek',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      input_cost: costs.inputCost,
      output_cost: costs.outputCost,
      total_cost: costs.totalCost,
      feature: 'laser_expert',
      latency_ms: Date.now() - startTime,
      status: 'success',
    });

    // ─── 13. RETURN RESPONSE ───────────────────────────────────────
    return new Response(
      JSON.stringify({
        conversation_id: conversationId,
        message: {
          role: 'assistant',
          content: assistantContent,
        },
        usage: {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: totalTokens,
        },
        request_id: requestId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(`[ai-chat] Unexpected error [${requestId}]:`, err);
    return errorResponse(
      'The Laser Expert is temporarily unavailable. Please try again in a moment. Your other 0machine tools are still available.',
      500
    );
  }
});
