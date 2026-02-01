
import { PDFPageContent } from '../types';

export const extractTextFromPDF = async (file: File): Promise<PDFPageContent[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: PDFPageContent[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(' ');
    pages.push({ pageNumber: i, text });
  }

  return pages;
};

export const extractReferenceText = async (files: File[]): Promise<string> => {
  let combinedText = "";
  for (const file of files) {
    const pages = await extractTextFromPDF(file);
    combinedText += `\n--- Documento de Referência: ${file.name} ---\n`;
    combinedText += pages.map(p => p.text).join(' ');
  }
  return combinedText;
};
