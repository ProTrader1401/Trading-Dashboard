import { Express, Request, Response } from "express";
import { googleSheetsClient } from "./googleSheetsClient";
import { log } from "./vite";
import { storage } from "./storage";
export async function registerRoutes(app: Express) {
  app.get("/api/settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      res.json({ success: true, data: settings });
    } catch (error: any) {
      log(`Error getting settings: ${error.message}`, "error");
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Route to save settings
  app.post("/api/settings", async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      await storage.saveSettings(settings);
      
      // Update the Google Sheets client with new settings
      if (settings.googleScriptUrl) {
        googleSheetsClient.setScriptUrl(settings.googleScriptUrl);
      }
      
      res.json({ success: true, data: settings });
    } catch (error: any) {
      log(`Error saving settings: ${error.message}`, "error");
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Route to handle all Google Sheets API calls via proxy
  app.post("/api/google-sheets", async (req: Request, res: Response) => {
    try {
      const { action, data, sheetId } = req.body;
      
      // Load settings from storage to get script URL
      const settings = await storage.getSettings();
      
      if (!settings?.googleScriptUrl) {
        return res.status(400).json({ 
          success: false, 
          error: "Google Script URL not configured. Please check settings." 
        });
      }

      // Set the script URL in the client
      googleSheetsClient.setScriptUrl(settings.googleScriptUrl);

      // Forward the request to Google Apps Script
      const result = await googleSheetsClient.makeRequest(action, data, sheetId || settings.googleSheetId);
      res.json(result);
    } catch (error: any) {
      log(`Error in /api/google-sheets: ${error.message}`, "error");
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Route to test Google Sheets connection from settings page
  app.post("/api/test-google-connection", async (req: Request, res: Response) => {
    try {
      const { googleSheetId, googleScriptUrl } = req.body;
      
      if (!googleScriptUrl) {
        return res.status(400).json({ 
          success: false, 
          error: "Google Script URL is required for testing." 
        });
      }

      googleSheetsClient.setScriptUrl(googleScriptUrl);
      const result = await googleSheetsClient.testConnection(googleSheetId);
      res.json(result);
    } catch (error: any) {
      log(`Error in /api/test-google-connection: ${error.message}`, "error");
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });
}