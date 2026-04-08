'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MPNotification } from '@/lib/mp/mpService';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  RefreshCw,
  User,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 15_000; // 15 seconds

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved:    { label: 'Aprobado',   cls: 'mp-badge--green'  },
    pending:     { label: 'Pendiente',  cls: 'mp-badge--yellow' },
    rejected:    { label: 'Rechazado',  cls: 'mp-badge--red'    },
    in_process:  { label: 'En proceso', cls: 'mp-badge--blue'   },
  };
  const cfg = map[status] ?? { label: status, cls: 'mp-badge--gray' };
  return <span className={`mp-badge ${cfg.cls}`}>{cfg.label}</span>;
}

function NotificationCard({ n, isNew }: { n: MPNotification; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(n.dateCreated);

  return (
    <div className={`mp-card ${isNew ? 'mp-card--new' : ''}`}>
      {/* Header row */}
      <div className="mp-card__header">
        <div className="mp-card__icon">
          <CreditCard size={18} />
        </div>
        <div className="mp-card__meta">
          <div className="mp-card__amount">
            <span className="mp-card__currency">{n.currency}</span>
            <span className="mp-card__value">
              ${n.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
            {n.netAmount !== n.amount && (
              <span className="mp-card__net">
                (neto ${n.netAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })})
              </span>
            )}
          </div>
          <div className="mp-card__date">
            <Clock size={12} />
            {date.toLocaleString('es-AR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </div>
        </div>
        <StatusBadge status={n.status} />
        <button
          id={`mp-card-toggle-${n.id}`}
          className={`mp-card__toggle ${expanded ? 'mp-card__toggle--open' : ''}`}
          onClick={() => setExpanded(v => !v)}
          aria-label="Expandir detalles"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Payer quick row */}
      <div className="mp-card__payer">
        <User size={13} />
        <span>{n.payerName !== 'N/A' ? n.payerName : n.payerEmail}</span>
      </div>

      {/* Expandable detail */}
      {expanded && (
        <div className="mp-card__detail">
          <dl className="mp-detail-grid">
            <dt>ID Pago</dt>       <dd>#{n.id}</dd>
            <dt>Descripción</dt>   <dd>{n.description}</dd>
            <dt>Pagador</dt>       <dd>{n.payerName}</dd>
            <dt>Email</dt>         <dd>{n.payerEmail}</dd>
            <dt>Identificación</dt><dd>{n.payerId}</dd>
            <dt>Método</dt>        <dd>{n.paymentMethod} ({n.paymentType})</dd>
            <dt>Detalle estado</dt><dd>{n.statusDetail}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function NotificationsPanel() {
  const [notifications, setNotifications]   = useState<MPNotification[]>([]);
  const [newIds, setNewIds]                 = useState<Set<number>>(new Set());
  const [status, setStatus]                 = useState<'idle' | 'polling' | 'error'>('idle');
  const [isOnline, setIsOnline]             = useState(true);
  const [lastSync, setLastSync]             = useState<Date | null>(null);
  const [totalResolved, setTotalResolved]   = useState(0);
  const [isInitialized, setIsInitialized]   = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    setStatus('polling');
    try {
      const res = await fetch('/api/mp/monitor');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as {
        new:     MPNotification[];
        history: MPNotification[];
        state:   { isInitialized: boolean; totalResolved: number };
      };

      setNotifications(data.history);
      setTotalResolved(data.state.totalResolved);
      setIsInitialized(data.state.isInitialized);
      setLastSync(new Date());
      setIsOnline(true);
      setStatus('idle');

      if (data.new.length > 0) {
        const ids = new Set(data.new.map(n => n.id));
        setNewIds(ids);
        setTimeout(() => setNewIds(new Set()), 8000); // highlight disappears after 8s
      }
    } catch {
      setStatus('error');
      setIsOnline(false);
    }
  }, []);

  // Initial fetch + polling every 15s
  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll]);

  const secondsUntilNext = POLL_INTERVAL_MS / 1000;

  return (
    <section className="mp-panel" aria-label="Monitor de pagos Mercado Pago">
      {/* Panel header */}
      <div className="mp-panel__header">
        <div className="mp-panel__title">
          <Zap size={20} className="mp-panel__icon" />
          <h2>Monitor de Pagos</h2>
          {isInitialized && (
            <span className="mp-panel__count">{totalResolved} recibidos</span>
          )}
        </div>

        <div className="mp-panel__controls">
          {isOnline ? (
            <span className="mp-status mp-status--online">
              <Wifi size={13} /> En línea
            </span>
          ) : (
            <span className="mp-status mp-status--offline">
              <WifiOff size={13} /> Sin conexión
            </span>
          )}

          <button
            id="mp-monitor-refresh"
            className={`mp-btn mp-btn--ghost ${status === 'polling' ? 'mp-btn--spinning' : ''}`}
            onClick={poll}
            disabled={status === 'polling'}
            aria-label="Actualizar ahora"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Sync info bar */}
      <div className="mp-panel__syncbar">
        <Activity size={12} />
        {status === 'polling' && <span>Consultando MP…</span>}
        {status === 'error'   && <span className="mp-text--red"><AlertCircle size={12} /> Error al conectar</span>}
        {status === 'idle' && lastSync && (
          <span>
            Última sync: {lastSync.toLocaleTimeString('es-AR')} · próxima en {secondsUntilNext}s
          </span>
        )}
        {!isInitialized && status === 'idle' && (
          <span>Inicializando monitor… esperando primer ciclo.</span>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 && status !== 'polling' && (
        <div className="mp-empty">
          <CheckCircle2 size={40} className="mp-empty__icon" />
          <p>Sin notificaciones aún.</p>
          <p className="mp-empty__sub">
            El monitor consultará Mercado Pago cada {secondsUntilNext} segundos.
          </p>
        </div>
      )}

      {/* Skeleton while loading for the first time */}
      {notifications.length === 0 && status === 'polling' && (
        <div className="mp-skeleton-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="mp-skeleton" />
          ))}
        </div>
      )}

      {/* Notification list */}
      {notifications.length > 0 && (
        <ul className="mp-list" role="list">
          {notifications.map(n => (
            <li key={n.id}>
              <NotificationCard n={n} isNew={newIds.has(n.id)} />
            </li>
          ))}
        </ul>
      )}

      <style>{PANEL_CSS}</style>
    </section>
  );
}

// ─── Scoped CSS ────────────────────────────────────────────────────────────────

const PANEL_CSS = `
/* ── Container ── */
.mp-panel {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 1rem;
  overflow: hidden;
  font-family: 'Inter', system-ui, sans-serif;
  color: #e2e8f0;
}

/* ── Header ── */
.mp-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgba(99, 102, 241, 0.08);
  border-bottom: 1px solid rgba(99, 102, 241, 0.15);
  gap: 0.75rem;
}
.mp-panel__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.mp-panel__title h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #f1f5f9;
}
.mp-panel__icon { color: #818cf8; }
.mp-panel__count {
  background: rgba(99,102,241,0.2);
  color: #a5b4fc;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  letter-spacing: 0.03em;
}
.mp-panel__controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ── Status pills ── */
.mp-status {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}
.mp-status--online  { background: rgba(34,197,94,0.15); color: #4ade80; }
.mp-status--offline { background: rgba(239,68,68,0.15);  color: #f87171; }

/* ── Sync bar ── */
.mp-panel__syncbar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1.25rem;
  font-size: 0.7rem;
  color: #64748b;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  background: rgba(0,0,0,0.15);
}
.mp-text--red { color: #f87171; display: flex; align-items: center; gap: 0.3rem; }

/* ── Buttons ── */
.mp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  border-radius: 0.4rem;
  transition: background 0.15s, opacity 0.15s;
  padding: 0.375rem;
}
.mp-btn--ghost {
  background: transparent;
  color: #94a3b8;
}
.mp-btn--ghost:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }
.mp-btn--ghost:disabled { opacity: 0.4; cursor: not-allowed; }
.mp-btn--spinning svg { animation: mp-spin 0.8s linear infinite; }
@keyframes mp-spin { to { transform: rotate(360deg); } }

/* ── List ── */
.mp-list {
  list-style: none;
  margin: 0;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 520px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(99,102,241,0.3) transparent;
}

/* ── Card ── */
.mp-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 0.65rem;
  padding: 0.8rem 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.mp-card:hover {
  border-color: rgba(99,102,241,0.35);
  box-shadow: 0 0 0 1px rgba(99,102,241,0.15) inset;
}
.mp-card--new {
  border-color: rgba(99,102,241,0.6) !important;
  box-shadow: 0 0 12px rgba(99,102,241,0.25);
  animation: mp-pulse-in 0.4s ease;
}
@keyframes mp-pulse-in {
  0%   { transform: scale(0.98); opacity: 0.7; }
  60%  { transform: scale(1.01); }
  100% { transform: scale(1);    opacity: 1;   }
}

.mp-card__header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.mp-card__icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.4rem;
  background: rgba(99,102,241,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #818cf8;
  flex-shrink: 0;
}
.mp-card__meta { flex: 1; min-width: 0; }
.mp-card__amount {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  flex-wrap: wrap;
}
.mp-card__currency {
  font-size: 0.65rem;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.05em;
}
.mp-card__value {
  font-size: 1.1rem;
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: -0.02em;
}
.mp-card__net {
  font-size: 0.65rem;
  color: #94a3b8;
}
.mp-card__date {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  color: #64748b;
  margin-top: 0.1rem;
}

.mp-card__toggle {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #64748b;
  padding: 0.2rem;
  border-radius: 0.3rem;
  transition: color 0.15s, transform 0.2s;
  display: flex;
  align-items: center;
}
.mp-card__toggle:hover { color: #e2e8f0; }
.mp-card__toggle--open { transform: rotate(180deg); }

.mp-card__payer {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 0.35rem;
  padding-left: 2.6rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Detail grid ── */
.mp-card__detail {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.mp-detail-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.3rem 1rem;
  margin: 0;
  font-size: 0.72rem;
}
.mp-detail-grid dt {
  color: #64748b;
  font-weight: 600;
  white-space: nowrap;
}
.mp-detail-grid dd {
  color: #cbd5e1;
  margin: 0;
  word-break: break-all;
}

/* ── Badges ── */
.mp-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  letter-spacing: 0.04em;
  white-space: nowrap;
  flex-shrink: 0;
}
.mp-badge--green  { background: rgba(34,197,94,0.15);  color: #4ade80; }
.mp-badge--yellow { background: rgba(234,179,8,0.15);  color: #facc15; }
.mp-badge--red    { background: rgba(239,68,68,0.15);  color: #f87171; }
.mp-badge--blue   { background: rgba(59,130,246,0.15); color: #60a5fa; }
.mp-badge--gray   { background: rgba(148,163,184,0.1); color: #94a3b8; }

/* ── Empty state ── */
.mp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  gap: 0.5rem;
  text-align: center;
}
.mp-empty__icon { color: rgba(99,102,241,0.4); margin-bottom: 0.5rem; }
.mp-empty p { margin: 0; font-size: 0.85rem; color: #64748b; }
.mp-empty__sub { font-size: 0.72rem !important; color: #475569 !important; }

/* ── Skeleton ── */
.mp-skeleton-list { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
.mp-skeleton {
  height: 72px;
  border-radius: 0.65rem;
  background: linear-gradient(90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.07) 50%,
    rgba(255,255,255,0.04) 75%);
  background-size: 200% 100%;
  animation: mp-shimmer 1.4s ease infinite;
}
@keyframes mp-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;
