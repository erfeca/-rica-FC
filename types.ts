
export interface ProofreadingError {
  tipoErro: string;
  capitulo: string;
  pagina: number;
  de: string;
  para: string;
  explicacao: string;
  status: string; // empty by default
}

export interface ProofreadingSession {
  fileName: string;
  startTime: Date;
  endTime?: Date;
  duration?: string;
  errors: ProofreadingError[];
}

export interface PDFPageContent {
  pageNumber: number;
  text: string;
}
