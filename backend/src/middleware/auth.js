const User = require('../models_mongo/User');


// Enhanced requireLogin: checks if session is active in DB
async function requireLogin(req, res, next){
  if(!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const Session = require('../models_mongo/Session');
    // Find the session by session ID (cookie)
    const sessionId = req.sessionID;
    // Find the session record for this user and session
    const sessionRecord = await Session.findOne({ userId: req.session.userId, isActive: true });
    if (!sessionRecord) {
      req.session.destroy?.(() => {});
      return res.status(401).json({ error: 'Session terminated by admin' });
    }
  } catch (e) {
    // If session DB check fails, deny access for safety
    return res.status(401).json({ error: 'Session check failed' });
  }
  next();
}

async function loadCurrentUser(req, res, next){
  if(req.session.userId){
    const user = await User.findById(req.session.userId).select('-passwordHash').exec();
    if(user) req.currentUser = user;
  }
  next();
}

function roleAtLeast(minRole){
  const order = ['engineer','manager','admin','superadmin'];
  return (req, res, next) => {
    if(!req.currentUser) return res.status(401).json({ error: 'Not authenticated' });
    const userRoleIndex = order.indexOf(req.currentUser.role);
    const minIndex = order.indexOf(minRole);
    if(userRoleIndex < minIndex) return res.status(403).json({ error: 'Forbidden' });
    next();
  }
}

function canManageTarget(actorRole, targetRole){
  const order = ['engineer','manager','admin','superadmin'];
  return order.indexOf(actorRole) > order.indexOf(targetRole);
}

module.exports = { requireLogin, loadCurrentUser, roleAtLeast, canManageTarget };
