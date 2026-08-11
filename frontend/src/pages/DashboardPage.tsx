import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { startConversation, getDailyChallenge } from '../lib/api';
import { LogOut, Mic, BookOpen, UserCheck, Trophy, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState<any>(null);
  const [startingChallenge, setStartingChallenge] = useState(false);

  useEffect(() => {
    getDailyChallenge().then(res => setDailyChallenge(res.challenge)).catch(console.error);
  }, []);

  const handleStartConversation = async () => {
    try {
      setStarting(true);
      const { sessionId } = await startConversation('conversation');
      navigate(`/conversation/${sessionId}`);
    } catch (error) {
      console.error('Failed to start conversation', error);
      alert('Failed to start conversation. Check console for details.');
    } finally {
      setStarting(false);
    }
  };

  const handleStartDailyChallenge = async () => {
    if (!dailyChallenge) return;
    try {
      setStartingChallenge(true);
      const { sessionId } = await startConversation(
        'daily_challenge',
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        dailyChallenge.topic
      );
      navigate(`/conversation/${sessionId}`);
    } catch (error) {
      console.error('Failed to start challenge', error);
      alert('Failed to start daily challenge.');
    } finally {
      setStartingChallenge(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-500/10 to-transparent pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              Hi, {profile?.displayName || profile?.email?.split('@')[0] || 'there'}!
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 rounded-full text-sm font-semibold tracking-wide uppercase border border-brand-200 dark:border-brand-500/30">
                Level: {profile?.proficiencyLevel || 'Beginner'}
              </span>
            </div>
          </div>
          <button onClick={signOut} className="btn-ghost flex items-center gap-2">
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Primary CTA */}
          <div 
            className="lg:col-span-3 premium-card p-8 md:p-10 cursor-pointer group"
            onClick={handleStartConversation}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-indigo-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4 backdrop-blur-md border border-white/30">
                  <Sparkles size={16} /> Recommended
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">Practice Speaking</h2>
                <p className="text-brand-100 text-lg max-w-xl">
                  Start a natural voice conversation with your AI coach. Get real-time feedback and automatically level up as you improve.
                </p>
              </div>
              <button 
                className="bg-white text-brand-700 hover:bg-brand-50 font-bold text-lg px-8 py-4 rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-3 whitespace-nowrap"
                disabled={starting}
              >
                {starting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
                    Starting...
                  </div>
                ) : (
                  <>
                    <div className="bg-brand-100 p-2 rounded-full">
                      <Mic size={24} className="text-brand-600" />
                    </div>
                    Start Session
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Secondary Cards */}
          <div 
            className="premium-card p-8 cursor-pointer group" 
            onClick={() => navigate('/document-trainer')}
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Document Trainer</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload a PDF and practice discussing its content. Perfect for articles or textbook chapters.
            </p>
          </div>

          <div 
            className="premium-card p-8 cursor-pointer group" 
            onClick={() => navigate('/roleplays')}
          >
            <div className="w-14 h-14 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UserCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Roleplay Scenarios</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Practice real-world situations like interviews, ordering food, and more.
            </p>
          </div>

          <div 
            className="premium-card p-8 cursor-pointer group" 
            onClick={() => navigate('/interview-simulator')}
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UserCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Interview Simulator</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Upload your resume and a JD to practice tailored mock interviews with AI.
            </p>
          </div>

          <div className="premium-card p-8 rounded-2xl relative overflow-hidden group cursor-pointer" onClick={handleStartDailyChallenge}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/5 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Trophy size={28} />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Daily Challenge</h3>
                {dailyChallenge && (
                  <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-md text-xs font-bold uppercase tracking-wider">
                    {dailyChallenge.duration}
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4 min-h-[3rem]">
                {dailyChallenge ? dailyChallenge.topic : 'Loading challenge...'}
              </p>
              
              <button 
                disabled={startingChallenge || !dailyChallenge}
                className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all disabled:opacity-50"
              >
                {startingChallenge ? 'Starting...' : 'Start Challenge'} &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
