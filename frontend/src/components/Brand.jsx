import { GraduationCap } from 'lucide-react';

export default function Brand() {
  return <a className="brand" href="/" aria-label="Lumora — Illuminating the Path to Success.">
    <span className="brand-mark"><GraduationCap size={22}/></span>
    <span className="brand-copy"><span className="brand-name">Lumora</span><small className="brand-tagline">Illuminating the Path to Success.</small></span>
  </a>;
}
