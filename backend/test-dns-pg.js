const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

async function connect() {
  let connectionString = process.env.DATABASE_URL;
  // Remove sslmode=require from URL so our custom ssl object is respected
  connectionString = connectionString.replace('?sslmode=require&channel_binding=require', '');
  
  const url = new URL(connectionString);
  const hostname = url.hostname;

  console.log('Original hostname:', hostname);

  const resolver = new dns.promises.Resolver();
  resolver.setServers(['8.8.8.8']); // Force Google DNS

  try {
    const addresses = await resolver.resolve4(hostname);
    const ip = addresses[0];
    console.log('Resolved IP:', ip);

    // Reconstruct URL with IP
    url.hostname = ip;
    
    const pool = new Pool({
      connectionString: url.toString(),
      ssl: { 
        rejectUnauthorized: false,
        servername: hostname // Keep SNI intact
      }
    });

    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful using forced Google DNS:', res.rows[0].now);
    pool.end();
  } catch (err) {
    console.error('Failed:', err.message);
  }
}
connect();
