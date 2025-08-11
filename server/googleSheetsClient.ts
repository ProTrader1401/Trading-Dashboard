/**
 * Enhanced Google Sheets Client for Trading Dashboard
 * Provides robust, performant integration with Google Sheets API
 */

export interface GoogleSheetsResponse {
  success: boolean;
  results?: {
    trades: number;
    strategies: number;
    psychology: number;
  };
  error?: string;
  timestamp: string;
}

export interface ConnectionTestResponse {
  success: boolean;
  message?: string;
  spreadsheetName?: string;
  sheets?: Array<{
    name: string;
    rows: number;
    columns: number;
  }>;
  error?: string;
  timestamp: string;
}

export class GoogleSheetsClient {
  public scriptUrl: string | null = null;
  private retryAttempts = 0; // No retries for ultra-fast response
  private retryDelay = 100; // Ultra-fast 100ms delay

  constructor(scriptUrl?: string) {
    this.scriptUrl = scriptUrl || null;
  }

  setScriptUrl(url: string) {
    this.scriptUrl = url;
  }

  /**
   * Test connection to Google Sheets
   */
  async testConnection(sheetId?: string): Promise<ConnectionTestResponse> {
    if (!this.scriptUrl) {
      return {
        success: false,
        error: 'Google Script URL not configured',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await this.makeRequest('test', { sheetId });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Sync data to Google Sheets with proper field mapping and P&L calculations
   */
  async syncData(data: {
    trades?: any[];
    strategies?: any[];
    psychologyEntries?: any[];
  }): Promise<GoogleSheetsResponse> {
    if (!this.scriptUrl) {
      console.warn('Google Sheets sync skipped: Script URL not configured');
      return {
        success: false,
        error: 'Script URL not configured',
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Transform and validate data before syncing
      const transformedData: any = {};
      
      if (data.trades && data.trades.length > 0) {
        transformedData.trades = data.trades.map(trade => ({
          ...trade,
          // Ensure P&L is calculated correctly
          profitLoss: trade.exitPrice && trade.entryPrice ? 
            ((parseFloat(trade.exitPrice) - parseFloat(trade.entryPrice)) * trade.quantity).toString() :
            trade.profitLoss || '0',
          // Ensure all required fields are present
          stockName: trade.stockName || '',
          whichSetup: trade.whichSetup || null,
          emotion: trade.emotion || null,
          notes: trade.notes || null,
          psychologyReflections: trade.psychologyReflections || null,
          screenshotLink: trade.screenshotLink || null,
        }));
      }
      
      if (data.strategies) {
        transformedData.strategies = data.strategies;
      }
      
      if (data.psychologyEntries) {
        transformedData.psychologyEntries = data.psychologyEntries;
      }

      const response = await this.makeRequestWithRetry({
        action: 'sync',
        ...transformedData
      });

      return response;
    } catch (error) {
      console.error('Failed to sync data to Google Sheets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Create backup in Google Sheets
   */
  async createBackup(): Promise<GoogleSheetsResponse> {
    if (!this.scriptUrl) {
      return {
        success: false,
        error: 'Script URL not configured',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await this.makeRequest({
        action: 'backup'
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Make HTTP request to Google Apps Script with retry logic
   */
  private async makeRequestWithRetry(data: any): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.makeRequest(data);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.warn(`Sync attempt ${attempt} failed, retrying in ${delay}ms:`, error);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Make HTTP request to Google Apps Script
   */
  public async makeRequest(action: string, data: any, sheetId?: string): Promise<any> {
    if (!this.scriptUrl) {
      throw new Error('Script URL not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Ultra-fast 5 second timeout

    try {
      const requestBody = {
        action,
        data: { ...data, sheetId: sheetId || data?.sheetId },
        sheetId: sheetId || data?.sheetId,
      };

      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - Google Sheets took too long to respond');
      }
      
      throw error;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate Google Apps Script URL format
   */
  static isValidScriptUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return (
        parsedUrl.hostname === 'script.google.com' &&
        parsedUrl.pathname.includes('/macros/s/') &&
        parsedUrl.pathname.endsWith('/exec')
      );
    } catch {
      return false;
    }
  }

  /**
   * Validate Google Sheets ID format
   */
  static isValidSheetId(id: string): boolean {
    // Google Sheets IDs are typically 44 characters long and contain letters, numbers, hyphens, and underscores
    const sheetIdRegex = /^[a-zA-Z0-9-_]{44}$/;
    return sheetIdRegex.test(id);
  }
}

// Global instance for use throughout the application  
export const googleSheetsClient = new GoogleSheetsClient();