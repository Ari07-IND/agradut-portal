const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

// Global interceptor
const resolver = new dns.promises.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

const originalLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname && hostname.includes('neon.tech')) {
    resolver.resolve4(hostname).then(addresses => {
      console.log('Intercepted Neon DNS, resolved to:', addresses);
      if (options.all) {
        callback(null, addresses.map(addr => ({ address: addr, family: 4 })));
      } else {
        callback(null, addresses[0], 4);
      }
    }).catch(err => {
      console.error('Interceptor failed, falling back:', err);
      originalLookup(hostname, options, callback);
    });
  } else {
    originalLookup(hostname, options, callback);
  }
};

async function connect() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful using GLOBAL DNS INTERCEPTOR:', res.rows[0].now);
    pool.end();
  } catch (err) {
    console.error('Failed:', err.message);
  }
}
connect();
