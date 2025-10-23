import { useEffect } from 'react';
import { websocketService } from './services/websocket';
import { TrendsPanel } from './components/TrendsPanel';
import { ChartPanel } from './components/ChartPanel';
import './App.scss';

function App() {
  useEffect(() => {
    // Connect to WebSocket on mount
    console.log('🚀 Connecting to WebSocket...');
    websocketService.connect();

    // Cleanup on unmount
    return () => {
      console.log('👋 Disconnecting from WebSocket...');
      websocketService.disconnect();
    };
  }, []);

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <header className="header">
        <div className="nav-container">
          <div className="nav-tabs">
            <button className="nav-button nav-button-active">Dashboard</button>
            <button className="nav-button nav-button-inactive">Strategies</button>
            <button className="nav-button nav-button-inactive">Trades</button>
          </div>
          <div className="avatar">
            <span>U</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="panels-grid">
          {/* Left Panel - Trends */}
          <TrendsPanel />

          {/* Right Panel - Chart */}
          <ChartPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
