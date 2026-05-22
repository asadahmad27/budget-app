---
name: Professional Personal Finance
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#44474d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777e'
  outline-variant: '#c5c6ce'
  surface-tint: '#4e5f7e'
  primary: '#031632'
  on-primary: '#ffffff'
  primary-container: '#1a2b48'
  on-primary-container: '#8293b5'
  inverse-primary: '#b6c7eb'
  secondary: '#2c694e'
  on-secondary: '#ffffff'
  secondary-container: '#aeeecb'
  on-secondary-container: '#316e52'
  tertiary: '#131819'
  on-tertiary: '#ffffff'
  tertiary-container: '#282c2e'
  on-tertiary-container: '#8f9395'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#b6c7eb'
  on-primary-fixed: '#081b38'
  on-primary-fixed-variant: '#374765'
  secondary-fixed: '#b1f0ce'
  secondary-fixed-dim: '#95d4b3'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#0e5138'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#181c1e'
  on-tertiary-fixed-variant: '#434749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max-width: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is anchored in the principles of **Professional Modernism**. It prioritizes clarity, trustworthiness, and visual calm to mitigate the cognitive load often associated with financial management. The aesthetic leans into a "Corporate Modern" style—combining the reliability of traditional banking with the agility of a modern fintech startup.

The target audience ranges from young professionals to seasoned investors who require a high-utility interface that feels premium yet accessible. By utilizing generous whitespace and a restrained color palette, the system ensures that critical financial data remains the focal point, fostering an emotional response of control and confidence.

## Colors
The color strategy employs a "Safety & Growth" hierarchy:
- **Primary (Deep Navy):** Used for structural elements, primary buttons, and navigation to establish authority and stability.
- **Secondary (Emerald Green):** Reserved exclusively for positive financial indicators—savings growth, income, and successful transactions.
- **Neutral (Subtle Grays):** A scale of cool grays used for secondary text, borders, and backgrounds to maintain a clean, airy environment.
- **Backgrounds:** The primary surface uses a soft off-white (#FAFAFB) to reduce glare and improve long-term readability.

## Typography
This design system utilizes **Inter** for all roles to ensure maximum legibility across data-heavy screens. 
- **Numerical Data:** Financial figures should utilize `tabular-nums` (font-variant-numeric) to ensure digits align vertically in lists and tables.
- **Hierarchical Weight:** Headlines use a semi-bold or bold weight (600-700) to stand out against the deep navy background. 
- **Mobile Scaling:** Large headlines are reduced on mobile to prevent awkward text wrapping in transaction lists.

## Layout & Spacing
The layout is built on an **8px grid system**, ensuring mathematical harmony across all components.
- **Desktop:** A 12-column fixed grid with a max width of 1200px. This prevents financial dashboards from stretching too far, which can make data scanning difficult.
- **Mobile:** A fluid, single-column layout with 16px side margins.
- **Rhythm:** Generous vertical padding (32px - 48px) is used between sections (e.g., between the "Total Balance" and "Recent Transactions") to create the "less overwhelming" feel requested.

## Elevation & Depth
The design system uses **Ambient Shadows** to create a sense of organized layering without the harshness of heavy borders.
- **Level 1 (Cards):** Small, diffused shadow (0px 4px 12px rgba(26, 43, 72, 0.05)) to lift transaction cards from the background.
- **Level 2 (Modals/Inputs):** Medium shadow (0px 8px 24px rgba(26, 43, 72, 0.10)) to indicate active focus or system overlays.
- **Tonal Layers:** We prefer using subtle background color shifts (e.g., a Tertiary Gray background for the main app area and White for the interactive cards) over complex shadow stacks.

## Shapes
A **Rounded (0.5rem / 8px)** shape language is applied across the system. This radius provides a modern, approachable feel while maintaining enough structure to appear professional.
- **Buttons and Inputs:** Fixed at 8px radius.
- **Wallet Cards:** Use `rounded-xl` (1.5rem / 24px) to mimic the physical form of plastic credit/debit cards.
- **Progress Bars:** Use fully pill-shaped (rounded-full) caps for a smoother, more "fluid" visual representation of budget tracking.

## Components
- **Wallet Cards:** Specialized containers for JazzCash, NayaPay, and Meezan. Each should feature the institution's brand color as a subtle top-border or logo mark, but maintain the design system's typography and soft-shadow container.
- **Category Progress Bars:** A dual-track system. The background track is a light gray (#E2E8F0), while the active track uses Emerald Green for "under budget" and a soft muted red for "over budget."
- **Transaction Input Form:** Features large, clear input fields with 16px internal padding. Labels are positioned above the field in `label-md`. The "Amount" input should be prominent, using `headline-md` typography.
- **Buttons:** Primary buttons are Solid Navy with White text. Secondary buttons use a ghost style (Navy outline) or a subtle gray background.
- **Chips:** Used for transaction categories (e.g., "Food," "Travel"). These use a light tint of the primary color with a small icon prefix.