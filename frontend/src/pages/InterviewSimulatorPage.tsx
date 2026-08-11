import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument, getDocuments, startConversation } from '../lib/api';
import { ArrowLeft, Briefcase, FileText, Upload, Plus, Loader2, Sparkles, User, FileSearch } from 'lucide-react';

interface DocumentRecord {
  id: string;
  filename: string;
  created_at: string;
}

export default function InterviewSimulatorPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [jdId, setJdId] = useState<string | null>(null);
  
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingJd, setUploadingJd] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'jd') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported currently.');
      return;
    }

    try {
      if (type === 'resume') setUploadingResume(true);
      else setUploadingJd(true);
      
      setError(null);
      const { documentId } = await uploadDocument(file);
      
      if (type === 'resume') setResumeId(documentId);
      else setJdId(documentId);
      
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      if (type === 'resume') setUploadingResume(false);
      else setUploadingJd(false);
      event.target.value = '';
    }
  };

  const handleStartInterview = async () => {
    if (!resumeId || !jdId) {
      setError('Please upload or select both a Resume and a Job Description.');
      return;
    }

    try {
      setError(null);
      setStarting(true);
      const { sessionId } = await startConversation('interview', undefined, undefined, resumeId, jdId);
      navigate(`/conversation/${sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start interview session');
      setStarting(false);
    }
  };

  const renderUploadBox = (type: 'resume' | 'jd', currentId: string | null, uploading: boolean) => {
    const isResume = type === 'resume';
    const selectedDoc = documents.find(d => d.id === currentId);
    
    return (
      <div className="premium-card p-8 text-center relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 transition-colors bg-white/50 dark:bg-slate-900/50 flex-1">
        <input 
          type="file" 
          accept="application/pdf"
          onChange={(e) => handleFileUpload(e, type)}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
        />
        <div className="pointer-events-none flex flex-col items-center justify-center relative z-10 min-h-[160px]">
          {uploading ? (
            <>
              <Loader2 size={48} className="text-brand-500 mb-4 animate-spin" />
              <p className="text-slate-500 dark:text-slate-400">Processing {isResume ? 'Resume' : 'Job Description'}...</p>
            </>
          ) : selectedDoc ? (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate w-full px-4">{selectedDoc.filename}</h3>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Selected</p>
              <p className="text-xs text-slate-400 mt-4 underline">Click to change</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm text-brand-500 border border-slate-100 dark:border-slate-700">
                {isResume ? <User size={32} /> : <FileSearch size={32} />}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Upload {isResume ? 'Resume' : 'Job Description'}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">PDF up to 5MB</p>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-8 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-sm font-semibold tracking-wide uppercase border border-brand-200 dark:border-brand-500/30 mb-4">
            <Sparkles size={16} /> Flagship Feature
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-3">
            <Briefcase className="text-brand-500" size={36} /> Interview Simulator
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Upload your resume and a target job description. The AI will act as a hiring manager, conducting a realistic mock interview tailored specifically for you.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-4 rounded-xl mb-8 text-sm font-medium border border-rose-100 dark:border-rose-500/20">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 mb-12">
          {renderUploadBox('resume', resumeId, uploadingResume)}
          {renderUploadBox('jd', jdId, uploadingJd)}
        </div>

        <div className="flex justify-center mb-16">
          <button
            onClick={handleStartInterview}
            disabled={!resumeId || !jdId || starting}
            className="py-4 px-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-lg font-bold rounded-2xl hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl shadow-brand-500/20"
          >
            {starting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus size={24} />}
            Start Mock Interview
          </button>
        </div>

        {/* Existing Documents Selection */}
        <div>
          <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Or Select Existing Documents</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <Loader2 size={32} className="animate-spin text-brand-500" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-slate-500">No documents uploaded yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <div key={doc.id} className="premium-card p-4 flex flex-col group">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="text-slate-400" size={20} />
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate flex-1" title={doc.filename}>
                      {doc.filename}
                    </h3>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => setResumeId(doc.id)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${resumeId === doc.id ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      Set as Resume
                    </button>
                    <button 
                      onClick={() => setJdId(doc.id)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${jdId === doc.id ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      Set as JD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
