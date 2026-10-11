import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareBrief } from '../src/lib/brief.mjs';
test('incomplete enquiries produce field errors and no brief', () => {
  const result = prepareBrief({name:' ',email:'invalid',projectType:'',description:'Short'});
  assert.deepEqual(Object.keys(result.errors), ['name','email','projectType','description']);
  assert.equal(result.brief, '');
});
test('a valid brief preserves project context and an optional budget', () => {
  const result = prepareBrief({name:'Alex',email:'alex@example.com',projectType:'Landing page',description:'A focused landing page for a new fitness business.',budget:''});
  assert.deepEqual(result.errors, {});
  assert.match(result.brief, /Name: Alex/);
  assert.match(result.brief, /Email: alex@example.com/);
  assert.match(result.brief, /Working budget: To discuss/);
  assert.match(result.brief, /new fitness business/);
  assert.match(result.brief, /Desired timeline: Flexible \/ to discuss/);
});
test('a small-business website is a supported prefilled service type', () => {
  const result = prepareBrief({name:'Alex',email:'alex@example.com',projectType:'Small-business website',description:'A responsive website for a local fitness studio.'});
  assert.deepEqual(result.errors, {});
  assert.match(result.brief, /Project: Small-business website/);
});
test('reviewed briefs include the requested timeline without promising a date', () => {
  const result = prepareBrief({name:'Alex',email:'alex@example.com',projectType:'UI refinement',description:'Improve the mobile layout of an existing business website.',budget:'To discuss',timeline:'Aiming for December'});
  assert.deepEqual(result.errors, {});
  assert.match(result.brief, /Desired timeline: Aiming for December/);
});
test('review includes an optional business name and only accepts known project types', () => {
  const result = prepareBrief({name:'Alex',email:'alex@example.com',businessName:'Northside Studio',projectType:'Web application',description:'A small tool to manage requests and follow up with customers.'});
  assert.deepEqual(result.errors, {});
  assert.match(result.brief, /Business or project: Northside Studio/);
  const invalid = prepareBrief({name:'Alex',email:'alex@example.com',projectType:'Surprise service',description:'A small tool to manage requests and follow up with customers.'});
  assert.equal(invalid.errors.projectType, 'Choose a project type, or select “Not sure yet”.');
  assert.equal(invalid.brief, '');
});
