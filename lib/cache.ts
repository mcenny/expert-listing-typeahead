import type { Country } from "@/types/country";

const cache = new Map<string, Country[]>();

export function getCachedResults(query: string): Country[] | undefined {
  return cache.get(normalizeKey(query));
}

export function setCachedResults(query: string, results: Country[]): void {
  cache.set(normalizeKey(query), results);
}

export function clearCache(): void {
  cache.clear();
}

function normalizeKey(query: string): string {
  return query.trim().toLowerCase();
}
