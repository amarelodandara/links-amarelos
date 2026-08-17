import type { EditionWriter } from "../src/editor/edition-io";

/**
 * Transporte de gravação do app: manda o conteúdo cru pro servidor local, que
 * escreve em /content. Contraparte do `studioWriter`; as regras de ordem das
 * gravações moram em `edition-io.ts`, compartilhadas pelos dois.
 */

const request = async (path: string, init: RequestInit) => {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error ?? "falha na gravação");
  }
};

export const httpWriter: EditionWriter = {
  writeFile: (path, contents) =>
    request(`/api/file?path=${encodeURIComponent(path)}`, {
      method: "POST",
      body: contents,
    }),
  deleteFile: (path) =>
    request(`/api/file?path=${encodeURIComponent(path)}`, { method: "DELETE" }),
};
