import { Trade, Strategy, PsychologyEntry } from "@shared/schema";

export class GoogleSheetsAPI {
  private scriptUrl: string;
  private sheetId: string;

  constructor(scriptUrl: string, sheetId: string) {
    this.scriptUrl = scriptUrl;
    this.sheetId = sheetId;
  }

  private async makeRequest(action: string, data?: any) {
    try {
      // In production (static build), use JSONP to avoid CORS issues
      // In development, route through backend to avoid CORS issues
      const isProduction = import.meta.env.PROD;
      
      if (isProduction) {
        // Use JSONP for production to avoid CORS issues
        return new Promise((resolve, reject) => {
          const callbackName = `jsonp_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Create callback function
          (window as any)[callbackName] = (result: any) => {
            delete (window as any)[callbackName];
            document.body.removeChild(script);
            
            if (result.error) {
              reject(new Error(result.error));
            } else {
              resolve(result.data || result);
            }
          };
          
          // Create script element for JSONP
          const script = document.createElement('script');
          const params = new URLSearchParams({
            action,
            data: JSON.stringify(data),
            sheetId: this.sheetId,
            callback: callbackName
          });
          
          script.src = `${this.scriptUrl}?${params.toString()}`;
          script.onerror = () => {
            delete (window as any)[callbackName];
            document.body.removeChild(script);
            reject(new Error('JSONP request failed'));
          };
          
          document.body.appendChild(script);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            if ((window as any)[callbackName]) {
              delete (window as any)[callbackName];
              if (document.body.contains(script)) {
                document.body.removeChild(script);
              }
              reject(new Error('Request timeout'));
            }
          }, 30000);
        });
      } else {
        // Development mode - route through backend
        const response = await fetch("/api/google-sheets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            data: { ...data, sheetId: this.sheetId },
            sheetId: this.sheetId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.error) {
          throw new Error(result.error);
        }

        return result.data || result;
      }
    } catch (error) {
      console.error("Google Sheets API error:", error);
      throw error;
    }
  }

  // Trades
  async getTrades(): Promise<Trade[]> {
    try {
      const result = await this.makeRequest("getTrades");
      console.log('Raw Google Sheets response for getTrades:', result);
      
      // Handle different response formats
      let trades = result.data || result;
      
      // Ensure it's an array
      if (!Array.isArray(trades)) {
        console.warn('Expected array but got:', typeof trades, trades);
        return [];
      }
      
      // Transform data to ensure proper field mapping
      return trades.map(trade => ({
        ...trade,
        // Ensure boolean fields are properly converted
        isTradeTaken: trade.isTradeTaken === true || trade.isTradeTaken === 'Yes' || trade.setupFollowed === true,
        setupFollowed: trade.setupFollowed === true || trade.isTradeTaken === true || trade.isTradeTaken === 'Yes',
        // Ensure numeric fields are properly converted
        quantity: typeof trade.quantity === 'string' ? parseInt(trade.quantity) : trade.quantity,
        // Ensure string fields are not null
        entryPrice: trade.entryPrice?.toString() || '0',
        exitPrice: trade.exitPrice?.toString() || null,
        profitLoss: trade.profitLoss?.toString() || '0',
      }));
    } catch (error) {
      console.error('Error fetching trades from Google Sheets:', error);
      throw error;
    }
  }

  async addTrade(trade: Omit<Trade, "id" | "createdAt">): Promise<Trade> {
    try {
      console.log('Adding trade to Google Sheets:', trade);
      const result = await this.makeRequest("addTrade", trade);
      console.log('Add trade response:', result);
      return result.data || result;
    } catch (error) {
      console.error('Error adding trade to Google Sheets:', error);
      throw error;
    }
  }

  async updateTrade(id: number, trade: Partial<Trade>): Promise<Trade> {
    const result = await this.makeRequest("updateTrade", { id, ...trade });
    return result.data || result;
  }

  async deleteTrade(id: number): Promise<void> {
    const result = await this.makeRequest("deleteTrade", { id });
    return result.data || result;
  }

  async getTradesByDate(date: string): Promise<Trade[]> {
    const result = await this.makeRequest("getTradesByDate", { date });
    return result.data || result;
  }

  // Strategies
  async getStrategies(): Promise<Strategy[]> {
    const result = await this.makeRequest("getStrategies");
    return result.data || result;
  }

  async addStrategy(strategy: Omit<Strategy, "id" | "createdAt">): Promise<Strategy> {
    const result = await this.makeRequest("addStrategy", strategy);
    return result.data || result;
  }

  async updateStrategy(id: number, strategy: Partial<Strategy>): Promise<Strategy> {
    const result = await this.makeRequest("updateStrategy", { id, ...strategy });
    return result.data || result;
  }

  async deleteStrategy(id: number): Promise<void> {
    const result = await this.makeRequest("deleteStrategy", { id });
    return result.data || result;
  }

  // Psychology Entries
  async getPsychologyEntries(): Promise<PsychologyEntry[]> {
    const result = await this.makeRequest("getPsychologyEntries");
    return result.data || result;
  }

  async addPsychologyEntry(entry: Omit<PsychologyEntry, "id" | "createdAt">): Promise<PsychologyEntry> {
    const result = await this.makeRequest("addPsychologyEntry", entry);
    return result.data || result;
  }

  async updatePsychologyEntry(id: number, entry: Partial<PsychologyEntry>): Promise<PsychologyEntry> {
    const result = await this.makeRequest("updatePsychologyEntry", { id, ...entry });
    return result.data || result;
  }

  async deletePsychologyEntry(id: number): Promise<void> {
    const result = await this.makeRequest("deletePsychologyEntry", { id });
    return result.data || result;
  }
}
