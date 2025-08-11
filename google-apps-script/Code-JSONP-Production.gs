/**
 * IntraDay Trading Dashboard - DYNAMIC SHEET ID PRODUCTION Google Apps Script
 * ACCEPTS SHEET ID FROM UI SETTINGS - NO HARDCODED IDS
 * 
 * Version: 8.0.0 - Dynamic Sheet ID Production
 * Last Updated: 2025-01-28
 */

// Helper to set CORS headers for all responses
function setCorsHeaders(response) {
  return response
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Handle OPTIONS requests (CORS preflight)
function doOptions() {
  const response = ContentService.createTextOutput('');
  return setCorsHeaders(response);
}

// NO HARDCODED SHEET ID - ACCEPTS FROM REQUEST
const CONFIG = {
  SHEETS: {
    TRADES: 'Trades',
    STRATEGIES: 'Strategies', 
    PSYCHOLOGY: 'Psychology'
  }
};

// CORRECT Headers that match UI exactly
const TRADES_HEADERS = [
  'ID', 'Trade Date', 'Stock Name', 'Quantity', 'Entry Price', 'Exit Price', 
  'Stop Loss', 'Target Price', 'P&L', 'Trade Taken', 'Strategy', 'Emotion', 
  'Trade Notes', 'Psychology Reflections', 'Screenshot Link', 'Created At'
];

const STRATEGIES_HEADERS = [
  'ID', 'Name', 'Description', 'Screenshot URL', 'Tags', 'Status', 'Created At'
];

const PSYCHOLOGY_HEADERS = [
  'ID', 'Entry Date', 'Daily P&L', 'Best Trade ID', 'Worst Trade ID',
  'Mental Reflections', 'Improvement Areas', 'Created At'
];

/**
 * INDIAN TIMEZONE FUNCTIONS
 */
function getISTDateTime() {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * FAST CACHING - 30 second cache for speed
 */
const CACHE = {
  data: new Map(),
  timestamps: new Map(),
  CACHE_DURATION: 30000 // 30 seconds
};

function getCachedSheet(spreadsheetId, sheetName) {
  const cacheKey = `${spreadsheetId}_${sheetName}`;
  const cached = CACHE.data.get(cacheKey);
  const timestamp = CACHE.timestamps.get(cacheKey);
  
  if (cached && timestamp && (Date.now() - timestamp) < CACHE.CACHE_DURATION) {
    return cached;
  }
  
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  CACHE.data.set(cacheKey, sheet);
  CACHE.timestamps.set(cacheKey, Date.now());
  
  return sheet;
}

/**
 * MAIN ENTRY POINTS - SUPPORTS BOTH GET (JSONP) AND POST
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const data = e.parameter.data ? JSON.parse(e.parameter.data) : {};
    const sheetId = e.parameter.sheetId || data.sheetId;
    const callback = e.parameter.callback;
    
    if (!sheetId) {
      const errorResult = { success: false, error: 'Sheet ID is required', timestamp: getISTDateTime() };
      if (callback) {
        const jsonpError = callback + '(' + JSON.stringify(errorResult) + ');';
        return ContentService
          .createTextOutput(jsonpError)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService
        .createTextOutput(JSON.stringify(errorResult))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    let result;
    
    switch (action) {
      case 'test':
        result = handleTestConnection(sheetId);
        break;
      case 'getTrades':
        result = handleGetTrades(sheetId);
        break;
      case 'getStrategies':
        result = handleGetStrategies(sheetId);
        break;
      case 'getPsychologyEntries':
        result = handleGetPsychologyEntries(sheetId);
        break;
      case 'addTrade':
        result = handleAddTrade(sheetId, { data });
        break;
      case 'addStrategy':
        result = handleAddStrategy(sheetId, { data });
        break;
      case 'addPsychologyEntry':
        result = handleAddPsychologyEntry(sheetId, { data });
        break;
      case 'updateTrade':
        result = handleUpdateTrade(sheetId, { data });
        break;
      case 'deleteTrade':
        result = handleDeleteTrade(sheetId, { data });
        break;
      case 'updateStrategy':
        result = handleUpdateStrategy(sheetId, { data });
        break;
      case 'deleteStrategy':
        result = handleDeleteStrategy(sheetId, { data });
        break;
      case 'updatePsychologyEntry':
        result = handleUpdatePsychologyEntry(sheetId, { data });
        break;
      case 'deletePsychologyEntry':
        result = handleDeletePsychologyEntry(sheetId, { data });
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    
    // Handle JSONP callback
    if (callback) {
      const jsonpResponse = callback + '(' + JSON.stringify(result) + ');';
      return setCorsHeaders(
        ContentService
          .createTextOutput(jsonpResponse)
          .setMimeType(ContentService.MimeType.JAVASCRIPT)
      );
    }
    
    // Regular JSON response
    return setCorsHeaders(
      ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON)
    );
      
  } catch (error) {
    const errorResult = { success: false, error: error.message, timestamp: getISTDateTime() };
    
    if (e.parameter.callback) {
      const jsonpError = e.parameter.callback + '(' + JSON.stringify(errorResult) + ');';
      return setCorsHeaders(
        ContentService
          .createTextOutput(jsonpError)
          .setMimeType(ContentService.MimeType.JAVASCRIPT)
      );
    }
    
    return setCorsHeaders(
      ContentService
        .createTextOutput(JSON.stringify(errorResult))
        .setMimeType(ContentService.MimeType.JSON)
    );
  }
}

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const sheetId = requestData.sheetId;
    
    if (!sheetId) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Sheet ID is required in request data',
          timestamp: getISTDateTime()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    let result;
    
    switch (action) {
      case 'test':
        result = handleTestConnection(sheetId);
        break;
      case 'getTrades':
        result = handleGetTrades(sheetId);
        break;
      case 'getStrategies':
        result = handleGetStrategies(sheetId);
        break;
      case 'getPsychologyEntries':
        result = handleGetPsychologyEntries(sheetId);
        break;
      case 'addTrade':
        result = handleAddTrade(sheetId, requestData);
        break;
      case 'addStrategy':
        result = handleAddStrategy(sheetId, requestData);
        break;
      case 'addPsychologyEntry':
        result = handleAddPsychologyEntry(sheetId, requestData);
        break;
      case 'updateTrade':
        result = handleUpdateTrade(sheetId, requestData);
        break;
      case 'deleteTrade':
        result = handleDeleteTrade(sheetId, requestData);
        break;
      case 'updateStrategy':
        result = handleUpdateStrategy(sheetId, requestData);
        break;
      case 'deleteStrategy':
        result = handleDeleteStrategy(sheetId, requestData);
        break;
      case 'updatePsychologyEntry':
        result = handleUpdatePsychologyEntry(sheetId, requestData);
        break;
      case 'deletePsychologyEntry':
        result = handleDeletePsychologyEntry(sheetId, requestData);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    
    return setCorsHeaders(
      ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON)
    );
      
  } catch (error) {
    return setCorsHeaders(
      ContentService
        .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: getISTDateTime()
        }))
        .setMimeType(ContentService.MimeType.JSON)
    );
  }
}

/**
 * DATA HANDLERS - ALL ACCEPT DYNAMIC SHEET ID
 */
function handleTestConnection(sheetId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    return {
      success: true,
      message: 'Connection successful to your sheet!',
      spreadsheetName: spreadsheet.getName(),
      timestamp: getISTDateTime()
    };
  } catch (error) {
    return {
      success: false,
      error: 'Cannot access sheet: ' + error.message,
      timestamp: getISTDateTime()
    };
  }
}

function handleGetTrades(sheetId) {
  try {
    const sheet = getCachedSheet(sheetId, CONFIG.SHEETS.TRADES);
    if (!sheet) {
      return { success: false, error: 'Trades sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, data: [] };
    }
    
    const trades = data.slice(1).map(row => ({
      id: row[0] || Date.now() + Math.random(),
      tradeDate: row[1] || new Date().toISOString().split('T')[0],
      stockName: row[2] || '',
      quantity: parseInt(row[3]) || 0,
      entryPrice: row[4] || '0',
      exitPrice: row[5] || '',
      stopLoss: row[6] || '',
      targetPrice: row[7] || '',
      profitLoss: row[8] || '0',
      isTradeTaken: row[9] === 'Yes' || row[9] === true || row[9] === 'TRUE' || row[9] === 1,
      setupFollowed: row[9] === 'Yes' || row[9] === true || row[9] === 'TRUE' || row[9] === 1,
      whichSetup: row[10] || null,
      emotion: row[11] || '',
      notes: row[12] || null,
      psychologyReflections: row[13] || '',
      screenshotLink: row[14] || '',
      createdAt: row[15] || getISTDateTime()
    }));
    
    return { success: true, data: trades };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleGetStrategies(sheetId) {
  try {
    const sheet = getCachedSheet(sheetId, CONFIG.SHEETS.STRATEGIES);
    if (!sheet) {
      return { success: false, error: 'Strategies sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, data: [] };
    }
    
    const strategies = data.slice(1).map(row => ({
      id: row[0] || Date.now() + Math.random(),
      name: row[1] || '',
      description: row[2] || '',
      screenshotUrl: row[3] || '',
      tags: row[4] ? row[4].split(',').map(tag => tag.trim()) : null,
      status: row[5] || 'active',
      createdAt: row[6] || getISTDateTime()
    }));
    
    return { success: true, data: strategies };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleGetPsychologyEntries(sheetId) {
  try {
    const sheet = getCachedSheet(sheetId, CONFIG.SHEETS.PSYCHOLOGY);
    if (!sheet) {
      return { success: false, error: 'Psychology sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, data: [] };
    }
    
    const entries = data.slice(1).map(row => ({
      id: row[0] || Date.now() + Math.random(),
      entryDate: row[1] || '',
      dailyPnL: row[2] || '0',
      bestTradeId: row[3] ? parseInt(row[3]) : null,
      worstTradeId: row[4] ? parseInt(row[4]) : null,
      mentalReflections: row[5] || '',
      improvementAreas: row[6] || '',
      createdAt: row[7] || getISTDateTime()
    }));
    
    return { success: true, data: entries };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleAddTrade(sheetId, requestData) {
  try {
    const sheet = getOrCreateSheet(sheetId, CONFIG.SHEETS.TRADES);
    
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, TRADES_HEADERS.length).setValues([TRADES_HEADERS]);
      sheet.getRange(1, 1, 1, TRADES_HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    const trade = requestData.data || requestData;
    
    // Check for duplicates
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      const row = existingData[i];
      if (row[2] === trade.stockName && 
          row[1] === trade.tradeDate &&
          row[4] === trade.entryPrice) {
        return { success: true, message: 'Duplicate prevented', data: trade };
      }
    }
    
    // Create row with YYYY-MM-DD date format
    const row = [
      trade.id || Date.now(),
      trade.tradeDate || new Date().toISOString().split('T')[0], // Keep YYYY-MM-DD format
      trade.stockName || '',
      trade.quantity || 0,
      trade.entryPrice || '0',
      trade.exitPrice || '',
      trade.stopLoss || '',
      trade.targetPrice || '',
      trade.profitLoss || '0',
      (trade.isTradeTaken === true || trade.isTradeTaken === 'true' || trade.isTradeTaken === 1 || trade.setupFollowed === true) ? 'Yes' : 'No',
      trade.whichSetup || '',
      trade.emotion || '',
      trade.notes || '',
      trade.psychologyReflections || '',
      trade.screenshotLink || '',
      getISTDateTime()
    ];
    
    sheet.appendRow(row);
    
    return { success: true, data: trade, timestamp: getISTDateTime() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleAddStrategy(sheetId, requestData) {
  try {
    const sheet = getOrCreateSheet(sheetId, CONFIG.SHEETS.STRATEGIES);
    
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, STRATEGIES_HEADERS.length).setValues([STRATEGIES_HEADERS]);
      sheet.getRange(1, 1, 1, STRATEGIES_HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    const strategy = requestData.data || requestData;
    
    // Check for duplicates
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      const row = existingData[i];
      if (row[1] === strategy.name) {
        return { success: true, message: 'Duplicate prevented', data: strategy };
      }
    }
    
    const row = [
      strategy.id || Date.now(),
      strategy.name || '',
      strategy.description || '',
      strategy.screenshotUrl || '',
      Array.isArray(strategy.tags) ? strategy.tags.join(',') : (strategy.tags || ''),
      strategy.status || 'active',
      getISTDateTime()
    ];
    
    sheet.appendRow(row);
    
    return { success: true, data: strategy, timestamp: getISTDateTime() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleAddPsychologyEntry(sheetId, requestData) {
  try {
    const sheet = getOrCreateSheet(sheetId, CONFIG.SHEETS.PSYCHOLOGY);
    
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, PSYCHOLOGY_HEADERS.length).setValues([PSYCHOLOGY_HEADERS]);
      sheet.getRange(1, 1, 1, PSYCHOLOGY_HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    const entry = requestData.data || requestData;
    
    // Check for duplicates by entry date
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      const row = existingData[i];
      if (row[1] === entry.entryDate) {
        return { success: true, message: 'Duplicate prevented', data: entry };
      }
    }
    
    const row = [
      entry.id || Date.now(),
      entry.entryDate || new Date().toISOString().split('T')[0], // Keep YYYY-MM-DD format
      entry.dailyPnL || '0',
      entry.bestTradeId || '',
      entry.worstTradeId || '',
      entry.mentalReflections || '',
      entry.improvementAreas || '',
      getISTDateTime()
    ];
    
    sheet.appendRow(row);
    
    return { success: true, data: entry, timestamp: getISTDateTime() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * UPDATE AND DELETE OPERATIONS
 */
function handleUpdateTrade(sheetId, requestData) {
  try {
    const sheet = getCachedSheet(sheetId, CONFIG.SHEETS.TRADES);
    const trade = requestData.data || requestData;
    const data = sheet.getDataRange().getValues();
    
    // Find the trade by ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == trade.id) {
        // Update the row
        const row = [
          trade.id,
          trade.tradeDate || data[i][1],
          trade.stockName || data[i][2],
          trade.quantity || data[i][3],
          trade.entryPrice || data[i][4],
          trade.exitPrice || data[i][5],
          trade.stopLoss || data[i][6],
          trade.targetPrice || data[i][7],
          trade.profitLoss || data[i][8],
          trade.isTradeTaken !== undefined ? (trade.isTradeTaken ? 'Yes' : 'No') : data[i][9],
          trade.whichSetup || data[i][10],
          trade.emotion || data[i][11],
          trade.notes || data[i][12],
          trade.psychologyReflections || data[i][13],
          trade.screenshotLink || data[i][14],
          data[i][15] // Keep original created date
        ];
        
        sheet.getRange(i + 1, 1, 1, TRADES_HEADERS.length).setValues([row]);
        return { success: true, data: trade, timestamp: getISTDateTime() };
      }
    }
    
    return { success: false, error: 'Trade not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleDeleteTrade(sheetId, requestData) {
  try {
    const sheet = getCachedSheet(sheetId, CONFIG.SHEETS.TRADES);
    const { id } = requestData.data || requestData;
    const data = sheet.getDataRange().getValues();
    
    // Find and delete the trade by ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Trade deleted successfully' };
      }
    }
    
    return { success: false, error: 'Trade not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleUpdateStrategy(sheetId, requestData) {
  try {
    const sheet = getCachedSheet(sheetId, CONFIG.SHEETS.STRATEGIES);
    const strategy = requestData.data || requestData;
    const data = sheet.getDataRange().getValues();
    
    // Find the strategy by ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == strategy.id) {
        const row = [
          strategy.id,
          strategy.name || data[i][1],
          strategy.description || data[i][2],
          strategy.screenshotUrl || data[i][3],
          strategy.tags || data[i][4],
          strategy.status || data[i][5],
          data[i][6] // Keep original created date
        ];
        
        sheet.getRange(i + 1, 1, 1, STRATEGIES_HEADERS.length).setValues([row]);
        return { success: true, data: strategy, timestamp: getISTDateTime() };
      }
    }
    
    return { success: false, error: 'Strategy not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleDeleteStrategy(sheetId, requestData) {
  try {
    const sheet = getCachedSheet(sheetId, CONFIG.SHEETS.STRATEGIES);
    const { id } = requestData.data || requestData;
    const data = sheet.getDataRange().getValues();
    
    // Find and delete the strategy by ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Strategy deleted successfully' };
      }
    }
    
    return { success: false, error: 'Strategy not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleUpdatePsychologyEntry(sheetId, requestData) {
  try {
    const sheet = getCachedSheet(sheetId, CONFIG.SHEETS.PSYCHOLOGY);
    const entry = requestData.data || requestData;
    const data = sheet.getDataRange().getValues();
    
    // Find the entry by ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == entry.id) {
        const row = [
          entry.id,
          entry.entryDate !== undefined ? entry.entryDate : data[i][1],
          entry.dailyPnL !== undefined ? entry.dailyPnL : data[i][2],
          entry.bestTradeId !== undefined ? entry.bestTradeId : data[i][3],
          entry.worstTradeId !== undefined ? entry.worstTradeId : data[i][4],
          entry.mentalReflections !== undefined ? entry.mentalReflections : data[i][5],
          entry.improvementAreas !== undefined ? entry.improvementAreas : data[i][6],
          data[i][7] // Keep original created date
        ];
        
        sheet.getRange(i + 1, 1, 1, PSYCHOLOGY_HEADERS.length).setValues([row]);
        return { success: true, data: entry, timestamp: getISTDateTime() };
      }
    }
    
    return { success: false, error: 'Psychology entry not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleDeletePsychologyEntry(sheetId, requestData) {
  try {
    const sheet = getCachedSheet(sheetId, CONFIG.SHEETS.PSYCHOLOGY);
    const { id } = requestData.data || requestData;
    const data = sheet.getDataRange().getValues();
    
    // Find and delete the entry by ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Psychology entry deleted successfully' };
      }
    }
    
    return { success: false, error: 'Psychology entry not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * HELPER FUNCTIONS
 */
function getOrCreateSheet(sheetId, sheetName) {
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * TEST FUNCTION
 */
function testConfiguration() {
  console.log('⚠️ This script now accepts dynamic Sheet IDs from UI settings');
  console.log('✅ No hardcoded Sheet ID - uses whatever you enter in settings');
  console.log('✅ Ready for deployment with any Google Sheet');
  return true;
}