[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/UgtyIKLp)
# CSS Advanced

## Overview

This lab guides you through practicing **advanced CSS basics** with a simple page: common properties, fonts & text, the box model, flexbox, and positioning. You’ll complete TODOs in a stylesheet to see how each concept changes the layout and typography.

## What You'll Learn

* **Common Properties**: Colors, backgrounds, display values, and CSS variables  
* **Fonts & Text**: Families, units (px/em/rem), weights, transforms, line-height  
* **Box Model**: Margin, padding, border, width/height, `box-sizing`  
* **Flexbox**: Container and item properties, wrapping, alignment, flexible sizing  
* **Positioning & Stacking**: `static`, `relative`, `absolute`, `fixed`, `z-index`

## Prerequisites

* Basic understanding of HTML structure  
* Any modern web browser (Chrome, Firefox, Safari, Edge)  
* A text editor (VS Code, Sublime Text, Notepad++)

## Files

* `index.html`: Markup for five practice sections (Common, Fonts/Text, Box Model, Flexbox, Positioning)  
* `styles.css`: CSS with TODOs to complete 
* `README.md`: This instruction file

## Project Structure

```
css-advanced-layout-typography/
├── index.html
├── styles.css
└── README.md
```

## Instructions

### Step 1: Set Up the Project

1. Open `index.html` in your text editor.  
2. Complete the TODO comment:
   - Ensure the `<head>` links to the **styles** CSS file:
     ```html
     <link rel="stylesheet" href="styles.css">
     ```

### Step 2: Complete the CSS TODOs

Open `styles.css` and complete each TODO.

#### TODO 1: Base & Variables
```css
:root {
  /* TODO: sett --brand, --muted, --bg, --card */
  --brand: hsl(221 83% 53%); /* similar to a classic blue */
  --muted: #6b7280;
  --bg: #f6f7fb;
  --card: #ffffff;
}

* {
  /* TODO: sett box-sizing: border-box; */
  box-sizing: border-box;
}
```

#### TODO 2: Layout Shell
```css
.site-header, .site-footer {
  /* TODO: add subtle background using var(--card) */
  text-align:center;
  padding:1.25rem;
  background: var(--card);
}

.tagline {
  /* TODO: set color: var(--muted) */
  color: var(--muted);
}

.card {
  /* TODO: add a soft box-shadow */
  background: var(--card);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-block: 1rem;
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
}
```

#### TODO 3: Common Properties
```css
.color-demo .color-note {
  /* TODO: set color: var(--brand) using variable; set font-weight: 700; */
  color: var(--brand);
  font-weight: 700;
}

.color-demo .muted {
  /* TODO: color: var(--muted); font-size: 0.95rem; */
  color: var(--muted);
  font-size: 0.95rem;
}

.bg-sample {
  /* TODO: set 100% width; min-height: 80px; background-color/gradient */
  width: 100%;
  min-height: 80px;
  background: linear-gradient(135deg, hsl(221 83% 96%), hsl(221 83% 92%));
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #374151;
}

.inline-label {
  /* TODO: set the display to inline-block; add padding; border */
  display:inline-block;
  padding:0.25rem 0.5rem;
  border:1px solid rgba(0,0,0,0.15);
  border-radius:6px;
  margin-right:0.25rem;
}
.inline-label.alt {
  /* TODO: set the dashed border; and set display inline */
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border: 1px dashed rgba(0,0,0,0.25);
  border-radius: 6px;
}
```

#### TODO 3: Fonts & Text
```css
.copy .title {
  /* TODO: set the font-size; font-weight; text-transform */
  font-size: 1.5rem;
  font-weight: 700;
  text-transform: capitalize;
  margin: 0.5rem 0;
}

.copy .intro {
  /* TODO: make font style italic; set line-height */
  font-style: italic;
  line-height: 1.7;
  color: #334155;
}

.copy .sample-text {
  /* TODO: set font type serif; font-size: relative sizing (em) */
  font-family: serif;
  font-size: 1.1em;
  color: #1f2937;
}

.cta-link {
  /* TODO: set brand color using variable; set the text to no underline; apply hover styles */
  text-decoration: none;
  color: var(--brand);
  font-weight: 600;
}

.cta-link:hover{
  text-decoration: underline;
  color: hsl(221 83% 40%);
}
```

#### TODO 5: Box Model
```css
.box {
  /* TODO: set the width and height; add padding; add border */
  /* TODO: rounded corners; flex centering */
  width: 120px;
  height: 80px;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  display: flex; 
  align-items: center; 
  justify-content: center;
  background: #fafafa;
  font-weight:600;
}
.b1 {
  /* TODO (WRITE): unique style */
  background: #e0f2fe;
  border-color: #93c5fd;
   }
.b2 {
  /* TODO (WRITE): unique style */
  background: #dcfce7;
  border-color: #86efac;}
.b3 {
  /* TODO (WRITE): unique style */
  background: #fee2e2;
  border-color: #fca5a5; 
}
```

#### TODO 6: Flexbox
```css
.toolbar {
  /* TODO: Set the display to flex; justify-content to have space between; align-items to center; add gap */
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px dashed rgba(0,0,0,0.1);
}

.btn {
  /* TODO: Add padding; add hover effect on button*/
  padding: 0.55rem 0.9rem;
  background: #eef2ff;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn:hover{
  background: #e0e7ff;
}

.product-grid {
  /* TODO: Set display to flex; make the flex wrap; add gap; basis ~140px */
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.product-grid .item {
  /* TODO: place the item in center; set min-height; and add a background color*/
  flex: 1 1 140px; 
  display:grid;
  place-items:center;
  min-height:80px;
  background: #f3f4f6;
  border:1px solid #e5e7eb;
  border-radius:10px;
}
```

#### TODO 7: Positioning & Stacking
```css
.static-box {
  /* TODO: Add styling to the box*/
  background: #f3f4f6;
  border:1px solid #e5e7eb;
  border-radius:8px;
  padding:0.5rem 0.75rem;
  display: inline-block;
}

.relative-box {
  /* TODO: Make the position relative; and give an offset of 10px */
  position: relative;
  top: 10px; 
  left: 10px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  display: inline-block;
  margin-left: 0.5rem;
}

.absolute-parent {
  /* TODO: Make the position relative; style the container */
  position: relative;
  display: inline-block;
  margin-left: 0.5rem;
  padding: 1.25rem 1.5rem;
  background: #ecfeff;
  border: 1px solid #a5f3fc;
  border-radius: 10px;
}
.absolute-child {
  /* TODO: Make the position absolute and fix badge at top-right */
  position: absolute;
  top: -10px;
  right: -10px;
  background: #cffafe;
  border: 1px solid #67e8f9;
  padding: 0.35rem 0.5rem;
  border-radius: 999px;
  font-size: 0.85rem;
}

.fixed-badge {
  /* TODO: fixed the position of badge at bottom-right; do styling */
  position: fixed;
  right: 16px; bottom:16px;
  background: #fde68a;
  border: 1px solid #fcd34d;
  border-radius: 999px;
  padding: 0.4rem 0.7rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.stack {
  /* TODO: make the suares overlapping with z-index */
  position: absolute;
  width: 60px; 
  height: 60px;
  top: 70px; 
  left: 60px;
  border-radius: 8px;
}
.stack.a { 
  /* TODO: lower z-index */ 
  background: #34d399;
  z-index: 1;
}

.stack.b { 
  /* TODO: higher z-index */ 
  background: #f59e0b;
  top: 85px;
  left: 75px;
  z-index: 2;
}
```

### Step 3: Test Your Page

1. Save `index.html` and `styles.css`.  
2. Open in your browser.  
3. Verify each section updates as you complete TODs.  
4. Hover buttons/links to test interactive styles.

## Expected Results

- [ ] **Layout**: Subtle backgrounds, muted tagline, card shadows  
- [ ] **Typography**: Capitalized titles, serif body text, brand links with hover underline  
- [ ] **Box Model**: Three demo boxes with padding, borders, unique looks  
- [ ] **Flexbox**: Evenly spaced toolbar and responsive product grid  
- [ ] **Positioning**: Relative offsets, absolute child badge, fixed viewport badge, stacked squares  

## Understanding the Concepts

* **Variables**: Centralize colors with `:root`  
* **Fonts/Text**: Compare units, transforms, and spacing  
* **Box Model**: Use `box-sizing: border-box` for predictability  
* **Flexbox**: Wrap, align, and size items flexibly  
* **Positioning**: Control flow, offsets, and stacking

## Elements You’ll Style

* **Header & Footer** with muted tagline  
* **Typography section** with titles, intros, links  
* **Box row** with three styled boxes  
* **Flex toolbar & grid** for navigation and items  
* **Positioning stage** for static, relative, absolute, fixed, stacked elements

## Common Patterns

1. Design tokens via CSS variables  
2. Clear visual hierarchy  
3. Interactive feedback (hover states)  
4. Responsive flex layout

## Troubleshooting

* **No styles?** Check CSS `<link>`  
* **Misplaced absolute child?** Ensure parent has `position: relative`  
* **Overlap wrong?** Adjust `z-index`  
* **Grid not wrapping?** Confirm `flex-wrap: wrap` and `flex-basis`

## CSS Resources

* [MDN CSS](https://developer.mozilla.org/)  
* [Flexbox Froggy](https://flexboxfroggy.com/)  
* [Specificity Calculator](https://specificity.keegan.st/)  
* [CSS Zen Garden](https://csszengarden.com/)  

Happy styling! 🎨🧩
