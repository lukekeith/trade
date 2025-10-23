import { makeAutoObservable } from 'mobx';
import type { Timeframe } from '../types/candle';

/**
 * UI Store - manages UI state
 * Following proper MobX pattern: Application.ui
 */
export class UIStore {
  // Current timeframe selection
  selectedTimeframe: Timeframe = '1d';

  // Panel states
  showAddSymbolInput = false;

  // Connection status
  isConnected = false;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Set selected timeframe
   */
  setTimeframe(timeframe: Timeframe) {
    this.selectedTimeframe = timeframe;
  }

  /**
   * Toggle add symbol input
   */
  setShowAddSymbolInput(show: boolean) {
    this.showAddSymbolInput = show;
  }

  /**
   * Set connection status
   */
  setConnected(connected: boolean) {
    this.isConnected = connected;
  }
}
