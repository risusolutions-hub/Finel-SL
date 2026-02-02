const { DailyWorkTime: SQLDailyWorkTime, User: SQLUser } = require('../models');
const { mongoose, DailyWorkTime, User } = require('../models_mongo');

const DWTModel = mongoose.models.DailyWorkTime || mongoose.model('DailyWorkTime', new mongoose.Schema({}, { strict: false, timestamps: true }));

async function getDailyWorkHistory(req, res) {
  try {
    const { engineerId, fromDate, toDate } = req.query;
    const targetId = engineerId || req.currentUser.id;

    // Verify permission - engineer can only see their own, managers/admins can see all
    const currentIdStr = (req.currentUser.id||'').toString();
    if (req.currentUser.role === 'engineer' && currentIdStr !== (targetId||'').toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try{
      const q = { engineerId: targetId };
      if (fromDate || toDate) {
        q.workDate = {};
        if (fromDate) q.workDate.$gte = fromDate;
        if (toDate) q.workDate.$lte = toDate;
      }
      const records = await DWTModel.find(q).sort({ workDate: -1 }).limit(90).lean().exec();
      return res.json({ records });
    }catch(e){
      const where = { engineerId: targetId };
      if (fromDate || toDate) {
        where.workDate = {};
        if (fromDate) where.workDate['$gte'] = fromDate;
        if (toDate) where.workDate['$lte'] = toDate;
      }
      const records = await SQLDailyWorkTime.findAll({ where, order: [['workDate','DESC']], limit: 90 });
      return res.json({ records });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getWorkStats(req, res) {
  try {
    const { engineerId, fromDate, toDate } = req.query;
    const targetId = engineerId || req.currentUser.id;
    const currentIdStr = (req.currentUser.id||'').toString();
    if (req.currentUser.role === 'engineer' && currentIdStr !== (targetId||'').toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try{
      const q = { engineerId: targetId };
      if (fromDate || toDate) {
        q.workDate = {};
        if (fromDate) q.workDate.$gte = fromDate;
        if (toDate) q.workDate.$lte = toDate;
      }
      const records = await DWTModel.find(q).lean().exec();
      const totalDays = records.length;
      const totalMinutes = records.reduce((sum, r) => sum + (r.totalWorkTimeMinutes || 0), 0);
      const avgMinutesPerDay = totalDays > 0 ? Math.floor(totalMinutes / totalDays) : 0;
      const maxMinutesDay = records.length > 0 ? Math.max(...records.map(r => r.totalWorkTimeMinutes || 0)) : 0;
      const minMinutesDay = records.length > 0 ? Math.min(...records.map(r => r.totalWorkTimeMinutes || 0)) : 0;
      return res.json({ stats: { totalDays, totalMinutes, avgMinutesPerDay, maxMinutesDay, minMinutesDay, avgHoursPerDay: Math.floor(avgMinutesPerDay/60), avgMinsPerDay: avgMinutesPerDay%60, totalHours: Math.floor(totalMinutes/60), totalMins: totalMinutes%60 } });
    }catch(e){
      const where = { engineerId: targetId };
      if (fromDate || toDate) {
        where.workDate = {};
        if (fromDate) where.workDate['$gte'] = fromDate;
        if (toDate) where.workDate['$lte'] = toDate;
      }
      const records = await SQLDailyWorkTime.findAll({ where });
      const totalDays = records.length;
      const totalMinutes = records.reduce((sum, r) => sum + (r.totalWorkTimeMinutes || 0), 0);
      const avgMinutesPerDay = totalDays > 0 ? Math.floor(totalMinutes / totalDays) : 0;
      const maxMinutesDay = records.length > 0 ? Math.max(...records.map(r => r.totalWorkTimeMinutes || 0)) : 0;
      const minMinutesDay = records.length > 0 ? Math.min(...records.map(r => r.totalWorkTimeMinutes || 0)) : 0;
      return res.json({ stats: { totalDays, totalMinutes, avgMinutesPerDay, maxMinutesDay, minMinutesDay, avgHoursPerDay: Math.floor(avgMinutesPerDay/60), avgMinsPerDay: avgMinutesPerDay%60, totalHours: Math.floor(totalMinutes/60), totalMins: totalMinutes%60 } });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getCurrentDayStatus(req, res) {
  try {
    try{
      const user = await User.findById(req.currentUser.id).lean().exec().catch(()=>null);
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = await DWTModel.findOne({ engineerId: req.currentUser.id, workDate: today }).lean().exec().catch(()=>null);
      return res.json({ isCheckedIn: user?.isCheckedIn, dailyFirstCheckIn: user?.dailyFirstCheckIn, dailyLastCheckOut: user?.dailyLastCheckOut, dailyTotalWorkTime: user?.dailyTotalWorkTime||0, lastCheckIn: user?.lastCheckIn, lastCheckOut: user?.lastCheckOut, activeTime: user?.activeTime||0, todayRecord: todayRecord||null });
    }catch(e){
      const user = await SQLUser.findByPk(req.currentUser.id).catch(()=>null);
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = await SQLDailyWorkTime.findOne({ where: { engineerId: user.id, workDate: today } }).catch(()=>null);
      return res.json({ isCheckedIn: user.isCheckedIn, dailyFirstCheckIn: user.dailyFirstCheckIn, dailyLastCheckOut: user.dailyLastCheckOut, dailyTotalWorkTime: user.dailyTotalWorkTime||0, lastCheckIn: user.lastCheckIn, lastCheckOut: user.lastCheckOut, activeTime: user.activeTime||0, todayRecord: todayRecord||null });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getDailyWorkHistory,
  getWorkStats,
  getCurrentDayStatus
};
