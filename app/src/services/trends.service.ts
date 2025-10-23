/**
 * Trends Service - Polls Python for trend calculations and broadcasts via WebSocket
 */
export class TrendsService {
  private interval: NodeJS.Timeout | null = null;
  private pythonServiceUrl: string;
  private broadcastCallback: ((data: any) => void) | null = null;

  constructor(pythonServiceUrl: string = 'http://localhost:8000') {
    this.pythonServiceUrl = pythonServiceUrl;
  }

  /**
   * Start polling Python service for trends
   */
  start(intervalMs: number = 60000, broadcastFn: (data: any) => void) {
    this.broadcastCallback = broadcastFn;

    // Fetch immediately on start
    this.fetchAndBroadcastTrends();

    // Then poll every intervalMs
    this.interval = setInterval(() => {
      this.fetchAndBroadcastTrends();
    }, intervalMs);

    console.log(`✅ Trends service started (polling every ${intervalMs / 1000}s)`);
  }

  /**
   * Stop polling
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('⏹️  Trends service stopped');
    }
  }

  /**
   * Fetch trends from Python and broadcast via WebSocket
   */
  private async fetchAndBroadcastTrends() {
    try {
      const response = await fetch(`${this.pythonServiceUrl}/trends`);

      if (!response.ok) {
        throw new Error(`Python service returned ${response.status}`);
      }

      const trendsData: any = await response.json();

      // Broadcast to all connected clients
      if (this.broadcastCallback) {
        this.broadcastCallback(trendsData);
      }

      console.log(`📊 Fetched trends for ${Object.keys(trendsData.trends || {}).length} symbols from Python`);

    } catch (error) {
      console.error('❌ Error fetching trends from Python:', error);
    }
  }

  /**
   * Manually trigger a trend fetch (useful for testing or on-demand updates)
   */
  async fetchNow() {
    await this.fetchAndBroadcastTrends();
  }
}
