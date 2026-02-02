/**
 * Enterprise Design Guidelines & Component Styling Rules
 * Professional Business Interface Design
 */

/* ============================================================================
   DESIGN PRINCIPLES
   ============================================================================ */

/*
1. CLARITY FIRST
   - Clear hierarchy without visual noise
   - High contrast for readability
   - Generous whitespace

2. MINIMAL & FOCUSED
   - Flat design (no gradients, minimal shadows)
   - Single color accent (professional navy)
   - Neutral backgrounds

3. PROFESSIONAL TONE
   - Clean, geometric shapes
   - Consistent spacing grid (4px)
   - Simple, readable typography

4. EFFICIENCY
   - Predictable layouts
   - Accessible interactions
   - Fast to scan and use

5. TRUST & AUTHORITY
   - Serious color palette (whites, grays, navy)
   - Well-organized information
   - Clear visual hierarchy
*/

/* ============================================================================
   COLOR PALETTE
   ============================================================================ */

/*
PRIMARY COLORS:
- Navy/Dark Blue: #1B2541 (primary900), #3D5A8C (primary600) - Headers, CTAs
- Professional Gray: #4B5563 (neutral600) - Primary text
- White: #FFFFFF - Surfaces, backgrounds

SECONDARY COLORS:
- Light Gray: #F9FAFB - Backgrounds, alt surfaces
- Medium Gray: #D1D5DB - Borders
- Dark Gray: #374151 - Secondary text

STATUS COLORS:
- Success: #059669 - Green, never bright lime
- Warning: #D97706 - Amber, not yellow
- Error: #DC2626 - Red, professional shade
- Info: #0891B2 - Cyan, professional blue

DO NOT USE:
- Bright colors (#FF0000, #00FF00, #FFFF00)
- Gradients or color blends
- Shadows deeper than 2px
- Rounded corners > 8px
- Emojis or illustrations
*/

/* ============================================================================
   TYPOGRAPHY
   ============================================================================ */

/*
FONT: Inter, Roboto, Open Sans (system fallbacks)

SIZE HIERARCHY:
- Page Titles (Page Headers): 28px, bold (900), letter-spacing -0.02em
- Section Titles (Dashboard headers): 20px, semibold (600), letter-spacing 0em
- Card Headers / Subheadings: 16px, semibold (600)
- Body Text / Labels: 14px, normal (400)
- Small Text / Captions: 13px, normal (400), color: gray-500
- Tiny Text / Timestamps: 12px, normal (400), color: gray-400

LINE HEIGHT:
- Headlines: 1.25 (tight)
- Body: 1.5 (normal)
- Relaxed: 1.75 (for longer text)

WEIGHTS: light (300) | normal (400) | medium (500) | semibold (600) | bold (700)

RULES:
- Never mix fonts
- Maximum 3 font sizes per page
- Use letter-spacing only for all-caps labels (+0.05em)
- Use font-weight for hierarchy, not size alone
*/

/* ============================================================================
   SPACING & LAYOUT
   ============================================================================ */

/*
BASE GRID: 4px
Use multiples: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px

MARGINS:
- Element to element: 16px (4)
- Section to section: 24px (6)
- Page padding: 24px (6)
- Group inside card: 12px (3)

PADDING:
- Card padding: 16px (4)
- Button padding X: 16px, Y: 8-12px
- Input padding: 12px X, 8px Y
- Sidebar sections: 12px vertical, 16px horizontal
- Header padding: 16px

GAPS:
- Grid gap: 16px (4)
- Flex item gap: 8px (2) for compact, 16px (4) for loose
- Button groups: 8px (2)

SIDEBAR WIDTH: 256px (constant)
MAX CONTENT WIDTH: 1440px (desktop)
*/

/* ============================================================================
   BORDERS & SHADOWS
   ============================================================================ */

/*
BORDERS:
- Default border: 1px solid #E5E7EB (neutral-200)
- Hover border: 1px solid #D1D5DB (neutral-300)
- Focus border: 1px solid #3D5A8C (primary-600)
- Disabled border: 1px solid #E5E7EB (neutral-200)
- Header/Sidebar border: 1px solid #1F2937 (neutral-800)

BORDER RADIUS:
- Minimal: 3px (xs) - rare, for very small elements
- Default: 4px (md) - buttons, inputs, small cards
- Larger: 6px (lg) - cards, panels
- Large: 8px (xl) - modals, dropdowns
- Full: 9999px (circles, profile pics)

SHADOWS (minimal, professional):
- xs: 0 1px 2px rgba(0,0,0,0.05)
- sm: 0 1px 3px rgba(0,0,0,0.08) - cards, buttons on hover
- md: 0 4px 6px rgba(0,0,0,0.08) - panels
- lg: 0 10px 15px rgba(0,0,0,0.1) - modals, dropdowns
- Never use drop shadows deeper than 10px radius
*/

/* ============================================================================
   BUTTONS
   ============================================================================ */

/*
PRIMARY BUTTON (Main Action):
- Background: #3D5A8C (primary-600)
- Text: white
- Padding: 8px 16px (height 40px)
- Border: none or 1px primary-600
- Border-radius: 4px
- Font: 13px, semibold
- Hover: background #23325A (primary-800)
- Active: background #1B2541 (primary-900)
- Focus: ring 2px #4A6FA5 (primary-500) offset 1px
- Transition: 150ms ease-out
- Cursor: pointer
- Disabled: opacity 50%, cursor not-allowed

SECONDARY BUTTON (Alternative Action):
- Background: white
- Text: #4B5563 (neutral-600)
- Border: 1px #D1D5DB (neutral-300)
- Padding: 8px 16px (height 40px)
- Border-radius: 4px
- Font: 13px, semibold
- Hover: background #F9FAFB (neutral-50), border #9CA3AF (neutral-400)
- Focus: ring 2px #4A6FA5 offset 1px
- Transition: 150ms ease-out

TERTIARY/TEXT BUTTON:
- Background: transparent
- Text: #4A6FA5 (primary-500)
- Border: none
- Padding: 8px 16px
- Font: 13px, semibold
- Hover: background #F0F4F8 (primary-50)
- Focus: ring 2px primary-500 offset 1px

DANGER BUTTON:
- Background: #DC2626 (error-500)
- Text: white
- Hover: #B91C1C (darker red)

STATUS BUTTONS:
- Success: background #059669, hover #047857
- Warning: background #D97706, hover #B45309
- Info: background #0891B2, hover #0679A0

NO GRADIENTS, NO ROUNDED CORNERS > 4px, NO SHADOWS
*/

/* ============================================================================
   INPUTS & FORMS
   ============================================================================ */

/*
TEXT INPUT:
- Background: white
- Border: 1px #D1D5DB (neutral-300)
- Padding: 8px 12px (height 40px total)
- Border-radius: 4px
- Font: 14px
- Placeholder color: #9CA3AF (neutral-400)
- Text color: #1F2937 (neutral-800)
- Focus: ring 2px #4A6FA5 (primary-500), border primary-600
- Disabled: background #F3F4F6 (neutral-100), border #E5E7EB, cursor not-allowed
- Transition: 150ms ease-out

LABEL:
- Font: 13px, semibold (600), #374151 (neutral-700)
- Margin-bottom: 4px
- Display: block

TEXTAREA:
- Same as text input, but no height restriction
- Min-height: 120px recommended

SELECT/DROPDOWN:
- Same as text input styling
- Padding-right: 32px (for arrow icon)
- Arrow color: #6B7280 (neutral-500)

CHECKBOX/RADIO:
- Size: 18px
- Border: 1px #D1D5DB
- Checked: background #3D5A8C (primary-600), border primary-600
- Hover: border #9CA3AF (neutral-400)
- Focus: ring 2px primary-500
- Label-spacing: 8px

FORM LAYOUT:
- Label above input
- 16px gap between form groups
- Use clear error messages below input (color: #DC2626)
- Success state: border #059669, checkmark icon
- Helper text: 12px, color #6B7280 (neutral-500)
*/

/* ============================================================================
   TABLES
   ============================================================================ */

/*
TABLE HEADER:
- Background: #F9FAFB (neutral-50)
- Border-bottom: 1px #E5E7EB (neutral-200)
- Text: 12px, semibold (600), #374151 (neutral-700)
- Padding: 12px 16px
- Uppercase letter-spacing: 0.05em
- Text-align: left (default)

TABLE ROW:
- Background: white
- Border-bottom: 1px rgba(0,0,0,0.04) (very light)
- Text: 14px, normal (400), #4B5563 (neutral-600)
- Padding: 12px 16px
- Height: 44px

ZEBRA STRIPING (optional):
- Even rows: white
- Odd rows: #F9FAFB (neutral-50)

ROW HOVER:
- Background: #F3F4F6 (neutral-100)
- Transition: 150ms ease-out
- Cursor: pointer (if clickable)

COMPACT TABLE:
- Padding: 8px 12px
- Height: 36px
- Font: 13px

FIXED COLUMNS:
- Use for ID, action columns
- Right-align numbers, left-align text/actions

EMPTY STATE:
- Center text: "No data" or "No records found"
- Color: #9CA3AF (neutral-400)
- Padding: 32px top/bottom
- Font-style: italic

SORTING INDICATORS:
- Arrow icon (▲▼) next to header text
- Active: color #3D5A8C (primary-600)
- Inactive: color #D1D5DB (neutral-300)
*/

/* ============================================================================
   CARDS & PANELS
   ============================================================================ */

/*
CARD:
- Background: white
- Border: 1px #E5E7EB (neutral-200)
- Border-radius: 6px
- Padding: 16px
- Shadow: 0 1px 3px rgba(0,0,0,0.08)
- Margin-bottom: 16px

CARD HEADER:
- Font: 16px, semibold (600), #1F2937 (neutral-800)
- Padding-bottom: 12px
- Border-bottom: 1px #E5E7EB (optional)

CARD CONTENT:
- Padding: 12px (internal spacing)
- Font: 14px, normal (400)

CARD FOOTER:
- Padding-top: 12px
- Border-top: 1px #E5E7EB (optional)
- Contains buttons or additional info

PANEL (Sidebar, Modal Side):
- Same as card, but may have darker background (#F9FAFB)
- Used for grouped related information

STATISTICS CARD:
- Larger number: 24px, bold (700), #1F2937
- Label: 13px, normal (400), #6B7280 (neutral-500)
- Padding: 16px
- Can use light colored background (#F0F4F8 for primary)
- Border-left: 3px solid primary color (optional)
*/

/* ============================================================================
   MODALS & DIALOGS
   ============================================================================ */

/*
OVERLAY:
- Background: rgba(0,0,0,0.5)
- Backdrop-filter: optional blur(4px)

MODAL:
- Background: white
- Border: 1px #E5E7EB (neutral-200)
- Border-radius: 8px
- Shadow: 0 20px 25px rgba(0,0,0,0.1)
- Width: 90% (mobile), 600px (desktop)
- Max-width: 90vw
- Padding: 24px

MODAL HEADER:
- Font: 20px, semibold (600), #1F2937
- Border-bottom: 1px #E5E7EB (optional)
- Padding-bottom: 16px
- Close button: top-right, size 24px, color #9CA3AF

MODAL FOOTER:
- Border-top: 1px #E5E7EB
- Padding-top: 16px
- Button spacing: 8px between buttons
- Align: right
- Primary button on right, secondary on left

ALERT/CONFIRMATION:
- Header: bold, 18px
- Message: 14px, #4B5563
- Buttons: Primary (action), Secondary (cancel)
*/

/* ============================================================================
   NAVIGATION & SIDEBAR
   ============================================================================ */

/*
SIDEBAR:
- Width: 256px (fixed)
- Background: #111827 (neutral-900)
- Border-right: 1px #1F2937 (neutral-800)
- Position: fixed, left, top
- Height: 100vh
- Overflow-y: auto

SIDEBAR HEADER:
- Height: 64px
- Padding: 16px
- Border-bottom: 1px #1F2937
- Display: flex, gap 12px
- Font: 18px, bold (700), white

SIDEBAR NAV ITEM:
- Padding: 12px 16px
- Margin: 4px 12px
- Font: 14px, semibold (600)
- Border-radius: 4px
- Transition: 150ms ease-out

NAV ITEM STATES:
- Inactive: color #A1A5B0 (neutral-400), background transparent
- Hover: background #1F2937 (neutral-800), color #D1D5DB (neutral-300)
- Active: background #3D5A8C (primary-600), color white, border-left 3px primary
- Icon: size 18px, margin-right 12px

SIDEBAR FOOTER:
- Border-top: 1px #1F2937
- Padding: 16px
- Contains user profile, logout
- Background: #0F172A (slightly darker)

HEADER (Top Bar):
- Background: white
- Border-bottom: 1px #E5E7EB (neutral-200)
- Height: 64px
- Padding: 0 24px
- Display: flex, justify-between, align-center
- Box-shadow: none

BREADCRUMBS:
- Font: 13px, normal
- Separator: "/" or ">", color #D1D5DB
- Active: #4B5563, clickable #3D5A8C with underline on hover
*/

/* ============================================================================
   STATUS INDICATORS
   ============================================================================ */

/*
BADGE:
- Padding: 4px 8px
- Border-radius: 3px
- Font: 11px, semibold (600)
- Text-transform: uppercase

BADGE COLORS:
- Success: background #D1FAE5, text #065F46
- Warning: background #FEF3C7, text #92400E
- Error: background #FEE2E2, text #7F1D1D
- Info: background #DBEAFE, text #0C2340
- Neutral: background #F3F4F6, text #374151

STATUS DOT:
- Size: 8px
- Border-radius: 50%
- Inline with text
- Colors match badge

PROGRESS BAR:
- Height: 4px
- Background: #E5E7EB (neutral-200)
- Fill: #3D5A8C (primary-600)
- Border-radius: 2px
- Smooth transition: 300ms ease-out

LOADING SPINNER:
- Size: 20px, 24px, or 32px
- Color: #3D5A8C (primary-600)
- Stroke width: 2px
- Never use bright colors or animated GIFs
*/

/* ============================================================================
   FORMS & VALIDATION
   ============================================================================ */

/*
REQUIRED FIELD:
- Add asterisk (*) in label, color #DC2626 (error)
- Or bold the label
- Mark as required in legend

ERROR MESSAGE:
- Color: #DC2626 (error-500)
- Font: 12px
- Position: below input, 4px gap
- Icon: X or ! symbol, 14px

SUCCESS MESSAGE:
- Color: #059669 (success-500)
- Font: 12px
- Icon: checkmark, 14px

HELP TEXT:
- Color: #6B7280 (neutral-500)
- Font: 12px
- Position: below input or label
- Text-style: normal (not italic)

DISABLED FIELD:
- Background: #F3F4F6 (neutral-100)
- Text: #9CA3AF (neutral-400)
- Border: #E5E7EB (neutral-200)
- Cursor: not-allowed
- Opacity: 1 (don't use opacity)

FORM LAYOUT:
- Full width inputs by default
- Label + Input + Help/Error stacked vertically
- 16px between form groups
- Consider 2-column layout for wide screens (with careful field pairing)
*/

/* ============================================================================
   ACCESSIBILITY & INTERACTIONS
   ============================================================================ */

/*
FOCUS STATES (all interactive elements):
- Ring: 2px solid #4A6FA5 (primary-500)
- Ring-offset: 1px white
- Never remove focus outline
- Ensure 3:1 minimum contrast ratio

HOVER STATES:
- Subtle background color change (max 5% darker)
- Smooth transition (150ms)
- Cursor: pointer (buttons, links)
- Cursor: default (text)

ACTIVE/PRESSED:
- Slightly darker background
- Maintains focus ring
- Often used with pseudo-class :active

DISABLED:
- Opacity: 100% (don't fade)
- Cursor: not-allowed
- Lower contrast text
- Still visible (important for context)

TRANSITIONS:
- Fast interactions: 150ms (hover, click feedback)
- Medium: 250ms (expand, collapse)
- Slow: 400ms (modals, page transitions)
- Easing: ease-out (feels responsive)

CURSOR TYPES:
- pointer: buttons, links, clickable cards
- default: text, labels
- text: input fields
- not-allowed: disabled elements
- grab/grabbing: draggable
- move: resizable
- wait: loading

DARK MODE (future):
- Not required for enterprise interface
- If implemented: invert colors, maintain contrast
*/

/* ============================================================================
   RESPONSIVE DESIGN
   ============================================================================ */

/*
BREAKPOINTS:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

SIDEBAR BEHAVIOR:
- Desktop: fixed 256px
- Tablet: fixed 256px or collapsible
- Mobile: hidden by default, slide-in menu

LAYOUT SHIFTS:
- Desktop: sidebar + main content
- Tablet: sidebar + main (may collapse)
- Mobile: fullscreen content

PADDING:
- Desktop: 24px
- Tablet: 16px
- Mobile: 12px

FONT SIZES:
- Generally consistent
- May reduce by 1px on mobile for small text
- Maintain hierarchy

TABLES:
- Desktop: full table
- Tablet: scrollable or stacked
- Mobile: card layout or horizontal scroll
*/

/* ============================================================================
   SPECIAL STATES & SCENARIOS
   ============================================================================ */

/*
EMPTY STATE:
- Centered content
- Icon: 48px, light gray (#D1D5DB)
- Title: 18px, semibold, #374151
- Message: 14px, #6B7280
- CTA button: primary button
- Padding: 48px around

LOADING STATE:
- Spinner: 24-32px, #3D5A8C
- Text: "Loading..." or "Please wait..."
- Overlay: 50% opacity if blocking
- Show skeleton loaders for large lists

ERROR STATE:
- Icon: alert triangle, 32px, #DC2626
- Title: "Error occurred"
- Message: specific error text
- Retry button: secondary
- Error code: 12px, monospace, #6B7280

SUCCESS MESSAGE:
- Position: top-right or top-center
- Background: #D1FAE5 (success-100)
- Border-left: 3px #059669
- Auto-dismiss after 3-4 seconds
- Manual close button: X icon

TOAST/NOTIFICATION:
- Position: fixed bottom-right, 16px margin
- Background: #F3F4F6 with colored border-left
- Max-width: 400px
- Shadow: md
- Auto-dismiss: 4s with fade-out

SKELETON LOADER:
- Pulse animation: opacity 0.6-1.0
- Background: #E5E7EB
- Border-radius: match final element
- Stagger loads for multiple rows
*/

export default {};
