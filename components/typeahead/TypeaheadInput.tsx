interface TypeaheadInputProps {
  inputId: string;
  value: string;
  placeholder: string;
  isOpen: boolean;
  activeDescendant?: string;
  listboxId: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function TypeaheadInput({
  inputId,
  value,
  placeholder,
  isOpen,
  activeDescendant,
  listboxId,
  disabled,
  onChange,
  onFocus,
  onKeyDown,
}: TypeaheadInputProps) {
  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        Search countries
      </label>

      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      </div>

      <input
        id={inputId}
        role="combobox"
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeDescendant}
        className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-12 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100"
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
      />

      {value.length > 0 && (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onChange("")}
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ×
          </span>
        </button>
      )}
    </div>
  );
}
