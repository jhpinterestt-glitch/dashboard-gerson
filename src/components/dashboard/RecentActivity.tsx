import { useEffect, useMemo, useState } from "react";
import { FileText, Landmark, Gavel, TrendingUp, TrendingDown } from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getProcessos,
  getLancamentos,
  getPrazos,
  type Processo,
  type Lancamento,
  type Prazo,
} from "@/lib/store";
import { useOutletContext } from "react-router-dom";

interface Props {
  /** Optional yyyy-MM-dd to filter activity to that day. */
  filterDay?: string | null;
}

type ActivityItem = {
  id: string;
  icon: typeof FileText;
  title: string;
  desc: string;
  date: Date;
  author: string;
  searchBlob: string;
};

function formatTimestamp(date: Date): string {
  if (isToday(date)) return `Hoje às ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Ontem às ${format(date, "HH:mm")}`;
  return format(date, "dd MMM, yyyy 'às' HH:mm", { locale: ptBR });
}

export function RecentActivity({ filterDay }: Props) {
  const ctx = useOutletContext<{ refreshKey: number; searchQuery?: string }>() || {
    refreshKey: 0,
  };
  const searchQuery = (ctx?.searchQuery || "").trim().toLowerCase();
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [prazos, setPrazos] = useState<Prazo[]>([]);

  useEffect(() => {
    getProcessos().then(setProcessos);
    getLancamentos().then(setLancamentos);
    getPrazos().then(setPrazos);
  }, [ctx?.refreshKey]);

  const items = useMemo<ActivityItem[]>(() => {
    const all: ActivityItem[] = [
      ...processos.map((p) => ({
        id: `proc-${p.id}`,
        icon: FileText,
        title: "Novo Caso Cadastrado:",
        desc: `${p.cliente} — Processo ${p.numero}${p.tribunal ? ` (${p.tribunal})` : ""}.`,
        date: parseISO(p.criadoEm),
        author: "CRM Jurídico",
        searchBlob: `${p.cliente} ${p.numero} ${p.tribunal} processo caso`.toLowerCase(),
      })),
      ...lancamentos.map((l) => ({
        id: `lan-${l.id}`,
        icon: l.tipo === "receita" ? TrendingUp : Landmark,
        title: l.tipo === "receita" ? "Receita Registrada:" : "Despesa Registrada:",
        desc: `${l.descricao} — R$ ${l.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
        date: parseISO(l.data),
        author: "Sistema Financeiro",
        searchBlob: `${l.descricao} ${l.tipo} financeiro fluxo caixa`.toLowerCase(),
      })),
      ...prazos.map((p) => ({
        id: `prz-${p.id}`,
        icon: p.tipo === "fatal" ? Gavel : FileText,
        title: p.tipo === "fatal" ? "Prazo Fatal:" : "Evento Agendado:",
        desc: `${p.titulo}${p.detalhe ? ` — ${p.detalhe}` : ""}.`,
        date: parseISO(p.data),
        author: "Agenda",
        searchBlob: `${p.titulo} ${p.detalhe} prazo audiência agenda`.toLowerCase(),
      })),
    ];

    let filtered = all;
    if (filterDay) {
      filtered = filtered.filter((a) => format(a.date, "yyyy-MM-dd") === filterDay);
    }
    if (searchQuery) {
      filtered = filtered.filter((a) => a.searchBlob.includes(searchQuery));
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 12);
  }, [processos, lancamentos, prazos, filterDay, searchQuery]);

  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <h4 className="text-xl font-serif text-foreground">
          {filterDay ? "Atividade do Dia" : "Atividade Recente"}
        </h4>
        {searchQuery && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-label">
            Filtrando por: <span className="text-accent font-bold">"{searchQuery}"</span>
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-card p-8 rounded-xl text-center border border-border">
          <p className="text-sm text-muted-foreground italic">
            {searchQuery
              ? "Nenhuma atividade corresponde à sua busca."
              : filterDay
                ? "Sem atividade registrada para este dia."
                : "Nenhuma atividade registrada ainda. Cadastre processos, lançamentos ou prazos."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <div
              key={a.id}
              className="bg-card p-6 rounded-xl flex items-start gap-6 border-l-2 border-border hover:border-accent transition-all"
            >
              <div className="w-10 h-10 rounded bg-primary/5 flex items-center justify-center flex-shrink-0">
                <a.icon size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="font-bold">{a.title}</span> {a.desc}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 font-label">
                  {formatTimestamp(a.date)} • {a.author}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
