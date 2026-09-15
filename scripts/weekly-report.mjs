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
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT_ID = 'prj_VU0z7CLpWTQjgARtmZRh5Jj0XxtK';
const TEAM_ID = 'team_c51RJHXmEP8fkADGAt3Bb2i0';

const MAGNETS = [
  { name: '5 development models',   page: '/5-development-models',                  thanks: '/thanks/5-development-models',          group: '183924441027184080' },
  { name: 'Build your public voice', page: '/build-your-public-voice',              thanks: '/thanks/build-your-public-voice',       group: '184737667850700274' },
  { name: 'Alternative models',      page: '/alternative-models-framework',         thanks: '/thanks/alternative-models-framework',  group: '185546911183275136' },
  { name: 'Conversation to content', page: '/conversation-to-content-map',          thanks: '/thanks/conversation-to-content-map',   group: '185546914392966331' },
  { name: 'Coaching pathway guide',  page: '/the-coaching-pathway-guide-in-england', thanks: '/thanks/coaching-pathway-guide',       group: '185800853427324705' }
];

function readEnvFile() {
  const out = {};
  try {
    for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      // The CLI escapes real newlines as a literal \n, and the stored MailerLite
      // key has one on the end. Left in place it makes an illegal header value.
      if (m) out[m[1]] = m[2].replace(/\\n/g, '').trim();
    }
  } catch {}
  return out;
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

  const key = process.env.MAILERLITE_API_KEY || readEnvFile().MAILERLITE_API_KEY;
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
  console.log();
}

main().catch(e => { console.error(`\n${e.message}\n`); process.exit(1); });
