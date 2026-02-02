const { User } = require('../models_mongo');
const { User: SQLUser } = require('../models');

async function login(req, res){
  const { identifier, password } = req.body; // identifier can be email or name
  if(!identifier || !password) return res.status(400).json({ error: 'Missing credentials' });

  let user = await User.findOne({ $or: [{ email: identifier }, { name: identifier }] }).exec();

  // Fallback: if no Mongo user, try SQL user (seeded). If SQL user exists and password matches,
  // create a Mongo user copy so subsequent requests use Mongo.
  if(!user){
    const sqlUser = await SQLUser.findOne({ where: { $or: [{ email: identifier }, { name: identifier }] } });
    if(sqlUser){
      console.log('[auth] Found SQL user fallback for', sqlUser.email);
      const okSql = await sqlUser.verifyPassword(password);
      console.log('[auth] SQL password verify =>', okSql);
      if(okSql){
        // create mongo user
        user = new User({
          name: sqlUser.name,
          email: sqlUser.email,
          passwordHash: sqlUser.passwordHash,
          role: sqlUser.role,
          status: sqlUser.status
        });
        await user.save();
        console.log('[auth] Created mongo user from SQL fallback:', user.email);
      }
    } else {
      console.log('[auth] No SQL fallback user found for', identifier);
    }
  }

  if (user.isLocked) {
    return res.status(403).json({ error: 'Account is locked due to repeated failed logins. Contact admin.' });
  }
  if (user.status === 'blocked') {
    return res.status(403).json({ error: 'Account is blocked' });
  }
  // Password expiry check (90 days)
  if (user.passwordExpiresAt && user.passwordExpiresAt < Date.now()) {
    return res.status(403).json({ error: 'Password expired. Please reset your password.' });
  }
  const ok = await user.verifyPassword(password);
  if(!ok) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    // Lock account after 5 failed attempts
    if (user.failedLoginAttempts >= 5) {
      user.isLocked = true;
    }
    await user.save();
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Reset failed login attempts on success
  user.failedLoginAttempts = 0;
  // Update last login time
  user.lastLoginAt = new Date();
  await user.save();

  req.session.userId = user._id.toString();
  req.session.role = user.role;

  // Create a session record for device tracking
  try {
    const { Session } = require('../models_mongo');
    await Session.create({
      userId: user._id,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      createdAt: new Date(),
      lastActiveAt: new Date(),
      isActive: true
    });
  } catch (e) { console.error('Session record error:', e); }

  res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
}

function logout(req, res){
  req.session.destroy(err=>{
    if(err) return res.status(500).json({ error: 'Failed to logout' });
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
}

async function me(req, res){
  if(!req.session.userId) return res.json(null);
  const user = await User.findById(req.session.userId).select('-passwordHash').exec();
  res.json(user);
}

module.exports = { login, logout, me };
