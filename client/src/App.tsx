import { useEffect } from 'react';
import { websocketService } from './services/websocket';
import { Panel } from './components/Panel';
import { ConnectionIndicator } from './components/ConnectionIndicator';
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
          <ConnectionIndicator />
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
          {/* Left Panel - Dynamic Widget */}
          <Panel panelId="left" />

          {/* Center Panel - Dynamic Widget */}
          <Panel panelId="center" />

          {/* Right Panel - Dynamic Widget */}
          <Panel panelId="right" />
        </div>
      </main>
    </div>
  );
}

export default App;
