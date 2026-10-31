import { useEffect, useState } from 'react';
import { Check, CircleAlert, Inbox, X } from 'lucide-react';
import { labels } from '../services/api.js';

export function StatCard({ icon: Icon, label, value, tone, hint, share = 0 }) {
  const target = Number(value || 0);
  const [displayValue, setDisplayValue] = useState(target);
  useEffect(() => {
    let frame;
    const started = performance.now();
    const from = displayValue;
    const animate = (now) => {
      const progress = Math.min(1, (now - started) / 450);
      setDisplayValue(Math.round(from + (target - from) * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return <article className={`stat-card stat-${tone}`} aria-label={`${label}: ${value}`}>
    <span className="stat-icon"><Icon size={18} strokeWidth={1.8} /></span>
    <div className="stat-copy"><span>{label}</span><strong>{displayValue.toLocaleString()}</strong><small>{hint}</small></div>
    <span className="stat-share" style={{ '--share': `${Math.max(0, Math.min(100, share))}%` }} aria-label={`${Math.round(share)} percent of inquiries`}><span>{Math.round(share)}%</span></span>
  </article>;
}

export function TableSkeleton({ rows = 5 }) {
  return <div className="skeleton-rows" role="status" aria-label="Loading inquiries">{Array.from({ length: rows }, (_, i) =>
    <div className="skeleton-row" key={i}><span className="skeleton-avatar"/><span className="skeleton-lines"><i/><i/></span><span className="skeleton-cell"/><span className="skeleton-cell short"/><span className="skeleton-pill"/><span className="skeleton-pill small"/></div>
  )}<span className="sr-only">Loading inquiries…</span></div>;
}

export function EmptyState({ searching, onClear }) {
  return <div className="empty-state"><span className="empty-icon"><Inbox size={22}/></span><strong>{searching ? 'No matching inquiries' : 'Your inbox is clear'}</strong><span>{searching ? 'Try another name, phone number, or filter.' : 'New inquiries will appear here as soon as they arrive.'}</span>{searching && <button className="text-button" onClick={onClear}>Clear filters</button>}</div>;
}

export function Toast({ toast, onDismiss }) {
  useEffect(() => { if (!toast) return; const id = window.setTimeout(onDismiss, 4000); return () => window.clearTimeout(id); }, [toast, onDismiss]);
  if (!toast) return null;
  const Icon = toast.type === 'error' ? CircleAlert : Check;
  return <div className={`toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} aria-live="polite"><Icon size={18}/><span>{toast.message}</span><button onClick={onDismiss} aria-label="Dismiss notification"><X size={16}/></button></div>;
}

export function InquiryDetails({ inquiry, onClose }) {
  useEffect(() => { if (!inquiry) return; const onKeyDown = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown); }, [inquiry, onClose]);
  if (!inquiry) return null;
  return <div className="dialog-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title"><div className="dialog-top"><span className="form-kicker">INQUIRY DETAILS</span><button className="icon-button" onClick={onClose} aria-label="Close details"><X size={18}/></button></div><div className="detail-person"><span className="contact-avatar large">{inquiry.fullName.slice(0,1).toUpperCase()}</span><div><h2 id="detail-title">{inquiry.fullName}</h2><span>{inquiry.email}</span></div></div><div className="detail-facts"><div><small>Phone</small><strong>{inquiry.phone}</strong></div><div><small>User type</small><strong>{labels[inquiry.userType]}</strong></div><div><small>Category</small><strong>{labels[inquiry.category]}</strong></div><div><small>Received</small><strong>{new Date(inquiry.createdAt).toLocaleString()}</strong></div></div><div className="message-block"><small>MESSAGE</small><p>{inquiry.message}</p></div><button className="button primary full" onClick={onClose}>Done</button></section></div>;
}

export function StatusBadge({ value }) { return <span className={`status-badge ${value.toLowerCase().replace('_','-')}`}><i/>{labels[value]}</span>; }
