const OWNER = 'darbinyanharut48-s';
const REPO = 'elitek9group-com';
const BRANCH = 'main';
const API = 'https://api.github.com';

function getToken() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN is not set');
    return token;
}

function headers() {
    return {
        Authorization: `Bearer ${getToken()}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'elitek9group-admin',
    };
}

async function getFile(path) {
    const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`, {
        headers: headers(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub getFile ${path} failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return {
        sha: data.sha,
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
    };
}

async function putFile({ path, contentBase64, message, sha }) {
    const body = {
        message,
        content: contentBase64,
        branch: BRANCH,
    };
    if (sha) body.sha = sha;
    const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`GitHub putFile ${path} failed: ${res.status} ${await res.text()}`);
    return res.json();
}

async function putTextFile(path, text, message, sha) {
    return putFile({ path, contentBase64: Buffer.from(text, 'utf-8').toString('base64'), message, sha });
}

async function putBase64File(path, base64, message, sha) {
    return putFile({ path, contentBase64: base64, message, sha });
}

module.exports = { getFile, putTextFile, putBase64File };
