import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Target, BookA, Zap, Star } from 'lucide-react';
import { API_BASE } from '../lib/api';

interface ScorecardRecord {
  id: string;
  grammar_score: number;
  vocabulary_score: number;
  fluency_score: number;
  strengths: string[];
  improvements: string[];
}

export default function ScorecardPage() {
  const { sessionId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [scorecard, setScorecard] = useState<ScorecardRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !session?.access_token) return;
    generateAndFetchScorecard();
  }, [sessionId, session]);

  const generateAndFetchScorecard = async () => {
    try {
      setLoading(true);
      setError(null);
      // Generate
      const genRes = await fetch(`${API_BASE}/api/conversation/${sessionId}/scorecard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!genRes.ok) throw new Error('Failed to generate scorecard');
      
      // Fetch
      const fetchRes = await fetch(`${API_BASE}/api/conversation/${sessionId}/scorecard`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await fetchRes.json();
      if (!data.scorecard) throw new Error('Scorecard not found');
      
      setScorecard(data.scorecard);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 relative">
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-8 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 relative mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Analyzing Session...</h2>
            <p className="text-slate-500 dark:text-slate-400">The AI coach is evaluating your performance.</p>
          </div>
        ) : error ? (
          <div className="glass-panel p-8 rounded-2xl text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Oops!</h2>
            <p className="text-rose-500 mb-6">{error}</p>
            <button onClick={generateAndFetchScorecard} className="btn-primary">Try Again</button>
          </div>
        ) : scorecard && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-xl shadow-brand-500/30 mb-6">
                <Star size={40} className="drop-shadow-md" />
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">Session Scorecard</h1>
              <p className="text-lg text-slate-500 dark:text-slate-400">Here's how you performed in this conversation.</p>
            </div>

            {/* Scores Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Grammar', score: scorecard.grammar_score, icon: BookA, color: 'text-blue-500' },
                { title: 'Vocabulary', score: scorecard.vocabulary_score, icon: Target, color: 'text-violet-500' },
                { title: 'Fluency', score: scorecard.fluency_score, icon: Zap, color: 'text-amber-500' },
              ].map((item, i) => (
                <div key={i} className="premium-card p-6 flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 ${item.color}`}>
                    <item.icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <div className="text-4xl font-black text-slate-900 dark:text-white mb-4">
                    {item.score}<span className="text-xl text-slate-400 font-medium">/100</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getScoreColor(item.score)} transition-all duration-1000 ease-out`}
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback Grid */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="premium-card p-8 border-t-4 border-t-emerald-500">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center">👍</span>
                  Strengths
                </h3>
                <ul className="space-y-4">
                  {scorecard.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                      {str}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="premium-card p-8 border-t-4 border-t-brand-500">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-500/20 text-brand-600 flex items-center justify-center">💡</span>
                  Areas for Improvement
                </h3>
                <ul className="space-y-4">
                  {scorecard.improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0"></div>
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="text-center pt-8 pb-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
