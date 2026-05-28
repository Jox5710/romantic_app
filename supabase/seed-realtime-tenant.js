#!/usr/bin/env node
/**
 * Idempotent realtime tenant provisioner.
 *
 * Supabase Realtime v2 is multi-tenant: every WebSocket connection looks up
 * a row in _realtime.tenants by external_id. Self-hosted single-tenant
 * deploys need to insert that row exactly once. This script does it via the
 * realtime container's POST /api/tenants endpoint (which handles AES-encryption
 * of jwt_secret internally — safer than raw SQL).
 *
 * Run inside the docker network:
 *   docker exec \
 *     -e JWT_SECRET=... -e POSTGRES_PASSWORD=... \
 *     romantic_app-app-1 node /app/supabase/seed-realtime-tenant.js
 */

const crypto = require('crypto');

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'your-super-secret-jwt-token-with-at-least-32-characters';
const PG_PW = process.env.POSTGRES_PASSWORD || 'forever_local_2025';
const REALTIME_URL = process.env.REALTIME_URL || 'http://realtime:4000';

// HS256 JWT signed with API_JWT_SECRET (= JWT_SECRET) — granted supabase_admin role
const b64 = (obj) =>
  Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
const now = Math.floor(Date.now() / 1000);
const header = b64({ alg: 'HS256', typ: 'JWT' });
const payload = b64({ role: 'supabase_admin', iat: now, exp: now + 300 });
const sig = crypto
  .createHmac('sha256', JWT_SECRET)
  .update(`${header}.${payload}`)
  .digest('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');
const token = `${header}.${payload}.${sig}`;

const tenant = {
  tenant: {
    name: 'realtime',
    external_id: 'realtime',
    jwt_secret: JWT_SECRET,
    postgres_cdc_default: 'postgres_cdc_rls',
    extensions: [
      {
        type: 'postgres_cdc_rls',
        settings: {
          db_host: 'db',
          db_name: 'postgres',
          db_user: 'supabase_admin',
          db_password: PG_PW,
          db_port: '5432',
          region: 'us-east-1',
          ssl_enforced: false,
          publication: 'supabase_realtime',
        },
      },
    ],
  },
};

(async () => {
  let res;
  try {
    res = await fetch(`${REALTIME_URL}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(tenant),
    });
  } catch (err) {
    console.error(`network error contacting ${REALTIME_URL}: ${err.message}`);
    process.exit(1);
  }

  const body = await res.text();

  if (res.ok) {
    console.log('tenant created');
    return;
  }
  // Realtime returns 422 on duplicate external_id
  if (
    res.status === 422 &&
    /already|exist|taken|unique/i.test(body)
  ) {
    console.log('tenant already exists — ok');
    return;
  }
  console.error(`HTTP ${res.status}: ${body}`);
  process.exit(1);
})();
