import { invoke } from "@tauri-apps/api/core";

export const isTauri = (): boolean => {
  return (
    typeof window !== "undefined" &&
    ((window as any).__TAURI_INTERNALS__ !== undefined ||
      (window as any).__tauri_ipc__ !== undefined)
  );
};

export const isElectron = (): boolean => {
  return (
    typeof window !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("electron")
  );
};

export async function saveFile(filename: string, base64Content: string, mimeType: string): Promise<string> {
  if (isTauri()) {
    try {
      const savedPath = await invoke<string>("save_file", { filename, base64Content });
      return savedPath;
    } catch (err) {
      console.error("Tauri save_file error:", err);
      throw new Error(String(err) || "Operação cancelada");
    }
  } else if (isElectron()) {
    try {
      if ((window as any).electronAPI?.saveFile) {
        const savedPath = await (window as any).electronAPI.saveFile(filename, base64Content);
        if (!savedPath) throw new Error("Operação cancelada");
        return savedPath;
      } else {
        throw new Error("Electron API não disponível no contexto da página");
      }
    } catch (err) {
      console.error("Electron saveFile error:", err);
      throw err;
    }
  } else {
    // Web browser fallback
    const raw = window.atob(base64Content);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    const blob = new Blob([uInt8Array], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return "baixado";
  }
}
