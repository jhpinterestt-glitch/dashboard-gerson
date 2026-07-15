// SQLite-backed (Tauri) and LocalStorage-backed (fallback) data store for processes and financial entries
import Database from "@tauri-apps/plugin-sql";

export interface Processo {
  id: string;
  cliente: string;
  numero: string;
  tribunal: string;
  valor: number;
  status: "Ativo" | "Em análise" | "Concluído";
  fase: string;
  criadoEm: string;
}

export interface Lancamento {
  id: string;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  data: string; // ISO date
}

export interface Prazo {
  id: string;
  titulo: string;
  detalhe: string;
  data: string; // ISO date (yyyy-mm-dd)
  tipo: "fatal" | "normal";
  processoId?: string;
}

// Helper to check if running inside Tauri environment
export const isTauri = (): boolean => {
  return (
    typeof window !== "undefined" &&
    ((window as any).__TAURI_INTERNALS__ !== undefined ||
      (window as any).__tauri_ipc__ !== undefined)
  );
};

// SQLite connection caching
let dbInstance: Database | null = null;
async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:advocacia.db");
  }
  return dbInstance;
}

// LocalStorage helpers (used as fallback outside Tauri)
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Keys for fallback ---
const PROC_KEY = "sovereign_processos";
const LANC_KEY = "sovereign_lancamentos";
const PRAZO_KEY = "sovereign_prazos";

// --- Processos ---
export async function getProcessos(): Promise<Processo[]> {
  if (isTauri()) {
    try {
      const db = await getDb();
      return await db.select<Processo[]>("SELECT * FROM processos ORDER BY criadoEm DESC");
    } catch (e) {
      console.error("Erro ao ler processos do SQLite, usando fallback:", e);
      return loadFromStorage<Processo[]>(PROC_KEY, []);
    }
  } else {
    return loadFromStorage<Processo[]>(PROC_KEY, []);
  }
}

export async function addProcesso(p: Omit<Processo, "id" | "criadoEm">): Promise<Processo> {
  const novo: Processo = {
    ...p,
    id: crypto.randomUUID(),
    criadoEm: new Date().toISOString(),
  };

  if (isTauri()) {
    try {
      const db = await getDb();
      await db.execute(
        "INSERT INTO processos (id, cliente, numero, tribunal, valor, status, fase, criadoEm) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [novo.id, novo.cliente, novo.numero, novo.tribunal, novo.valor, novo.status, novo.fase, novo.criadoEm]
      );
    } catch (e) {
      console.error("Erro ao inserir processo no SQLite, usando fallback:", e);
      const list = loadFromStorage<Processo[]>(PROC_KEY, []);
      list.push(novo);
      saveToStorage(PROC_KEY, list);
    }
  } else {
    const list = loadFromStorage<Processo[]>(PROC_KEY, []);
    list.push(novo);
    saveToStorage(PROC_KEY, list);
  }

  return novo;
}

export async function updateProcesso(id: string, data: Partial<Processo>): Promise<void> {
  if (isTauri()) {
    try {
      const db = await getDb();
      const existing = await db.select<Processo[]>("SELECT * FROM processos WHERE id = $1", [id]);
      if (existing && existing.length > 0) {
        const merged = { ...existing[0], ...data };
        await db.execute(
          "UPDATE processos SET cliente = $1, numero = $2, tribunal = $3, valor = $4, status = $5, fase = $6 WHERE id = $7",
          [merged.cliente, merged.numero, merged.tribunal, merged.valor, merged.status, merged.fase, id]
        );
      }
    } catch (e) {
      console.error("Erro ao atualizar processo no SQLite, usando fallback:", e);
      const list = loadFromStorage<Processo[]>(PROC_KEY, []).map((p) =>
        p.id === id ? { ...p, ...data } : p
      );
      saveToStorage(PROC_KEY, list);
    }
  } else {
    const list = loadFromStorage<Processo[]>(PROC_KEY, []).map((p) =>
      p.id === id ? { ...p, ...data } : p
    );
    saveToStorage(PROC_KEY, list);
  }
}

export async function deleteProcesso(id: string): Promise<void> {
  if (isTauri()) {
    try {
      const db = await getDb();
      await db.execute("DELETE FROM processos WHERE id = $1", [id]);
    } catch (e) {
      console.error("Erro ao deletar processo no SQLite, usando fallback:", e);
      const list = loadFromStorage<Processo[]>(PROC_KEY, []).filter((p) => p.id !== id);
      saveToStorage(PROC_KEY, list);
    }
  } else {
    const list = loadFromStorage<Processo[]>(PROC_KEY, []).filter((p) => p.id !== id);
    saveToStorage(PROC_KEY, list);
  }
}

// --- Lançamentos ---
export async function getLancamentos(): Promise<Lancamento[]> {
  if (isTauri()) {
    try {
      const db = await getDb();
      return await db.select<Lancamento[]>("SELECT * FROM lancamentos ORDER BY data DESC");
    } catch (e) {
      console.error("Erro ao ler lançamentos do SQLite, usando fallback:", e);
      return loadFromStorage<Lancamento[]>(LANC_KEY, []);
    }
  } else {
    return loadFromStorage<Lancamento[]>(LANC_KEY, []);
  }
}

export async function addLancamento(l: Omit<Lancamento, "id">): Promise<Lancamento> {
  const novo: Lancamento = { ...l, id: crypto.randomUUID() };

  if (isTauri()) {
    try {
      const db = await getDb();
      await db.execute(
        "INSERT INTO lancamentos (id, tipo, descricao, valor, data) VALUES ($1, $2, $3, $4, $5)",
        [novo.id, novo.tipo, novo.descricao, novo.valor, novo.data]
      );
    } catch (e) {
      console.error("Erro ao inserir lançamento no SQLite, usando fallback:", e);
      const list = loadFromStorage<Lancamento[]>(LANC_KEY, []);
      list.push(novo);
      saveToStorage(LANC_KEY, list);
    }
  } else {
    const list = loadFromStorage<Lancamento[]>(LANC_KEY, []);
    list.push(novo);
    saveToStorage(LANC_KEY, list);
  }

  return novo;
}

export async function updateLancamento(id: string, data: Partial<Lancamento>): Promise<void> {
  if (isTauri()) {
    try {
      const db = await getDb();
      const existing = await db.select<Lancamento[]>("SELECT * FROM lancamentos WHERE id = $1", [id]);
      if (existing && existing.length > 0) {
        const merged = { ...existing[0], ...data };
        await db.execute(
          "UPDATE lancamentos SET tipo = $1, descricao = $2, valor = $3, data = $4 WHERE id = $5",
          [merged.tipo, merged.descricao, merged.valor, merged.data, id]
        );
      }
    } catch (e) {
      console.error("Erro ao atualizar lançamento no SQLite, usando fallback:", e);
      const list = loadFromStorage<Lancamento[]>(LANC_KEY, []).map((l) =>
        l.id === id ? { ...l, ...data } : l
      );
      saveToStorage(LANC_KEY, list);
    }
  } else {
    const list = loadFromStorage<Lancamento[]>(LANC_KEY, []).map((l) =>
      l.id === id ? { ...l, ...data } : l
    );
    saveToStorage(LANC_KEY, list);
  }
}

export async function deleteLancamento(id: string): Promise<void> {
  if (isTauri()) {
    try {
      const db = await getDb();
      await db.execute("DELETE FROM lancamentos WHERE id = $1", [id]);
    } catch (e) {
      console.error("Erro ao deletar lançamento no SQLite, usando fallback:", e);
      const list = loadFromStorage<Lancamento[]>(LANC_KEY, []).filter((l) => l.id !== id);
      saveToStorage(LANC_KEY, list);
    }
  } else {
    const list = loadFromStorage<Lancamento[]>(LANC_KEY, []).filter((l) => l.id !== id);
    saveToStorage(LANC_KEY, list);
  }
}

// --- Prazos ---
export async function getPrazos(): Promise<Prazo[]> {
  if (isTauri()) {
    try {
      const db = await getDb();
      return await db.select<Prazo[]>("SELECT * FROM prazos ORDER BY data ASC");
    } catch (e) {
      console.error("Erro ao ler prazos do SQLite, usando fallback:", e);
      return loadFromStorage<Prazo[]>(PRAZO_KEY, []);
    }
  } else {
    return loadFromStorage<Prazo[]>(PRAZO_KEY, []);
  }
}

export async function addPrazo(p: Omit<Prazo, "id">): Promise<Prazo> {
  const novo: Prazo = { ...p, id: crypto.randomUUID() };

  if (isTauri()) {
    try {
      const db = await getDb();
      await db.execute(
        "INSERT INTO prazos (id, titulo, detalhe, data, tipo, processoId) VALUES ($1, $2, $3, $4, $5, $6)",
        [novo.id, novo.titulo, novo.detalhe, novo.data, novo.tipo, novo.processoId || null]
      );
    } catch (e) {
      console.error("Erro ao inserir prazo no SQLite, usando fallback:", e);
      const list = loadFromStorage<Prazo[]>(PRAZO_KEY, []);
      list.push(novo);
      saveToStorage(PRAZO_KEY, list);
    }
  } else {
    const list = loadFromStorage<Prazo[]>(PRAZO_KEY, []);
    list.push(novo);
    saveToStorage(PRAZO_KEY, list);
  }

  return novo;
}

export async function deletePrazo(id: string): Promise<void> {
  if (isTauri()) {
    try {
      const db = await getDb();
      await db.execute("DELETE FROM prazos WHERE id = $1", [id]);
    } catch (e) {
      console.error("Erro ao deletar prazo no SQLite, usando fallback:", e);
      const list = loadFromStorage<Prazo[]>(PRAZO_KEY, []).filter((p) => p.id !== id);
      saveToStorage(PRAZO_KEY, list);
    }
  } else {
    const list = loadFromStorage<Prazo[]>(PRAZO_KEY, []).filter((p) => p.id !== id);
    saveToStorage(PRAZO_KEY, list);
  }
}

// --- Computed Stats ---
export async function getHonorariosMes(): Promise<number> {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const lancamentos = await getLancamentos();
  return lancamentos
    .filter((l) => {
      const d = new Date(l.data);
      return l.tipo === "receita" && d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((s, l) => s + l.valor, 0);
}

export async function getSaldoEmConta(): Promise<number> {
  const lancamentos = await getLancamentos();
  return lancamentos.reduce(
    (s, l) => s + (l.tipo === "receita" ? l.valor : -l.valor),
    0
  );
}

export async function getProcessosAtivosCount(): Promise<number> {
  const processos = await getProcessos();
  return processos.filter((p) => p.status === "Ativo").length;
}

// --- Date queries ---
function sameDay(iso: string, ymd: string): boolean {
  return iso.slice(0, 10) === ymd;
}

export async function getPrazosByDay(ymd: string): Promise<Prazo[]> {
  const list = await getPrazos();
  return list.filter((p) => sameDay(p.data, ymd));
}

export async function getLancamentosByDay(ymd: string): Promise<Lancamento[]> {
  const list = await getLancamentos();
  return list.filter((l) => sameDay(l.data, ymd));
}

export async function getProcessosByDay(ymd: string): Promise<Processo[]> {
  const list = await getProcessos();
  return list.filter((p) => sameDay(p.criadoEm, ymd));
}

/** Returns set of ymd strings that have at least one event (prazo, lançamento or novo processo). */
export async function getDaysWithEvents(): Promise<Set<string>> {
  const set = new Set<string>();
  const [prazos, lancamentos, processos] = await Promise.all([
    getPrazos(),
    getLancamentos(),
    getProcessos(),
  ]);
  prazos.forEach((p) => set.add(p.data.slice(0, 10)));
  lancamentos.forEach((l) => set.add(l.data.slice(0, 10)));
  processos.forEach((p) => set.add(p.criadoEm.slice(0, 10)));
  return set;
}
