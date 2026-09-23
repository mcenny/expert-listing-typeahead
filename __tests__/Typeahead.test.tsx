import { act, render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { Typeahead } from '@/components/typeahead/Typeahead';
import { clearCache, setCachedResults } from '@/lib/cache';
import type { CountriesApiResponse } from '@/types/country';

const mockCountries = [
  {
    code: 'NG',
    name: 'Nigeria',
    capital: 'Abuja',
    flag: '🇳🇬',
  },
  {
    code: 'NE',
    name: 'Niger',
    capital: 'Niamey',
    flag: '🇳🇪',
  },
];

function mockResponse(
  payload: CountriesApiResponse,
  init?: ResponseInit,
): Response {
  const status = init?.status ?? 200;

  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

describe('Typeahead', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
    clearCache();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('does not request until the user has typed at least two characters and the debounce completes', async () => {
    const fetchMock = jest.mocked(global.fetch);
    fetchMock.mockResolvedValue(
      mockResponse({ data: mockCountries }) as Response,
    );

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<Typeahead />);

    const input = screen.getByRole('combobox');

    await user.type(input, 'n');

    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(input, 'i');

    expect(fetchMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(299);
    });

    expect(fetchMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it('renders results and selects a country with Enter', async () => {
    const fetchMock = jest.mocked(global.fetch);
    fetchMock.mockResolvedValue(
      mockResponse({ data: mockCountries }) as Response,
    );

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<Typeahead />);

    const input = screen.getByRole('combobox');

    await user.type(input, 'ni');

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(await screen.findByText('Nigeria')).toBeInTheDocument();
    expect(screen.getByText('Niger')).toBeInTheDocument();

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(input).toHaveValue('Niger');
    expect(screen.getByText('Selected country')).toBeInTheDocument();
  });

  it('closes the results with Escape', async () => {
    const fetchMock = jest.mocked(global.fetch);
    fetchMock.mockResolvedValue(
      mockResponse({ data: mockCountries }) as Response,
    );

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<Typeahead />);

    const input = screen.getByRole('combobox');

    await user.type(input, 'ni');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText('Nigeria')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByText('Nigeria')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows an empty state when the API returns no countries', async () => {
    const fetchMock = jest.mocked(global.fetch);
    fetchMock.mockResolvedValue(mockResponse({ data: [] }) as Response);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<Typeahead />);

    await user.type(screen.getByRole('combobox'), 'zz');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText('No countries found.')).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    const fetchMock = jest.mocked(global.fetch);
    fetchMock.mockResolvedValue(
      mockResponse(
        { data: [], error: 'Service unavailable.' },
        { status: 502 },
      ),
    );

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<Typeahead />);

    await user.type(screen.getByRole('combobox'), 'ni');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Service unavailable.',
    );
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
  });

  it('ignores a stale response when a newer request completes first', async () => {
    const fetchMock = jest.mocked(global.fetch);
    let resolveFirst!: (value: Response) => void;
    let resolveSecond!: (value: Response) => void;

    const firstResponse = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });

    const secondResponse = new Promise<Response>((resolve) => {
      resolveSecond = resolve;
    });

    fetchMock
      .mockReturnValueOnce(firstResponse)
      .mockReturnValueOnce(secondResponse);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<Typeahead />);

    const input = screen.getByRole('combobox');

    await user.type(input, 'ni');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await user.clear(input);
    await user.type(input, 'nig');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    await act(async () => {
      resolveSecond(mockResponse({ data: [mockCountries[0]] }));
    });

    expect(await screen.findByText('Nigeria')).toBeInTheDocument();

    await act(async () => {
      resolveFirst(
        mockResponse({
          data: [
            {
              code: 'CA',
              name: 'Canada',
              capital: 'Ottawa',
              flag: '🇨🇦',
            },
          ],
        }),
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByText('Canada')).not.toBeInTheDocument();
    expect(screen.getByText('Nigeria')).toBeInTheDocument();
  });

  it('ignores a stale response when the newer query is cached', async () => {
    const fetchMock = jest.mocked(global.fetch);
    let resolveFirst!: (value: Response) => void;

    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFirst = resolve;
      }),
    );
    setCachedResults('nig', [mockCountries[0]]);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<Typeahead />);

    const input = screen.getByRole('combobox');

    await user.type(input, 'ni');

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await user.clear(input);
    await user.type(input, 'nig');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText('Nigeria')).toBeInTheDocument();

    await act(async () => {
      resolveFirst(
        mockResponse({
          data: [
            {
              code: 'CA',
              name: 'Canada',
              capital: 'Ottawa',
              flag: '🇨🇦',
            },
          ],
        }),
      );
    });

    expect(screen.queryByText('Canada')).not.toBeInTheDocument();
    expect(screen.getByText('Nigeria')).toBeInTheDocument();
  });
});
