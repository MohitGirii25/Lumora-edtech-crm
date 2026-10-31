const inquiryModel = require('../models/inquiryModel');
const invalid = (message) => Object.assign(new Error(message), { status: 400 });

async function create(req, res) {
  try {
    const { fullName, email, phone, userType, category, message } = req.body || {};
    const userTypes = ['PARENT', 'STUDENT', 'SCHOOL'];
    const categories = ['SCHOLARSHIP', 'CONCERT', 'ADMISSION', 'GENERAL_QUERY'];
    if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 160) throw invalid('Enter a name between 2 and 160 characters.');
    if (typeof email !== 'string' || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email.trim())) throw invalid('Enter a valid email address.');
    if (typeof phone !== 'string' || !/^[+\d() .-]{7,24}$/.test(phone.trim())) throw invalid('Enter a valid phone number.');
    if (!userTypes.includes(userType)) throw invalid('Choose a valid user type.');
    if (!categories.includes(category)) throw invalid('Choose a valid inquiry category.');
    if (typeof message !== 'string' || message.trim().length < 5 || message.trim().length > 5000) throw invalid('Enter a message between 5 and 5000 characters.');
    const inq = await inquiryModel.createInquiry(req.body);
    res.status(201).json(inq);
  } catch (e) { res.status(e.status || 500).json({ message: e.status ? e.message : 'Could not save your inquiry.' }); }
}

async function list(req, res) {
  const { category, userType, status, search, sort, page, size } = req.query;
  const currentPage = Number.parseInt(page || '0', 10);
  const pageSize = Number.parseInt(size || '10', 10);
  if (!Number.isInteger(currentPage) || currentPage < 0 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return res.status(400).json({ message: 'Page must be nonnegative and size must be between 1 and 100.' });
  }
  if (status && !['NEW', 'IN_PROGRESS', 'RESOLVED'].includes(status)) return res.status(400).json({ message: 'Choose a valid inquiry status.' });
  if (sort && !['newest', 'oldest'].includes(sort)) return res.status(400).json({ message: 'Choose a valid date sort order.' });
  try {
    const data = await inquiryModel.listInquiries({ category, userType, status, search, sort, page: currentPage, size: pageSize });
    res.json(data);
  } catch {
    res.status(500).json({ message: 'Could not load inquiries.' });
  }
}

async function getOne(req, res) {
  const inq = await inquiryModel.getInquiry(req.params.id);
  if (!inq) return res.status(404).json({ message: 'not found' });
  res.json(inq);
}

async function patchStatus(req, res) {
  if (!['NEW', 'IN_PROGRESS', 'RESOLVED'].includes(req.body?.status)) return res.status(400).json({ message: 'Choose a valid inquiry status.' });
  const inq = await inquiryModel.updateStatus(req.params.id, req.body.status);
  if (!inq) return res.status(404).json({ message: 'not found' });
  res.json(inq);
}

async function dashboard(req, res) {
  res.json(await inquiryModel.stats());
}

async function dashboardAnalytics(req, res) {
  const days = Number.parseInt(req.query.days || '30', 10);
  const interval = req.query.interval || 'day';
  if (![7, 30, 90, 365].includes(days)) return res.status(400).json({ message: 'Choose a supported analytics date range.' });
  if (!['day', 'week', 'month'].includes(interval)) return res.status(400).json({ message: 'Choose a supported trend interval.' });
  try {
    res.json(await inquiryModel.analytics({ days, interval }));
  } catch {
    res.status(500).json({ message: 'Could not load inquiry analytics.' });
  }
}

module.exports = { create, list, getOne, patchStatus, dashboard, dashboardAnalytics };
