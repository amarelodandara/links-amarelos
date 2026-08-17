import { deleteStaticFile, writeStaticFile } from "@remotion/studio";
import type { EditionWriter } from "./edition-io";

/**
 * Transporte de gravação de dentro do Remotion Studio: a API do Studio escreve
 * na publicDir (= /content), criando as pastas que faltarem e recusando
 * qualquer caminho que saia dela.
 *
 * O app de 3 colunas usa o writer de HTTP em `app/http-writer.ts`; as regras de
 * ordem das gravações são as mesmas, em `edition-io.ts`.
 */
export const studioWriter: EditionWriter = {
  writeFile: (path, contents) => writeStaticFile({ filePath: path, contents }),
  deleteFile: async (path) => {
    await deleteStaticFile(path);
  },
};
