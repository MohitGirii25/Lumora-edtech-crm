import { useCallback, useEffect, useState } from 'react';
import { Activity, ArrowDownUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleHelp, Filter, GraduationCap, Inbox, LoaderCircle, LogOut, Menu, RefreshCw, Search, SlidersHorizontal, Users, X } from 'lucide-react';
import { api, errorMessage, labels } from '../services/api.js';
import Brand from '../components/Brand.jsx';
import { EmptyState, InquiryDetails, StatCard, StatusBadge, TableSkeleton, Toast } from '../components/CrmComponents.jsx';

const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 };
const statuses = ['NEW', 'IN_PROGRESS', 'RESOLVED'];
function getAdmin() { try { return JSON.parse(localStorage.getItem('edtech-admin') || '{"name":"Administrator"}'); } catch { return { name: 'Administrator' }; } }

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, newCount: 0, inProgress: 0, resolved: 0 });
  const [page, setPage] = useState(emptyPage);
  const [category, setCategory] = useState(''); const [userType, setUserType] = useState('');
  const [search, setSearch] = useState(''); const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState('');
  const [updating, setUpdating] = useState(null); const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null); const [collapsed, setCollapsed] = useState(false);
  const admin = getAdmin();

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const params = { page: page.number, size: 10 };
      if (category) params.category = category;
      if (userType) params.userType = userType;
      if (query) params.search = query;
      const [inquiries, dashboardStats] = await Promise.all([
        api.get('/admin/inquiries', { params }), api.get('/admin/inquiries/dashboard/stats')
      ]);
      setPage(inquiries.data); setStats(dashboardStats.data);
    } catch (e) { setLoadError(errorMessage(e)); }
    finally { setLoading(false); }
  }, [category, userType, query, page.number]);
  useEffect(() => { load(); }, [load]);

  async function changeStatus(inquiry, status) {
    if (inquiry.status === status) return;
    setUpdating(inquiry.id);
    try {
      const response = await api.patch(`/admin/inquiries/${inquiry.id}/status`, { status });
      setPage(current => ({ ...current, content: current.content.map(row => row.id === inquiry.id ? response.data : row) }));
      const statsResponse = await api.get('/admin/inquiries/dashboard/stats'); setStats(statsResponse.data);
      setToast({ type: 'success', message: `${inquiry.fullName} moved to ${labels[status]}.` });
    } catch (e) { setToast({ type: 'error', message: errorMessage(e) }); }
    finally { setUpdating(null); }
  }
  function applySearch(e) { e.preventDefault(); setPage(current => ({ ...current, number: 0 })); setQuery(search.trim()); }
  function clearFilters() { setCategory(''); setUserType(''); setSearch(''); setQuery(''); setPage(current => ({ ...current, number: 0 })); }
  function logout() { localStorage.removeItem('edtech-token'); localStorage.removeItem('edtech-admin'); window.location.assign('/admin/login'); }
  const hasFilters = Boolean(category || userType || query || search);
  const start = page.totalElements === 0 ? 0 : page.number * page.size + 1;
  const end = Math.min((page.number + 1) * page.size, page.totalElements);

  return <main className={`dashboard-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className="sidebar" aria-label="Main navigation">
      <div className="side-brand"><Brand/><button className="sidebar-toggle" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}><ChevronsLeft size={17}/></button></div>
      <div className="side-label">WORKSPACE</div>
      <a href="/admin" className="side-item active" aria-current="page" title={collapsed ? 'Inquiries' : undefined}><Inbox size={18}/><span>Inquiries</span><span className="side-count">{stats.newCount}</span></a>
      <div className="side-bottom">
        <div className="side-help"><span className="help-mark"><CircleHelp size={14}/></span><strong>Need a hand?</strong><span>Reach out to your workspace owner.</span></div>
        <button className="profile" onClick={logout} title="Log out"><span className="profile-avatar">{(admin.name || 'A').slice(0,1).toUpperCase()}</span><span className="profile-text"><strong>{admin.name}</strong><small>Administrator</small></span><LogOut size={16}/></button>
      </div>
    </aside>
    <section className="dash-main">
      <header className="dash-top"><div className="top-left"><button className="mobile-menu" onClick={() => setCollapsed(v => !v)} aria-label="Toggle navigation"><Menu size={19}/></button><span className="breadcrumb">Workspace <b>/</b> <strong>Inquiries</strong></span></div><div className="dash-user"><span>Good to see you, <strong>{admin.name}</strong></span><span className="profile-avatar small">{(admin.name || 'A').slice(0,1).toUpperCase()}</span></div></header>
      <div className="dash-content">
        <div className="page-title-row"><div><span className="eyebrow"><span className="eyebrow-dot"/> INQUIRY MANAGEMENT</span><h1>Your inbox</h1><p>Stay on top of every conversation and keep good things moving.</p></div><button className="button refresh-button" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''}/><span>Refresh</span></button></div>
        <div className="stats-grid"><StatCard icon={Users} label="Total inquiries" value={stats.total} tone="navy" hint="All time"/><StatCard icon={Inbox} label="New" value={stats.newCount} tone="blue" hint="Needs attention"/><StatCard icon={Activity} label="In progress" value={stats.inProgress} tone="amber" hint="Being followed up"/><StatCard icon={GraduationCap} label="Resolved" value={stats.resolved} tone="green" hint="Successfully handled"/></div>
        <section className="inbox-panel" aria-labelledby="inquiries-heading">
          <div className="panel-head"><div><h2 id="inquiries-heading">All inquiries <span className="total-pill">{page.totalElements}</span></h2><p>Review, search, and update incoming requests.</p></div><span className="updated-label"><i/> Synced with your database</span></div>
          <form className="filters" onSubmit={applySearch}>
            <label className="search-input"><Search size={16}/><span className="sr-only">Search by name or phone number</span><input type="search" placeholder="Search name or phone…" value={search} onChange={e => setSearch(e.target.value)}/>{search && <button type="button" className="clear-search" onClick={() => { setSearch(''); setQuery(''); setPage(current => ({ ...current, number: 0 })); }} aria-label="Clear search"><X size={14}/></button>}</label>
            <label className="filter-select"><Filter size={14}/><span className="sr-only">Filter by category</span><select value={category} onChange={e => { setCategory(e.target.value); setPage(current => ({ ...current, number: 0 })); }}><option value="">All categories</option><option value="SCHOLARSHIP">Scholarship</option><option value="CONCERT">Concert</option><option value="ADMISSION">Admission</option><option value="GENERAL_QUERY">General Query</option></select></label>
            <label className="filter-select"><Users size={14}/><span className="sr-only">Filter by user type</span><select value={userType} onChange={e => { setUserType(e.target.value); setPage(current => ({ ...current, number: 0 })); }}><option value="">All user types</option><option value="PARENT">Parent</option><option value="STUDENT">Student</option><option value="SCHOOL">School</option></select></label>
            <button className="button search-button" type="submit"><Search size={14}/><span>Search</span></button>
            {hasFilters && <button type="button" className="reset-button" onClick={clearFilters}>Clear filters</button>}
            <span className="filter-caption"><SlidersHorizontal size={13}/> Filters</span>
          </form>
          {loadError ? <div className="load-error" role="alert"><span><strong>We couldn’t load your inquiries.</strong><small>{loadError}</small></span><button className="button retry-button" onClick={load}>Try again</button></div> : <>
            <div className="table-wrap"><table><thead><tr><th scope="col">CONTACT</th><th scope="col">PHONE</th><th scope="col">USER TYPE</th><th scope="col">CATEGORY</th><th scope="col">RECEIVED <ArrowDownUp size={11}/></th><th scope="col">STATUS</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead>
              {loading ? <tbody><tr><td colSpan="7" className="skeleton-cell-wrap"><TableSkeleton/></td></tr></tbody> : page.content.length === 0 ? <tbody><tr><td colSpan="7"><EmptyState searching={hasFilters} onClear={clearFilters}/></td></tr></tbody> : <tbody>{page.content.map(item => <tr key={item.id}>
                <td><div className="contact-cell"><span className="contact-avatar">{item.fullName.slice(0,1).toUpperCase()}</span><span><strong>{item.fullName}</strong><small>{item.email}</small></span></div></td>
                <td className="muted-cell phone-cell">{item.phone}</td><td><span className="type-label">{labels[item.userType]}</span></td><td><span className="category-label">{labels[item.category]}</span></td><td className="muted-cell date-cell">{new Date(item.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</td>
                <td><div className="status-control"><StatusBadge value={item.status}/><select disabled={updating === item.id} className="status-select" value={item.status} onChange={e => changeStatus(item, e.target.value)} aria-label={`Update status for ${item.fullName}`}>{statuses.map(s => <option value={s} key={s}>{labels[s]}</option>)}</select>{updating === item.id && <LoaderCircle className="spin status-loader" size={13}/>}</div></td>
                <td><button className="row-open" title={`View ${item.fullName} inquiry`} aria-label={`View ${item.fullName} inquiry details`} onClick={() => setSelected(item)}><ArrowDownUp size={14}/></button></td>
              </tr>)}</tbody>}</table></div>
            <div className="pagination"><span>Showing <strong>{start}–{end}</strong> of <strong>{page.totalElements}</strong></span><div><button disabled={page.number <= 0 || loading} onClick={() => setPage(current => ({ ...current, number: 0 }))} aria-label="First page"><ChevronsLeft size={15}/></button><button disabled={page.number <= 0 || loading} onClick={() => setPage(current => ({ ...current, number: current.number - 1 }))} aria-label="Previous page"><ChevronLeft size={15}/></button><span className="page-count">{page.totalPages === 0 ? 0 : page.number + 1} <i>/</i> {page.totalPages}</span><button disabled={page.number + 1 >= page.totalPages || loading} onClick={() => setPage(current => ({ ...current, number: current.number + 1 }))} aria-label="Next page"><ChevronRight size={15}/></button><button disabled={page.number + 1 >= page.totalPages || loading} onClick={() => setPage(current => ({ ...current, number: page.totalPages - 1 }))} aria-label="Last page"><ChevronsRight size={15}/></button></div></div>
          </>}
        </section>
        <footer className="dash-footer"><span><GraduationCap size={16}/> Brightpath Education</span><span>Built for better conversations.</span></footer>
      </div>
    </section>
    <Toast toast={toast} onDismiss={() => setToast(null)}/><InquiryDetails inquiry={selected} onClose={() => setSelected(null)}/>
  </main>;
}
