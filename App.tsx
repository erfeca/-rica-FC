
import React, { useState, useCallback, useRef } from 'react';
import { Layout, CheckCircle, Clock, FileText, Download, Play, RotateCcw, Loader2, XCircle } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { extractTextFromPDF, extractReferenceText } from './services/pdfService';
import { proofreadText } from './services/geminiService';
import { ProofreadingError, ProofreadingSession } from './types';

export default function App() {
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [session, setSession] = useState<ProofreadingSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const startProofreading = async () => {
    if (!mainFile) return;

    setIsProcessing(true);
    const startTime = new Date();
    
    // Initialize AbortController
    abortControllerRef.current = new AbortController();
    
    try {
      const referenceText = await extractReferenceText(refFiles);
      const documentPages = await extractTextFromPDF(mainFile);
      
      const errors = await proofreadText(
        documentPages, 
        referenceText, 
        (current, total) => setProgress({ current, total }),
        abortControllerRef.current.signal
      );

      const endTime = new Date();
      setSession({
        fileName: mainFile.name,
        startTime,
        endTime,
        duration: formatDuration(startTime, endTime),
        errors
      });
    } catch (error: any) {
      if (error.message === 'AbortError') {
        console.log("Revisão cancelada pelo usuário.");
      } else {
        console.error("Erro no processo de revisão:", error);
        alert("Ocorreu um erro durante a revisão. Verifique os arquivos e tente novamente.");
      }
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
      abortControllerRef.current = null;
    }
  };

  const cancelProofreading = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const exportToExcel = () => {
    if (!session) return;

    // Structure data for Excel according to requirement
    const data = session.errors.map(err => ({
      'Tipo de Erro': err.tipoErro,
      'Capítulo': err.capitulo || 'N/A',
      'Página': err.pagina,
      'De': err.de,
      'Para': err.para,
      'Explicação': err.explicacao,
      'Status': '' // Column without filling as requested
    }));

    // Metadata as the first few rows
    const metadata = [
      ['RELATÓRIO DE REVISÃO'],
      ['Arquivo:', session.fileName],
      ['Data:', session.startTime.toLocaleDateString('pt-BR')],
      ['Duração:', session.duration],
      [], // Empty row
      ['TIPO DE ERRO', 'CAPÍTULO', 'PÁGINA', 'DE', 'PARA', 'EXPLICAÇÃO', 'STATUS']
    ];

    const ws = (window as any).XLSX.utils.json_to_sheet(data, { origin: 'A7', skipHeader: true });
    
    // Add metadata titles manually
    (window as any).XLSX.utils.sheet_add_aoa(ws, metadata, { origin: 'A1' });

    const wb = (window as any).XLSX.utils.book_new();
    (window as any).XLSX.utils.book_append_sheet(wb, ws, 'Revisão');
    
    (window as any).XLSX.writeFile(wb, `Revisao_${session.fileName.replace('.pdf', '')}.xlsx`);
  };

  const reset = () => {
    setMainFile(null);
    setRefFiles([]);
    setSession(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-lg mb-8">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Revisor Pro AI</h1>
              <p className="text-indigo-100 text-sm">Agente Inteligente de Revisão Gramatical</p>
            </div>
          </div>
          
          {session && (
            <div className="flex items-center gap-4 text-sm font-medium bg-white/10 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-1.5 border-r border-white/20 pr-4">
                <Clock className="w-4 h-4" />
                <span>{session.duration}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span className="truncate max-w-[150px]">{session.fileName}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4">
        {!session ? (
          <div className="max-w-4xl mx-auto">
            <FileUploader 
              onMainFileChange={setMainFile}
              onRefFilesChange={setRefFiles}
              mainFile={mainFile}
              refFiles={refFiles}
              isProcessing={isProcessing}
            />

            <div className="flex justify-center mt-10">
              <button
                onClick={startProofreading}
                disabled={!mainFile || isProcessing}
                className={`flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold shadow-xl transition-all ${
                  !mainFile || isProcessing
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Processando ({progress.current}/{progress.total})...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current" />
                    <span>Iniciar Revisão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Erros Identificados ({session.errors.length})
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Excel
                  </button>
                  <button
                    onClick={reset}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Nova Revisão
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Página</th>
                      <th className="px-6 py-4">Capítulo</th>
                      <th className="px-6 py-4">Tipo</th>
                      <th className="px-6 py-4">De (Original)</th>
                      <th className="px-6 py-4">Para (Sugestão)</th>
                      <th className="px-6 py-4">Explicação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {session.errors.length > 0 ? session.errors.map((error, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">{error.pagina}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 italic">{error.capitulo || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            error.tipoErro.toLowerCase().includes('ortografia') ? 'bg-orange-100 text-orange-700' :
                            error.tipoErro.toLowerCase().includes('gramática') ? 'bg-blue-100 text-blue-700' :
                            'bg-indigo-100 text-indigo-700'
                          }`}>
                            {error.tipoErro}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600 line-through decoration-red-300">{error.de}</td>
                        <td className="px-6 py-4 text-sm text-emerald-700 font-medium">{error.para}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 max-w-xs">{error.explicacao}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                          Nenhum erro encontrado no documento baseado nas referências fornecidas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Status Bar with Cancel Button */}
      {isProcessing && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4 animate-in slide-in-from-bottom-full duration-300 z-50">
          <div className="container mx-auto max-w-5xl flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                  Analisando documento...
                </span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-indigo-700">Página {progress.current} de {progress.total}</p>
                <p className="text-[10px] text-slate-400 font-medium">Isso pode levar alguns minutos</p>
              </div>
              
              <button
                onClick={cancelProofreading}
                className="flex items-center gap-2 px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-all active:scale-95"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
