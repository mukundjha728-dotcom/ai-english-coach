import { Volume2 } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  isSpeaking: boolean;
}

export function VoicePlaybackModule({ isSpeaking }: Props) {
  return (
    <div className={clsx(
      "flex items-center gap-3 px-4 py-2 rounded-full transition-colors duration-300",
      isSpeaking ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-400"
    )}>
      <Volume2 size={20} className={clsx(isSpeaking && "animate-pulse")} />
      <span className="text-sm font-medium">
        {isSpeaking ? 'AI Coach is speaking' : 'Audio ready'}
      </span>
      
      {isSpeaking && (
        <div className="flex gap-1 items-center h-4 ml-2">
          <div className="w-1 bg-indigo-500 rounded-full h-full animate-[waveform_1s_ease-in-out_infinite]" />
          <div className="w-1 bg-indigo-500 rounded-full h-2/3 animate-[waveform_1.2s_ease-in-out_infinite]" />
          <div className="w-1 bg-indigo-500 rounded-full h-full animate-[waveform_0.8s_ease-in-out_infinite]" />
        </div>
      )}
    </div>
  );
}
