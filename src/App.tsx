import { useEffect } from 'react'

/**
 * RaptorGraph - Main Application Component
 * 100% offline, privacy-first DFIR graph analysis tool
 */
function App() {
  useEffect(() => {
    // Ensure dark mode is applied
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <div className="h-screen w-screen bg-dark text-slate-100 flex flex-col overflow-hidden">
      {/* Header Placeholder */}
      <header className="h-16 bg-dark-secondary border-b border-dark flex items-center px-6">
        <h1 className="text-2xl font-bold text-cyber-500">🦖 RaptorGraph</h1>
        <p className="ml-4 text-sm text-slate-400">
          100% Offline DFIR Graph Analysis
        </p>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Placeholder */}
        <aside className="w-60 bg-dark-secondary border-r border-dark">
          <div className="p-4 text-slate-400 text-sm">
            Sidebar (Task 2)
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Welcome to RaptorGraph</h2>
            <p className="text-slate-400 max-w-md">
              Your privacy-first, offline graph analysis tool for DFIR investigations.
              Upload CSV files to begin.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
