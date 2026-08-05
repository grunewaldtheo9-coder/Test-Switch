import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useToastStore, type ToastKind } from '@/store/useToastStore';

const ICON: Record<ToastKind, JSX.Element> = {
  info: <Info size={16} />, success: <CheckCircle2 size={16} />,
  warn: <AlertTriangle size={16} />, error: <XCircle size={16} />,
};

export function ToastHost(): JSX.Element {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {ICON[t.kind]}
          <span style={{ flex: 1, fontSize: 13 }}>{t.message}</span>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}
