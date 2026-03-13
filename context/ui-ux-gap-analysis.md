# Launch UI/UX Gap Analysis
> Created: 2026-03-13 | Status: Actively being fixed

## North Stars
1. **labs.google/flow** — Cinematic full-viewport hero, near-black background, massive luminous typography, extreme negative space, pill-shaped CTAs, scroll-driven reveals. Restraint as luxury.
2. **Victor-app gradient buttons** — 5-stop radial gradient with CSS @property animation system, animated gradient border via mask-composite, 0.5s smooth transitions.

## Page-by-Page Audit

### Landing Page (/) — CRITICAL
| Aspect | Before | After (Target) | Gap |
|--------|--------|----------------|-----|
| Hero | 80vh centered text, badge chip, text-7xl | Full-viewport cinematic, text-9xl, hero-glow | CRITICAL |
| Background | Cyan radial gradient overlay | Pure bg-background (near-black) | CRITICAL |
| CTA | Flat bg-primary with cyan glow shadow | GradientButton (5-stop radial, animated border) | CRITICAL |
| Typography | Inter 600, small feeling | Inter 600, massive display with light bleed glow | HIGH |
| Navigation | None | Minimal top bar — logo left, sign-in right | MEDIUM |
| Content sections | FloatingCard grid, "How it Works" | Tab-based capabilities (Research/Create/Launch) | HIGH |
| Scroll behavior | Static | Scroll-reveal with IntersectionObserver | HIGH |
| Footer | None | 3-column with links, copyright | MEDIUM |

### Auth Flow — CRITICAL
| Aspect | Before | After (Target) | Gap |
|--------|--------|----------------|-----|
| Presentation | Modal dialog with Tabs | Full-page /auth route with glass card | CRITICAL |
| Google OAuth | Secondary outline button | Primary GradientButton, most prominent | HIGH |
| Email form | Always visible, tab-based | Collapsed by default, expandable | HIGH |
| Polish | Standard form validation | Smooth transitions, premium feel | MEDIUM |

### Gradient Buttons — HIGH
| Aspect | Before | After (Target) | Gap |
|--------|--------|----------------|-----|
| Gradient | Flat linear bg-gradient | 5-stop radial with @property animation | HIGH |
| Hover | opacity-90 | Full gradient morph, 0.5s transition | HIGH |
| Border | None | Animated linear-gradient via mask-composite | HIGH |

### Protected Pages — Cyan Contamination
| File | Issue | Severity |
|------|-------|----------|
| veritas/strategy/page.tsx | 150+ hardcoded rgba(79,209,255,X) | HIGH |
| veritas/thumbnail/[id]/edit/page.tsx | Inline hex colors (#a855f7, #0f172a) | HIGH |
| landing-pad/editor/page.tsx | from-primary to-cyan-400, cyan shadows | HIGH |
| dashboard/page.tsx | text-blue-400, text-cyan-400 | MEDIUM |
| content-studio/page.tsx | border-cyan-400 | LOW |
| store/architectStore.ts | Legacy palette primary: '#4FD1FF' | LOW |

## Replacement Rules
| Old | New |
|-----|-----|
| rgba(79,209,255,0.X) | rgba(255,255,255,0.X) |
| text-cyan-400 | text-primary |
| border-cyan-400 | border-primary |
| from-cyan-500/20 | from-primary/10 |
| to-cyan-400 | to-primary |
| text-blue-400 | text-primary |
| Colored text-* (green/purple/orange/pink) | text-muted-foreground |

## Additional Scope
- **Rename**: "Launch Pad" → "Launch" globally
- **Resend**: Email auth confirmation via Resend API (replacing Supabase built-in)
