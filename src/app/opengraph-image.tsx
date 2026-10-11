import { brand } from '../lib/brand';
import { ImageResponse } from 'next/og';
export const alt = 'OVIO — Websites and products that just work.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(<div style={{ background: brand.background, color: brand.text, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px' }}><div style={{ display: 'flex', fontSize: 42 }}>ovio<span style={{ color: brand.accent }}>.</span></div><div style={{ fontSize: 88, lineHeight: 1.08, letterSpacing: '-5px', display: 'flex' }}>Websites and products<br/>that just work.</div><div style={{ fontSize: 23, color: brand.muted, display: 'flex' }}>Independent digital studio. Thoughtfully designed. Carefully built.</div></div>, size);
}
