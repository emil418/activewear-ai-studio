

## Plan: Add athlete image between Hero and How It Works

### What
Add the uploaded image (athlete in yellow jersey running) as a showcase section between the Hero and the Value Bar on the landing page.

### Steps

1. **Copy image to project** -- Copy `user-uploads://60ed948e-6199-48fe-a9d5-16b2c04c2564.jfif` to `src/assets/hero-athlete.jfif`

2. **Add showcase section in `src/pages/Index.tsx`** -- Insert a new section component between `<Hero />` and `<ValueBar />`:
   - Full-width section with max-width container
   - The image centered with rounded corners and subtle border
   - Fade-in animation on scroll (using existing `motion` setup)
   - Responsive sizing (larger on desktop, full-width on mobile)
   - Optional subtle caption like "AI-generated sportswear visualization"

3. **Import the image** using ES6 module import: `import heroAthlete from "@/assets/hero-athlete.jfif"`

### Technical details
- Image imported via `src/assets` for Vite bundling/optimization
- Uses existing `framer-motion` for scroll animation
- Styled with Tailwind (rounded, border, shadow) matching the dark theme

