import { 
  type Trade, 
  type InsertTrade,
  type Strategy,
  type InsertStrategy,
  type PsychologyEntry,
  type InsertPsychologyEntry,
  type Settings,
  type InsertSettings
} from "@shared/schema";
import { promises as fs } from 'fs';
import path from 'path';

export interface IStorage {
  // Trades
  getTrades(): Promise<Trade[]>;
  getTradeById(id: number): Promise<Trade | undefined>;
  getTradesByDate(date: string): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, trade: Partial<InsertTrade>): Promise<Trade | undefined>;
  deleteTrade(id: number): Promise<boolean>;

  // Strategies
  getStrategies(): Promise<Strategy[]>;
  getStrategyById(id: number): Promise<Strategy | undefined>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: number, strategy: Partial<InsertStrategy>): Promise<Strategy | undefined>;
  deleteStrategy(id: number): Promise<boolean>;

  // Psychology Entries
  getPsychologyEntries(): Promise<PsychologyEntry[]>;
  getPsychologyEntryById(id: number): Promise<PsychologyEntry | undefined>;
  createPsychologyEntry(entry: InsertPsychologyEntry): Promise<PsychologyEntry>;
  updatePsychologyEntry(id: number, entry: Partial<InsertPsychologyEntry>): Promise<PsychologyEntry | undefined>;

  // Settings
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
}

// Google Sheets based storage implementation
export class GoogleSheetsStorage implements IStorage {
  private trades: Map<number, Trade>;
  private strategies: Map<number, Strategy>;
  private psychologyEntries: Map<number, PsychologyEntry>;
  private settings: Settings | undefined;
  private currentTradeId: number;
  private currentStrategyId: number;
  private currentPsychologyId: number;
  private settingsPath: string;

  constructor() {
    this.trades = new Map();
    this.strategies = new Map();
    this.psychologyEntries = new Map();
    this.settings = undefined;
    this.currentTradeId = 1;
    this.currentStrategyId = 1;
    this.currentPsychologyId = 1;
    this.settingsPath = path.join(process.cwd(), 'data', 'settings.json');

    // Only load demo data in development, NOT in production
    if (process.env.NODE_ENV === 'development' && !process.env.DISABLE_DEMO_DATA) {
      this.initializeDemoData();
    }
    this.loadSettings();
  }

  private async loadSettings() {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      const settingsData = JSON.parse(data);
      this.settings = {
        ...settingsData,
        updatedAt: new Date(settingsData.updatedAt)
      };
      console.log('Settings loaded successfully:', { 
        hasScriptUrl: !!this.settings?.googleScriptUrl, 
        hasSheetId: !!this.settings?.googleSheetId 
      });
    } catch (error) {
      console.log('No saved settings found, using defaults');
      this.settings = {
        id: 1,
        googleSheetId: null,
        googleScriptUrl: null,
        updatedAt: new Date(),
      };
    }
  }

  private async saveSettings() {
    if (!this.settings) return;
    
    try {
      await fs.mkdir(path.dirname(this.settingsPath), { recursive: true });
      await fs.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2));
      console.log('Settings saved successfully');
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }

  private initializeDemoData() {
    // Demo trades
    const demoTrades: InsertTrade[] = [
      {
        tradeDate: "2024-01-15",
        stockName: "RELIANCE",
        quantity: 100,
        entryPrice: "2450.50",
        exitPrice: "2475.25",
        stopLoss: "2420.00",
        targetPrice: "2500.00",
        profitLoss: "2475",
        setupFollowed: true,
        whichSetup: "Breakout Momentum",
        emotion: "Confident",
        notes: "Clean breakout above resistance",
        psychologyReflections: "Stayed disciplined with the plan",
        screenshotLink: null,
      },
      {
        tradeDate: "2024-01-15",
        stockName: "TCS",
        quantity: 50,
        entryPrice: "3580.00",
        exitPrice: "3562.50",
        stopLoss: "3550.00",
        targetPrice: "3620.00",
        profitLoss: "-875",
        setupFollowed: true,
        whichSetup: "Mean Reversion",
        emotion: "Neutral",
        notes: "Setup failed, hit stop loss",
        psychologyReflections: "Good risk management",
        screenshotLink: null,
      },
      {
        tradeDate: "2024-01-16",
        stockName: "INFY",
        quantity: 75,
        entryPrice: "1523.20",
        exitPrice: "1547.80",
        stopLoss: "1510.00",
        targetPrice: "1560.00",
        profitLoss: "1845",
        setupFollowed: true,
        whichSetup: "Gap & Go",
        emotion: "Excited",
        notes: "Perfect gap up setup",
        psychologyReflections: "Managed emotions well",
        screenshotLink: null,
      },
    ];

    demoTrades.forEach(trade => {
      this.createTrade(trade);
    });

    // Demo strategies
    const demoStrategies: InsertStrategy[] = [
      {
        name: "Breakout Momentum",
        description: "Trading stocks breaking above key resistance levels with high volume",
        status: "active",
        tags: ["momentum", "breakout"],
        screenshotUrl: null,
      },
      {
        name: "Mean Reversion",
        description: "Trading oversold stocks in strong uptrends",
        status: "testing",
        tags: ["reversion", "support"],
        screenshotUrl: null,
      },
      {
        name: "Gap & Go",
        description: "Trading gap ups with strong pre-market volume",
        status: "active",
        tags: ["gap", "momentum"],
        screenshotUrl: null,
      },
    ];

    demoStrategies.forEach(strategy => {
      this.createStrategy(strategy);
    });

    // Default settings
    this.settings = {
      id: 1,
      googleSheetId: null,
      googleScriptUrl: null,
      updatedAt: new Date(),
    };
  }

  // Sync data with Google Sheets (optimized for performance)
  private async syncToGoogleSheets() {
    if (!this.settings?.googleScriptUrl) return;

    try {
      // Prepare data with proper field mapping
      const data = {
        action: 'sync',
        trades: Array.from(this.trades.values()).map(trade => ({
          ...trade,
          // Ensure all fields are included for complete data sync
          tradeDate: trade.tradeDate,
          stockName: trade.stockName,
          quantity: trade.quantity,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice || '',
          stopLoss: trade.stopLoss || '',
          targetPrice: trade.targetPrice || '',
          profitLoss: trade.profitLoss || '',
          setupFollowed: trade.setupFollowed,
          whichSetup: trade.whichSetup || '',
          emotion: trade.emotion || '',
          notes: trade.notes || '',
          psychologyReflections: trade.psychologyReflections || '',
          screenshotLink: trade.screenshotLink || '',
          id: trade.id,
          createdAt: trade.createdAt
        })),
        strategies: Array.from(this.strategies.values()).map(strategy => ({
          ...strategy,
          // Ensure all strategy fields are included
          name: strategy.name,
          description: strategy.description,
          status: strategy.status,
          tags: strategy.tags,
          screenshotUrl: strategy.screenshotUrl || '',
          id: strategy.id,
          createdAt: strategy.createdAt
        })),
        psychologyEntries: Array.from(this.psychologyEntries.values()).map(entry => ({
          ...entry,
          // Ensure all psychology fields are included
          month: entry.month,
          year: entry.year,
          monthlyPnL: entry.monthlyPnL || '',
          bestTradeId: entry.bestTradeId || '',
          worstTradeId: entry.worstTradeId || '',
          mentalReflections: entry.mentalReflections || '',
          improvementAreas: entry.improvementAreas || '',
          id: entry.id,
          createdAt: entry.createdAt
        })),
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced to 8 seconds for faster response

      const response = await fetch(this.settings.googleScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Sync failed');
      }

      console.log(`Google Sheets sync successful: ${result.results?.trades || 0} trades, ${result.results?.strategies || 0} strategies, ${result.results?.psychology || 0} psychology entries`);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Google Sheets sync timeout - request took too long');
      } else {
        console.warn('Failed to sync to Google Sheets:', error);
      }
    }
  }

  // Trades methods
  async getTrades(): Promise<Trade[]> {
    return Array.from(this.trades.values()).sort((a, b) => 
      new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
    );
  }

  async getTradeById(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async getTradesByDate(date: string): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(trade => trade.tradeDate === date);
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentTradeId++;
    const trade: Trade = {
      ...insertTrade,
      id,
      createdAt: new Date(),
      exitPrice: insertTrade.exitPrice || null,
      stopLoss: insertTrade.stopLoss || null,
      targetPrice: insertTrade.targetPrice || null,
      profitLoss: insertTrade.profitLoss || null,
      whichSetup: insertTrade.whichSetup || null,
      emotion: insertTrade.emotion || null,
      notes: insertTrade.notes || null,
      psychologyReflections: insertTrade.psychologyReflections || null,
      screenshotLink: insertTrade.screenshotLink || null,
    };
    this.trades.set(id, trade);
    
    // Sync to Google Sheets
    await this.syncToGoogleSheets();
    
    return trade;
  }

  async updateTrade(id: number, updateData: Partial<InsertTrade>): Promise<Trade | undefined> {
    const trade = this.trades.get(id);
    if (!trade) return undefined;

    const updatedTrade: Trade = {
      ...trade,
      ...updateData,
    };
    this.trades.set(id, updatedTrade);
    
    // Sync to Google Sheets
    await this.syncToGoogleSheets();
    
    return updatedTrade;
  }

  async deleteTrade(id: number): Promise<boolean> {
    const deleted = this.trades.delete(id);
    if (deleted) {
      await this.syncToGoogleSheets();
    }
    return deleted;
  }

  // Strategies methods
  async getStrategies(): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getStrategyById(id: number): Promise<Strategy | undefined> {
    return this.strategies.get(id);
  }

  async createStrategy(insertStrategy: InsertStrategy): Promise<Strategy> {
    const id = this.currentStrategyId++;
    const strategy: Strategy = {
      ...insertStrategy,
      id,
      createdAt: new Date(),
      description: insertStrategy.description || null,
      screenshotUrl: insertStrategy.screenshotUrl || null,
      tags: insertStrategy.tags || null,
    };
    this.strategies.set(id, strategy);
    
    // Sync to Google Sheets
    await this.syncToGoogleSheets();
    
    return strategy;
  }

  async updateStrategy(id: number, updateData: Partial<InsertStrategy>): Promise<Strategy | undefined> {
    const strategy = this.strategies.get(id);
    if (!strategy) return undefined;

    const updatedStrategy: Strategy = {
      ...strategy,
      ...updateData,
    };
    this.strategies.set(id, updatedStrategy);
    
    // Sync to Google Sheets
    await this.syncToGoogleSheets();
    
    return updatedStrategy;
  }

  async deleteStrategy(id: number): Promise<boolean> {
    const deleted = this.strategies.delete(id);
    if (deleted) {
      await this.syncToGoogleSheets();
    }
    return deleted;
  }

  // Psychology entries methods
  async getPsychologyEntries(): Promise<PsychologyEntry[]> {
    return Array.from(this.psychologyEntries.values()).sort((a, b) => 
      b.year - a.year || a.month.localeCompare(b.month)
    );
  }

  async getPsychologyEntryById(id: number): Promise<PsychologyEntry | undefined> {
    return this.psychologyEntries.get(id);
  }

  async createPsychologyEntry(insertEntry: InsertPsychologyEntry): Promise<PsychologyEntry> {
    const id = this.currentPsychologyId++;
    const entry: PsychologyEntry = {
      ...insertEntry,
      id,
      createdAt: new Date(),
      monthlyPnL: insertEntry.monthlyPnL || null,
      bestTradeId: insertEntry.bestTradeId || null,
      worstTradeId: insertEntry.worstTradeId || null,
      mentalReflections: insertEntry.mentalReflections || null,
      improvementAreas: insertEntry.improvementAreas || null,
    };
    this.psychologyEntries.set(id, entry);
    
    // Sync to Google Sheets
    await this.syncToGoogleSheets();
    
    return entry;
  }

  async updatePsychologyEntry(id: number, updateData: Partial<InsertPsychologyEntry>): Promise<PsychologyEntry | undefined> {
    const entry = this.psychologyEntries.get(id);
    if (!entry) return undefined;

    const updatedEntry: PsychologyEntry = {
      ...entry,
      ...updateData,
    };
    this.psychologyEntries.set(id, updatedEntry);
    
    // Sync to Google Sheets
    await this.syncToGoogleSheets();
    
    return updatedEntry;
  }

  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(settingsData: InsertSettings): Promise<Settings> {
    this.settings = {
      id: this.settings?.id || 1,
      googleSheetId: settingsData.googleSheetId || null,
      googleScriptUrl: settingsData.googleScriptUrl || null,
      updatedAt: new Date(),
    };
    
    // Save to file system for persistence
    await this.saveSettings();
    
    return this.settings;
  }

  // Force sync to Google Sheets (for testing)
  async forceSyncToGoogleSheets() {
    if (!this.settings?.googleScriptUrl) {
      return {
        success: false,
        error: 'Google Script URL not configured',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const data = {
        action: 'sync',
        trades: Array.from(this.trades.values()),
        strategies: Array.from(this.strategies.values()),
        psychologyEntries: Array.from(this.psychologyEntries.values()),
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(this.settings.googleScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout - Google Sheets took too long to respond',
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const storage = new GoogleSheetsStorage();