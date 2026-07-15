import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { notifySuccess, notifyError } from '../lib/toast';

type DescriptionGeneratorProps = {
  currentValue: string;
  onSelect: (value: string) => void;
  generateFn: () => Promise<{ option1: string; option2: string }>;
  label?: string;
  loadingLabel?: string;
  optionLabels?: [string, string];
  disabled?: boolean;
  validate?: () => string | null;
};

export default function DescriptionGenerator({
  currentValue,
  onSelect,
  generateFn,
  label = 'Generar con IA',
  loadingLabel = 'Generando...',
  optionLabels = ['Opción 1', 'Opción 2'],
  disabled = false,
  validate,
}: DescriptionGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [options, setOptions] = useState<{ option1: string; option2: string } | null>(null);
  const [confirmText, setConfirmText] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (validate) {
      const error = validate();
      if (error) { notifyError(error); return; }
    }
    setGenerating(true);
    setOptions(null);
    try {
      const result = await generateFn();
      if (!result.option1 && !result.option2) {
        notifyError('La IA no generó descripciones válidas. Intenta de nuevo.');
        return;
      }
      setOptions(result);
      notifySuccess('Descripciones generadas con IA');
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al generar descripción');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (text: string) => {
    if (currentValue.trim()) {
      setConfirmText(text);
    } else {
      onSelect(text);
      setOptions(null);
    }
  };

  const handleConfirmReplace = () => {
    if (confirmText) {
      onSelect(confirmText);
      setConfirmText(null);
      setOptions(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={disabled || generating}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          {generating ? loadingLabel : label}
        </button>
        {options && (
          <button
            type="button"
            onClick={() => setOptions(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>
      {options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {([options.option1, options.option2] as const).map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectOption(opt)}
              className={`text-left p-3 rounded-lg border-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                currentValue === opt
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300 dark:hover:border-primary-600'
              }`}
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">
                {optionLabels[i]}
              </span>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{opt}</p>
            </button>
          ))}
        </div>
      )}

      {confirmText !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md mx-4 w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              ¿Mantener o reemplazar texto anterior?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Ya tienes una descripción escrita. ¿Qué deseas hacer con el texto generado por IA?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmText(null)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Mantener actual
              </button>
              <button
                type="button"
                onClick={handleConfirmReplace}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-500 transition-colors"
              >
                Reemplazar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
