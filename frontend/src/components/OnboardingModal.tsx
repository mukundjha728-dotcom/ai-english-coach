import { useState } from 'react';
import { Mic, CheckCircle2 } from 'lucide-react';
import { completeOnboarding } from '../lib/api';

export function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    try {
      setLoading(true);
      await completeOnboarding();
      onComplete();
    } catch (err) {
      console.error('Failed to complete onboarding', err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg shadow-2xl border border-brand-500/20 bg-white dark:bg-slate-900 rounded-2xl animate-in fade-in zoom-in duration-300 overflow-hidden">
        
        {/* Header */}
        <div className="text-center p-8 pb-4">
          <div className="mx-auto bg-brand-100 dark:bg-brand-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Mic className="w-8 h-8 text-brand-500" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome to AI Coach!</h2>
          <p className="text-base mt-2 text-slate-500 dark:text-slate-400">
            You're just a few steps away from improving your spoken English.
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-4">
          <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-xl space-y-3 border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              How it works
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc list-inside ml-1">
              <li>When you start a session, your browser will ask for <strong>Microphone Permissions</strong>.</li>
              <li>Please click <strong>Allow</strong> so the AI can hear you speak.</li>
              <li>Use Google Chrome for the best voice recognition experience.</li>
              <li>Try out a Daily Challenge or Roleplay to get started!</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-4">
          <button 
            onClick={handleComplete} 
            disabled={loading} 
            className="w-full text-lg h-14 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Starting...
              </>
            ) : (
              "Got it, let's go!"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
