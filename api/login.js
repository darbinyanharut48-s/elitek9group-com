const crypto = require('crypto');
const { createSessionCookie } = require('../lib/session');

function timingSafeEqualStr(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) {
        // still run a compare to avoid an obvious early-exit timing signal
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'method_not_allowed' });
        return;
    }

    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminUser || !adminPass) {
        res.status(500).json({ error: 'admin_not_configured' });
        return;
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { username, password } = body || {};

    const ok =
        username && password &&
        timingSafeEqualStr(username, adminUser) &&
        timingSafeEqualStr(password, adminPass);

    if (!ok) {
        res.status(401).json({ error: 'invalid_credentials' });
        return;
    }

    res.setHeader('Set-Cookie', createSessionCookie());
    res.status(200).json({ ok: true });
};
