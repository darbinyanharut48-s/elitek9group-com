const { isValidSession } = require('../lib/session');

module.exports = async (req, res) => {
    res.status(200).json({ authenticated: isValidSession(req) });
};
