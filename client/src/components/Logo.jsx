import { Orbit } from 'lucide-react';
export default function Logo({ light = false }) {
  return <span className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-mark"><Orbit size={21} strokeWidth={2.4} /></span><span>connectify<span className="brand-dot">.</span></span></span>;
}
