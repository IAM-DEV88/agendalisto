import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface Country {
  code: string;
  dial: string;
  name: string;
  flag: string;
}

const countries: Country[] = [
  { code: 'CO', dial: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: 'AR', dial: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', dial: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: 'PE', dial: '+51', name: 'Perú', flag: '🇵🇪' },
  { code: 'EC', dial: '+593', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'MX', dial: '+52', name: 'México', flag: '🇲🇽' },
  { code: 'ES', dial: '+34', name: 'España', flag: '🇪🇸' },
  { code: 'US', dial: '+1', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'BR', dial: '+55', name: 'Brasil', flag: '🇧🇷' },
  { code: 'VE', dial: '+58', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'UY', dial: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'PY', dial: '+595', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'BO', dial: '+591', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'CR', dial: '+506', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'PA', dial: '+507', name: 'Panamá', flag: '🇵🇦' },
  { code: 'DO', dial: '+1-809', name: 'República Dominicana', flag: '🇩🇴' },
  { code: 'CU', dial: '+53', name: 'Cuba', flag: '🇨🇺' },
  { code: 'GT', dial: '+502', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'SV', dial: '+503', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'HN', dial: '+504', name: 'Honduras', flag: '🇭🇳' },
  { code: 'NI', dial: '+505', name: 'Nicaragua', flag: '🇳🇮' },
];

function parsePhone(value: string): { dial: string; number: string } {
  if (!value) return { dial: '+57', number: '' };
  const sorted = [...countries].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (value.startsWith(c.dial)) {
      return { dial: c.dial, number: value.slice(c.dial.length) };
    }
  }
  return { dial: '+57', number: value };
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  name?: string;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = 'Número de teléfono',
  required,
  id,
  name,
}: PhoneInputProps) {
  const [dial, setDial] = useState(() => parsePhone(value).dial);
  const [localNumber, setLocalNumber] = useState(() => parsePhone(value).number);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { dial: d, number: n } = parsePhone(value);
    setDial(d);
    setLocalNumber(n);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleDialSelect(d: string) {
    setDial(d);
    onChange(d + localNumber);
    setOpen(false);
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    setLocalNumber(raw);
    onChange(dial + raw);
  }

  const selected = countries.find(c => c.dial === dial) ?? countries[0];

  return (
    <div ref={ref} className="relative">
      <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-100 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 pl-3 pr-1.5 py-4 text-sm font-medium text-slate-700 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-200 transition-colors shrink-0"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span>{selected.dial}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        <div className="w-px bg-slate-300 dark:bg-slate-400 self-stretch my-3" />

        <input
          type="tel"
          id={id}
          name={name}
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={placeholder}
          required={required}
          inputMode="numeric"
          autoComplete="tel-national"
          className="flex-1 !bg-transparent !border-0 !outline-none !pl-3 !rounded-none text-slate-900 dark:text-gray-900 font-medium placeholder:text-slate-400 text-sm"
        />
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {countries.map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleDialSelect(c.dial)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors
                ${c.dial === dial
                  ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
            >
              <span className="text-base leading-none shrink-0">{c.flag}</span>
              <span className="font-medium shrink-0 w-16">{c.dial}</span>
              <span className="text-slate-500 dark:text-slate-400 truncate">{c.name}</span>
              {c.dial === dial && (
                <span className="ml-auto text-primary-600 dark:text-primary-400 text-xs font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
