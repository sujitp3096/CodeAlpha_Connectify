import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
export default function Toast({ toast }) {
  const Icon = toast?.type === 'error' ? AlertCircle : toast?.type === 'info' ? Info : CheckCircle2;
  return <AnimatePresence>{toast && <motion.div className={`toast toast-${toast.type || 'success'}`} initial={{ opacity: 0, y: 14, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}><Icon size={17} /><span>{toast.message}</span></motion.div>}</AnimatePresence>;
}
