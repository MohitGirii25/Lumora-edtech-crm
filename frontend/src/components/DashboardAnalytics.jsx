import { useMemo, useState } from 'react';
import { Activity, BarChart3, PieChart, Users } from 'lucide-react';
import { labels } from '../services/api.js';

const categoryOrder = ['SCHOLARSHIP', 'CONCERT', 'ADMISSION', 'GENERAL_QUERY'];
const userOrder = ['PARENT', 'STUDENT', 'SCHOOL'];
const palette = ['#6558d9', '#9b8cf3', '#79a6ef', '#c0b7fa'];
const formatTick = (value, interval) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, interval === 'month' ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' });
};

function Donut({ title, icon: Icon, values, order, colors, emptyLabel }) {
  const total = order.reduce((sum, key) => sum + (values?.[key] || 0), 0);
  let cursor = 0;
  const stops = order.map((key, index) => {
    const value = values?.[key] || 0;
    const start = cursor;
    cursor += total ? value / total * 100 : 0;
    return `${colors[index]} ${start}% ${cursor}%`;
  }).join(', ');
  return <article className="analytics-card distribution-card">
    <div className="analytics-card-head"><span className="chart-icon"><Icon size={16}/></span><div><h3>{title}</h3><p>Share of inquiries in this period</p></div></div>
    <div className="donut-layout"><div className="donut-chart" style={{ background: total ? `conic-gradient(${stops})` : '#edf0f7' }} role="img" aria-label={`${title}: ${total} total`}><div className="donut-hole"><strong>{total.toLocaleString()}</strong><span>Total</span></div></div>
      <ul className="chart-legend">{order.map((key, index) => { const value = values?.[key] || 0; const percent = total ? Math.round(value / total * 100) : 0; return <li key={key} title={`${labels[key]}: ${value} (${percent}%)`}><i style={{ background: colors[index] }}/><span>{labels[key] || key}</span><strong>{value}</strong><small>{percent}%</small></li>; })}{total === 0 && <li className="legend-empty">{emptyLabel}</li>}</ul>
    </div>
  </article>;
}

function TrendChart({ trend, interval, onIntervalChange }) {
  const points = useMemo(() => {
    const items = trend || [];
    const max = Math.max(1, ...items.map(item => item.count));
    const width = 620, height = 190, left = 12, top = 18, bottom = 28;
    const chartHeight = height - top - bottom;
    const coords = items.map((item, index) => ({ x: items.length < 2 ? width / 2 : left + index * (width - left * 2) / (items.length - 1), y: top + chartHeight - item.count / max * chartHeight, ...item }));
    return { coords, width, height, top, bottom, chartHeight, max };
  }, [trend]);
  const path = points.coords.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const fillPath = points.coords.length ? `${path} L ${points.coords.at(-1).x} ${points.height - points.bottom} L ${points.coords[0].x} ${points.height - points.bottom} Z` : '';
  const tickIndexes = points.coords.length <= 5 ? points.coords.map((_, index) => index) : [0, Math.round((points.coords.length - 1) / 3), Math.round(2 * (points.coords.length - 1) / 3), points.coords.length - 1];
  return <article className="analytics-card trend-card">
    <div className="analytics-card-head trend-heading"><span className="chart-icon"><Activity size={16}/></span><div><h3>Inquiry trends</h3><p>New inquiries received over time</p></div><div className="segmented-control" role="group" aria-label="Trend grouping">{['day', 'week', 'month'].map(value => <button type="button" key={value} className={interval === value ? 'selected' : ''} aria-pressed={interval === value} onClick={() => onIntervalChange(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div></div>
    <div className="trend-plot"><svg viewBox={`0 0 ${points.width} ${points.height}`} role="img" aria-label="Inquiry count trend chart" preserveAspectRatio="none">
      {[0, 1, 2, 3].map(index => { const y = points.top + index * points.chartHeight / 3; return <g key={index}><line x1="0" x2={points.width} y1={y} y2={y} className="grid-line"/><text x="0" y={y - 4} className="axis-label">{Math.round(points.max * (3 - index) / 3)}</text></g>; })}
      {fillPath && <path d={fillPath} className="trend-area"/>}{path && <path d={path} className="trend-line"/>}
      {points.coords.map((point, index) => <g key={`${point.bucket}-${index}`}><title>{`${formatTick(point.bucket, interval)}: ${point.count} ${point.count === 1 ? 'inquiry' : 'inquiries'}`}</title><circle cx={point.x} cy={point.y} r="3.4" className="trend-point"/></g>)}
      {tickIndexes.map(index => <text key={index} x={points.coords[index].x} y={points.height - 5} textAnchor={index === 0 ? 'start' : index === points.coords.length - 1 ? 'end' : 'middle'} className="axis-label">{formatTick(points.coords[index].bucket, interval)}</text>)}
    </svg>{!points.coords.length && <div className="chart-empty">No inquiries in this period yet</div>}</div>
  </article>;
}

export default function DashboardAnalytics({ data }) {
  const statusTotal = (data?.newCount || 0) + (data?.inProgress || 0) + (data?.resolved || 0);
  const statuses = [
    { key: 'NEW', value: data?.newCount || 0, tone: 'new' },
    { key: 'IN_PROGRESS', value: data?.inProgress || 0, tone: 'progress' },
    { key: 'RESOLVED', value: data?.resolved || 0, tone: 'resolved' }
  ];
  return <section className="analytics-section" aria-labelledby="analytics-title">
    <div className="analytics-section-title"><div><span className="eyebrow"><span className="eyebrow-dot"/> PERFORMANCE</span><h2 id="analytics-title">Inquiry analytics</h2><p>Understand who is reaching out and how your team is responding.</p></div><span className="analytics-live"><i/> Based on live inquiry records</span></div>
    <div className="distribution-grid"><Donut title="By category" icon={PieChart} values={data?.categories} order={categoryOrder} colors={palette} emptyLabel="No category data"/><Donut title="By user type" icon={Users} values={data?.userTypes} order={userOrder} colors={['#6558d9', '#8c7eea', '#b5aaf4']} emptyLabel="No user type data"/>
      <article className="analytics-card status-overview"><div className="analytics-card-head"><span className="chart-icon"><BarChart3 size={16}/></span><div><h3>Status overview</h3><p>Current workflow breakdown</p></div></div><div className="status-summary"><strong>{statusTotal.toLocaleString()}</strong><span>inquiries</span></div><div className="status-bars">{statuses.map(item => <div className="status-bar-row" key={item.key}><div><span>{labels[item.key]}</span><strong>{item.value}</strong></div><div className="status-track"><i className={`status-fill ${item.tone}`} style={{ width: `${statusTotal ? Math.max(item.value ? 2 : 0, item.value / statusTotal * 100) : 0}%` }}/></div></div>)}</div><p className="status-footnote">Counts reflect the selected date range.</p></article>
    </div>
  </section>;
}
