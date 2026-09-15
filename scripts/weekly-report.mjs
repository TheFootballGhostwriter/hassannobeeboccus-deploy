#!/usr/bin/env node
// Weekly measurement roll-up for hassannobeeboccus.com.
//
//   node scripts/weekly-report.mjs [days]        default 7
//
// Two sources, deliberately:
//   Vercel Web Analytics — every visitor, no consent needed, but pageviews only.
//     Conversions are therefore counted as pageviews of a /thanks/<slug> path.
//   MailerLite — the durable list, and the only place signup_source lives.
//
// GA4 is not read here. It only fires after someone clicks Accept, so its
// numbers describe a self-selected minority and cannot be compared to Vercel's.

import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://hassannobeeboccus.com';
const PROJECT_ID = 'prj_VU0z7CLpWTQjgARtmZRh5Jj0XxtK';
const TEAM_ID = 'team_c51RJHXmEP8fkADGAt3Bb2i0';

const MAGNETS = [
  { name: '5 development models',   page: '/5-development-models',                  thanks: '/thanks/5-development-models',          group: '183924441027184080' },
  { name: 'Build your public voice', page: '/build-your-public-voice',              thanks: '/thanks/build-your-public-voice',       group: '184737667850700274' },
  { name: 'Alternative models',      page: '/alternative-models-framework',         thanks: '/thanks/alternative-models-framework',  group: '185546911183275136' },
  { name: 'Conversation to content', page: '/conversation-to-content-map',          thanks: '/thanks/conversation-to-content-map',   group: '185546914392966331' },
  { name: 'Coaching pathway guide',  page: '/the-coaching-pathway-guide-in-england', thanks: '/thanks/coaching-pathway-guide',       group: '185800853427324705' }
];

// .env.local is overwritten by `vercel env pull`, so credentials that the site
// itself does not need live alongside this script instead.
function readEnv() {
  const out = {};
  for (const file of ['.env.local', 'scripts/.env.report']) {
    let text;
    try { text = readFileSync(join(ROOT, file), 'utf8'); } catch { continue; }
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      // Both files escape real newlines as a literal \n. Restoring them matters
      // for the RSA key, and trimming drops the stray one on the MailerLite key
      // that would otherwise make an illegal header value.
      if (m) out[m[1]] = m[2].replace(/\\n/g, '\n').trim();
    }
  }
  return { ...out, ...process.env };
}

// The CLI stores a usable token once you have run `vercel login`, so the report
// works without asking anyone to mint a personal access token by hand.
function vercelToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  const p = join(process.env.HOME, 'Library/Application Support/com.vercel.cli/auth.json');
  return JSON.parse(readFileSync(p, 'utf8')).token;
}

async function vercelQuery(path, params) {
  const url = new URL(`https://api.vercel.com/v1/query/web-analytics/${path}`);
  url.searchParams.set('projectId', PROJECT_ID);
  url.searchParams.set('teamId', TEAM_ID);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${vercelToken()}` } });
  if (!r.ok) throw new Error(`Vercel ${path} ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).data;
}

// Service account rather than OAuth: no refresh token to expire, and the whole
// exchange is a signed JWT, so this stays dependency-free.
async function googleToken(email, privateKey) {
  const enc = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const iat = Math.floor(Date.now() / 1000);
  const unsigned = `${enc({ alg: 'RS256', typ: 'JWT' })}.${enc({
    iss: email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat, exp: iat + 3600
  })}`;
  const jwt = `${unsigned}.${createSign('RSA-SHA256').update(unsigned).sign(privateKey, 'base64url')}`;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  if (!r.ok) throw new Error(`Google token ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).access_token;
}

async function searchAnalytics(token, body) {
  const site = encodeURIComponent(`${SITE}/`);
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`Search Analytics ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).rows || [];
}

async function inspectUrl(token, url) {
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: `${SITE}/` })
  });
  if (!r.ok) return null;
  return (await r.json()).inspectionResult?.indexStatusResult?.coverageState || null;
}

// Bing takes no date range. It returns a trailing window and dates arrive as
// MS-Ajax strings, so the window has to be cut client-side.
async function bing(method, key, extra = {}) {
  const url = new URL(`https://ssl.bing.com/webmaster/api.svc/json/${method}`);
  url.searchParams.set('apikey', key);
  url.searchParams.set('siteUrl', SITE);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Bing ${method} ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).d || [];
}

const msDate = s => new Date(Number(String(s).match(/-?\d+/)[0]));

async function mailerlite(path, key) {
  const r = await fetch(`https://connect.mailerlite.com/api/${path}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }
  });
  if (!r.ok) throw new Error(`MailerLite ${path} ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);
const rate = (n, d) => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : '—');

async function main() {
  const days = Number(process.argv[2] || 7);
  const until = new Date();
  const since = new Date(until.getTime() - days * 86400000);
  const range = { since: since.toISOString(), until: until.toISOString() };

  const env = readEnv();
  const key = env.MAILERLITE_API_KEY;
  if (!key) throw new Error('MAILERLITE_API_KEY missing. Run: vercel env pull .env.local --environment=production');

  const [totals, paths, referrers] = await Promise.all([
    vercelQuery('visits/count', range),
    vercelQuery('visits/aggregate', { ...range, by: 'requestPath', limit: '100' }),
    vercelQuery('visits/aggregate', { ...range, by: 'referrerHostname', limit: '10' })
  ]);

  const views = new Map(paths.map(p => [p.requestPath, p]));
  const get = p => views.get(p) || { pageviews: 0, visitors: 0 };

  console.log(`\nhassannobeeboccus.com — last ${days} days`);
  console.log(`${since.toISOString().slice(0, 10)} to ${until.toISOString().slice(0, 10)}\n`);
  console.log(`  ${totals.visitors} visitors, ${totals.pageviews} pageviews\n`);

  console.log('LEAD MAGNETS');
  console.log(`  ${pad('', 26)}${lpad('visitors', 9)}${lpad('opt-ins', 9)}${lpad('rate', 8)}${lpad('list', 7)}`);
  for (const m of MAGNETS) {
    const page = get(m.page);
    const conv = get(m.thanks).pageviews;
    const group = await mailerlite(`groups/${m.group}`, key);
    console.log(`  ${pad(m.name, 26)}${lpad(page.visitors, 9)}${lpad(conv, 9)}${lpad(rate(conv, page.visitors), 8)}${lpad(group.data.active_count, 7)}`);
  }

  // Which CTA block each subscriber came from. Only set for people who opted in
  // after the source inputs shipped, so early subscribers show as unattributed.
  const sources = new Map();
  for (const m of MAGNETS) {
    const subs = await mailerlite(`subscribers?filter[group]=${m.group}&limit=100`, key);
    for (const s of subs.data) {
      const src = (s.fields && s.fields.signup_source) || 'unattributed';
      sources.set(src, (sources.get(src) || 0) + 1);
    }
  }
  console.log('\nWHERE OPT-INS CAME FROM (all time)');
  for (const [src, n] of [...sources].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${pad(src, 35)}${lpad(n, 5)}`);
  }

  const call = get('/book-a-call');
  const calendar = get('/book-a-call/calendar-loaded');
  console.log('\nBOOK A CALL');
  console.log(`  ${pad('reached the page', 35)}${lpad(call.visitors, 5)}`);
  console.log(`  ${pad('got past the cookie gate', 35)}${lpad(calendar.visitors, 5)}  (${rate(calendar.visitors, call.visitors)})`);

  const articles = paths.filter(p => p.requestPath.startsWith('/football-thoughts/'));
  console.log('\nARTICLES');
  if (!articles.length) console.log('  no article views in this period');
  for (const a of articles.sort((x, y) => y.visitors - x.visitors)) {
    console.log(`  ${pad(a.requestPath.replace('/football-thoughts/', ''), 55)}${lpad(a.visitors, 5)}`);
  }

  console.log('\nREFERRERS');
  for (const r of referrers) {
    console.log(`  ${pad(r.referrerHostname || 'direct', 35)}${lpad(r.visitors, 5)}`);
  }

  await googleSection(env, since, until);
  await bingSection(env, since);
  console.log();
}

async function googleSection(env, since, until) {
  console.log('\nGOOGLE SEARCH');
  if (!env.GSC_SA_EMAIL || !env.GSC_SA_KEY) {
    console.log('  not configured — see scripts/README-credentials.md');
    return;
  }
  const token = await googleToken(env.GSC_SA_EMAIL, env.GSC_SA_KEY);
  const day = d => d.toISOString().slice(0, 10);
  const base = { startDate: day(since), endDate: day(until), type: 'web' };

  const [totals, queries, pages] = await Promise.all([
    searchAnalytics(token, base),
    searchAnalytics(token, { ...base, dimensions: ['query'], rowLimit: 10 }),
    searchAnalytics(token, { ...base, dimensions: ['page'], rowLimit: 10 })
  ]);

  const t = totals[0];
  if (!t) console.log('  no impressions in this period');
  else console.log(`  ${t.clicks} clicks, ${t.impressions} impressions, average position ${t.position.toFixed(1)}`);

  if (queries.length) {
    console.log('\n  queries people searched');
    for (const q of queries) console.log(`    ${pad(q.keys[0], 45)}${lpad(q.clicks, 4)} clicks${lpad(q.impressions, 6)} impr`);
  }
  if (pages.length) {
    console.log('\n  pages Google showed');
    for (const p of pages) console.log(`    ${pad(p.keys[0].replace(SITE, '') || '/', 45)}${lpad(p.clicks, 4)} clicks${lpad(p.impressions, 6)} impr`);
  }

  // The site's problem has been indexing, not ranking, so the coverage state of
  // every sitemap URL is the number worth watching week to week.
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const states = new Map();
  for (const u of urls) {
    const state = await inspectUrl(token, u) || 'unknown';
    states.set(state, [...(states.get(state) || []), u.replace(SITE, '') || '/']);
  }
  console.log(`\n  indexing, ${urls.length} sitemap URLs`);
  for (const [state, list] of [...states].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`    ${pad(state, 40)}${lpad(list.length, 4)}`);
    if (!/^Submitted and indexed$/.test(state)) for (const u of list) console.log(`        ${u}`);
  }
}

async function bingSection(env, since) {
  console.log('\nBING SEARCH');
  if (!env.BING_API_KEY) {
    console.log('  not configured — see scripts/README-credentials.md');
    return;
  }
  const traffic = (await bing('GetRankAndTrafficStats', env.BING_API_KEY)).filter(r => msDate(r.Date) >= since);
  const clicks = traffic.reduce((n, r) => n + r.Clicks, 0);
  const impressions = traffic.reduce((n, r) => n + r.Impressions, 0);
  console.log(`  ${clicks} clicks, ${impressions} impressions`);

  const queries = (await bing('GetQueryStats', env.BING_API_KEY))
    .filter(r => msDate(r.Date) >= since)
    .sort((a, b) => b.Impressions - a.Impressions)
    .slice(0, 10);
  if (queries.length) {
    console.log('\n  queries people searched');
    for (const q of queries) console.log(`    ${pad(q.Query, 45)}${lpad(q.Clicks, 4)} clicks${lpad(q.Impressions, 6)} impr`);
  }
}

main().catch(e => { console.error(`\n${e.message}\n`); process.exit(1); });
