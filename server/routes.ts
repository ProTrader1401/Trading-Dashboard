import { Express, Request, Response } from "express";
import { googleSheetsClient } from "./googleSheetsClient";
import { log } from "./vite";
import { createServer } from "http";

export async function registerRoutes(app: Express) {
  // Route to handle all Google Sheets API calls via proxy
  app.post("/api/google-sheets", async (req: Request, res: Response) => {
    try {
      const { action, data, sheetId } = req.body;
      
      // Load settings from storage to get script URL
      const storage = await import("./storage");
      const settings = await storage.storage.getSettings();
      
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

  // Create and return server
  const server = createServer(app);
  return server;
}