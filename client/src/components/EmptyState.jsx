import { Compass } from 'lucide-react';
export default function EmptyState({ title = 'A little quiet here', message = 'Check back soon for something new.', icon: Icon = Compass }) {
  return <div className="empty-state"><span className="empty-state-icon"><Icon size={25} /></span><h3>{title}</h3><p>{message}</p></div>;
}
