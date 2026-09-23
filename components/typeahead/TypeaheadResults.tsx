import type { Country } from "@/types/country";
import { TypeaheadItem } from "./TypeaheadItem";

interface TypeaheadResultsProps {
  countries: Country[];
  activeIndex: number;
  listboxId: string;
  onSelect: (country: Country) => void;
  onHover: (index: number) => void;
}

export function TypeaheadResults({
  countries,
  activeIndex,
  listboxId,
  onSelect,
  onHover,
}: TypeaheadResultsProps) {
  return (
    <ul
      id={listboxId}
      role="listbox"
      aria-label="Country results"
      className="max-h-80 overflow-y-auto py-2"
    >
      {countries.map((country, index) => (
        <TypeaheadItem
          key={country.code}
          country={country}
          index={index}
          isActive={index === activeIndex}
          onSelect={onSelect}
          onMouseEnter={() => onHover(index)}
        />
      ))}
    </ul>
  );
}
