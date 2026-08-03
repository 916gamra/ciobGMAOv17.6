import React, { useState } from 'react';
import { RealFileImporter } from '@/core/excel/realFileImporter';
import { ExcelFileAnalyzer } from '@/core/excel/fileAnalyzer';
import { Upload, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function RealFileImporterUI() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleAnalyzeFile = async (file: File) => {
    try {
      setIsLoading(true);
      const fileAnalysis = await ExcelFileAnalyzer.analyzeGestionPDRFile(file);
      setAnalysis(fileAnalysis);
      setSelectedFile(file);

      toast.success('File analyzed successfully', {
        description: `${fileAnalysis.totalRows} rows, ${fileAnalysis.sheets.length} sheets found.`
      });
    } catch (error: any) {
      toast.error('File analysis failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFile = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      const result = await RealFileImporter.importGestionPDRFile(selectedFile);
      setImportResult(result);

      if (result.success) {
        toast.success('Import completed successfully', {
          description: `${result.summary.importedRows} rows imported.`
        });
      } else {
        toast.warning('Import completed with warnings', {
          description: `${result.summary.errors.length} errors/warnings.`
        });
      }
    } catch (error: any) {
      toast.error('Import failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-100 tracking-tight mb-2">Legacy Excel Import</h1>
        <p className="text-slate-400 text-lg">Safely integrate physical Excel data into the unified database.</p>
      </header>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-4 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-200">1. Select PDR File</h2>
        
        <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-white/5 transition-all">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAnalyzeFile(file);
            }}
            className="hidden"
            id="file-input"
            disabled={isLoading}
          />
          <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center">
            <Upload className="w-12 h-12 text-blue-500 mb-4" />
            <p className="text-lg text-slate-200 font-semibold">Drag & Drop or Click to Browse</p>
            <p className="text-sm text-slate-400 mt-2">Only Excel files (.xlsx, .xls) are supported.</p>
            <p className="text-xs text-slate-500 mt-1">Example: Gestion PDR Nabil.xlsx</p>
          </label>
        </div>
      </div>

      {analysis && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-6 shadow-xl">
          <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            File Analysis Report
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-emerald-400">{analysis.totalRows}</p>
              <p className="text-sm text-slate-400 mt-1">Total Rows</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">{analysis.sheets.length}</p>
              <p className="text-sm text-slate-400 mt-1">Sheets</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-400">{analysis.totalItems}</p>
              <p className="text-sm text-slate-400 mt-1">Items Found</p>
            </div>
            <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-slate-300">{(analysis.fileSize / 1024).toFixed(1)} KB</p>
              <p className="text-sm text-slate-400 mt-1">File Size</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-slate-300">Sheet Breakdown:</h4>
            {analysis.sheets.map((sheet: any, idx: number) => (
              <div key={idx} className="bg-black/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-200">{sheet.name}</p>
                  <span className="text-sm px-2 py-1 bg-slate-700/50 rounded-md text-slate-300">{sheet.rowCount} rows</span>
                </div>
                <p className="text-sm text-slate-400">{sheet.columnCount} recognized columns</p>

                {sheet.issues.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-1">
                    {sheet.issues.slice(0, 3).map((issue: any, i: number) => (
                      <div key={i} className="text-xs text-amber-400 flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{issue.message}</span>
                      </div>
                    ))}
                    {sheet.issues.length > 3 && (
                      <p className="text-xs text-slate-500 mt-2">... and {sheet.issues.length - 3} more issues detected.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleImportFile}
            disabled={isLoading || !!importResult}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none"
          >
            {isLoading ? 'Importing Data...' : importResult ? 'Import Complete' : 'Execute Import'}
          </button>
        </div>
      )}

      {importResult && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-700/50 pb-4">
            {importResult.success ? (
              <>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <h3 className="text-xl font-semibold text-emerald-400">Import Successful</h3>
              </>
            ) : (
              <>
                <AlertCircle className="w-8 h-8 text-amber-500" />
                <h3 className="text-xl font-semibold text-amber-400">Import Completed with Warnings</h3>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-3xl font-bold text-emerald-400">{importResult.summary.importedRows}</p>
              <p className="text-sm text-slate-400 mt-1">Rows Imported</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-3xl font-bold text-amber-400">{importResult.summary.errors.length}</p>
              <p className="text-sm text-slate-400 mt-1">Anomalies Detected</p>
            </div>
          </div>

          {importResult.summary.errors.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-amber-500 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Anomalies & Conflicts ({importResult.summary.errors.length})
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                {importResult.summary.errors.slice(0, 10).map((error: any, idx: number) => (
                  <div key={idx} className="text-sm text-amber-300/80 flex items-start gap-2">
                    <span className="text-amber-500 font-bold">{idx + 1}.</span>
                    <span>{error.message || error.error || error.type} (Ref: {error.reference || 'N/A'})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
