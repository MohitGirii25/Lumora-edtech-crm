import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarClock, CircleAlert, Mail, Phone, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Brand from '../components/Brand.jsx';
import { StatusBadge } from '../components/CrmComponents.jsx';
import { api, errorMessage, labels } from '../services/api.js';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });
}

export default function InquiryDetailPage() {
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/admin/inquiries/${id}`)
      .then(({ data }) => { if (active) setInquiry(data); })
      .catch((e) => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return <main className="inquiry-detail-shell">
    <header className="inquiry-detail-top"><Brand/><Link className="detail-back-link" to="/admin"><ArrowLeft size={16}/> Back to inquiries</Link></header>
    <div className="inquiry-detail-content">
      {loading ? <div className="detail-state" role="status">Loading inquiry details…</div> : error ? <div className="detail-state detail-error" role="alert"><CircleAlert size={20}/><div><strong>We couldn’t load this inquiry.</strong><span>{error}</span></div><Link className="button" to="/admin">Return to inbox</Link></div> : inquiry && <>
        <div className="detail-page-heading"><div><span className="eyebrow"><span className="eyebrow-dot"/> INQUIRY RECORD</span><h1>Inquiry details</h1><p>Full information submitted by this contact.</p></div><StatusBadge value={inquiry.status}/></div>
        <article className="inquiry-record">
          <section className="record-contact"><span className="contact-avatar record-avatar">{(inquiry.fullName || '?').slice(0, 1).toUpperCase()}</span><div><span className="form-kicker">CONTACT</span><h2>{inquiry.fullName}</h2><a href={`mailto:${inquiry.email}`}><Mail size={15}/>{inquiry.email}</a></div></section>
          <section className="record-section"><h3>Contact information</h3><div className="record-facts">
            <div className="record-fact"><Phone size={16}/><span><small>Phone</small><strong>{inquiry.phone || '—'}</strong></span></div>
            <div className="record-fact"><UserRound size={16}/><span><small>User type</small><strong>{labels[inquiry.userType] || inquiry.userType || '—'}</strong></span></div>
            <div className="record-fact"><CalendarClock size={16}/><span><small>Received</small><strong>{formatDate(inquiry.createdAt)}</strong></span></div>
            <div className="record-fact"><CalendarClock size={16}/><span><small>Last updated</small><strong>{formatDate(inquiry.updatedAt)}</strong></span></div>
          </div></section>
          <section className="record-section"><h3>Inquiry</h3><div className="record-category"><small>Category</small><strong>{labels[inquiry.category] || inquiry.category || '—'}</strong></div><div className="record-message"><small>MESSAGE</small><p>{inquiry.message || 'No message provided.'}</p></div></section>
          <footer className="record-footer"><span>Inquiry ID <strong>{inquiry.id}</strong></span><Link className="button primary" to="/admin"><ArrowLeft size={15}/> Back to inbox</Link></footer>
        </article>
      </>}
    </div>
  </main>;
}
