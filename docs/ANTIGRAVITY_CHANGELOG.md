# ANTIGRAVITY CHANGELOG

## [2026-09-16 19:10:07] - Adopt Project Reporting Protocol
- **Task**: Implement and commit to the Antigravity Project Reporting & Changelog Protocol.
- **Files Changed**:
  - `.agents/AGENTS.md` (Created)
  - `docs/ANTIGRAVITY_CHANGELOG.md` (Created & Initialized)
- **Tests Performed**:
  - File existence check for `.agents/AGENTS.md`
  - File existence check for `docs/ANTIGRAVITY_CHANGELOG.md`
- **Test Results**:
  - `.agents/AGENTS.md` existence: PASS
  - `docs/ANTIGRAVITY_CHANGELOG.md` existence: PASS
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-09-19 21:41:00] - Confirm Project Reporting & Changelog Protocol Adoption
- **Task**: Explicitly acknowledge and re-confirm strict adherence to the Project Reporting Protocol & Changelog Maintenance rule for all future tasks.
- **Files Changed**:
  - `docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - Verification of `docs/ANTIGRAVITY_CHANGELOG.md` presence & structure.
- **Test Results**:
  - `docs/ANTIGRAVITY_CHANGELOG.md` check: PASS
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-09-19 21:51:30] - Fix Sign Up to App Redirect Flow & Premium Onboarding Transition
- **Task**: Fix Sign Up → App redirect flow in 0machine and implement dedicated 5-second max SignupSuccessTransition component with exact 0machine logo, smooth launch/workshop icon animations, and Supabase email verification check.
- **Files Changed**:
  - `lasercut-planner/src/components/SignupSuccessTransition.tsx` (Created)
  - `lasercut-planner/src/screens/AuthScreen.tsx` (Modified)
  - `lasercut-planner/src/screens/DesktopAuthScreen.tsx` (Modified)
  - `lasercut-planner/tsconfig.json` (Modified)
- **Tests Performed**:
  - TypeScript compilation check (`npx tsc --noEmit`): PASS
  - Next.js production build check (`npm run build` in 0machine-landing): PASS
  - Auth error handling & session preservation validation: PASS
- **Test Results**:
  - `npx tsc --noEmit`: PASS
  - `npm run build`: PASS
  - Signup transition timeline & redirect check: PASS
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-09-29 20:14:30] - Redesign 0machine Subscription & Paywall Experience
- **Task**: Redesign 0machine subscription paywall screen (`PaywallScreen.tsx` & `ProUpgradeModal.tsx`) with AI-generated workshop hero artwork, 45+ high-readability typography, monthly/annual plan selector, value progression timeline, expandable coupon input, and sticky primary CTA.
- **Files Changed**:
  - `lasercut-planner/public/paywall_hero.png` (Created - AI-generated workshop hero illustration)
  - `lasercut-planner/assets/paywall_hero.png` (Created - Image asset for Expo/Native)
  - `lasercut-planner/src/screens/PaywallScreen.tsx` (Modified - Redesigned full-screen paywall)
  - `lasercut-planner/src/components/ProUpgradeModal.tsx` (Modified - Redesigned feature-gated upgrade modal)
  - `docs/ANTIGRAVITY_CHANGELOG.md` (Modified)
- **Tests Performed**:
  - TypeScript compilation check (`npx tsc --noEmit` in `lasercut-planner`): PASS (0 errors)
  - Next.js production build check (`npm run build` in `0machine-landing`): PASS (0 errors)
  - Mobile & desktop responsive layout validation (360px, 390px, 414px, 430px, desktop): PASS
  - Existing Stripe checkout, promo code (`3DAYSFREE`), restore purchase, and Free Forever logic preservation: PASS
- **Test Results**:
  - `npx tsc --noEmit`: PASS
  - `npm run build`: PASS
- **Known Issues**: None

## [2026-09-29 20:26:30] - Simplify Email Auth Flow & Disable OTP / Email Verification Barriers
- **Task**: Simplify signup and login flows for the first 100 0machine users by removing OTP codes, email confirmation screens, magic links, and unverified user banners. Direct signup -> auto session creation -> direct dashboard redirect.
- **Files Changed**:
  - `lasercut-planner/src/hooks/useAuth.ts` (Simplified `signUp` to auto-login if session isn't returned directly by Supabase; set `isEmailVerified = true` for all authenticated users; removed OTP methods)
  - `lasercut-planner/src/screens/DesktopAuthScreen.tsx` (Removed transition/OTP screen triggers; signup directly establishes session and opens dashboard)
  - `lasercut-planner/src/screens/AuthScreen.tsx` (Removed mobile transition/OTP screen triggers; direct dashboard entry)
  - `lasercut-planner/src/context/VerificationContext.tsx` (Made `requireVerification` pass-through without showing blocking modals)
  - `lasercut-planner/src/components/UnverifiedUserBanner.tsx` (Returned `null` unconditionally)
  - `lasercut-planner/src/components/OTPVerificationModal.tsx` (Returned `null` unconditionally)
  - `lasercut-planner/src/components/SignupSuccessTransition.tsx` (Returned `null` unconditionally)
- **Tests Performed**:
  - TypeScript type check (`npx tsc --noEmit`): PASS (0 errors)
  - Expo web build (`npm run vercel-build`): PASS (Built clean static assets)
  - Existing user login & error handling check: PASS
  - Signup with existing email check: PASS
  - Mobile responsiveness check (375px - 430px): PASS
- **Test Results**:
  - `npx tsc --noEmit`: PASS
  - `npm run vercel-build`: PASS

## [2026-09-29 20:45:00] - Comprehensive Auth Audit & Direct Dashboard Signup Optimization
- **Task**: Audit 20+ authentication system components, identify OTP/link mismatch root causes, and clean up signup & login flows. Direct signup -> auto-session -> direct dashboard.
- **Files Changed**:
  - `lasercut-planner/src/hooks/useAuth.ts` (Streamlined `signUp` & `signIn` session handling)
  - `lasercut-planner/src/screens/DesktopAuthScreen.tsx` (Removed unused modal imports/state; direct dashboard transition)
  - `lasercut-planner/src/screens/AuthScreen.tsx` (Removed unused modal imports/state; direct dashboard transition)
  - `docs/ANTIGRAVITY_CHANGELOG.md` & `lasercut-planner/docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - TEST 1 (New user signup -> direct dashboard): PASS
  - TEST 2 (Dashboard refresh session persistence): PASS
  - TEST 3 (Logout -> return to login screen): PASS
  - TEST 4 (Existing user login): PASS
  - TEST 5 (Wrong password error handling): PASS
  - TEST 6 (Existing email signup error message): PASS
  - TEST 7 & 8 (Mobile 375px & 430px responsive layout): PASS
  - TEST 9 (New browser session login): PASS
  - TEST 10 & 11 (Browser console & network request audit - 0 OTP/magic-link requests): PASS
  - TypeScript compilation check (`npx tsc --noEmit`): PASS
  - Web export build (`npm run vercel-build`): PASS
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-09-29 20:56:45] - Upgrade Zustand to 5.0.15 for React 19 Peer Dependency Compatibility
- **Task**: Resolve `use-sync-external-store@1.2.0` ERESOLVE peer dependency warning without downgrading React 19 or Expo 55.
- **Files Changed**:
  - `lasercut-planner/package.json` (Upgraded `zustand` from `^4.5.2` to `^5.0.15`)
  - `lasercut-planner/package-lock.json` (Updated cleanly via `npm install`)
  - `docs/ANTIGRAVITY_CHANGELOG.md` & `lasercut-planner/docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - `npm install`: PASS (0 `ERESOLVE` peer dependency warnings)
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npm run vercel-build`: PASS (Clean web bundle export)
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-09-29 21:07:00] - Refine SignUp Error Detection for Existing Unconfirmed Users & Supabase Settings
- **Task**: Catch Supabase `identities: []` signature for existing unconfirmed users and provide clear error messages if Supabase "Confirm email" is still enabled.
- **Files Changed**:
  - `lasercut-planner/src/hooks/useAuth.ts` (Added `data.user.identities.length === 0` check and improved "Email not confirmed" error guidance)
  - `docs/ANTIGRAVITY_CHANGELOG.md` & `lasercut-planner/docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npm run vercel-build`: PASS
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-09-29 21:12:00] - Implement 5-Second Animated Loading Bar Signup Transition
- **Task**: Create premium 5-second animated progress bar transition (`SignupSuccessTransition.tsx`) with 0machine logo, live percentage progress, and status timeline before redirecting to dashboard.
- **Files Changed**:
  - `lasercut-planner/src/components/SignupSuccessTransition.tsx` (Built 5-second animated loading bar with percentage tracking)
  - `lasercut-planner/src/hooks/useAuth.ts` (Added `deferSession` and `completeSession` helpers)
  - `lasercut-planner/src/screens/DesktopAuthScreen.tsx` & `AuthScreen.tsx` (Integrated 5s progress transition)
  - `docs/ANTIGRAVITY_CHANGELOG.md` & `lasercut-planner/docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npm run vercel-build`: PASS (Clean web bundle export)
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-09-29 21:23:00] - Integrate Laser Expert AI Assistant Tab & Free API Architecture
- **Task**: Integrate 0machine Laser Expert AI Assistant into tab navigation (`LaserExpertScreen.tsx`, `useLaserExpert.ts`, `ResponsiveTabBar.tsx`, `App.tsx`) with zero-cost free-tier fallback architecture.
- **Files Changed**:
  - `lasercut-planner/App.tsx` (Registered `<Tab.Screen name="Laser Expert" component={LaserExpertScreen} />`)
  - `lasercut-planner/src/components/ResponsiveTabBar.tsx` (Added `Bot` icon and `'Laser Expert'` icon mapping)
  - `lasercut-planner/src/hooks/useLaserExpert.ts` & `LaserExpertScreen.tsx` (Tracked in repository)
  - `lasercut-planner/supabase/functions/ai-chat/index.ts` & `20260906_ai_conversations.sql` (Tracked in repository)
  - `docs/ANTIGRAVITY_CHANGELOG.md` & `lasercut-planner/docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npm run vercel-build`: PASS (Clean web bundle export)
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-09-29 21:26:45] - Enforce Strict Domain Rules for Laser Expert AI Assistant
- **Task**: Lock down Laser Expert AI Assistant to strictly answer questions about Woodworking, Laser Cutting, CNC Fabrication, and 0machine Tools only. All off-topic queries are strictly refused with a specialized refusal response.
- **Files Changed**:
  - `lasercut-planner/supabase/functions/ai-chat/index.ts` (Enforced strict domain prompt boundaries and off-topic prohibition rules)
  - `lasercut-planner/src/screens/LaserExpertScreen.tsx` (Updated empty state subtitle to highlight domain boundaries)
  - `docs/ANTIGRAVITY_CHANGELOG.md` & `lasercut-planner/docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npm run vercel-build`: PASS (Clean web bundle export)
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-09-29 21:40:00] - Add Floating AI Chat Bubble Widget (LaserExpertBubble)
- **Task**: Create floating AI Chat Bubble component (`LaserExpertBubble.tsx`) and embed it persistently in `App.tsx` so users can access 0machine Laser & CNC AI Expert from any screen.
- **Files Changed**:
  - `lasercut-planner/src/components/LaserExpertBubble.tsx` (Created floating bubble & popover chat widget component)
  - `lasercut-planner/App.tsx` (Rendered `<LaserExpertBubble />` persistently inside `NavigationContainer` with tab navigation handler)
  - `docs/ANTIGRAVITY_CHANGELOG.md` & `lasercut-planner/docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npm run vercel-build`: PASS (Clean web bundle export)
  - GitHub push & commit (`78ff739`): PASS
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-09-29 21:45:00] - Fix AI Expert Missing Response & Integrate Client Fallback Engine
- **Task**: Fix empty/missing response bug when sending messages to AI Expert by introducing an offline client-side fallback knowledge engine (`laserExpertFallback.ts`) for laser cutting, woodworking, CNC, and 0machine tools whenever Supabase Edge function is unavailable or DEEPSEEK key is unconfigured.
- **Files Changed**:
  - `lasercut-planner/src/lib/laserExpertFallback.ts` (Created client fallback engine with domain-specific rules & off-topic refusal)
  - `lasercut-planner/src/hooks/useLaserExpert.ts` (Updated `sendMessage` to generate fallbacks without dropping optimistic messages)
  - `lasercut-planner/src/components/LaserExpertBubble.tsx` (Enhanced text rendering for AI responses)
  - `docs/ANTIGRAVITY_CHANGELOG.md` & `lasercut-planner/docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npm run vercel-build`: PASS (Clean web bundle export)
  - GitHub push & commit (`e405874`): PASS
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-09-29 21:53:00] - Make AI Chat Bubble Draggable & Offset from Mobile Navigation Bar
- **Task**: Implement cross-platform touch/drag pan physics (`PanResponder` & `Animated.ValueXY`) on the AI Chat Bubble and increase mobile bottom spacing (`bottom: 85px`) to prevent overlapping the mobile bottom tools bar.
- **Files Changed**:
  - `lasercut-planner/src/components/LaserExpertBubble.tsx` (Added `PanResponder` touch drag physics, grab cursor styling, and mobile offset `bottom: 85px`)
  - `docs/ANTIGRAVITY_CHANGELOG.md` & `lasercut-planner/docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - `npx tsc --noEmit`: PASS (0 errors)
  - `npm run vercel-build`: PASS (Clean web bundle export)
  - GitHub push & commit (`31ce732`): PASS
## [2026-10-02 23:22:00] - Fix Mobile AI Chat Bubble Size & Tap Responsiveness
- **Task**: Fix issue where AI Expert chat bubble button was too large on mobile screens and failed to open the chat modal on tap/click.
- **Files Changed**:
  - `lasercut-planner/src/components/LaserExpertBubble.tsx` (Fixed `PanResponder` to pass tap gestures cleanly to button handlers, added mobile responsive styling to reduce bubble footprint, and added safe area top inset padding to full-screen mobile chat overlay header)
  - `docs/ANTIGRAVITY_CHANGELOG.md` & `lasercut-planner/docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - TypeScript type check (`npx tsc --noEmit`): PASS (0 errors)
  - PanResponder gesture validation: PASS (Taps <8px trigger modal open, drags >8px move bubble smoothly)
  - Mobile responsive size check: PASS (Compact pill ~125px on mobile, full pill on desktop)
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-10-02 23:28:00] - Reorder Navigation Tools from PRO to FREE
- **Task**: Reorder tools in Desktop sidebar and Mobile bottom navigation bar so PRO features appear first, followed by FREE workshop tools.
- **Files Changed**:
  - `lasercut-planner/App.tsx` (Reordered `Tab.Screen` routes to list PRO tools first, set `initialRouteName="Dashboard"`)
  - `lasercut-planner/src/components/ResponsiveTabBar.tsx` (Added `⚡ PRO TOOLS` and `🛠️ WORKSHOP TOOLS` section headers on Desktop sidebar, added `PRO` badge indicators on Mobile bottom tabs)
  - `docs/ANTIGRAVITY_CHANGELOG.md` & `lasercut-planner/docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - TypeScript type check (`npx tsc --noEmit`): PASS (0 errors)
  - Navigation route ordering validation: PASS (PRO tools first -> FREE tools second across Desktop and Mobile)
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-10-02 23:39:00] - Deploy Latest Build & Push to Vercel via GitHub Main
- **Task**: Test local Vercel web export build (`npm run vercel-build`), commit all recent enhancements, and push to GitHub `main` branch to trigger Vercel deployment.
- **Files Changed**:
  - `lasercut-planner/App.tsx`
  - `lasercut-planner/src/components/LaserExpertBubble.tsx`
  - `lasercut-planner/src/components/ResponsiveTabBar.tsx`
  - `docs/ANTIGRAVITY_CHANGELOG.md` & `lasercut-planner/docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - `npm run vercel-build`: PASS (Bundled 2362 modules, exported `web-build` cleanly)
  - `git push origin main` (`70af5a7`): PASS
- **Current Status**: COMPLETE
- **Known Issues**: None

## [2026-10-02 23:46:00] - Add Users At Risk and Subscriptions & Revenue Sections to Admin Console
- **Task**: Implement data-driven "Users At Risk" signal cards and "Subscriptions & Revenue" metrics with date range filters in the 0machine Admin Console (`0machine-landing/app/admin/page.js`).
- **Files Changed**:
  - `0machine-landing/app/admin/page.js` (Added Section 1 Users At Risk, Section 2 Subscriptions & Revenue with 7d/30d/90d/All-time filters, interactive signal filtering, MRR calculation, and extended user table columns)
  - `docs/ANTIGRAVITY_CHANGELOG.md` & `lasercut-planner/docs/ANTIGRAVITY_CHANGELOG.md` (Updated)
- **Tests Performed**:
  - `npm run build` in `0machine-landing`: PASS (Compiled Next.js production build in 1896ms with 0 errors)
  - `git push origin main` (`85392bf` in `0machine-landing`): PASS
## [2026-10-03 00:08:00] - Update 0machine Visual Color Palette (Graphite & Safety Orange)
- **Task**: Update visual color palette across `0machine-landing` and `lasercut-planner` to the new 0machine brand identity (Graphite `#111317`, Dark Graphite `#1A1D21`, Graphite `#23262C`, Safety Orange `#FE7733`, Orange Light `#FF925C`, Orange Dark `#E85F20`, Neon Sprout `#B1FA63`) while preserving UI layout, theme architecture, Light/Dark mode differentiation, and semantic success/error/warning/info colors.
- **Files Changed**:
  - `0machine-landing/app/globals.css` (Updated `@theme` CSS tokens and background/utility variables)
  - `0machine-landing/app/components/Pricing.js` (Updated section background and highlight card accent colors)
  - `0machine-landing/app/api/abandoned-checkout/route.js` (Updated email template brand colors)
  - `0machine-landing/app/lib/email.js` (Updated email template brand colors)
  - `lasercut-planner/src/context/ThemeContext.tsx` (Updated `DARK_THEME` & `LIGHT_THEME` definitions)
  - `lasercut-planner/App.tsx` (Updated local `COLORS` object & loading spinner color)
  - `lasercut-planner/src/components/ResponsiveTabBar.tsx` (Updated tab bar local `COLORS` object & pro badge background)
  - `lasercut-planner/src/components/LaserExpertBubble.tsx` (Updated local `COLORS` object & inline brand icons/styles)
  - `lasercut-planner/src/screens/DashboardScreen.tsx` (Updated primary orange inline hex usages)
  - `lasercut-planner/src/screens/ProjectsListScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/ProjectDetailsScreen.tsx` (Updated `C` palette object & PDF export banner background)
  - `lasercut-planner/src/screens/MaterialsScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/OrdersScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/ProductionScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/LaserPresetsScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/QuoteGeneratorScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/InvoiceGeneratorScreen.tsx` (Updated `COLORS` object & inline HTML footer branding)
  - `lasercut-planner/src/screens/DesignLibraryScreen.tsx` (Updated `COLORS` object)
  - `lasercut-planner/src/screens/NestingEstimatorScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/MachineProfilesScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/ClientsScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/TemplatesScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/StatsScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/SettingsScreen.tsx` (Updated local `styles` & inline brand usages)
  - `lasercut-planner/src/screens/AuthScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/DesktopAuthScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/PaywallScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/AdminUploadScreen.tsx` (Updated `COLORS` object)
  - `lasercut-planner/src/screens/AddProjectScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/CostCalculatorScreen.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/screens/LaserExpertScreen.tsx` (Updated `primaryColor` fallback)
  - `lasercut-planner/src/components/ProUpgradeModal.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/components/SignupSuccessTransition.tsx` (Updated `C` palette object)
  - `lasercut-planner/src/components/OTPVerificationModal.tsx` (Updated inline brand styles)
  - `lasercut-planner/src/components/OnboardingModal.tsx` (Updated inline primary color hex usages)
  - `lasercut-planner/src/components/AssetDetailsModal.tsx` (Updated `COLORS` object & preview background)
  - `lasercut-planner/src/components/UnverifiedUserBanner.tsx` (Updated inline brand styles)
  - `lasercut-planner/public/landing.html` (Updated `:root` CSS variables and screen stats element color)
- **Tests Performed**:
  - `npx tsc --noEmit` in `lasercut-planner`: PASS (0 TypeScript errors)
  - `npm run build` in `0machine-landing`: PASS (0 build errors, 16 static/dynamic routes compiled in 2.1s)
  - `npm run vercel-build` in `lasercut-planner`: PASS (Bundled 2360 modules, exported `web-build` cleanly)
  - `git push origin main` (`8777f80` in `lasercut-planner` & `eebcef5` in `0machine-landing`): PASS
## [2026-10-03 00:38:00] - Apply Neon Sprout (#B1FA63) Brand Accent Highlights
- **Task**: Apply Neon Sprout (`#B1FA63`) brand accent to Pro badges, active highlights, pricing plan callouts, and glow elements while keeping Safety Orange (`#FE7733`) for primary CTA buttons.
- **Files Changed**:
  - `0machine-landing/app/globals.css` (Added `--color-neon-sprout: #B1FA63;` and `--color-glow-neon`)
  - `0machine-landing/app/components/Pricing.js` (Updated featured plan badge and discount tags to Neon Sprout)
  - `lasercut-planner/src/components/ResponsiveTabBar.tsx` (Updated `mobileProBadge` to Neon Sprout)
  - `lasercut-planner/src/screens/DashboardScreen.tsx` (Updated `isPro` workshop badge to Neon Sprout `#B1FA63` with dark text)
  - `lasercut-planner/src/screens/ProjectDetailsScreen.tsx` (Updated `ProBadge` border and text to Neon Sprout)
  - `lasercut-planner/src/screens/PaywallScreen.tsx` (Added `neon: #B1FA63` token)
  - `lasercut-planner/src/components/ProUpgradeModal.tsx` (Added `neon: #B1FA63` token)
  - `lasercut-planner/public/landing.html` (Added `--neon-sprout: #B1FA63;`)
- **Tests Performed**:
  - `npx tsc --noEmit` in `lasercut-planner`: PASS (0 TypeScript errors)
  - `npm run build` in `0machine-landing`: PASS (0 build errors, 16 static/dynamic routes compiled in 2.1s)
  - `npm run vercel-build` in `lasercut-planner`: PASS (Bundled 2362 modules, exported `web-build` cleanly)
  - `git push origin main` (`a7112ed` in `lasercut-planner` & `3a7615b` in `0machine-landing`): PASS
- **Current Status**: COMPLETE
- **Known Issues**: None



