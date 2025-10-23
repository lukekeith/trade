import { makeAutoObservable, runInAction } from 'mobx';
import { websocketService } from '../services/websocket';

export class SymbolStore {
  symbols: string[] = [];
  selectedSymbol: string | null = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchSymbols() {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch('http://localhost:3000/api/symbols');
      if (!response.ok) throw new Error('Failed to fetch symbols');

      const data = await response.json();
      runInAction(() => {
        this.symbols = data.symbols || [];
        if (!this.selectedSymbol && this.symbols.length > 0) {
          this.selectedSymbol = this.symbols[0];
        }
        this.isLoading = false;
      });

      // Subscribe to symbols via WebSocket
      if (websocketService.isConnected()) {
        websocketService.subscribeToSymbols(this.symbols);
      }
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.isLoading = false;
      });
    }
  }

  async addSymbol(symbol: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch('http://localhost:3000/api/symbols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.toUpperCase() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add symbol');
      }

      const data = await response.json();
      runInAction(() => {
        this.symbols = data.symbols || [];
        this.isLoading = false;
      });

      // Subscribe to new symbol
      if (websocketService.isConnected()) {
        websocketService.subscribeToSymbols([symbol.toUpperCase()]);
      }

      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.isLoading = false;
      });
      return false;
    }
  }

  async removeSymbol(symbol: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch(`http://localhost:3000/api/symbols/${symbol}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove symbol');

      const data = await response.json();
      runInAction(() => {
        this.symbols = data.symbols || [];
        if (this.selectedSymbol === symbol && this.symbols.length > 0) {
          this.selectedSymbol = this.symbols[0];
        }
        this.isLoading = false;
      });

      // Unsubscribe from removed symbol
      if (websocketService.isConnected()) {
        websocketService.unsubscribeFromSymbols([symbol]);
      }

      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.isLoading = false;
      });
      return false;
    }
  }

  selectSymbol(symbol: string) {
    this.selectedSymbol = symbol;
  }

  clearError() {
    this.error = null;
  }
}

export const symbolStore = new SymbolStore();
