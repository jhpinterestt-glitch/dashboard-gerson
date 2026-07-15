import { useEffect, useMemo, useState } from "react";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UrgentDeadlines } from "@/components/dashboard/UrgentDeadlines";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { ChevronRight, X } from "lucide-react";
import { format, isToday as isTodayFn } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDaysWithEvents } from "@/lib/store";
import { useOutletContext } from "react-router-dom";

export default function Dashboard() {
  const ctx = useOutletContext<{ refreshKey: number }>() || { refreshKey: 0 };
  const [today, setToday] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [eventDays, setEventDays] = useState<Set<string>>(new Set());

  // Refresh "today" at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 5, 0);
    const t = setTimeout(() => setToday(new Date()), midnight.getTime() - now.getTime());
    return () => clearTimeout(t);
  }, [today]);

  useEffect(() => {
    getDaysWithEvents().then(setEventDays);
  }, [ctx?.refreshKey]);

  // Build small horizontal strip of last 7 days for quick filter
  const strip = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      arr.push(d);
    }
    return arr;
  }, [today]);

  return (
    <div>
      <div className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-label mb-2">
            <span>Executivo</span>
            <ChevronRight size={10} />
            <span className="text-primary font-bold">Dashboard Principal</span>
          </div>
          <h2 className="text-4xl font-serif text-foreground">
            Visão Geral Financeira
          </h2>
          <p className="text-xs text-muted-foreground mt-1 italic capitalize">
            {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Day filter strip */}
        <div className="flex items-center gap-2">
          {strip.map((d) => {
            const ymd = format(d, "yyyy-MM-dd");
            const isSel = selectedDay === ymd;
            const isToday = isTodayFn(d);
            const hasEvent = eventDays.has(ymd);
            return (
              <button
                key={ymd}
                onClick={() => setSelectedDay(isSel ? null : ymd)}
                className={`relative flex flex-col items-center justify-center w-12 h-14 rounded-lg border transition-all
                  ${isSel
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-accent"
                  }
                `}
              >
                <span className={`text-[9px] font-label uppercase tracking-widest ${isSel ? "" : "text-muted-foreground"}`}>
                  {format(d, "EEE", { locale: ptBR }).slice(0, 3)}
                </span>
                <span
                  className={`text-sm font-bold ${
                    isSel
                      ? ""
                      : isToday
                        ? "text-accent"
                        : "text-foreground"
                  }`}
                >
                  {format(d, "d")}
                </span>
                {hasEvent && !isSel && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="ml-2 p-2 rounded-lg border border-border hover:bg-muted transition-colors"
              title="Limpar filtro"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <MetricCards />

      <div className="mb-12">
        <FinancialChart />
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <RecentActivity filterDay={selectedDay} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <UrgentDeadlines filterDay={selectedDay} />
        </div>
      </div>
    </div>
  );
}
