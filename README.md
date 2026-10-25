# Expert Listing Typeahead

A production-minded country autocomplete built with Next.js, TypeScript, Tailwind CSS, and the REST Countries v5 API.

The app requires a server-side REST Countries API key to search. The key is
never exposed to the browser.

## Features

- 300ms input debouncing
- Minimum two-character search threshold
- Server-side API key handling
- `AbortController` request cancellation
- Request identity checks to prevent stale responses from updating the UI
- In-memory client-side caching
- Loading, empty, error, and retry states
- Mouse selection
- Arrow Up / Arrow Down navigation
- Enter to select
- Escape to close
- Accessible ARIA combobox/listbox semantics
- Responsive UI
- Jest + React Testing Library tests
- Dedicated race-condition test

## Architecture

```text
User input
   |
   v
query state
   |
   v
300ms debounce
   |
   v
client cache lookup
   |-------------------- hit --------------------> results
   |
   miss
   |
   v
/api/countries?q=...
   |
   v
Next.js route handler
   |
   v
REST Countries v5
   |
   v
normalized Country[]
   |
   v
UI
```

The browser never receives the REST Countries API key. The browser calls the
local Next.js route at `/api/countries`, and that route makes the authenticated
request to REST Countries. The route also normalizes the v5 response into the
smaller shape used by the UI, including `capitals[].name`.

## Why both AbortController and request IDs?

Cancellation improves efficiency by attempting to stop obsolete requests.

It is not sufficient as the only correctness mechanism, because a response can already be in flight or otherwise finish around the time cancellation occurs.

Each request therefore receives a monotonically increasing request ID:

```ts
const requestId = ++requestIdRef.current;

if (requestId !== requestIdRef.current) {
  return;
}
```

Only the latest request is allowed to update the UI.

This is also covered by an automated race-condition test.

## Caching

A small in-memory `Map` caches recent query results for the current browser session.

This is intentionally limited in scope. A production marketplace with many users and a much larger search dataset would likely move search closer to the data source and use a server-side cache/CDN strategy, potentially with SWR or React Query on the client when their broader data-fetching features are justified.

## Setup

### 1. Install dependencies

```bash
yarn install
```

### 2. Configure the API key

Copy the example environment file:

```bash
cp .env.example .env.local
```

Then add your REST Countries API key:

```env
REST_COUNTRIES_API_KEY=your_key_here
```

Do not use `NEXT_PUBLIC_` for this secret.

### 3. Run locally

```bash
yarn dev
```

Open:

```text
http://localhost:3000
```

## Validation

Run the test suite:

```bash
yarn test
```

The tests cover the two-character threshold and 300ms debounce, result
rendering, Enter selection, Escape closing, empty and error states, and
out-of-order responses. They also cover the case where an older request
resolves after a newer cached query.

Run lint:

```bash
yarn lint
```

Create a production build:

```bash
yarn build
```

## Troubleshooting

### Search returns an API key error

Confirm that `.env.local` exists and contains:

```env
REST_COUNTRIES_API_KEY=your_key_here
```

Restart the development server after changing environment variables. Keep the
key server-side and do not prefix it with `NEXT_PUBLIC_`.

### Search returns an upstream error

The local route forwards REST Countries authentication, quota, and service
errors to the UI. Check the server terminal for the upstream response and
confirm that the API key is active and has available quota.

## Deployment

The project can be deployed to Vercel.

Add the following environment variable in the Vercel project settings:

```text
REST_COUNTRIES_API_KEY
```

Then deploy normally.

