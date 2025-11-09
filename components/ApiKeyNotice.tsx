import React, { useEffect, useMemo, useState } from 'react';

function resolveApiKey(): string | null {
  const viteKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY as string | undefined;
  if (viteKey && viteKey.trim()) return viteKey.trim();
  const windowKey = (globalThis as any)?.API_KEY as string | undefined;
  if (windowKey && windowKey.trim()) return windowKey.trim();
  try {
    const stored = localStorage.getItem('GEMINI_API_KEY');
    if (stored && stored.trim()) return stored.trim();
  } catch {}
  return null;
}

const ApiKeyNotice = () => {
  const [value, setValue] = useState('');
  const existing = useMemo(() => resolveApiKey(), []);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existing) setValue(existing);
  }, [existing]);

  if (existing) return null;

  const onSave = () => {
    try {
      const trimmed = value.trim();
      if (!trimmed) return;
      localStorage.setItem('GEMINI_API_KEY', trimmed);
      (window as any).API_KEY = trimmed;
      setSaved(true);
      setTimeout(() => {
        location.reload();
      }, 400);
    } catch {}
  };

  return (
    <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 p-3 flex items-center space-x-3">
      <div className="text-sm text-yellow-800 dark:text-yellow-300 flex-1">
        Missing Gemini API key. Enter it to enable analysis and chat.
      </div>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste Gemini API Key"
        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-gray-200"
        style={{ width: 220 }}
      />
      <button
        onClick={onSave}
        className="px-3 py-1 rounded bg-brand-secondary text-white text-sm"
      >
        {saved ? 'Saved' : 'Save'}
      </button>
    </div>
  );
};

export default ApiKeyNotice;


