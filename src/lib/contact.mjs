export function emailDraftUrl(email, brief) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return `mailto:${email}?subject=${encodeURIComponent('Project enquiry for OVIO')}&body=${encodeURIComponent(brief)}`;
}
export function whatsappUrl(number) {
  const digits = (number || '').replace(/[\s+()-]/g, '');
  return /^\d{8,15}$/.test(digits) ? `https://wa.me/${digits}` : null;
}
