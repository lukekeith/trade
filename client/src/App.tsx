import './App.css';

function App() {
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
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Trends</h2>
              <button className="settings-button">⚙️</button>
            </div>
            <p className="panel-content">Trends panel coming soon...</p>
          </div>

          {/* Right Panel - Chart */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Chart</h2>
              <button className="settings-button">⚙️</button>
            </div>
            <p className="panel-content">Chart panel coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
