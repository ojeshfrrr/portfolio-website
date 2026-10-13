import { ImageResponse } from 'next/og';
import { brand } from '../../lib/brand';

// Keep this as a regular route handler rather than Next's image metadata
// convention so it is not advertised until a verified public origin exists.
export async function GET() {
  return new ImageResponse(
    <div style={{ background: brand.background, color: brand.text, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px' }}>
      <div style={{ display: 'flex', fontSize: 42 }}>ovio<span style={{ color: brand.accent }}>.</span></div>
      <div style={{ fontSize: 88, lineHeight: 1.08, letterSpacing: '-5px', display: 'flex' }}>Websites and products<br/>that just work.</div>
      <div style={{ fontSize: 23, color: brand.muted, display: 'flex' }}>Independent digital studio. Thoughtfully designed. Carefully built.</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
