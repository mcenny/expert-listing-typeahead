'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getCachedResults, setCachedResults } from '@/lib/cache';
import type { Country, CountriesApiResponse } from '@/types/country';
import { TypeaheadInput } from './TypeaheadInput';
import { TypeaheadResults } from './TypeaheadResults';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

export function Typeahead() {
  const inputId = useId();
  const listboxId = useId();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Country[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchCountries = useCallback(async (searchQuery: string) => {
    const normalizedQuery = searchQuery.trim();

    await Promise.resolve();

    controllerRef.current?.abort();
    const requestId = ++requestIdRef.current;

    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      setActiveIndex(-1);
      return;
    }

    const cached = getCachedResults(normalizedQuery);

    if (cached) {
      setResults(cached);
      setError(null);
      setIsLoading(false);
      setActiveIndex(cached.length > 0 ? 0 : -1);
      setIsOpen(true);
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setIsOpen(true);
    setActiveIndex(-1);

    void fetch(`/api/countries?q=${encodeURIComponent(normalizedQuery)}`, {
      signal: controller.signal,
    })
      .then(async (response) => ({
        response,
        payload: (await response.json()) as CountriesApiResponse,
      }))
      .then(({ response, payload }) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (!response.ok) {
          setResults([]);
          setActiveIndex(-1);
          setError(payload.error ?? 'Unable to search countries.');
          setIsLoading(false);
          return;
        }

        setCachedResults(normalizedQuery, payload.data);
        setResults(payload.data);
        setActiveIndex(payload.data.length > 0 ? 0 : -1);
        setError(null);
        setIsLoading(false);
      })
      .catch((requestError) => {
        if (controller.signal.aborted) {
          return;
        }

        if (requestId !== requestIdRef.current) {
          return;
        }

        setResults([]);
        setActiveIndex(-1);
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to search countries.',
        );
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let isActive = true;

    void Promise.resolve().then(() => {
      if (isActive) {
        void fetchCountries(debouncedQuery);
      }
    });

    return () => {
      isActive = false;
    };
  }, [debouncedQuery, fetchCountries]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      requestIdRef.current += 1;
    };
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedCountry(null);
    setError(null);
    setActiveIndex(-1);

    if (value.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }

  function handleSelect(country: Country) {
    controllerRef.current?.abort();
    setQuery(country.name);
    setSelectedCountry(country);
    setResults([]);
    setActiveIndex(-1);
    setIsOpen(false);
    setIsLoading(false);
    setError(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && event.key !== 'Escape') {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (results.length > 0) {
          setActiveIndex((current) =>
            current < results.length - 1 ? current + 1 : 0,
          );
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (results.length > 0) {
          setActiveIndex((current) =>
            current > 0 ? current - 1 : results.length - 1,
          );
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          handleSelect(results[activeIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  const activeDescendant =
    activeIndex >= 0 && results[activeIndex]
      ? `country-option-${results[activeIndex].code}`
      : undefined;

  const showDropdown =
    isOpen &&
    query.trim().length >= MIN_QUERY_LENGTH &&
    (isLoading ||
      error !== null ||
      results.length > 0 ||
      debouncedQuery === query.trim());

  return (
    <div className='relative w-full max-w-xl'>
      <TypeaheadInput
        inputId={inputId}
        value={query}
        placeholder='Search countries...'
        isOpen={showDropdown}
        activeDescendant={activeDescendant}
        listboxId={listboxId}
        onChange={handleQueryChange}
        onFocus={() => {
          if (query.trim().length >= MIN_QUERY_LENGTH) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
      />

      {showDropdown && (
        <div className='absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10'>
          {isLoading && (
            <div
              role='status'
              aria-live='polite'
              className='flex items-center gap-3 px-4 py-4 text-sm text-slate-600'
            >
              <span
                aria-hidden='true'
                className='h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900'
              />
              Searching countries...
            </div>
          )}

          {!isLoading && error && (
            <div className='px-4 py-4'>
              <p role='alert' className='text-sm text-red-600'>
                {error}
              </p>

              <button
                type='button'
                className='mt-3 text-sm font-semibold text-slate-900 underline underline-offset-4 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900'
                onClick={() => void fetchCountries(query)}
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
            <TypeaheadResults
              countries={results}
              activeIndex={activeIndex}
              listboxId={listboxId}
              onSelect={handleSelect}
              onHover={setActiveIndex}
            />
          )}

          {!isLoading &&
            !error &&
            results.length === 0 &&
            debouncedQuery === query.trim() && (
              <p className='px-4 py-4 text-sm text-slate-500'>
                No countries found.
              </p>
            )}
        </div>
      )}

      {selectedCountry && (
        <div
          role='status'
          aria-live='polite'
          className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4'
        >
          <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
            Selected country
          </p>
          <div className='mt-2 flex items-center gap-3'>
            <span className='text-2xl' aria-hidden='true'>
              {selectedCountry.flag}
            </span>
            <div>
              <p className='font-semibold text-slate-900'>
                {selectedCountry.name}
              </p>
              <p className='text-sm text-slate-500'>
                {selectedCountry.capital ?? 'Capital unavailable'} ·{' '}
                {selectedCountry.code}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
