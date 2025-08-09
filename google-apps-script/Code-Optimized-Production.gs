/**
 * IntraDay Trading Dashboard - OPTIMIZED PRODUCTION Google Apps Script
 * FAST, RESPONSIVE, INDIAN TIMEZONE, NO TEST DATA
 * 
 * Version: 5.0.0 - Production Optimized
 * Last Updated: 2025-01-26
 */

// Configuration - Update SPREADSHEET_ID with your actual Google Sheets ID
const CONFIG = {
  SPREADSHEET_ID: '1RXg9THvQd2WMwVgWH6G4tDuuoGOC59mf5pJGko51mVo', // Your actual Sheet ID
  SHEETS: {
    TRADES: 'Trades',
    STRATEGIES: 'Strategies', 
    PSYCHOLOGY: 'Psychology'
  },
  // Indian Standard Time offset
  IST_OFFSET: 5.5 * 60 * 60 * 1000 // +5:30 hours in milliseconds
};

// CORRECT Headers that match UI exactly
const TRADES_HEADERS = [
  'ID', 'Trade Date', 'Stock Name', 'Quantity', 'Entry Price', 'Exit Price', 
  'Stop Loss', 'Target Price', 'P&L', 'Setup Followed', 'Strategy', 'Emotion', 
  'Trade Notes', 'Psychology Reflections', 'Screenshot Link', 'Created At'
];

const STRATEGIES_HEADERS = [
  'ID', 'Name', 'Description', 'Screenshot URL', 'Tags', 'Status', 'Created At'
];

const PSYCHOLOGY_HEADERS = [
  'ID', 'Month', 'Year', 'Monthly P&L', 'Best Trade ID', 'Worst Trade ID',
  'Mental Reflections', 'Improvement Areas', 'Created At'
];

/**
 * UTILITY FUNCTIONS FOR INDIAN TIMEZONE
 */

/**
 * Get current Indian Standard Time
 */
function getISTDateTime() {
  const now = new Date();
  // Proper IST calculation: UTC + 5:30
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
 * Format date to Indian format (DD/MM/YYYY)
 */
function formatIndianDate(date) {
  if (!date) return '';
  const istDate = new Date(typeof date === 'string' ? date : date.getTime() + CONFIG.IST_OFFSET);
  return istDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
}

/**
 * Format datetime to Indian format
 */
function formatIndianDateTime(date) {
  if (!date) return getISTDateTime();
  const inputDate = new Date(date);
  // Convert to IST properly
  const istDate = new Date(inputDate.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate.toLocaleString('en-IN', {
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
 * OPTIMIZED CACHING SYSTEM
 */
const CACHE = {
  sheets: new Map(),
  lastAccess: new Map(),
  CACHE_DURATION: 60000 // 1 minute cache
};

function getCachedSheet(sheetName) {
  const cached = CACHE.sheets.get(sheetName);
  const lastAccess = CACHE.lastAccess.get(sheetName);
  
  if (cached && lastAccess && (Date.now() - lastAccess < CACHE.CACHE_DURATION)) {
    return cached;
  }
  
  // Cache miss - get fresh sheet
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = getOrCreateSheet(spreadsheet, sheetName);
  
  CACHE.sheets.set(sheetName, sheet);
  CACHE.lastAccess.set(sheetName, Date.now());
  
  return sheet;
}

/**
 * Main entry point for POST requests
 */
function doPost(e) {
  try {
    if (!CONFIG.SPREADSHEET_ID) {
      throw new Error('SPREADSHEET_ID not configured. Please update CONFIG.SPREADSHEET_ID');
    }
    
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    console.log(`Processing ${action} request at ${formatIndianDateTime(new Date())}`);
    
    let result;
    switch (action) {
      case 'test':
        result = handleTestConnection();
        break;
      case 'sync':
        result = handleSyncRequest(requestData);
        break;
      case 'getTrades':
        result = handleGetTrades();
        break;
      case 'addTrade':
        result = handleAddTrade(requestData);
        break;
      case 'getStrategies':
        result = handleGetStrategies();
        break;
      case 'addStrategy':
        result = handleAddStrategy(requestData);
        break;
      case 'getPsychologyEntries':
        result = handleGetPsychology();
        break;
      case 'addPsychologyEntry':
        result = handleAddPsychology(requestData);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * OPTIMIZED Test connection
 */
function handleTestConnection() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Connection successful',
        spreadsheetName: spreadsheet.getName(),
        timestamp: getISTDateTime(),
        timezone: 'Asia/Kolkata (IST)'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * OPTIMIZED bulk sync with batch operations
 */
function handleSyncRequest(requestData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let results = { trades: 0, strategies: 0, psychology: 0 };
    
    // Use batch operations for better performance
    const operations = [];
    
    // Sync trades
    if (requestData.trades && requestData.trades.length > 0) {
      operations.push(() => {
        const sheet = getOrCreateSheet(spreadsheet, CONFIG.SHEETS.TRADES);
        if (sheet.getLastRow() === 0) {
          initializeTradesSheet(sheet);
        }
        
        const newTrades = requestData.trades.filter(trade => !isDuplicateTrade(sheet, trade));
        const rows = newTrades.map(trade => createTradeRow(trade));
        
        if (rows.length > 0) {
          sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
          results.trades = rows.length;
        }
      });
    }
    
    // Sync strategies
    if (requestData.strategies && requestData.strategies.length > 0) {
      operations.push(() => {
        const sheet = getOrCreateSheet(spreadsheet, CONFIG.SHEETS.STRATEGIES);
        if (sheet.getLastRow() === 0) {
          initializeStrategiesSheet(sheet);
        }
        
        const newStrategies = requestData.strategies.filter(strategy => !isDuplicateStrategy(sheet, strategy));
        const rows = newStrategies.map(strategy => createStrategyRow(strategy));
        
        if (rows.length > 0) {
          sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
          results.strategies = rows.length;
        }
      });
    }
    
    // Sync psychology
    if (requestData.psychologyEntries && requestData.psychologyEntries.length > 0) {
      operations.push(() => {
        const sheet = getOrCreateSheet(spreadsheet, CONFIG.SHEETS.PSYCHOLOGY);
        if (sheet.getLastRow() === 0) {
          initializePsychologySheet(sheet);
        }
        
        const newEntries = requestData.psychologyEntries.filter(entry => !isDuplicatePsychology(sheet, entry));
        const rows = newEntries.map(entry => createPsychologyRow(entry));
        
        if (rows.length > 0) {
          sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
          results.psychology = rows.length;
        }
      });
    }
    
    // Execute all operations
    operations.forEach(op => op());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        results: results,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Sync error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * OPTIMIZED Add single trade
 */
function handleAddTrade(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.TRADES);
    
    if (sheet.getLastRow() === 0) {
      initializeTradesSheet(sheet);
    }
    
    const trade = requestData.data || requestData;
    
    // Quick duplicate check
    if (isDuplicateTrade(sheet, trade)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Trade already exists (duplicate prevented)',
          data: trade,
          timestamp: getISTDateTime()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Single row append - fastest operation
    const row = createTradeRow(trade);
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: trade,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Add trade error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * OPTIMIZED Add single strategy
 */
function handleAddStrategy(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.STRATEGIES);
    
    if (sheet.getLastRow() === 0) {
      initializeStrategiesSheet(sheet);
    }
    
    const strategy = requestData.data || requestData;
    
    if (isDuplicateStrategy(sheet, strategy)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Strategy already exists (duplicate prevented)',
          data: strategy,
          timestamp: getISTDateTime()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const row = createStrategyRow(strategy);
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: strategy,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Add strategy error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * OPTIMIZED Add single psychology entry
 */
function handleAddPsychology(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.PSYCHOLOGY);
    
    if (sheet.getLastRow() === 0) {
      initializePsychologySheet(sheet);
    }
    
    const entry = requestData.data || requestData;
    
    if (isDuplicatePsychology(sheet, entry)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Psychology entry already exists (duplicate prevented)',
          data: entry,
          timestamp: getISTDateTime()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const row = createPsychologyRow(entry);
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: entry,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Add psychology error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * OPTIMIZED Get trades with caching
 */
function handleGetTrades() {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.TRADES);
    
    if (sheet.getLastRow() === 0) {
      initializeTradesSheet(sheet);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          data: [],
          timestamp: getISTDateTime()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const trades = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      
      trades.push({
        id: row[0],
        tradeDate: formatDate(row[1]),
        stockName: row[2] || '',
        quantity: parseFloat(row[3]) || 0,
        entryPrice: row[4]?.toString() || '0',
        exitPrice: row[5]?.toString() || null,
        stopLoss: row[6]?.toString() || null,
        targetPrice: row[7]?.toString() || null,
        profitLoss: row[8]?.toString() || '0',
        setupFollowed: row[9] === true,
        whichSetup: row[10] || null,
        emotion: row[11] || null,
        notes: row[12] || null,
        psychologyReflections: row[13] || null,
        screenshotLink: row[14] || null,
        createdAt: row[15] ? formatIndianDateTime(new Date(row[15])) : getISTDateTime()
      });
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: trades,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * OPTIMIZED Get strategies
 */
function handleGetStrategies() {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.STRATEGIES);
    
    if (sheet.getLastRow() === 0) {
      initializeStrategiesSheet(sheet);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          data: [],
          timestamp: getISTDateTime()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const strategies = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      
      strategies.push({
        id: row[0],
        name: row[1] || '',
        description: row[2] || null,
        screenshotUrl: row[3] || null,
        tags: row[4] ? row[4].split(',').map(tag => tag.trim()) : null,
        status: row[5] || 'active',
        createdAt: row[6] ? formatIndianDateTime(new Date(row[6])) : getISTDateTime()
      });
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: strategies,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * OPTIMIZED Get psychology entries
 */
function handleGetPsychology() {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.PSYCHOLOGY);
    
    if (sheet.getLastRow() === 0) {
      initializePsychologySheet(sheet);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          data: [],
          timestamp: getISTDateTime()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const entries = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      
      entries.push({
        id: row[0],
        month: row[1] || '',
        year: parseInt(row[2]) || new Date().getFullYear(),
        monthlyPnL: row[3]?.toString() || null,
        bestTradeId: row[4] ? parseInt(row[4]) : null,
        worstTradeId: row[5] ? parseInt(row[5]) : null,
        mentalReflections: row[6] || '',
        improvementAreas: row[7] || '',
        createdAt: row[8] ? formatIndianDateTime(new Date(row[8])) : getISTDateTime()
      });
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: entries,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * OPTIMIZED Helper Functions
 */

function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

function initializeTradesSheet(sheet) {
  sheet.getRange(1, 1, 1, TRADES_HEADERS.length).setValues([TRADES_HEADERS]);
  sheet.getRange(1, 1, 1, TRADES_HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function initializeStrategiesSheet(sheet) {
  sheet.getRange(1, 1, 1, STRATEGIES_HEADERS.length).setValues([STRATEGIES_HEADERS]);
  sheet.getRange(1, 1, 1, STRATEGIES_HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function initializePsychologySheet(sheet) {
  sheet.getRange(1, 1, 1, PSYCHOLOGY_HEADERS.length).setValues([PSYCHOLOGY_HEADERS]);
  sheet.getRange(1, 1, 1, PSYCHOLOGY_HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function createTradeRow(trade) {
  // Calculate P&L correctly with precision
  const entryPrice = parseFloat(trade.entryPrice || '0');
  const exitPrice = parseFloat(trade.exitPrice || '0');
  const quantity = parseFloat(trade.quantity || '0');
  const pnl = (exitPrice > 0 && entryPrice > 0) ? parseFloat(((exitPrice - entryPrice) * quantity).toFixed(2)) : 0;
  
  return [
    trade.id || Date.now(),
    formatIndianDate(trade.tradeDate || new Date()),
    trade.stockName || '',
    quantity,
    entryPrice,
    exitPrice || '',
    trade.stopLoss || '',
    trade.targetPrice || '',
    pnl,
    trade.setupFollowed || false,    
    trade.whichSetup || '',
    trade.emotion || '',
    trade.notes || '',
    trade.psychologyReflections || '',
    trade.screenshotLink || '',
    getISTDateTime() // Use proper IST formatting
  ];
}

function createStrategyRow(strategy) {
  return [
    strategy.id || Date.now(),
    strategy.name || '',
    strategy.description || '',
    strategy.screenshotUrl || '',
    Array.isArray(strategy.tags) ? strategy.tags.join(',') : (strategy.tags || ''),
    strategy.status || 'active',
    getISTDateTime() // Use proper IST formatting
  ];
}

function createPsychologyRow(entry) {
  return [
    entry.id || Date.now(),
    entry.month || '',
    entry.year || new Date().getFullYear(),
    entry.monthlyPnL || '',
    entry.bestTradeId || '',
    entry.worstTradeId || '',
    entry.mentalReflections || '',
    entry.improvementAreas || '',
    getISTDateTime() // Use proper IST formatting
  ];
}

// ENHANCED duplicate checks with precise matching
function isDuplicateTrade(sheet, trade) {
  if (sheet.getLastRow() <= 1) return false;
  
  const data = sheet.getDataRange().getValues();
  const tradeDate = formatDate(trade.tradeDate);
  const stockName = trade.stockName?.toString().toUpperCase();
  const quantity = parseFloat(trade.quantity || 0);
  const entryPrice = parseFloat(trade.entryPrice || 0);
  const exitPrice = parseFloat(trade.exitPrice || 0);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const existingDate = formatDate(row[1]);
    const existingStock = row[2]?.toString().toUpperCase();
    const existingQty = parseFloat(row[3] || 0);
    const existingEntry = parseFloat(row[4] || 0);
    const existingExit = parseFloat(row[5] || 0);
    
    // Enhanced matching: date, stock, quantity, entry price, and exit price
    if (existingDate === tradeDate && 
        existingStock === stockName && 
        Math.abs(existingQty - quantity) < 0.01 &&
        Math.abs(existingEntry - entryPrice) < 0.01 &&
        Math.abs(existingExit - exitPrice) < 0.01) {
      console.log(`Duplicate trade detected: ${stockName} on ${tradeDate}`);
      return true;
    }
  }
  return false;
}

function isDuplicateStrategy(sheet, strategy) {
  if (sheet.getLastRow() <= 1) return false;
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === strategy.name) {
      return true;
    }
  }
  return false;
}

function isDuplicatePsychology(sheet, entry) {
  if (sheet.getLastRow() <= 1) return false;
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === entry.month && parseInt(row[2]) === parseInt(entry.year)) {
      return true;
    }
  }
  return false;
}

function formatDate(date) {
  if (!date) return '';
  if (date instanceof Date) {
    return formatIndianDate(date);
  }
  return date.toString();
}

/**
 * For GET requests (testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Trading Dashboard Google Apps Script - PRODUCTION OPTIMIZED',
      version: '5.0.0 - Fast, Responsive, Indian Timezone',
      timezone: 'Asia/Kolkata (IST)',
      timestamp: getISTDateTime(),
      hint: 'Use POST requests for data operations. No test data in production.'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}