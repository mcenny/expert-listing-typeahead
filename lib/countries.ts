import type { Country } from '@/types/country';

const API_BASE_URL = 'https://api.restcountries.com/countries/v5';
const DEFAULT_LIMIT = 10;

interface RestCountriesRecord {
  names?: {
    common?: string;
  };
  codes?: {
    alpha_2?: string;
  };
  capitals?: Array<{
    name?: string;
  }>;
  capital?: string[];
  flag?: {
    emoji?: string;
  };
}

interface RestCountriesResponse {
  data?: {
    objects?: RestCountriesRecord[];
  };
  errors?: Array<{
    message?: string;
  }>;
}

export async function searchCountries(
  query: string,
  signal?: AbortSignal,
): Promise<Country[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const params = new URLSearchParams({
    q: normalizedQuery,
    limit: String(DEFAULT_LIMIT),
    response_fields: 'names.common,codes.alpha_2,capitals.name,flag.emoji',
  });

  const response = await fetch(`${API_BASE_URL}/name?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      Accept: 'application/json',
    },
    signal,
    cache: 'no-store',
  });

  const payload = (await response.json()) as RestCountriesResponse;

  if (!response.ok) {
    const message =
      payload.errors?.[0]?.message ?? 'Unable to search countries.';
    throw new Error(message);
  }

  return (payload.data?.objects ?? [])
    .map(normalizeCountry)
    .filter((country): country is Country => country !== null);
}

function normalizeCountry(record: RestCountriesRecord): Country | null {
  const name = record.names?.common?.trim();
  const code = record.codes?.alpha_2?.trim().toUpperCase();

  if (!name || !code) {
    return null;
  }

  return {
    code,
    name,
    capital: record.capitals?.[0]?.name ?? record.capital?.[0] ?? null,
    flag: record.flag?.emoji ?? '🌐',
  };
}

function getApiKey(): string {
  const key = process.env.REST_COUNTRIES_API_KEY;

  if (!key) {
    throw new Error('REST_COUNTRIES_API_KEY is not configured on the server.');
  }

  return key;
}
