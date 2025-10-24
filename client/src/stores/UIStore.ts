import { makeAutoObservable } from 'mobx';
import type { Timeframe } from '../types/candle';
import type { WidgetType } from '../types/widget';

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

  // Widget assignments for each panel
  leftPanelWidget: WidgetType = 'watchlist';
  centerPanelWidget: WidgetType = 'chart';
  rightPanelWidget: WidgetType = 'trends';

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

  /**
   * Set widget for left panel
   */
  setLeftPanelWidget(widgetType: WidgetType) {
    this.leftPanelWidget = widgetType;
  }

  /**
   * Set widget for center panel
   */
  setCenterPanelWidget(widgetType: WidgetType) {
    this.centerPanelWidget = widgetType;
  }

  /**
   * Set widget for right panel
   */
  setRightPanelWidget(widgetType: WidgetType) {
    this.rightPanelWidget = widgetType;
  }
}
