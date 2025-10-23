import { useEffect } from 'react';
import './App.css';

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex flex-col h-screen">
        {/* Top Navigation */}
        <header className="border-b border-border px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <button className="text-sm font-medium text-primary">Dashboard</button>
              <button className="text-sm font-medium text-muted-foreground">Strategies</button>
              <button className="text-sm font-medium text-muted-foreground">Trades</button>
            </div>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-medium">U</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 overflow-hidden">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Left Panel - Trends */}
            <div className="border border-border rounded-lg bg-card p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Trends</h2>
                <button className="text-muted-foreground hover:text-foreground">
                  ⚙️
                </button>
              </div>
              <p className="text-muted-foreground text-sm">Trends panel coming soon...</p>
            </div>

            {/* Right Panel - Chart */}
            <div className="border border-border rounded-lg bg-card p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Chart</h2>
                <button className="text-muted-foreground hover:text-foreground">
                  ⚙️
                </button>
              </div>
              <p className="text-muted-foreground text-sm">Chart panel coming soon...</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
