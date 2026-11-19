---
version: alpha
name: Clay-design-analysis
description: Design token reference for the 옷 고르기 MVP. Defines a warm cream canvas, dark ink, rounded controls, and saturated accent colors.
colors:
  primary: "#0a0a0a"
  ink: "#0a0a0a"
  canvas: "#fffaf0"
  surface-soft: "#faf5e8"
  surface-card: "#f5f0e0"
  muted: "#6a6a6a"
  hairline: "#e5e5e5"
  brand-pink: "#ff4d8b"
  brand-teal: "#1a3a3a"
  brand-lavender: "#b8a4ed"
  brand-peach: "#ffb084"
  brand-ochre: "#e8b94a"
  brand-mint: "#a4d4c5"
  brand-coral: "#ff6b5a"
typography:
  display: "Plain Black, Inter, sans-serif"
  body: "Inter, sans-serif"
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  pill: 9999px
spacing:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  section: 96px
responsive:
  baseline: 360px
  approach: mobile-first
---

## Overview

Use the warm cream canvas with dark ink for readable surfaces. Apply saturated pink, teal, lavender, peach, and ochre accents sparingly to distinguish feature areas. Rounded corners should feel friendly while preserving clear hierarchy.

## Components

- Primary buttons use dark ink, white text, 12px corners, and a 44px minimum height.
- Cards use cream or soft surface colors, 16–24px corners, and generous spacing.
- Inputs use the canvas background, dark text, 12px corners, and a 44px minimum height.
- Badges and category tabs use pill corners and muted text, with a clear selected state.

## Responsive Behavior

Design mobile-first at 360px. Keep tap targets at least 44px high, preserve readable spacing, and allow content cards to stack on narrow screens.
