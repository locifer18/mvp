'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle, XCircle, X } from 'lucide-react';

interface ImportResult {
  created: number;
  errors: number;
  total: number;
  message: string;
}

export default function ImportButton() {
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Accept both .csv and Excel-exported .csv files
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const text = await file.text();
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: text,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Import failed. Please check your file format.');
      } else {
        setResult(data);
        router.refresh();
      }
    } catch {
      setError('Failed to read or upload the file. Please try again.');
    } finally {
      setLoading(false);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".csv,text/csv,application/vnd.ms-excel"
        onChange={handleFile}
        className="hidden"
      />

      <button
        onClick={() => { setResult(null); setError(null); ref.current?.click(); }}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1e1e2e] hover:bg-[#2a2a3e] text-slate-300 rounded-lg border border-[#2d2d3d] transition-colors disabled:opacity-50"
      >
        <Upload size={14} />
        {loading ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-slate-500 border-t-indigo-400 rounded-full animate-spin" />
            Importing...
          </span>
        ) : (
          'Import CSV'
        )}
      </button>

      {/* Result toast */}
      {result && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-[#1a1a2e] border border-green-800 text-slate-200 rounded-xl shadow-2xl p-4 max-w-sm animate-in">
          <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-300">Import Complete</p>
            <p className="text-xs text-slate-400 mt-0.5">{result.message}</p>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-green-400">{result.created} imported</span>
              {result.errors > 0 && (
                <span className="text-red-400">{result.errors} failed</span>
              )}
            </div>
          </div>
          <button onClick={() => setResult(null)} className="text-slate-500 hover:text-slate-300">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-[#1a1a2e] border border-red-800 text-slate-200 rounded-xl shadow-2xl p-4 max-w-sm">
          <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-300">Import Failed</p>
            <p className="text-xs text-slate-400 mt-0.5">{error}</p>
            <p className="text-xs text-slate-500 mt-1">
              Make sure your CSV has a header row with a <code className="text-indigo-400">name</code> column.
            </p>
          </div>
          <button onClick={() => setError(null)} className="text-slate-500 hover:text-slate-300">
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
