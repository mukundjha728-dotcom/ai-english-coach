import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, Loader2, Theater } from 'lucide-react';
import { getRoleplays, startConversation } from '../lib/api';

interface Roleplay {
  id: string;
  name: string;
  category: string;
  system_prompt_template: string;
}

export default function RoleplaySelectorPage() {
  const navigate = useNavigate();
  const [roleplays, setRoleplays] = useState<Roleplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoleplays();
  }, []);

  const loadRoleplays = async () => {
    try {
      setLoading(true);
      const res = await getRoleplays();
      setRoleplays(res.roleplays);
    } catch (err: any) {
      setError(err.message || 'Failed to load roleplays');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRoleplay = async (roleplayId: string) => {
    try {
      setStarting(true);
      const { sessionId } = await startConversation('conversation', undefined, roleplayId);
      navigate(`/conversation/${sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start roleplay');
      setStarting(false);
    }
  };

  // Group by category
  const groupedRoleplays = roleplays.reduce((acc, rp) => {
    if (!acc[rp.category]) acc[rp.category] = [];
    acc[rp.category].push(rp);
    return acc;
  }, {} as Record<string, Roleplay[]>);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-400">
              Roleplay Scenarios
            </h1>
            <p className="text-slate-600 dark:text-slate-400">Practice your English in real-world situations.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedRoleplays).map(([category, rps]) => (
              <div key={category} className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rps.map((rp) => (
                    <div key={rp.id} className="glass-panel p-6 rounded-2xl flex flex-col h-full transition-transform hover:-translate-y-1 hover:shadow-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl text-brand-600 dark:text-brand-400">
                            <Theater size={24} />
                          </div>
                          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{rp.name}</h3>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-grow line-clamp-3">
                        {rp.system_prompt_template}
                      </p>
                      
                      <button
                        onClick={() => handleStartRoleplay(rp.id)}
                        disabled={starting}
                        className="w-full py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-brand-600 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                        Start Roleplay
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {roleplays.length === 0 && (
              <div className="text-center py-12 glass-panel rounded-2xl">
                <Theater className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No roleplays available</h3>
                <p className="text-slate-500">Run the database migration to seed roleplays.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
