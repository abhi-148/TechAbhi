import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 10) { console.error('Usage: npm run create-admin -- you@example.com "a-password-of-10+-chars"'); process.exit(1); }
const hash = await bcrypt.hash(password, 12);
await pool.query('INSERT INTO admin_users (email,password_hash) VALUES (?,?) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)', [email.toLowerCase(), hash]);
console.log('Admin saved:', email);
await pool.end();
