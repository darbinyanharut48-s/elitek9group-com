const crypto = require('crypto');

const COOKIE_NAME = 'admin_session';
const SESSION_DAYS = 7;

function getSecret() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error('SESSION_SECRET is not set');
    return secret;
}

function sign(expiry) {
    return crypto.createHmac('sha256', getSecret()).update(String(expiry)).digest('hex');
}

function createSessionCookie() {
    const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
    const value = `${expiry}.${sign(expiry)}`;
    const maxAge = SESSION_DAYS * 24 * 60 * 60;
    return `${COOKIE_NAME}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
    return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

function parseCookies(header) {
    const out = {};
    if (!header) return out;
    header.split(';').forEach((part) => {
        const idx = part.indexOf('=');
        if (idx === -1) return;
        out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    });
    return out;
}

function isValidSession(req) {
    const cookies = parseCookies(req.headers.cookie);
    const value = cookies[COOKIE_NAME];
    if (!value) return false;
    const [expiryStr, sig] = value.split('.');
    if (!expiryStr || !sig) return false;
    const expiry = Number(expiryStr);
    if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
    const expected = sign(expiry);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

module.exports = { createSessionCookie, clearSessionCookie, isValidSession };
