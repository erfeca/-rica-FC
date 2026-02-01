
import React from 'react';
import { FileUp, BookOpen, Info } from 'lucide-react';

interface FileUploaderProps {
  onMainFileChange: (file: File | null) => void;
  onRefFilesChange: (files: File[]) => void;
  mainFile: File | null;
  refFiles: File[];
  isProcessing: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onMainFileChange,
  onRefFilesChange,
  mainFile,
  refFiles,
  isProcessing
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Main File Upload */}
      <div className={`p-6 border-2 border-dashed rounded-xl transition-all ${mainFile ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-white'}`}>
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-indigo-100 rounded-full mb-4">
            <FileUp className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Arquivo para Revisão</h3>
          <p className="text-sm text-slate-500 mb-4">Selecione o PDF principal que deseja revisar.</p>
          
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => onMainFileChange(e.target.files?.[0] || null)}
              disabled={isProcessing}
            />
            <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              {mainFile ? 'Alterar PDF' : 'Selecionar PDF'}
            </span>
          </label>
          
          {mainFile && (
            <div className="mt-3 flex items-center text-xs font-medium text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
              {mainFile.name}
            </div>
          )}
        </div>
      </div>

      {/* Reference Files Upload */}
      <div className={`p-6 border-2 border-dashed rounded-xl transition-all ${refFiles.length > 0 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 bg-white'}`}>
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-emerald-100 rounded-full mb-4">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Documentos de Referência</h3>
          <p className="text-sm text-slate-500 mb-4">Adicione manuais ou guias de regras gramaticais.</p>
          
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf"
              className="hidden"
              onChange={(e) => onRefFilesChange(Array.from(e.target.files || []))}
              disabled={isProcessing}
            />
            <span className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
              {refFiles.length > 0 ? 'Adicionar mais' : 'Selecionar Referências'}
            </span>
          </label>

          {refFiles.length > 0 && (
            <div className="mt-4 w-full">
              <div className="flex items-center gap-1.5 mb-2 justify-center text-emerald-700">
                <Info className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Ordem de Prioridade</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {refFiles.map((file, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="bg-emerald-600 text-white w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold">{idx + 1}</span>
                    {file.name}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[9px] text-emerald-600/70 italic px-4">
                * Caso haja conflito entre referências, a regra do documento com menor número (maior prioridade) será aplicada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};