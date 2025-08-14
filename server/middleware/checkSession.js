const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

module.exports = async function checkSession(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Invalid user" });

    // Check lock status
    if (user.status === "locked") {
      return res.status(403).json({ message: "Account locked" });
    }

          // Check if session exists (if sessionId is present in token)
      if (decoded.sessionId) {
        const session = await Session.findOne({ sessionId: decoded.sessionId });
        if (!session) return res.status(401).json({ message: "Invalid session" });
        req.session = session;
      }

      // For student accounts, check if they've exceeded device limit
      if (user.accountType === 'student') {
        const activeSessions = await Session.find({ userId: user._id });
        if (activeSessions.length >= 2 && user.status !== 'locked') {
          // Lock account if not already locked
          user.status = "locked";
          await user.save();
          return res.status(403).json({ message: "Account locked due to multiple devices" });
        }
      }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
