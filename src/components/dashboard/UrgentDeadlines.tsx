import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { format, parseISO, differenceInCalendarDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getPrazos, type Prazo } from "@/lib/store";
import { useOutletContext } from "react-router-dom";
import { PrazoDetailModal } from "@/components/PrazoDetailModal";

interface Props {
  /** Optional yyyy-MM-dd to filter only that day; if omitted, shows next 5 days. */
  filterDay?: string | null;
}

export function UrgentDeadlines({ filterDay }: Props) {
  const { refreshKey, searchQuery } = useOutletContext<{ refreshKey: number; searchQuery?: string }>() || { refreshKey: 0, searchQuery: "" };
  const [prazos, setPrazos] = useState<Prazo[]>([]);
  const [selected, setSelected] = useState<Prazo | null>(null);

  useEffect(() => {
    getPrazos().then(setPrazos);
  }, [refreshKey]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const visible = useMemo(() => {
    let filtered = prazos;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.titulo.toLowerCase().includes(q) ||
          (p.detalhe && p.detalhe.toLowerCase().includes(q))
      );
    }

    if (filterDay) {
      return filtered
        .filter((p) => p.data.slice(0, 10) === filterDay)
        .sort((a, b) => a.data.localeCompare(b.data));
    }
    // Next 5 days from today (inclusive)
    return filtered
      .filter((p) => {
        const diff = differenceInCalendarDays(parseISO(p.data), today);
        return diff >= 0 && diff <= 5;
      })
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [prazos, filterDay, today, searchQuery]);

  // Weekly task load: pending prazos within current week
  const weekLoad = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    const weekPrazos = prazos.filter((p) =>
      isWithinInterval(parseISO(p.data), { start, end })
    );
    const total = weekPrazos.length;
    const pending = weekPrazos.filter((p) => parseISO(p.data) >= today).length;
    // Capacity threshold: 10 tasks/week = 100%
    const pct = Math.min(100, Math.round((pending / 10) * 100));
    return { total, pending, pct };
  }, [prazos, today]);

  return (
    <section className="bg-card rounded-xl shadow-sm p-8 border border-border sticky top-24">
      <div className="flex items-center gap-3 mb-8">
        <AlertTriangle size={20} className="text-destructive" />
        <h4 className="text-xl font-serif text-foreground">
          {filterDay ? "Prazos do Dia" : "Prazos Urgentes"}
        </h4>
      </div>

      {!filterDay && (
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-label mb-6">
          Próximos 5 dias
        </p>
      )}

      {visible.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-4">
          {filterDay
            ? "Sem prazos para este dia."
            : "Nenhum prazo nos próximos 5 dias."}
        </p>
      ) : (
        <div className="space-y-8">
          {visible.map((d) => {
            const data = parseISO(d.data);
            const diff = differenceInCalendarDays(data, today);
            const urgent = d.tipo === "fatal" || (diff >= 0 && diff <= 2);
            const label =
              diff === 0
                ? "Hoje"
                : diff === 1
                  ? "Amanhã"
                  : diff > 0 && diff <= 5
                    ? `Em ${diff} dias`
                    : format(data, "dd MMM, yyyy", { locale: ptBR });

            return (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className="w-full text-left relative pl-6 border-l border-border hover:border-accent transition-colors group"
              >
                <div
                  className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ring-4 ring-card ${
                    urgent ? "bg-destructive" : "bg-muted-foreground/30"
                  }`}
                />
                <p
                  className={`text-[10px] font-label uppercase tracking-widest font-bold mb-1 ${
                    urgent ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </p>
                <h5 className="text-base font-serif text-foreground mb-2 group-hover:text-accent transition-colors">
                  {d.titulo}
                </h5>
                {d.detalhe && (
                  <p className="text-xs text-muted-foreground italic mb-2">
                    {d.detalhe}
                  </p>
                )}
                <span className="text-[10px] font-label uppercase tracking-widest text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  Revisar Detalhes →
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Task load */}
      <div className="mt-10 p-6 bg-surface-low rounded-lg">
        <p className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-4">
          Carga de Tarefas Ativas
        </p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-body text-foreground">
            Pendentes esta semana
          </span>
          <span className="text-xs font-bold text-foreground">
            {weekLoad.pending}/{weekLoad.total || 0}
          </span>
        </div>
        <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              weekLoad.pct >= 80
                ? "bg-destructive"
                : weekLoad.pct >= 50
                  ? "bg-accent"
                  : "bg-primary"
            }`}
            style={{ width: `${weekLoad.pct}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground italic mt-3 text-center">
          {weekLoad.pct >= 80
            ? "Carga elevada — priorize os prazos fatais"
            : weekLoad.pct >= 50
              ? "Ritmo moderado de trabalho"
              : "Capacidade saudável"}
        </p>
      </div>

      <PrazoDetailModal
        prazo={selected}
        onClose={() => setSelected(null)}
        onChanged={() => {
          getPrazos().then(setPrazos);
          ctx?.bumpRefresh?.();
        }}
      />
    </section>
  );
}
