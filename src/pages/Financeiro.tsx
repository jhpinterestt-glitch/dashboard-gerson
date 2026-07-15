import { useState, useEffect } from "react";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { ChevronRight, TrendingUp, TrendingDown, AlertCircle, Plus, Trash2, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { getLancamentos, addLancamento, deleteLancamento, updateLancamento, type Lancamento } from "@/lib/store";
import { useOutletContext } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Financeiro() {
  const { refreshKey, searchQuery } = useOutletContext<{ refreshKey: number; searchQuery?: string }>() || { refreshKey: 0, searchQuery: "" };
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Lancamento | null>(null);

  useEffect(() => {
    getLancamentos().then(setLancamentos);
  }, [refreshKey]);

  const reload = () => getLancamentos().then(setLancamentos);

  const handleDelete = async (id: string) => {
    await deleteLancamento(id);
    reload();
  };

  const filtered = lancamentos.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.descricao.toLowerCase().includes(q) ||
      t.tipo.toLowerCase().includes(q) ||
      t.valor.toString().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div>
      <div className="mb-10">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-label mb-2">
          <span>Financeiro</span>
          <ChevronRight size={10} />
          <span className="text-primary font-bold">Fluxo de Caixa</span>
        </div>
        <h2 className="text-4xl font-serif text-foreground">Controle Financeiro</h2>
      </div>

      <FinancialChart />

      <div className="mt-8">
        <div className="bg-card p-8 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-serif text-foreground">Movimentações</h4>
            <Button onClick={() => setModalOpen(true)} size="sm" className="gap-2">
              <Plus size={14} />
              Novo Lançamento
            </Button>
          </div>

          {searchQuery && (
            <div className="mb-4 text-xs text-muted-foreground flex items-center gap-2">
              <span>Filtrando lançamentos por:</span>
              <span className="text-primary font-bold bg-muted px-2 py-0.5 rounded">
                "{searchQuery}"
              </span>
            </div>
          )}

          {sorted.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {lancamentos.length === 0 ? (
                <span>Nenhum lançamento. Clique em "Novo Lançamento" para começar.</span>
              ) : (
                <span>Nenhum lançamento encontrado para a busca. Tente buscar por outros termos de descrição ou valores.</span>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${t.tipo === "receita" ? "bg-success/10" : "bg-destructive/10"}`}>
                      {t.tipo === "receita" ? <TrendingUp size={14} className="text-success" /> : <TrendingDown size={14} className="text-destructive" />}
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{t.descricao}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-label">
                        {new Date(t.data).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-bold ${t.tipo === "receita" ? "text-success" : "text-destructive"}`}>
                      {t.tipo === "receita" ? "+" : "-"}R$ {t.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => setEditItem(t)}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent/20 text-muted-foreground hover:text-primary transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <NovoLancamentoModal
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); reload(); }}
        />
      )}

      {editItem && (
        <EditLancamentoModal
          lancamento={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); reload(); }}
        />
      )}
    </div>
  );
}

function NovoLancamentoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [tipo, setTipo] = useState<"receita" | "despesa">("receita");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));

  const handleSave = async () => {
    if (!descricao.trim() || !valor.trim()) return;
    await addLancamento({
      tipo,
      descricao,
      valor: parseFloat(valor.replace(/[^\d.,]/g, "").replace(",", ".")) || 0,
      data,
    });
    onSaved();
  };

  const inputClass =
    "w-full bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-accent rounded-md text-sm px-4 py-2.5 font-body placeholder:text-muted-foreground transition-colors hover:border-accent/50";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Novo Lançamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Tipo</label>
            <select className={inputClass} value={tipo} onChange={(e) => setTipo(e.target.value as "receita" | "despesa")}>
              <option value="receita">Receita (Honorários)</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Descrição *</label>
            <input className={inputClass} placeholder="Ex: Honorários — Cliente X" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Valor *</label>
            <input className={inputClass} placeholder="R$ 0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Data</label>
            <input type="date" className={inputClass} value={data} onChange={(e) => setData(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!descricao.trim() || !valor.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditLancamentoModal({ lancamento, onClose, onSaved }: { lancamento: Lancamento; onClose: () => void; onSaved: () => void }) {
  const [tipo, setTipo] = useState<"receita" | "despesa">(lancamento.tipo);
  const [descricao, setDescricao] = useState(lancamento.descricao);
  const [valor, setValor] = useState(String(lancamento.valor));
  const [data, setData] = useState(lancamento.data);

  const handleSave = async () => {
    if (!descricao.trim() || !valor.trim()) return;
    await updateLancamento(lancamento.id, {
      tipo,
      descricao,
      valor: parseFloat(valor.replace(/[^\d.,]/g, "").replace(",", ".")) || 0,
      data,
    });
    onSaved();
  };

  const inputClass =
    "w-full bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-accent rounded-md text-sm px-4 py-2.5 font-body placeholder:text-muted-foreground transition-colors hover:border-accent/50";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Editar Lançamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Tipo</label>
            <select className={inputClass} value={tipo} onChange={(e) => setTipo(e.target.value as "receita" | "despesa")}>
              <option value="receita">Receita (Honorários)</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Descrição *</label>
            <input className={inputClass} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Valor *</label>
            <input className={inputClass} value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Data</label>
            <input type="date" className={inputClass} value={data} onChange={(e) => setData(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!descricao.trim() || !valor.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
