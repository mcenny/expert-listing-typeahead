import type { Country } from "@/types/country";

interface TypeaheadItemProps {
  country: Country;
  index: number;
  isActive: boolean;
  onSelect: (country: Country) => void;
  onMouseEnter: () => void;
}

export function TypeaheadItem({
  country,
  index,
  isActive,
  onSelect,
  onMouseEnter,
}: TypeaheadItemProps) {
  const optionId = `country-option-${country.code}`;

  return (
    <li
      id={optionId}
      role="option"
      aria-selected={isActive}
      className={`cursor-pointer px-4 py-3 transition ${
        isActive ? "bg-slate-100" : "bg-white hover:bg-slate-50"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onSelect(country)}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          {country.flag}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900">
            {country.name}
          </p>

          <p className="text-sm text-slate-500">
            {country.capital ? country.capital : "Capital unavailable"}
          </p>
        </div>

        <span className="shrink-0 text-xs font-semibold tracking-wide text-slate-400">
          {country.code}
        </span>
      </div>

      <span className="sr-only">
        Result {index + 1}: {country.name}
      </span>
    </li>
  );
}
