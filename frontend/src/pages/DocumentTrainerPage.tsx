import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument, getDocuments, startConversation } from '../lib/api';
import { ArrowLeft, FileText, Upload, Plus, Loader2, Sparkles } from 'lucide-react';

interface DocumentRecord {
  id: string;
  filename: string;
  created_at: string;
}

export default function DocumentTrainerPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { documents } = await getDocuments();
      setDocuments(documents);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported currently.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await uploadDocument(file);
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleStartPractice = async (documentId: string) => {
    try {
      setError(null);
      const { sessionId } = await startConversation('document_trainer', documentId);
      navigate(`/conversation/${sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-8 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-sm font-semibold tracking-wide uppercase border border-brand-200 dark:border-brand-500/30 mb-4">
            <Sparkles size={16} /> Beta Feature
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-3">
            <FileText className="text-brand-500" size={36} /> Document Trainer
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Upload a PDF (like an article, manual, or textbook chapter) and practice your English by discussing its contents with the AI Coach.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-4 rounded-xl mb-8 text-sm font-medium border border-rose-100 dark:border-rose-500/20 flex items-center gap-2">
            {error}
          </div>
        )}

        {/* Upload Area */}
        <div className="premium-card mb-12 p-10 text-center relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 transition-colors bg-white/50 dark:bg-slate-900/50">
          <input 
            type="file" 
            accept="application/pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
          />
          <div className="pointer-events-none flex flex-col items-center justify-center relative z-10">
            {uploading ? (
              <>
                <Loader2 size={56} className="text-brand-500 mb-4 animate-spin" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Processing Document...</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Extracting text and analyzing semantic context.</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg text-brand-500 border border-slate-100 dark:border-slate-700">
                  <Upload size={36} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Upload a new PDF</h3>
                <p className="text-slate-500 dark:text-slate-400">Drag and drop, or click to browse (Max 5MB)</p>
              </>
            )}
          </div>
        </div>

        {/* Document List */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Your Documents</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 size={32} className="animate-spin text-brand-500" />
            </div>
          ) : documents.length === 0 ? (
            <div className="glass-panel py-16 text-center rounded-2xl">
              <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-lg text-slate-500 font-medium">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {documents.map((doc) => (
                <div key={doc.id} className="premium-card p-6 flex flex-col justify-between group">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-xl">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate" title={doc.filename}>
                        {doc.filename}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {new Date(doc.created_at).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStartPractice(doc.id)}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-brand-500 hover:text-white dark:hover:bg-brand-600 transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-md"
                  >
                    <Plus size={18} /> Start Practice
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
