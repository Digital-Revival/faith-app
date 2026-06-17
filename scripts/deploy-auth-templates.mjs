import fs from 'node:fs';
import path from 'node:path';

const projectRef = process.env.SUPABASE_PROJECT_REF;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!projectRef || !accessToken) {
  console.error('Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

const configPath = path.join('supabase', 'config.toml');
const htmlPath = path.join('supabase', 'templates', 'recovery.html');
const config = fs.readFileSync(configPath, 'utf8');

const subjectMatch = config.match(
  /\[auth\.email\.template\.recovery\][\s\S]*?subject\s*=\s*"([^"]+)"/
);
const subject = subjectMatch?.[1];
if (!subject) {
  console.error('Could not parse recovery subject from supabase/config.toml');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
  {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mailer_subjects_recovery: subject,
      mailer_templates_recovery_content: html,
    }),
  }
);

if (!res.ok) {
  const body = await res.text();
  console.error(`PATCH failed (${res.status}): ${body}`);
  process.exit(1);
}

console.log('Recovery auth template deployed.');
