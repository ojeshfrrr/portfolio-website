import test from 'node:test';
import assert from 'node:assert/strict';
import { emailDraftUrl, whatsappUrl } from '../src/lib/contact.mjs';
test('missing or invalid contact details never produce a destination', () => {
  for (const email of ['', 'not-an-email', 'a\nb@example.com']) assert.equal(emailDraftUrl(email, 'Hello'), null);
  for (const number of ['', 'abc', '123', '+91 123abc789']) assert.equal(whatsappUrl(number), null);
});
test('email brief is encoded without adding unintended mailto parameters', () => {
  const brief = 'A café website & booking flow?\nBudget: ₹50,000 #launch';
  const url = new URL(emailDraftUrl('test@example.com', brief));
  assert.equal(url.searchParams.get('body'), brief);
  assert.equal(url.searchParams.get('subject'), 'Project enquiry for OVIO');
  assert.equal(url.searchParams.size, 2);
});
test('WhatsApp strips formatting and preserves the international number', () => {
  assert.equal(whatsappUrl('+91 (98765) 43210'), 'https://wa.me/919876543210');
});
