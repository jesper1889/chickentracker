/**
 * Photo Placeholder Utilities
 *
 * Provides a default chicken icon/placeholder for chickens without photos.
 * The SVG is optimized and small (<2KB) for efficient rendering.
 */

/**
 * Default chicken placeholder SVG
 * A simple, friendly chicken icon in amber/orange color scheme
 */
export const CHICKEN_PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <!-- Background circle -->
  <circle cx="100" cy="100" r="90" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2"/>

  <!-- Chicken body -->
  <ellipse cx="100" cy="110" rx="50" ry="40" fill="#F59E0B"/>

  <!-- Chicken head -->
  <circle cx="85" cy="75" r="28" fill="#F59E0B"/>

  <!-- Eye -->
  <circle cx="80" cy="70" r="4" fill="#000"/>

  <!-- Beak -->
  <path d="M 60 75 L 50 75 L 60 80 Z" fill="#EF4444"/>

  <!-- Comb (top of head) -->
  <path d="M 75 50 Q 80 45 85 50 Q 90 45 95 50" stroke="#EF4444" stroke-width="3" fill="none" stroke-linecap="round"/>

  <!-- Wattle (under beak) -->
  <ellipse cx="65" cy="85" rx="4" ry="6" fill="#EF4444"/>

  <!-- Wing -->
  <ellipse cx="115" cy="105" rx="20" ry="15" fill="#FB923C" opacity="0.8"/>

  <!-- Tail feathers -->
  <path d="M 140 95 Q 160 85 155 105 Q 165 95 160 110 Q 170 100 165 115" fill="#FB923C" opacity="0.8"/>

  <!-- Legs -->
  <line x1="90" y1="145" x2="85" y2="165" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>
  <line x1="110" y1="145" x2="115" y2="165" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>

  <!-- Feet -->
  <path d="M 85 165 L 80 170 M 85 165 L 85 170 M 85 165 L 90 170" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
  <path d="M 115 165 L 110 170 M 115 165 L 115 170 M 115 165 L 120 170" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
</svg>
`.trim();

/**
 * Get the photo placeholder as a data URL for use in img src attributes
 *
 * @returns Data URL containing the SVG placeholder
 */
export function getPhotoPlaceholder(): string {
  const base64 = Buffer.from(CHICKEN_PLACEHOLDER_SVG).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get the raw SVG string for direct rendering
 *
 * @returns SVG markup string
 */
export function getPhotoPlaceholderSVG(): string {
  return CHICKEN_PLACEHOLDER_SVG;
}
