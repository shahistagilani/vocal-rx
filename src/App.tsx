import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

function App() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-orange-50 via-rose-50 to-amber-50 text-slate-900 relative overflow-hidden">
      <section className="container mx-auto px-6 pt-20 pb-40 text-center">
        <h1 className="mx-auto max-w-5xl font-bold text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter leading-none text-slate-900 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
          Vocal RX
        </h1>
        <p className="mx-auto mt-8 max-w-3xl text-xl sm:text-2xl md:text-3xl font-medium leading-relaxed text-slate-700">
          Healing begins with a <span className="text-orange-600 font-semibold">conversation</span>, 
          turning <span className="text-blue-600 font-semibold">voices</span> into <span className="text-emerald-600 font-semibold">care</span>.
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-500 font-light">
          Dictate a prescription. We structure it instantly. Edit and export in seconds.
        </p>
      </section>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Start dictation"
              className="fixed left-1/2 -translate-x-1/2 bottom-10 h-16 w-16 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg focus-visible:ring-4 focus-visible:ring-orange-300"
              variant="default"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7"
              >
                <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z" />
                <path d="M19 11a1 1 0 1 0-2 0 5 5 0 1 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.08A7 7 0 0 0 19 11Z" />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Start dictating</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </main>
  )
}

export default App
