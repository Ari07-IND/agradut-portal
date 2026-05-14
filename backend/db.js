// ============================================================
// Agradut Foundation — PostgreSQL connection pool
// ============================================================
const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

// Custom DNS Resolver to bypass Jio/ISP blocking of AWS Neon subdomains
const resolver = new dns.promises.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']); // Google & Cloudflare DNS

const originalLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname && hostname.includes('neon.tech')) {
    resolver.resolve4(hostname).then(addresses => {
      if (options.all) {
        callback(null, addresses.map(addr => ({ address: addr, family: 4 })));
      } else {
        callback(null, addresses[0], 4);
      }
    }).catch(err => {
      // Fallback to default if custom resolution fails
      originalLookup(hostname, options, callback);
    });
  } else {
    originalLookup(hostname, options, callback);
  }
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
