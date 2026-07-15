import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  FileSpreadsheet,
  Briefcase,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToExcel, exportToPDF } from "@/lib/exportService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getProcessos, getLancamentos, getPrazos, Processo, Lancamento, Prazo } from "@/lib/store";
import { cn } from "@/lib/utils";

interface TopBarProps {
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
}

export function TopBar({ searchQuery = "", onSearchChange }: TopBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<{
    processos: Processo[];
    lancamentos: Lancamento[];
    prazos: Prazo[];
  }>({ processos: [], lancamentos: [], prazos: [] });

  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleExportExcel = async () => {
    try {
      toast.info("Processando relatório Excel...");
      const path = await exportToExcel();
      toast.success(path && path !== "baixado" ? `Salvo com sucesso em: ${path}` : "Relatório Excel exportado com sucesso");
    } catch (e) {
      console.error(e);
      toast.error(String(e) || "Falha ao exportar relatório Excel");
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.info("Processando relatório PDF...");
      const path = await exportToPDF();
      toast.success(path && path !== "baixado" ? `Salvo com sucesso em: ${path}` : "Relatório PDF exportado com sucesso");
    } catch (e) {
      console.error(e);
      toast.error(String(e) || "Falha ao exportar relatório PDF");
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ processos: [], lancamentos: [], prazos: [] });
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    Promise.all([getProcessos(), getLancamentos(), getPrazos()]).then(
      ([allProcessos, allLancamentos, allPrazos]) => {
        const filteredProcessos = allProcessos.filter(
          (p) =>
            (p.cliente || "").toLowerCase().includes(query) ||
            (p.numero || "").toLowerCase().includes(query) ||
            (p.tribunal || "").toLowerCase().includes(query) ||
            (p.fase || "").toLowerCase().includes(query) ||
            (p.status || "").toLowerCase().includes(query)
        );

        const filteredLancamentos = allLancamentos.filter(
          (l) =>
            (l.descricao || "").toLowerCase().includes(query) ||
            (l.tipo || "").toLowerCase().includes(query) ||
            (l.valor || 0).toString().includes(query)
        );

        const filteredPrazos = allPrazos.filter(
          (p) =>
            (p.titulo || "").toLowerCase().includes(query) ||
            (p.detalhe || "").toLowerCase().includes(query) ||
            (p.tipo || "").toLowerCase().includes(query)
        );

        setResults({
          processos: filteredProcessos,
          lancamentos: filteredLancamentos,
          prazos: filteredPrazos,
        });
      }
    );
  }, [searchQuery]);

  const handleItemClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
    onSearchChange?.("");
  };

  const hasResults =
    results.processos.length > 0 ||
    results.lancamentos.length > 0 ||
    results.prazos.length > 0;

  return (
    <header className="flex justify-between items-center h-16 px-8 bg-card/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-border">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md" ref={containerRef}>
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange?.(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Pesquisar processos, casos ou documentos..."
            className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-accent rounded-md text-sm pl-10 py-2 font-body placeholder:text-muted-foreground"
          />

          {isOpen && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-2xl rounded-lg max-h-[400px] overflow-y-auto z-50 p-3 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {!hasResults ? (
                <div className="text-center py-6 text-sm text-muted-foreground font-body">
                  Nenhum resultado encontrado para "{searchQuery}"
                </div>
              ) : (
                <>
                  {/* Category: Processos */}
                  {results.processos.length > 0 && (
                    <div>
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-accent mb-2 px-2 flex items-center gap-1.5 border-b border-border/40 pb-1">
                        <Briefcase size={12} />
                        Processos ({results.processos.length})
                      </h4>
                      <div className="flex flex-col gap-1">
                        {results.processos.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleItemClick("/processos")}
                            className="w-full text-left p-2 rounded-md hover:bg-muted/60 transition-colors flex justify-between items-center gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-foreground truncate">{p.cliente}</p>
                              <p className="text-[10px] text-muted-foreground truncate">Nº {p.numero} • {p.tribunal}</p>
                            </div>
                            <span className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                              p.status === "Ativo" && "bg-green-500/10 text-green-600 border border-green-500/20",
                              p.status === "Em análise" && "bg-amber-accent/10 text-amber-accent border border-amber-accent/20",
                              p.status === "Concluído" && "bg-muted text-muted-foreground border border-border"
                            )}>
                              {p.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Prazos */}
                  {results.prazos.length > 0 && (
                    <div>
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-accent mb-2 px-2 flex items-center gap-1.5 border-b border-border/40 pb-1">
                        <Calendar size={12} />
                        Prazos ({results.prazos.length})
                      </h4>
                      <div className="flex flex-col gap-1">
                        {results.prazos.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleItemClick("/agenda")}
                            className="w-full text-left p-2 rounded-md hover:bg-muted/60 transition-colors flex justify-between items-center gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-foreground truncate">{p.titulo}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{p.detalhe}</p>
                            </div>
                            <span className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                              p.tipo === "fatal" ? "bg-destructive/10 text-destructive border border-destructive/20 animate-pulse" : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            )}>
                              {p.tipo === "fatal" ? "Fatal" : "Normal"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Financeiro */}
                  {results.lancamentos.length > 0 && (
                    <div>
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-accent mb-2 px-2 flex items-center gap-1.5 border-b border-border/40 pb-1">
                        <FileSpreadsheet size={12} />
                        Financeiro ({results.lancamentos.length})
                      </h4>
                      <div className="flex flex-col gap-1">
                        {results.lancamentos.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => handleItemClick("/financeiro")}
                            className="w-full text-left p-2 rounded-md hover:bg-muted/60 transition-colors flex justify-between items-center gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-foreground truncate">{l.descricao}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{new Date(l.data).toLocaleDateString("pt-BR")}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {l.tipo === "receita" ? (
                                <TrendingUp size={12} className="text-success" />
                              ) : (
                                <TrendingDown size={12} className="text-destructive" />
                              )}
                              <span className={cn(
                                "text-xs font-semibold font-mono",
                                l.tipo === "receita" ? "text-success" : "text-destructive"
                              )}>
                                {l.tipo === "receita" ? "+" : "-"} R$ {l.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-[10px] font-label uppercase tracking-widest border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <FileSpreadsheet size={14} />
              Exportar Relatório
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem
              onClick={handleExportExcel}
              className="gap-2 text-xs font-body cursor-pointer hover:bg-muted"
            >
              <FileSpreadsheet size={14} className="text-success" />
              Exportar para Excel (XLSX)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleExportPDF}
              className="gap-2 text-xs font-body cursor-pointer hover:bg-muted"
            >
              <FileSpreadsheet size={14} className="text-destructive" />
              Exportar para PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4 text-muted-foreground">
        <Bell
          size={20}
          className="cursor-pointer hover:text-primary transition-colors"
        />
        <div className="w-9 h-9 rounded-full bg-primary border border-accent/40 flex items-center justify-center text-xs font-serif font-bold text-accent tracking-wider">
          GG
        </div>
      </div>
    </header>
  );
}
