import { useCallback, useEffect, useState } from 'react';
import { Activity, ArrowDownUp, CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleHelp, Filter, GraduationCap, Inbox, LogOut, Menu, RefreshCw, Search, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage, labels } from '../services/api.js';
import Brand from '../components/Brand.jsx';
import { EmptyState, StatCard, StatusBadge, TableSkeleton, Toast } from '../components/CrmComponents.jsx';
import DashboardAnalytics from '../components/DashboardAnalytics.jsx';
import { loadAnalyticsFromInquiryPages } from '../services/inquiryAnalytics.js';

const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 };
const statuses = ['NEW', 'IN_PROGRESS', 'RESOLVED'];
function getAdmin() { try { return JSON.parse(localStorage.getItem('edtech-admin') || '{"name":"Administrator"}'); } catch { return { name: 'Administrator' }; } }

export default function DashboardPage() {
  const [page, setPage] = useState(emptyPage);
  const [category, setCategory] = useState(''); const [userType, setUserType] = useState('');
  const [status, setStatus] = useState(''); const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState(''); const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [analytics, setAnalytics] = useState(null); const [analyticsError, setAnalyticsError] = useState('');
  const [analyticsLoading, setAnalyticsLoading] = useState(true); const [days, setDays] = useState(30);
  const [collapsed, setCollapsed] = useState(false); const [toast, setToast] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const navigate = useNavigate();
  const admin = getAdmin();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const params = { page: page.number, size: 10 };
      if (category) params.category = category;
      if (userType) params.userType = userType;
      if (status) params.status = status;
      params.sort = sort;
      if (query) params.search = query;
      const inquiries = await api.get('/admin/inquiries', { params });
      setPage(inquiries.data);
    } catch (e) { setLoadError(errorMessage(e)); }
    finally { setLoading(false); setHasLoaded(true); }
  }, [category, userType, status, sort, query, page.number]);
  useEffect(() => { load(); }, [load]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true); setAnalyticsError('');
    try {
      try {
        const { data } = await api.get('/admin/inquiries/dashboard/analytics', { params: { days, interval: 'day' } });
        setAnalytics(data);
      } catch {
        setAnalytics(await loadAnalyticsFromInquiryPages(days, 'day'));
      }
    } catch (e) { setAnalyticsError(errorMessage(e)); }
    finally { setAnalyticsLoading(false); }
  }, [days]);
  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);
  function refreshDashboard() { load(); loadAnalytics(); }
  function applySearch(e) { e.preventDefault(); setPage(current => ({ ...current, number: 0 })); setQuery(search.trim()); }
  function clearFilters() { setCategory(''); setUserType(''); setStatus(''); setSort('newest'); setSearch(''); setQuery(''); setPage(current => ({ ...current, number: 0 })); }
  function logout() { localStorage.removeItem('edtech-token'); localStorage.removeItem('edtech-admin'); window.location.assign('/admin/login'); }
  const hasFilters = Boolean(category || userType || status || query || search);
  const start = page.totalElements === 0 ? 0 : page.number * page.size + 1;
  const end = Math.min((page.number + 1) * page.size, page.totalElements);

  return <main className={`dashboard-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className="sidebar" aria-label="Main navigation">
      <div className="side-brand"><Brand/><button className="sidebar-toggle" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}><ChevronsLeft size={17}/></button></div>
      <div className="side-label">WORKSPACE</div>
      <a href="/admin" className="side-item active" aria-current="page" title={collapsed ? 'Inquiries' : undefined}><Inbox size={18}/><span>Inquiries</span><span className="side-count">{analytics?.newCount || 0}</span></a>
      <div className="side-bottom">
        <div className="side-help"><span className="help-mark"><CircleHelp size={14}/></span><strong>Need a hand?</strong><span>Reach out to your workspace owner.</span></div>
        <button className="profile" onClick={logout} title="Log out"><span className="profile-avatar">{(admin.name || 'A').slice(0,1).toUpperCase()}</span><span className="profile-text"><strong>{admin.name}</strong><small>Administrator</small></span><LogOut size={16}/></button>
      </div>
    </aside>
    <section className="dash-main">
      <header className="dash-top"><div className="top-left"><button className="mobile-menu" onClick={() => setCollapsed(v => !v)} aria-label="Toggle navigation"><Menu size={19}/></button><span className="breadcrumb">Workspace <b>/</b> <strong>Overview</strong></span></div><div className="dash-user"><span>Good to see you, <strong>{admin.name}</strong></span><span className="dash-clock">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}<i>·</i>{now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span><span className="profile-avatar small">{(admin.name || 'A').slice(0,1).toUpperCase()}</span></div></header>
      <div className="dash-content">
        <div className="dashboard-welcome"><div className="page-title-row"><div><span className="eyebrow"><span className="eyebrow-dot"/> INQUIRY MANAGEMENT</span><h1>Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, {(admin.name || 'there').split(' ')[0]}</h1><p>Here’s what’s happening with your inquiries.</p></div><div className="dashboard-actions"><label className="date-range-control"><CalendarDays size={15}/><span className="sr-only">Analytics date range</span><select value={days} onChange={e => setDays(Number(e.target.value))}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option></select></label><button className="button refresh-button" onClick={refreshDashboard} disabled={loading || analyticsLoading}><RefreshCw size={15} className={loading || analyticsLoading ? 'spin' : ''}/><span>Refresh</span></button></div></div></div>
        {analyticsError ? <div className="analytics-error" role="alert"><strong>Analytics are temporarily unavailable.</strong><span>{analyticsError}</span><button className="text-button" onClick={loadAnalytics}>Try again</button></div> : <div className={analyticsLoading ? 'analytics-loading' : ''}>
          <div className="stats-grid"><StatCard icon={Users} label="Total inquiries" value={analytics?.total || 0} tone="navy" hint={`In the last ${days === 365 ? '12 months' : `${days} days`}`} share={analytics?.total ? 100 : 0}/><StatCard icon={Inbox} label="New inquiries" value={analytics?.newCount || 0} tone="blue" hint="Needs attention" share={analytics?.total ? analytics.newCount / analytics.total * 100 : 0}/><StatCard icon={Activity} label="In progress" value={analytics?.inProgress || 0} tone="amber" hint="Being followed up" share={analytics?.total ? analytics.inProgress / analytics.total * 100 : 0}/><StatCard icon={GraduationCap} label="Resolved" value={analytics?.resolved || 0} tone="green" hint="Successfully handled" share={analytics?.total ? analytics.resolved / analytics.total * 100 : 0}/></div>
          <DashboardAnalytics data={analytics}/>
        </div>}
        <section className="inbox-panel" aria-labelledby="inquiries-heading">
          <div className="panel-head"><div><h2 id="inquiries-heading">All inquiries <span className="total-pill">{page.totalElements}</span></h2><p>Review, search, and update incoming requests.</p></div><span className={`updated-label ${loading ? 'is-refreshing' : ''}`}><i className={loading ? 'spin' : ''}/>{loading ? 'Updating results…' : 'Synced with your database'}</span></div>
          <form className="filters" onSubmit={applySearch}>
            <label className="search-input"><Search size={16}/><span className="sr-only">Search by name or phone number</span><input type="search" placeholder="Search name or phone…" value={search} onChange={e => setSearch(e.target.value)}/>{search && <button type="button" className="clear-search" onClick={() => { setSearch(''); setQuery(''); setPage(current => ({ ...current, number: 0 })); }} aria-label="Clear search"><X size={14}/></button>}</label>
            <label className="filter-select sort-select"><ArrowDownUp size={14}/><span className="sr-only">Sort by received date</span><select value={sort} onChange={e => { setSort(e.target.value); setPage(current => ({ ...current, number: 0 })); }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
            <label className="filter-select"><Users size={14}/><span className="sr-only">Filter by user type</span><select value={userType} onChange={e => { setUserType(e.target.value); setPage(current => ({ ...current, number: 0 })); }}><option value="">All user types</option><option value="PARENT">Parent</option><option value="STUDENT">Student</option><option value="SCHOOL">School</option></select></label>
            <label className="filter-select"><Filter size={14}/><span className="sr-only">Filter by category</span><select value={category} onChange={e => { setCategory(e.target.value); setPage(current => ({ ...current, number: 0 })); }}><option value="">All categories</option><option value="SCHOLARSHIP">Scholarship</option><option value="CONCERT">Concert</option><option value="ADMISSION">Admission</option><option value="GENERAL_QUERY">General Query</option></select></label>
            <label className="filter-select"><Activity size={14}/><span className="sr-only">Filter by status</span><select value={status} onChange={e => { setStatus(e.target.value); setPage(current => ({ ...current, number: 0 })); }}><option value="">All statuses</option>{statuses.map(s => <option value={s} key={s}>{labels[s]}</option>)}</select></label>
            <button type="button" className="reset-button" onClick={clearFilters} disabled={!hasFilters} aria-hidden={!hasFilters}>Clear filters</button>
          </form>
          {loadError ? <div className="load-error" role="alert"><span><strong>We couldn’t load your inquiries.</strong><small>{loadError}</small></span><button className="button retry-button" onClick={load}>Try again</button></div> : <>
            <div className="table-wrap"><table><thead><tr><th scope="col">CONTACT</th><th scope="col">PHONE</th><th scope="col">USER TYPE</th><th scope="col">CATEGORY</th><th scope="col">RECEIVED <ArrowDownUp size={11}/></th><th scope="col">STATUS</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead>
              {loading && !hasLoaded ? <tbody><tr><td colSpan="7" className="skeleton-cell-wrap"><TableSkeleton/></td></tr></tbody> : page.content.length === 0 ? <tbody><tr><td colSpan="7"><EmptyState searching={hasFilters} onClear={clearFilters}/></td></tr></tbody> : <tbody>{page.content.map(item => <tr key={item.id} className="inquiry-row" tabIndex={0} onClick={() => navigate(`/admin/inquiries/${item.id}`)} onKeyDown={e => { if (e.target === e.currentTarget && e.key === 'Enter') navigate(`/admin/inquiries/${item.id}`); }}>
                <td><div className="contact-cell"><span className="contact-avatar">{item.fullName.slice(0,1).toUpperCase()}</span><span><strong>{item.fullName}</strong><small>{item.email}</small></span></div></td>
                <td className="muted-cell phone-cell">{item.phone}</td><td><span className="type-label">{labels[item.userType]}</span></td><td><span className="category-label">{labels[item.category]}</span></td><td className="muted-cell date-cell">{new Date(item.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</td>
                <td><StatusBadge value={item.status}/></td>
                <td><button className="row-open" title={`View ${item.fullName} inquiry`} aria-label={`View ${item.fullName} inquiry details`} onClick={() => navigate(`/admin/inquiries/${item.id}`)}><ArrowDownUp size={14}/></button></td>
              </tr>)}</tbody>}</table></div>
            <div className="pagination"><span>Showing <strong>{start}–{end}</strong> of <strong>{page.totalElements}</strong></span><div><button disabled={page.number <= 0 || loading} onClick={() => setPage(current => ({ ...current, number: 0 }))} aria-label="First page"><ChevronsLeft size={15}/></button><button disabled={page.number <= 0 || loading} onClick={() => setPage(current => ({ ...current, number: current.number - 1 }))} aria-label="Previous page"><ChevronLeft size={15}/></button><span className="page-count">{page.totalPages === 0 ? 0 : page.number + 1} <i>/</i> {page.totalPages}</span><button disabled={page.number + 1 >= page.totalPages || loading} onClick={() => setPage(current => ({ ...current, number: current.number + 1 }))} aria-label="Next page"><ChevronRight size={15}/></button><button disabled={page.number + 1 >= page.totalPages || loading} onClick={() => setPage(current => ({ ...current, number: page.totalPages - 1 }))} aria-label="Last page"><ChevronsRight size={15}/></button></div></div>
          </>}
        </section>
        <footer className="dash-footer"><span><GraduationCap size={16}/> Lumora</span><span>Illuminating the Path to Success.</span></footer>
      </div>
    </section>
    <Toast toast={toast} onDismiss={() => setToast(null)}/>
  </main>;
}
