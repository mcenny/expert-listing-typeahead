import { Typeahead } from '@/components/typeahead/Typeahead';

export default function Home() {
  return (
    <main className='min-h-screen bg-slate-50'>
      <section className='mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-16'>
        <div className='w-full max-w-2xl text-center'>
          <p className='text-sm font-semibold uppercase tracking-[0.2em] text-slate-500'>
            Expert Listing · Frontend Exercise
          </p>

          <h1 className='mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl'>
            Country typeahead
          </h1>

          <p className='mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg'>
            A production-minded autocomplete with debouncing, request
            cancellation, stale-response protection, caching, keyboard
            navigation, and accessible combobox semantics.
          </p>
        </div>

        <div className='mt-10 w-full max-w-xl'>
          <Typeahead />
        </div>

        <div className='mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-center text-sm text-slate-500'>
          <span>↑ ↓ Navigate</span>
          <span>Enter Select</span>
          <span>Esc Close</span>
        </div>
      </section>
    </main>
  );
}
