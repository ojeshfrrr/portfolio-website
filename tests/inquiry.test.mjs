import test from 'node:test';
import assert from 'node:assert/strict';
import { handleContact, allowInquiry } from '../src/lib/contact-handler.mjs';
import { prepareBrief } from '../src/lib/brief.mjs';
import { savePlannerDraft, savePlannerBrief, readPlannerHandoff, clearPlanner } from '../src/lib/planner-storage.ts';
import { emptyDraft } from '../src/lib/planner.mjs';
import { saveInquiry, readInquiry, clearInquiry } from '../src/lib/inquiry-storage.ts';
const payload = { name: 'QA Visitor', email: 'qa@example.com', projectType: 'Landing page', description: 'A useful website for an independent business.', goal: 'Generate leads or inquiries', features: 'Contact forms', plannerBrief: 'Reviewed planner notes', website: '' };
const env = { RESEND_API_KEY: 'test-only', CONTACT_TO_EMAIL: 'workwithovio@gmail.com', CONTACT_FROM_EMAIL: 'OVIO <test@example.com>' };
const request = (body = payload, headers = {}) => new Request('https://ovio.test/api/contact', { method: 'POST', headers: { origin: 'https://ovio.test', 'content-type': 'application/json', 'idempotency-key': '12345678-1234-1234-1234-123456789012', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
test('server rejects invalid origin, JSON, oversized streaming body, honeypot and unsupported choices', async () => {
  const never = () => { throw new Error('Provider must not be called'); };
  for (const [req, status] of [[request(payload, {origin: 'https://other.test'}),403], [request('{'),400], [request(' '.repeat(33000)),413], [request({...payload, website:'spam'}),400], [request({...payload, features:'Invented paid feature'}),400], [request({...payload,email:'invalid'}),400]]) assert.equal((await handleContact(req,env,never)).status,status);
});
test('missing provider returns recoverable 503, provider rejection and uncertain response never succeed', async () => {
  assert.equal((await handleContact(request(),{},fetch,()=>true)).status,503);
  for (const send of [async()=>new Response('{}',{status:422}),async()=>new Response('{}'),async()=>{throw new Error('Timeout');}]) assert.equal((await handleContact(request(),env,send,()=>true)).status,502);
});
test('accepted delivery includes all brief sections and retries share provider idempotency key', async () => {
  const seen=[];
  const send=async(url,options)=>{seen.push(options); assert.equal(url,'https://api.resend.com/emails'); return Response.json({id:'email-test'});};
  for(let i=0;i<2;i++) {const response=await handleContact(request(),env,send,()=>true);assert.deepEqual(await response.json(),{ok:true});}
  assert.equal(seen[0].headers['Idempotency-Key'],seen[1].headers['Idempotency-Key']);
  const email=JSON.parse(seen[0].body);assert.deepEqual(email.to,['workwithovio@gmail.com']);assert.equal(email.reply_to,payload.email);
  for(const value of ['Primary goal','Contact forms','Reviewed planner notes',payload.description]) assert.ok(email.text.includes(value));
});
test('rate limiting is bounded and expires',()=>{for(let i=0;i<5;i++)assert.equal(allowInquiry('test-client',100),true);assert.equal(allowInquiry('test-client',101),false);assert.equal(allowInquiry('test-client',600101),true);});
test('complete planner handoff preserves original categories and safely restores inquiry edits',()=>{
  clearPlanner();clearInquiry();
  const draft={...emptyDraft(),projectType:'E-commerce website',description:payload.description,goal:payload.goal,features:['Contact forms'],budget:'Not sure yet',timeline:'Not sure yet',step:4};
  savePlannerDraft(draft);savePlannerBrief('handoff');
  const handoff=readPlannerHandoff();assert.equal(handoff.draft.projectType,draft.projectType);assert.ok(handoff.brief.includes('Contact forms'));
  assert.deepEqual(prepareBrief({...payload,projectType:draft.projectType}).errors,{});
  saveInquiry({...payload,description:'An edited project description for review.'},'12345678-1234-1234-1234-123456789012');assert.equal(readInquiry().submissionId,'12345678-1234-1234-1234-123456789012');assert.equal(readInquiry().fields.description,'An edited project description for review.');
  clearPlanner();clearInquiry();assert.equal(readPlannerHandoff(),null);assert.equal(readInquiry(),null);
});
test('expired and malformed session handoffs are ignored',()=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:()=>JSON.stringify({version:1,savedAt:Date.now()-86400001,draft:payload,fields:payload}),setItem(){},removeItem(){}}});
  try {assert.equal(readPlannerHandoff(),null);assert.equal(readInquiry(),null);}finally{if(previous)Object.defineProperty(globalThis,'sessionStorage',previous);else delete globalThis.sessionStorage;}
});

test('origin validation respects the incoming host when Next uses an internal URL', async()=>{
  const req=new Request('http://localhost:3000/api/contact',{method:'POST',headers:{host:'127.0.0.1:3000',origin:'http://127.0.0.1:3000','content-type':'application/json','idempotency-key':'12345678-1234-1234-1234-123456789012'},body:JSON.stringify(payload)});
  assert.equal((await handleContact(req,{},fetch,()=>true)).status,503);
});

test('production origin validation works behind an HTTPS proxy without trusting spoofed hosts', async()=>{
  const envWithOrigin={...env,NEXT_PUBLIC_SITE_URL:'https://ovio.portways.app'};
  const make=(origin,host='internal:3000')=>new Request('http://internal:3000/api/contact',{method:'POST',headers:{host,origin,'content-type':'application/json','idempotency-key':'12345678-1234-1234-1234-123456789012'},body:JSON.stringify(payload)});
  const send=async()=>Response.json({id:'accepted'});
  assert.equal((await handleContact(make('https://ovio.portways.app'),envWithOrigin,send,()=>true)).status,200);
  assert.equal((await handleContact(make('https://evil.example','evil.example'),envWithOrigin,send,()=>true)).status,403);
  assert.equal((await handleContact(make('https://ovio.portways.app'),{...envWithOrigin,NEXT_PUBLIC_SITE_URL:'not-a-url'},send,()=>true)).status,403);
});
