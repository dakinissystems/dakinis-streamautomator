/**
 * Inline Copilot suggestions for title, description, or hashtags.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { suggestCopilot } from '../api/creatorApi.js';

export default function CreatorCopilotSuggest({
  type = 'title',
  onApply,
  prompt,
  contentId,
  autoOpen = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [source, setSource] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await suggestCopilot({
        type,
        contentId,
        prompt: prompt?.trim() || undefined,
      });
      const items = Array.isArray(result?.suggestions) ? result.suggestions : [];
      setSuggestions(items);
      setSource(result?.source || null);
      setOpen(true);
      if (!items.length) {
        toast.error('Sin sugerencias por ahora');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Copilot no disponible');
    } finally {
      setLoading(false);
    }
  }, [type, contentId, prompt]);

  useEffect(() => {
    if (autoOpen) load();
  }, [autoOpen, load]);

  const labels = {
    title: 'Sugerir título',
    description: 'Sugerir descripción',
    hashtags: 'Sugerir hashtags',
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={load}
        disabled={loading}
        className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {labels[type] || 'Copilot'}
      </button>
      {open && suggestions.length > 0 && (
        <div className="mt-2 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/80 dark:bg-violet-900/20 p-2 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-violet-600 dark:text-violet-400">
            {source === 'platform' ? 'IA plataforma' : 'Sugerencias locales'}
          </p>
          {suggestions.map((text, index) => (
            <button
              key={`${type}-${index}`}
              type="button"
              onClick={() => {
                onApply?.(text);
                setOpen(false);
                toast.success('Aplicado');
              }}
              className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-violet-100 dark:hover:bg-violet-900/40 text-gray-800 dark:text-gray-200"
            >
              {text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
