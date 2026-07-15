import { useState, useEffect } from "react";
import { ChevronRight, Search, Pencil, Trash2, Plus } from "lucide-react";
import { getProcessos, deleteProcesso, updateProcesso, addProcesso, type Processo } from "@/lib/store";
import { useOutletContext } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const statusStyles: Record<string, string> = {
  Ativo: "bg-success/10 text-success",
  "Em análise": "bg-muted text-muted-foreground",
  Concluído: "bg-primary/10 text-primary",
};

export default function Processos() {
  const { refreshKey, searchQuery } = useOutletContext<{ refreshKey: number; searchQuery?: string }>() || { refreshKey: 0, searchQuery: "" };
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<Processo | null>(null);
  const [novoOpen, setNovoOpen] = useState(false);

  useEffect(() => {
    getProcessos().then(setProcessos);
  }, [refreshKey]);

  const reload = () => getProcessos().then(setProcessos);

  const handleDelete = async (id: string) => {
    await deleteProcesso(id);
    reload();
  };

  const activeSearch = (searchQuery || search || "").trim().toLowerCase();
  const filtered = processos.filter(
    (p) =>
      p.cliente.toLowerCase().includes(activeSearch) ||
      p.numero.toLowerCase().includes(activeSearch) ||
      p.tribunal.toLowerCase().includes(activeSearch)
  );

  return (
    <div>
      <div className="mb-10">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-label mb-2">
          <span>CRM Jurídico</span>
          <ChevronRight size={10} />
          <span className="text-primary font-bold">Processos</span>
        </div>
        <h2 className="text-4xl font-serif text-foreground">Gestão de Processos</h2>
      </div>

      <section className="bg-card p-8 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-xl font-serif text-foreground">Todos os Processos</h4>
            <p className="text-sm text-muted-foreground">{processos.length} processo(s) cadastrado(s)</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrar processos..."
                value={searchQuery || search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-muted/50 border-none focus:outline-none focus:ring-1 focus:ring-accent rounded-md text-xs pl-9 py-2 font-body placeholder:text-muted-foreground"
              />
            </div>
            <Button onClick={() => setNovoOpen(true)} size="sm" className="gap-2">
              <Plus size={14} />
              Novo Processo
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {processos.length === 0 ? (
              <>
                <p className="text-sm font-serif">Nenhum processo cadastrado ainda.</p>
                <p className="text-xs mt-1">Use o botão "Novo Caso Jurídico" na barra lateral para começar.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-serif">Nenhum processo encontrado para a busca.</p>
                <p className="text-xs mt-1">Tente pesquisar por outros dados de cliente, processo ou tribunal.</p>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-surface-low">
              <tr>
                <th className="px-4 py-3 text-[10px] font-label uppercase tracking-widest text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-[10px] font-label uppercase tracking-widest text-muted-foreground">Nº Processo</th>
                <th className="px-4 py-3 text-[10px] font-label uppercase tracking-widest text-muted-foreground">Tribunal</th>
                <th className="px-4 py-3 text-[10px] font-label uppercase tracking-widest text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-[10px] font-label uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-[10px] font-label uppercase tracking-widest text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-serif text-foreground text-sm">{p.cliente}</div>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">{p.numero}</td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">{p.tribunal || "—"}</td>
                  <td className="px-4 py-4 text-xs text-foreground">
                    {p.valor > 0 ? p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${statusStyles[p.status] || "bg-muted text-muted-foreground"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditItem(p)}
                        className="p-1.5 rounded hover:bg-accent/20 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {editItem && (
        <EditModal
          processo={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); reload(); }}
        />
      )}

      {novoOpen && (
        <NovoProcessoModal
          onClose={() => setNovoOpen(false)}
          onSaved={() => { setNovoOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

function NovoProcessoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [cliente, setCliente] = useState("");
  const [numero, setNumero] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [valor, setValor] = useState("");

  const handleSave = async () => {
    if (!cliente.trim() || !numero.trim()) return;
    await addProcesso({
      cliente,
      numero,
      tribunal,
      valor: parseFloat(valor.replace(/[^\d.,]/g, "").replace(",", ".")) || 0,
      status: "Ativo",
      fase: "Em análise",
    });
    onSaved();
  };

  const inputClass =
    "w-full bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-accent rounded-md text-sm px-4 py-2.5 font-body placeholder:text-muted-foreground transition-colors hover:border-accent/50";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Novo Processo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Nome do Cliente *</label>
            <input className={inputClass} placeholder="Ex: João da Silva" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Nº do Processo *</label>
            <input className={inputClass} placeholder="Ex: 0001234-56.2024.8.26.0100" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Tribunal</label>
            <input className={inputClass} placeholder="Ex: TJ-SP" value={tribunal} onChange={(e) => setTribunal(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Valor da Causa</label>
            <input className={inputClass} placeholder="R$ 0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!cliente.trim() || !numero.trim()}>Salvar Processo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditModal({ processo, onClose, onSaved }: { processo: Processo; onClose: () => void; onSaved: () => void }) {
  const [cliente, setCliente] = useState(processo.cliente);
  const [numero, setNumero] = useState(processo.numero);
  const [tribunal, setTribunal] = useState(processo.tribunal);
  const [valor, setValor] = useState(String(processo.valor));
  const [status, setStatus] = useState(processo.status);

  const handleSave = async () => {
    await updateProcesso(processo.id, {
      cliente,
      numero,
      tribunal,
      valor: parseFloat(valor.replace(/[^\d.,]/g, "").replace(",", ".")) || 0,
      status,
    });
    onSaved();
  };

  const inputClass =
    "w-full bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-accent rounded-md text-sm px-4 py-2.5 font-body placeholder:text-muted-foreground transition-colors hover:border-accent/50";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Editar Processo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Cliente</label>
            <input className={inputClass} value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Nº do Processo</label>
            <input className={inputClass} value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Tribunal</label>
            <input className={inputClass} value={tribunal} onChange={(e) => setTribunal(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Valor</label>
            <input className={inputClass} value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1.5 block">Status</label>
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as Processo["status"])}>
              <option value="Ativo">Ativo</option>
              <option value="Em análise">Em análise</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
