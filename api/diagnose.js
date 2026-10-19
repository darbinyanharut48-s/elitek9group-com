const { isValidSession } = require('../lib/session');
const { getFile } = require('../lib/github');

// Read-only diagnostic: confirms the server can reach GitHub with the
// configured token and has access to this repo. Never echoes the token.
module.exports = async (req, res) => {
    if (!isValidSession(req)) {
        res.status(401).json({ error: 'not_authenticated' });
        return;
    }

    const out = { githubTokenSet: !!process.env.GITHUB_TOKEN };

    try {
        const file = await getFile('blog.html');
        out.canReadRepo = !!file;
        out.blogHtmlSha = file ? file.sha.slice(0, 7) : null;
    } catch (err) {
        out.canReadRepo = false;
        out.readError = String((err && err.message) || err);
    }

    res.status(200).json(out);
};
