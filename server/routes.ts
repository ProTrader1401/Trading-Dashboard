import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTradeSchema, insertStrategySchema, insertPsychologyEntrySchema, insertSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { GoogleSheetsClient } from "./googleSheetsClient";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Google Sheets client
  const googleSheetsClient = new GoogleSheetsClient();

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Google Sheets proxy endpoint to avoid CORS issues
  app.post("/api/google-sheets", async (req, res) => {
    try {
      const { action, data, sheetId } = req.body;
      
      console.log('Google Sheets API call:', { action, hasData: !!data, hasSheetId: !!sheetId });
      
      // Get current settings to configure Google Sheets client
      const settings = await storage.getSettings();
      console.log('Retrieved settings:', { 
        hasScriptUrl: !!settings?.googleScriptUrl,
        hasSheetId: !!settings?.googleSheetId 
      });
      
      if (!settings?.googleScriptUrl) {
        console.log('No Google Script URL found in settings');
        return res.status(400).json({ 
          success: false,
          error: "Google Script URL not configured. Please update settings." 
        });
      }

      // Use sheetId from request or fallback to settings
      const targetSheetId = sheetId || settings.googleSheetId;
      if (!targetSheetId) {
        return res.status(400).json({ 
          success: false,
          error: "Google Sheet ID not configured. Please update settings." 
        });
      }

      googleSheetsClient.setScriptUrl(settings.googleScriptUrl);

      let result;
      switch (action) {
        case 'test':
          result = await googleSheetsClient.testConnection(targetSheetId);
          break;
        case 'getTrades':
          // Return local trades for simplicity - Google Sheets integration working for sync
          result = { data: await storage.getTrades() };
          break;
        case 'addTrade':
          // Validate and calculate P&L before storing
          const validatedTrade = insertTradeSchema.parse(data);
          
          // Calculate P&L if exit price is provided
          if (validatedTrade.exitPrice) {
            const entryPrice = parseFloat(validatedTrade.entryPrice);
            const exitPrice = parseFloat(validatedTrade.exitPrice);
            const quantity = validatedTrade.quantity;
            const calculatedPnL = (exitPrice - entryPrice) * quantity;
            validatedTrade.profitLoss = calculatedPnL.toString();
          }
          
          // Add unique ID and timestamp  
          (validatedTrade as any).id = Date.now();
          
          const trade = await storage.createTrade(validatedTrade);
          
          // Sync to Google Sheets with duplicate prevention
          try {
            const response = await (googleSheetsClient as any).makeRequest({
              action: 'addTrade',
              data: trade,
              sheetId: targetSheetId
            });
            console.log('Trade synced to Google Sheets:', response.success);
          } catch (syncError) {
            console.warn('Trade sync to Google Sheets failed:', syncError);
          }
          
          result = { data: trade };
          break;
        case 'getStrategies':
          result = { data: await storage.getStrategies() };
          break;
        case 'addStrategy':
          const strategy = await storage.createStrategy(data);
          try {
            await googleSheetsClient.syncData({ strategies: [strategy] });
          } catch (syncError) {
            console.warn('Strategy sync to Google Sheets failed:', syncError);
          }
          result = { data: strategy };
          break;
        case 'getPsychologyEntries':
          result = { data: await storage.getPsychologyEntries() };
          break;
        case 'addPsychologyEntry':
          // Add unique ID and timestamp
          (data as any).id = Date.now();
          
          const psychologyEntry = await storage.createPsychologyEntry(data);
          
          // Sync to Google Sheets with duplicate prevention
          try {
            const response = await (googleSheetsClient as any).makeRequest({
              action: 'addPsychologyEntry', 
              data: psychologyEntry
            });
            console.log('Psychology entry synced to Google Sheets:', response.success);
          } catch (syncError) {
            console.warn('Psychology entry sync to Google Sheets failed:', syncError);
          }
          
          result = { data: psychologyEntry };
          break;
        default:
          return res.status(400).json({ 
            success: false,
            error: `Unknown action: ${action}` 
          });
      }

      res.json(result);
    } catch (error) {
      console.error('Google Sheets proxy error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Google Sheets operation failed' 
      });
    }
  });

  // Test Google Sheets connection endpoint  
  app.post("/api/test-google-connection", async (req, res) => {
    try {
      const { googleSheetId, googleScriptUrl } = req.body;
      
      console.log('Test connection request:', { 
        hasSheetId: !!googleSheetId, 
        hasScriptUrl: !!googleScriptUrl,
        sheetId: googleSheetId,
        scriptUrl: googleScriptUrl 
      });
      
      const settings = await storage.getSettings();
      
      const scriptUrl = googleScriptUrl || settings?.googleScriptUrl;
      const sheetId = googleSheetId || settings?.googleSheetId;
      
      console.log('Final values for test:', { 
        finalScriptUrl: scriptUrl, 
        finalSheetId: sheetId 
      });
      
      if (!scriptUrl) {
        return res.status(400).json({ 
          success: false,
          error: "Google Script URL not configured" 
        });
      }
      
      if (!sheetId) {
        return res.status(400).json({ 
          success: false,
          error: "Google Sheet ID not configured" 
        });
      }

      // Test the actual connection to Google Apps Script
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'test',
            sheetId: sheetId
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
          res.json({
            success: true,
            message: "Connection successful - Google Sheets integration working!",
            spreadsheetName: result.spreadsheetName,
            scriptUrl: scriptUrl,
            sheetId: sheetId,
            timestamp: new Date().toISOString()
          });
        } else {
          throw new Error(result.error || 'Connection test failed');
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Connection timeout - Google Sheets took too long to respond');
        }
        
        throw fetchError;
      }
      
    } catch (error) {
      console.error('Test connection error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed' 
      });
    }
  });

  // Sync all data to Google Sheets endpoint
  app.post("/api/sync-to-sheets", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!settings?.googleScriptUrl) {
        return res.status(400).json({ 
          success: false,
          error: "Google Script URL not configured" 
        });
      }

      googleSheetsClient.setScriptUrl(settings.googleScriptUrl);
      
      // Get all data
      const trades = await storage.getTrades();
      const strategies = await storage.getStrategies();
      const psychology = await storage.getPsychologyEntries();

      // Sync to Google Sheets
      const result = await googleSheetsClient.syncData({
        trades,
        strategies,
        psychologyEntries: psychology
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed' 
      });
    }
  });

  // Trades endpoints
  app.get("/api/trades", async (req, res) => {
    try {
      const trades = await storage.getTrades();
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  app.post("/api/trades", async (req, res) => {
    try {
      const tradeData = insertTradeSchema.parse(req.body);
      const trade = await storage.createTrade(tradeData);
      res.status(201).json(trade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid trade data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create trade" });
      }
    }
  });

  app.put("/api/trades/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tradeData = insertTradeSchema.partial().parse(req.body);
      const trade = await storage.updateTrade(id, tradeData);
      
      if (!trade) {
        res.status(404).json({ error: "Trade not found" });
        return;
      }
      
      res.json(trade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid trade data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update trade" });
      }
    }
  });

  app.delete("/api/trades/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTrade(id);
      
      if (!success) {
        res.status(404).json({ error: "Trade not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete trade" });
    }
  });

  app.get("/api/trades/date/:date", async (req, res) => {
    try {
      const date = req.params.date;
      const trades = await storage.getTradesByDate(date);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades by date" });
    }
  });

  // Strategies endpoints
  app.get("/api/strategies", async (req, res) => {
    try {
      const strategies = await storage.getStrategies();
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch strategies" });
    }
  });

  app.post("/api/strategies", async (req, res) => {
    try {
      const strategyData = insertStrategySchema.parse(req.body);
      const strategy = await storage.createStrategy(strategyData);
      res.status(201).json(strategy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid strategy data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create strategy" });
      }
    }
  });

  app.put("/api/strategies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const strategyData = insertStrategySchema.partial().parse(req.body);
      const strategy = await storage.updateStrategy(id, strategyData);
      
      if (!strategy) {
        res.status(404).json({ error: "Strategy not found" });
        return;
      }
      
      res.json(strategy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid strategy data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update strategy" });
      }
    }
  });

  app.delete("/api/strategies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStrategy(id);
      
      if (!success) {
        res.status(404).json({ error: "Strategy not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete strategy" });
    }
  });

  // Psychology entries endpoints
  app.get("/api/psychology-entries", async (req, res) => {
    try {
      const entries = await storage.getPsychologyEntries();
      res.json({ data: entries });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch psychology entries" });
    }
  });

  app.get("/api/psychology", async (req, res) => {
    try {
      const entries = await storage.getPsychologyEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch psychology entries" });
    }
  });

  app.post("/api/psychology-entries", async (req, res) => {
    try {
      const entryData = insertPsychologyEntrySchema.parse(req.body);
      const entry = await storage.createPsychologyEntry(entryData);
      res.status(201).json({ data: entry });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid psychology entry data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create psychology entry" });
      }
    }
  });

  app.post("/api/psychology", async (req, res) => {
    try {
      const entryData = insertPsychologyEntrySchema.parse(req.body);
      const entry = await storage.createPsychologyEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid psychology entry data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create psychology entry" });
      }
    }
  });

  app.put("/api/psychology/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entryData = insertPsychologyEntrySchema.partial().parse(req.body);
      const entry = await storage.updatePsychologyEntry(id, entryData);
      
      if (!entry) {
        res.status(404).json({ error: "Psychology entry not found" });
        return;
      }
      
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid psychology entry data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update psychology entry" });
      }
    }
  });

  // Settings endpoints
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const settingsData = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(settingsData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid settings data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update settings" });
      }
    }
  });

  // Google Sheets integration endpoints
  app.post("/api/test-google-connection", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      
      if (!settings?.googleScriptUrl) {
        res.status(400).json({ 
          success: false, 
          error: "Google Script URL not configured" 
        });
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', sheetId: sheetId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        res.status(408).json({ 
          success: false, 
          error: "Connection timeout - Google Sheets took too long to respond" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : "Connection test failed" 
        });
      }
    }
  });

  app.post("/api/sync-to-sheets", async (req, res) => {
    try {
      const result = await storage.forceSyncToGoogleSheets();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Sync failed" 
      });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/summary", async (req, res) => {
    try {
      const trades = await storage.getTrades();
      
      const totalPnL = trades.reduce((sum, trade) => 
        sum + parseFloat(trade.profitLoss?.toString() || "0"), 0
      );
      
      const winningTrades = trades.filter(trade => 
        parseFloat(trade.profitLoss?.toString() || "0") > 0
      );
      
      const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
      
      const summary = {
        totalTrades: trades.length,
        totalPnL,
        winRate,
        winningTrades: winningTrades.length,
        losingTrades: trades.length - winningTrades.length,
        averageWin: winningTrades.length > 0 
          ? winningTrades.reduce((sum, trade) => sum + parseFloat(trade.profitLoss?.toString() || "0"), 0) / winningTrades.length
          : 0,
        averageLoss: trades.length - winningTrades.length > 0
          ? trades.filter(trade => parseFloat(trade.profitLoss?.toString() || "0") < 0)
                  .reduce((sum, trade) => sum + parseFloat(trade.profitLoss?.toString() || "0"), 0) / (trades.length - winningTrades.length)
          : 0,
      };
      
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate analytics summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
