
import { GoogleGenAI, Type } from "@google/genai";
import { ProofreadingError, PDFPageContent } from '../types';

const MODEL_NAME = 'gemini-3-flash-preview';

export const proofreadText = async (
  pages: PDFPageContent[],
  referenceRules: string,
  onProgress: (page: number, total: number) => void,
  signal?: AbortSignal
): Promise<ProofreadingError[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const allErrors: ProofreadingError[] = [];
  const totalPages = pages.length;

  // Process in chunks of pages to avoid token limits and maintain quality
  for (const pageContent of pages) {
    // Check if the operation was cancelled before processing next page
    if (signal?.aborted) {
      throw new Error('AbortError');
    }

    onProgress(pageContent.pageNumber, totalPages);

    const prompt = `
      Atue como um revisor profissional de textos em língua portuguesa altamente criterioso.
      Analise o texto a seguir extraído da página ${pageContent.pageNumber} de um documento PDF.
      
      --- REGRAS DE REFERÊNCIA (ORDEM DE PRIORIDADE) ---
      ${referenceRules}
      --- FIM DAS REGRAS ---

      REGRA CRÍTICA DE PRIORIDADE:
      Os documentos de referência acima estão listados em ordem de importância. Em caso de CONFLITOS ou divergências entre as regras ou termos contidos neles, você deve SEMPRE priorizar a regra do documento que aparece primeiro na lista acima.

      TEXTO PARA REVISÃO (Página ${pageContent.pageNumber}):
      "${pageContent.text}"

      Instruções específicas:
      1. Identifique erros de ortografia, gramática, pontuação, sintaxe e concordância baseando-se estritamente nas referências (quando aplicável) e na norma culta.
      2. Tente identificar o "Capítulo" ou seção principal baseado no contexto do texto.
      3. Forneça uma explicação técnica e clara para cada correção.
      4. No campo 'arquivoReferencia', indique o nome exato do arquivo (conforme cabeçalho nas REGRAS DE REFERÊNCIA) se a correção for baseada em uma regra específica desse documento.
      5. Se não houver erros na página, retorne uma lista vazia [].
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tipoErro: { type: Type.STRING, description: "Tipo de erro (ex: Ortografia, Concordância, Pontuação)" },
                capitulo: { type: Type.STRING, description: "Capítulo ou Seção onde o erro foi encontrado" },
                pagina: { type: Type.NUMBER, description: "Número da página atual" },
                de: { type: Type.STRING, description: "Trecho original com erro" },
                para: { type: Type.STRING, description: "Trecho sugerido corrigido" },
                explicacao: { type: Type.STRING, description: "Explicação técnica da correção" },
                arquivoReferencia: { type: Type.STRING, description: "Nome do arquivo de referência utilizado como base para esta correção" },
              },
              required: ["tipoErro", "pagina", "de", "para", "explicacao"],
            },
          },
        },
      });

      if (response.text) {
        const pageErrors: ProofreadingError[] = JSON.parse(response.text).map((err: any) => ({
          ...err,
          pagina: pageContent.pageNumber,
          status: "" // Required empty status column for final Excel
        }));
        allErrors.push(...pageErrors);
      }
    } catch (error) {
      if (signal?.aborted) throw new Error('AbortError');
      console.error(`Erro ao processar página ${pageContent.pageNumber}:`, error);
    }
  }

  return allErrors;
};