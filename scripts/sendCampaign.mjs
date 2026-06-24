/**
 * AgendaYa — Email Campaign Sender
 *
 * Envía correos de invitación a negocios desde el CSV generado.
 * Soporta: Gmail SMTP, SendGrid, Brevo (Sendinblue).
 *
 * USO:
 *   1. Configurar variables de entorno (ver .env.example más abajo)
 *   2. pnpm install nodemailer
 *   3. node scripts/sendCampaign.mjs
 *
 *   node scripts/sendCampaign.mjs --help          # Ayuda completa
 *   node scripts/sendCampaign.mjs --dry-run        # Simular sin enviar
 *   node scripts/sendCampaign.mjs --limit=50       # Solo primeros 50
 *   node scripts/sendCampaign.mjs --start=100 --end=200  # Rango específico
 *   node scripts/sendCampaign.mjs --resume         # Reanudar
 *   node scripts/sendCampaign.mjs --resend         # Reenviar fallidos
 */

import { createReadStream, appendFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CSV_PATH = resolve(ROOT, 'negocios_sin_web_colombia.csv');
const PROGRESS_FILE = resolve(ROOT, '.campaign-progress.json');
const LOG_DIR = resolve(ROOT, 'logs');
const SENT_LOG = resolve(LOG_DIR, 'sent-emails.csv');
const ERROR_LOG = resolve(LOG_DIR, 'error-emails.csv');

// ─── Config ────────────────────────────────────────────────────────
const config = {
  provider: process.env.PROVIDER || 'gmail',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  sendgridKey: process.env.SENDGRID_API_KEY || '',
  brevoKey: process.env.BREVO_API_KEY || '',
  fromEmail: process.env.FROM_EMAIL || 'hola@agendaya.com',
  fromName: process.env.FROM_NAME || 'AgendaYa',
  delayMs: parseInt(process.env.DELAY_MS || '3000', 10),
  batchSize: parseInt(process.env.BATCH_SIZE || '10', 10),
};

// ─── Args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = {
  help: args.includes('--help'),
  resume: args.includes('--resume'),
  resend: args.includes('--resend'),
  dryRun: args.includes('--dry-run'),
  limit: parseArg('--limit'),
  start: parseArg('--start'),
  end: parseArg('--end'),
};

function parseArg(key) {
  const arg = args.find(a => a.startsWith(key));
  if (!arg) return null;
  const val = arg.split('=')[1];
  return val !== undefined ? parseInt(val, 10) : null;
}

function showHelp() {
  console.log(`
AgendaYa — Email Campaign Sender

USO:
  node scripts/sendCampaign.mjs [flags]

FLAGS:
  --help              Muestra esta ayuda
  --dry-run           Simula el envío sin enviar correos
  --limit=N           Solo envía los primeros N negocios
  --start=N           Comienza desde el índice N
  --end=N             Termina en el índice N
  --resume            Reanuda desde donde quedó
  --resend            Reenvía solo los que fallaron

VARIABLES DE ENTORNO:
  PROVIDER            gmail | sendgrid | brevo  (default: gmail)
  SMTP_HOST           smtp.gmail.com
  SMTP_PORT           587
  SMTP_USER           tuemail@gmail.com
  SMTP_PASS           App Password de Gmail
  SENDGRID_API_KEY    API Key de SendGrid
  BREVO_API_KEY       API Key de Brevo
  FROM_EMAIL          Remitente
  FROM_NAME           Nombre del remitente
  DELAY_MS            Ms entre envíos (default: 3000)
  BATCH_SIZE          Guardar progreso cada N (default: 10)

EJEMPLOS:
  PROVIDER=gmail SMTP_USER=... SMTP_PASS=... node scripts/sendCampaign.mjs --limit=10 --dry-run
  PROVIDER=sendgrid SENDGRID_API_KEY=SG.xxx node scripts/sendCampaign.mjs --resume
`);
}

// ─── CSV Reader ────────────────────────────────────────────────────
async function readCSV(path) {
  const rows = [];
  const stream = createReadStream(path, { encoding: 'utf-8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let first = true;
  for await (const line of rl) {
    if (first) { first = false; continue; }
    if (!line.trim()) continue;
    const c = parseLine(line);
    if (c.length >= 2) {
      rows.push({
        name: c[0].trim(),
        email: c[1].trim().toLowerCase(),
        phone: (c[2] || '').trim(),
        city: (c[4] || '').trim(),
        source: (c[7] || '').trim(),
      });
    }
  }
  return rows;
}

function parseLine(line) {
  const r = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { q = !q; }
    else if (ch === ',' && !q) { r.push(cur); cur = ''; }
    else { cur += ch; }
  }
  r.push(cur);
  return r;
}

// ─── Progress ──────────────────────────────────────────────────────
function loadProgress() {
  if (!existsSync(PROGRESS_FILE)) return null;
  try { return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8')); } catch { return null; }
}

function saveProgress(index, total, sent, failed) {
  writeFileSync(PROGRESS_FILE, JSON.stringify({ index, total, sent, failed, updatedAt: new Date().toISOString() }, null, 2));
}

function clearProgress() {
  if (existsSync(PROGRESS_FILE)) writeFileSync(PROGRESS_FILE, '{}');
}

// ─── Logs ──────────────────────────────────────────────────────────
function initLogs() {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
  if (!existsSync(SENT_LOG)) writeFileSync(SENT_LOG, '"email","name","city","source","status","timestamp"\n');
  if (!existsSync(ERROR_LOG)) writeFileSync(ERROR_LOG, '"email","name","error","timestamp"\n');
}

function logSent(email, name, city, source) {
  appendFileSync(SENT_LOG, `"${email}","${name}","${city}","${source}","sent","${new Date().toISOString()}"\n`);
}

function logError(email, name, error) {
  appendFileSync(ERROR_LOG, `"${email}","${name}","${esc(error)}","${new Date().toISOString()}"\n`);
}

function esc(s) { return String(s).replace(/"/g, '""'); }

// ─── Templates ─────────────────────────────────────────────────────
function buildHtml(name, email) {
  const encoded = encodeURIComponent(email);
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" style="max-width:600px;">
<tr><td align="center" style="padding:0 0 24px;">
<h1 style="margin:0;font-size:28px;color:#111827;"><span style="color:#2563eb;">Agenda</span><span style="color:#f97316;">Ya</span></h1>
</td></tr>
<tr><td style="background:#fff;border-radius:16px;padding:40px 32px;">
<p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.6;">Hola <strong>${escHtml(name)}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">Sabemos lo importante que es para ti hacer crecer tu negocio. Por eso creamos <strong>AgendaYa</strong>, una plataforma pensada para negocios como el tuyo.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr><td style="background:#eff6ff;border-radius:12px;padding:24px;">
<h2 style="margin:0 0 16px;font-size:18px;color:#1e40af;">¿Qué puede hacer AgendaYa por tu negocio?</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="padding:0 0 12px;font-size:14px;color:#374151;">✓ <strong>Perfil público gratuito</strong> — Tus clientes te encuentran en Google</td></tr>
<tr><td style="padding:0 0 12px;font-size:14px;color:#374151;">✓ <strong>Reservas online 24/7</strong> — Sin llamadas, sin perder clientes</td></tr>
<tr><td style="padding:0 0 12px;font-size:14px;color:#374151;">✓ <strong>Sin página web</strong> — AgendaYa es tu página web profesional</td></tr>
<tr><td style="padding:0;font-size:14px;color:#374151;">✓ <strong>Plan gratis</strong> — Sin compromiso, sin tarjeta de crédito</td></tr>
</table>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 28px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:#2563eb;border-radius:8px;">
<a href="https://agendaya.com/register" target="_blank" style="display:inline-block;padding:14px 40px;font-size:16px;font-weight:600;color:#fff;text-decoration:none;border-radius:8px;">Crear perfil gratis →</a>
</td></tr></table>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e5e7eb;padding:0 0 20px;"></td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="background:#f9fafb;border-radius:8px;padding:16px;font-style:italic;font-size:14px;color:#6b7280;border-left:4px solid #2563eb;">
"Desde que uso AgendaYa, mis clientes reservan solos. Ya no pierdo llamadas y tengo más tiempo para atenderlos mejor." — <strong>María, Salón de Belleza</strong>
</td></tr></table>
<p style="margin:0;font-size:14px;color:#6b7280;">¿Tienes dudas? Responde este correo o escríbenos a <a href="mailto:hola@agendaya.com" style="color:#2563eb;">hola@agendaya.com</a></p>
</td></tr>
<tr><td align="center" style="padding:24px 16px 0;">
<p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Recibiste este correo porque tu negocio está registrado en directorios comerciales de Colombia y creemos que AgendaYa puede ayudarte.</p>
<p style="margin:0;font-size:12px;color:#9ca3af;">
<a href="https://agendaya.com/unsubscribe?email=${encoded}" style="color:#9ca3af;text-decoration:underline;">Darme de baja</a>
&nbsp;·&nbsp; <a href="https://agendaya.com" style="color:#9ca3af;text-decoration:underline;">AgendaYa</a></p>
<p style="margin:12px 0 0;font-size:12px;color:#d1d5db;">© ${new Date().getFullYear()} AgendaYa.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function buildText(name, email) {
  const encoded = encodeURIComponent(email);
  return `Hola ${name},

Sabemos lo importante que es para ti hacer crecer tu negocio. Por eso creamos AgendaYa.

✓ Perfil público gratuito — Tus clientes te encuentran en Google
✓ Reservas online 24/7 — Sin llamadas, sin perder clientes
✓ Sin página web — AgendaYa es tu página web profesional
✓ Plan gratis — Sin compromiso, sin tarjeta de crédito

Crear tu perfil gratis: https://agendaya.com/register

¿Dudas? Escríbenos a hola@agendaya.com

---
Darte de baja: https://agendaya.com/unsubscribe?email=${encoded}`;
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  if (flags.help) { showHelp(); return; }

  console.log(`\n  AgendaYa — Campaign Sender  (${config.provider.toUpperCase()})\n`);

  if (!existsSync(CSV_PATH)) {
    console.error(`  ❌ No se encuentra: ${CSV_PATH}`);
    console.error('     Genera el CSV primero con el script de compilación de datos.');
    process.exit(1);
  }

  // Load
  const all = await readCSV(CSV_PATH);
  const valid = all.filter(b => b.email && b.email.includes('@') && !b.email.includes(' '));
  console.log(`  📂 ${all.length} negocios cargados, ${valid.length} con email válido`);

  if (valid.length === 0) { console.log('  ❌ No hay emails válidos.'); return; }

  // Range
  let start = flags.start ?? 0;
  let end = flags.end ?? valid.length;

  if (flags.resume) {
    const p = loadProgress();
    if (p?.index > 0) start = p.index;
  }

  if (flags.resend) {
    if (!existsSync(ERROR_LOG)) {
      console.log('  ✅ No hay errores previos para reenviar.');
      return;
    }
    const errors = readFileSync(ERROR_LOG, 'utf-8').split('\n').slice(1).filter(Boolean);
    const failedEmails = new Set(errors.map(l => {
      const c = parseLine(l);
      return c[0]?.replace(/"/g, '');
    }).filter(Boolean));
    const toResend = valid.filter(b => failedEmails.has(b.email));
    if (toResend.length === 0) {
      console.log('  ✅ No hay fallidos para reenviar.');
      return;
    }
    console.log(`  🔁 Reenviando ${toResend.length} fallidos`);
    valid.length = 0;
    valid.push(...toResend);
    start = 0;
    end = toResend.length;
  }

  if (flags.limit !== null) end = Math.min(start + flags.limit, end);
  if (end > valid.length) end = valid.length;

  const batch = valid.slice(start, end);
  if (batch.length === 0) { console.log('  ✅ No hay pendientes.'); return; }

  console.log(`  📋 Rango: [${start}..${end}) = ${batch.length} emails`);
  if (flags.dryRun) {
    console.log(`\n  🏁 MODO DRY-RUN (no se enviará nada)\n`);
    batch.slice(0, 10).forEach((b, i) => {
      console.log(`     ${start + i}. ${b.email.padEnd(32)} ${b.name.slice(0, 35)}`);
    });
    if (batch.length > 10) console.log(`     ... y ${batch.length - 10} más`);
    console.log(`\n  ✅ Dry-run completo.\n`);
    return;
  }

  // Load nodemailer (optional dep)
  let nodemailer;
  try {
    nodemailer = await import('nodemailer');
  } catch {
    console.error('  ❌ Falta nodemailer. Ejecuta: pnpm add nodemailer');
    process.exit(1);
  }

  // Init provider
  let transport;
  if (config.provider === 'gmail') {
    transport = nodemailer.default.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
    try {
      await transport.verify();
      console.log('  ✅ Conexión SMTP verificada');
    } catch (err) {
      console.error(`  ❌ SMTP: ${err.message}`);
      console.error('     Usa un App Password de Gmail (no tu contraseña normal)');
      process.exit(1);
    }
  }

  initLogs();

  let sent = 0, failed = 0;
  const subject = 'AgendaYa — Transforma tu negocio con reservas online gratis';

  for (let i = 0; i < batch.length; i++) {
    const biz = batch[i];
    const abs = start + i;
    const html = buildHtml(biz.name, biz.email);
    const text = buildText(biz.name, biz.email);

    try {
      if (config.provider === 'gmail') {
        await transport.sendMail({
          from: `"${config.fromName}" <${config.fromEmail}>`,
          to: biz.email,
          subject,
          html,
          text,
        });
      } else if (config.provider === 'sendgrid') {
        const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${config.sendgridKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: biz.email }] }],
            from: { email: config.fromEmail, name: config.fromName },
            subject,
            content: [{ type: 'text/plain', value: text }, { type: 'text/html', value: html }],
          }),
        });
        if (!r.ok) throw new Error(`SendGrid ${r.status}`);
      } else if (config.provider === 'brevo') {
        const r = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'api-key': config.brevoKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: { email: config.fromEmail, name: config.fromName },
            to: [{ email: biz.email }],
            subject,
            htmlContent: html,
            textContent: text,
          }),
        });
        if (!r.ok) throw new Error(`Brevo ${r.status}`);
      }
      sent++;
      logSent(biz.email, biz.name, biz.city, biz.source);
      const bar = barStr(sent + failed, batch.length);
      process.stdout.write(`  ✅ [${abs}/${valid.length}] ${biz.email} ${bar}\n`);
    } catch (err) {
      failed++;
      logError(biz.email, biz.name, err.message);
      process.stdout.write(`  ❌ [${abs}/${valid.length}] ${biz.email} — ${err.message.slice(0, 50)}\n`);
    }

    if ((i + 1) % config.batchSize === 0 || i === batch.length - 1) {
      saveProgress(abs + 1, valid.length, sent, failed);
    }

    if (i < batch.length - 1) await sleep(config.delayMs);
  }

  const total = sent + failed;
  console.log(`\n  ─────────────────────────────────────────`);
  console.log(`  ✅ Enviados: ${sent}  ❌ Fallidos: ${failed}  📁 Logs: logs/`);
  if (failed > 0) console.log(`  Reintentar: node scripts/sendCampaign.mjs --resend`);
  if (sent === batch.length) clearProgress();
  console.log('');
}

function barStr(done, total) {
  const w = 20;
  const p = Math.round((done / total) * w);
  return '[' + '█'.repeat(p) + '░'.repeat(w - p) + `] ${done}/${total}`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

main().catch(err => { console.error(err); process.exit(1); });
