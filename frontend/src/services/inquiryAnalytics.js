import { api } from './api.js';

const emptyAnalytics = () => ({ total: 0, newCount: 0, inProgress: 0, resolved: 0, categories: {}, userTypes: {}, trend: [] });

function bucketFor(dateValue, interval) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  if (interval === 'month') date.setDate(1);
  if (interval === 'week') {
    const day = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - day);
  }
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export async function loadAnalyticsFromInquiryPages(days, interval) {
  const first = await api.get('/admin/inquiries', { params: { page: 0, size: 100, sort: 'newest' } });
  const pageCount = first.data.totalPages || 0;
  const pages = [first.data];
  for (let start = 1; start < pageCount; start += 5) {
    const indexes = Array.from({ length: Math.min(5, pageCount - start) }, (_, offset) => start + offset);
    const nextPages = await Promise.all(indexes.map(page => api.get('/admin/inquiries', { params: { page, size: 100, sort: 'newest' } })));
    pages.push(...nextPages.map(response => response.data));
  }

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const records = pages.flatMap(page => page.content || []).filter(item => {
    const received = new Date(item.createdAt).getTime();
    return Number.isFinite(received) && received >= cutoff;
  });
  const result = emptyAnalytics();
  result.total = records.length;
  const trend = new Map();
  records.forEach(item => {
    if (item.status === 'NEW') result.newCount += 1;
    else if (item.status === 'IN_PROGRESS') result.inProgress += 1;
    else if (item.status === 'RESOLVED') result.resolved += 1;
    if (item.category) result.categories[item.category] = (result.categories[item.category] || 0) + 1;
    if (item.userType) result.userTypes[item.userType] = (result.userTypes[item.userType] || 0) + 1;
    const bucket = bucketFor(item.createdAt, interval);
    if (bucket) trend.set(bucket, (trend.get(bucket) || 0) + 1);
  });
  result.trend = [...trend].sort(([a], [b]) => a.localeCompare(b)).map(([bucket, count]) => ({ bucket, count }));
  return result;
}
