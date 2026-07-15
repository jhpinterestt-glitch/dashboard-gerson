import { useState, useEffect, useMemo } from "react";
import { ChevronRight, ChevronLeft, AlertTriangle, Plus, Trash2 } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday as isTodayFn,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getPrazos,
  getDaysWithEvents,
  deletePrazo,
  type Prazo,
} from "@/lib/store";
import { NovoPrazoModal } from "@/components/NovoPrazoModal";
import { useOutletContext } from "react-router-dom";

export default function Agenda() {
  const { refreshKey, searchQuery } = useOutletContext<{ refreshKey: number; searchQuery?: string }>() || { refreshKey: 0, searchQuery: "" };
  const [today, setToday] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [prazos, setPrazos] = useState<Prazo[]>([]);
  const [eventDays, setEventDays] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [localRefresh, setLocalRefresh] = useState(0);

  // Reload data
  useEffect(() => {
    getPrazos().then(setPrazos);
    getDaysWithEvents().then(setEventDays);
  }, [refreshKey, localRefresh]);

  // Auto-refresh "today" at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 5, 0);
    const ms = midnight.getTime() - now.getTime();
    const t = setTimeout(() => setToday(new Date()), ms);
    return () => clearTimeout(t);
  }, [today]);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Build the calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    const days: Date[] = [];
    let d = start;
    while (d <= end) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [currentMonth]);

  const selectedYmd = format(selectedDate, "yyyy-MM-dd");
  const selectedPrazos = prazos.filter((p) => p.data.slice(0, 10) === selectedYmd);

  // All prazos sorted (for sidebar)
  const upcomingPrazos = [...prazos]
    .filter((p) => parseISO(p.data) >= new Date(today.toDateString()))
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 6);

  const activeQuery = (searchQuery || "").trim().toLowerCase();

  const searchedPrazos = useMemo(() => {
    if (!activeQuery) return [];
    return prazos
      .filter(
        (p) =>
          p.titulo.toLowerCase().includes(activeQuery) ||
          (p.detalhe && p.detalhe.toLowerCase().includes(activeQuery))
      )
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [prazos, activeQuery]);

  const handleDelete = async (id: string) => {
    await deletePrazo(id);
    setLocalRefresh((k) => k + 1);
  };

  return (
    <div>
      <div className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-label mb-2">
            <span>Agenda</span>
            <ChevronRight size={10} />
            <span className="text-primary font-bold">Calendário</span>
          </div>
          <h2 className="text-4xl font-serif text-foreground">
            Prazos e Audiências
          </h2>
          <p className="text-xs text-muted-foreground mt-1 italic">
            Hoje, {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-[10px] font-label uppercase tracking-widest font-bold rounded-md hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={14} />
          Novo Prazo
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Calendar */}
        <div className="col-span-12 lg:col-span-8 bg-card p-8 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="p-2 hover:bg-muted rounded transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} className="text-muted-foreground" />
            </button>
            <div className="flex items-center gap-3">
              <h4 className="text-xl font-serif text-foreground capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h4>
              {!isSameMonth(currentMonth, today) && (
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="text-[10px] font-label uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border border-border px-2 py-1 rounded"
                >
                  Hoje
                </button>
              )}
            </div>
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="p-2 hover:bg-muted rounded transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-label uppercase tracking-widest text-muted-foreground py-2"
              >
                {d}
              </div>
            ))}
            {calendarDays.map((day) => {
              const ymd = format(day, "yyyy-MM-dd");
              const inMonth = isSameMonth(day, currentMonth);
              const isToday = isTodayFn(day);
              const isSelected = isSameDay(day, selectedDate);
              const hasEvent = eventDays.has(ymd);

              return (
                <button
                  key={ymd}
                  onClick={() => setSelectedDate(day)}
                  className={`relative min-h-[72px] p-2 rounded-lg border text-left transition-all
                    ${inMonth ? "border-border hover:border-accent" : "border-transparent opacity-40"}
                    ${isSelected && !isToday ? "border-accent bg-accent/10" : ""}
                  `}
                >
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold w-7 h-7 rounded-full transition-colors
                      ${isToday
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : isSelected
                          ? "text-primary"
                          : hasEvent && inMonth
                            ? "text-primary"
                            : "text-foreground"
                      }
                    `}
                  >
                    {format(day, "d")}
                  </span>
                  {hasEvent && inMonth && !isToday && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                  {hasEvent && isToday && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground">Hoje</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground">Possui Evento</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded border-2 border-accent" />
              <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground">Selecionado</span>
            </div>
          </div>
        </div>

        {/* Sidebar with selected day events + upcoming */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {activeQuery ? (
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <p className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1">
                Resultados da Busca
              </p>
              <h4 className="text-lg font-serif text-foreground mb-4">
                Filtrando por: <span className="text-primary font-bold bg-muted px-2 py-0.5 rounded">"{searchQuery}"</span>
              </h4>

              {searchedPrazos.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">
                  Nenhum compromisso encontrado.
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {searchedPrazos.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        const d = parseISO(e.data);
                        setSelectedDate(d);
                        setCurrentMonth(d);
                      }}
                      className={`w-full text-left p-3 rounded-lg border-l-2 hover:bg-muted/30 transition-colors ${
                        e.tipo === "fatal"
                          ? "border-destructive bg-destructive/5"
                          : "border-accent bg-accent/5"
                      }`}
                    >
                      <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground font-bold block mb-1">
                        {format(parseISO(e.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                      <p className="text-sm font-serif text-foreground">{e.titulo}</p>
                      {e.detalhe && (
                        <p className="text-xs text-muted-foreground italic mt-1">{e.detalhe}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Selected day */}
              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <p className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1">
                  Dia Selecionado
                </p>
                <h4 className="text-lg font-serif text-foreground mb-4 capitalize">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h4>

                {selectedPrazos.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-4">
                    Sem prazos ou eventos para este dia.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedPrazos.map((e) => (
                      <div
                        key={e.id}
                        className={`p-4 rounded-lg border-l-2 group relative ${
                          e.tipo === "fatal"
                            ? "border-destructive bg-destructive/5"
                            : "border-accent bg-accent/5"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {e.tipo === "fatal" && (
                            <AlertTriangle size={12} className="text-destructive" />
                          )}
                          <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground font-bold">
                            {e.tipo === "fatal" ? "Prazo Fatal" : "Evento"}
                          </span>
                        </div>
                        <p className="text-sm font-serif text-foreground">{e.titulo}</p>
                        {e.detalhe && (
                          <p className="text-xs text-muted-foreground italic mt-1">{e.detalhe}</p>
                        )}
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="absolute top-2 right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-4 w-full text-[10px] font-label uppercase tracking-widest text-foreground border border-border px-3 py-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all rounded-sm flex items-center justify-center gap-2"
                >
                  <Plus size={12} />
                  Adicionar para este dia
                </button>
              </div>

              {/* Upcoming */}
              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h4 className="text-base font-serif text-foreground mb-4">Próximos Eventos</h4>
                {upcomingPrazos.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    Nenhum prazo futuro cadastrado.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingPrazos.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => {
                          const d = parseISO(e.data);
                          setSelectedDate(d);
                          setCurrentMonth(d);
                        }}
                        className={`w-full text-left p-3 rounded-lg border-l-2 hover:bg-muted/30 transition-colors ${
                          e.tipo === "fatal" ? "border-destructive" : "border-accent"
                        }`}
                      >
                        <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground font-bold">
                          {format(parseISO(e.data), "dd MMM", { locale: ptBR })}
                        </span>
                        <p className="text-sm font-serif text-foreground">{e.titulo}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <NovoPrazoModal
        open={modalOpen}
        initialDate={selectedDate}
        onClose={() => setModalOpen(false)}
        onSaved={() => setLocalRefresh((k) => k + 1)}
      />
    </div>
  );
}
