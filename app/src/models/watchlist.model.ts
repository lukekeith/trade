import pool from '../config/database';
import { Watchlist } from '../types';

export class WatchlistModel {
  /**
   * Get watchlist for a user (or default for unauthenticated)
   */
  static async findByUserId(userId: number | null = null): Promise<Watchlist | null> {
    const query = `
      SELECT * FROM watchlists
      WHERE user_id IS NULL
      LIMIT 1
    `;

    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  /**
   * Get all symbols from watchlist
   */
  static async getSymbols(userId: number | null = null): Promise<string[]> {
    const watchlist = await this.findByUserId(userId);
    return watchlist?.symbols || [];
  }

  /**
   * Add a symbol to the watchlist
   */
  static async addSymbol(symbol: string, userId: number | null = null): Promise<Watchlist> {
    // First, get current watchlist
    const current = await this.findByUserId(userId);

    if (current) {
      // Check if symbol already exists
      if (current.symbols.includes(symbol.toUpperCase())) {
        return current;
      }

      // Add symbol to existing watchlist
      const query = `
        UPDATE watchlists
        SET symbols = array_append(symbols, $1),
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [symbol.toUpperCase(), current.id]);
      return result.rows[0];
    } else {
      // Create new watchlist
      const query = `
        INSERT INTO watchlists (user_id, symbols)
        VALUES ($1, $2)
        RETURNING *
      `;

      const result = await pool.query(query, [userId, [symbol.toUpperCase()]]);
      return result.rows[0];
    }
  }

  /**
   * Remove a symbol from the watchlist
   */
  static async removeSymbol(symbol: string, userId: number | null = null): Promise<Watchlist | null> {
    const query = `
      UPDATE watchlists
      SET symbols = array_remove(symbols, $1),
          updated_at = NOW()
      WHERE user_id IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, [symbol.toUpperCase()]);
    return result.rows[0] || null;
  }

  /**
   * Update symbol at specific position (for editing)
   */
  static async updateSymbol(
    oldSymbol: string,
    newSymbol: string,
    userId: number | null = null
  ): Promise<Watchlist | null> {
    const current = await this.findByUserId(userId);

    if (!current) return null;

    const index = current.symbols.indexOf(oldSymbol.toUpperCase());
    if (index === -1) return null;

    // Replace the symbol at the specific index
    const newSymbols = [...current.symbols];
    newSymbols[index] = newSymbol.toUpperCase();

    const query = `
      UPDATE watchlists
      SET symbols = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [newSymbols, current.id]);
    return result.rows[0];
  }

  /**
   * Set entire symbols array (replaces all symbols)
   */
  static async setSymbols(symbols: string[], userId: number | null = null): Promise<Watchlist> {
    const current = await this.findByUserId(userId);

    const upperSymbols = symbols.map(s => s.toUpperCase());

    if (current) {
      const query = `
        UPDATE watchlists
        SET symbols = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [upperSymbols, current.id]);
      return result.rows[0];
    } else {
      const query = `
        INSERT INTO watchlists (user_id, symbols)
        VALUES ($1, $2)
        RETURNING *
      `;

      const result = await pool.query(query, [userId, upperSymbols]);
      return result.rows[0];
    }
  }
}
