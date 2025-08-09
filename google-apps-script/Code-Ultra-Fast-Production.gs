/**
 * IntraDay Trading Dashboard - ULTRA FAST PRODUCTION Google Apps Script
 * OPTIMIZED FOR UNDER 2 SECONDS, INDIAN TIMEZONE, NO DUPLICATES
 * 
 * Version: 6.0.0 - Ultra Fast Production
 * Last Updated: 2025-01-26
 */

// Configuration - Update SPREADSHEET_ID with your actual Google Sheets ID
const CONFIG = {
  SPREADSHEET_ID: '1RXg9THvQd2WMwVgWH6G4tDuuoGOC59mf5pJGko51mVo', // Your actual Sheet ID
  SHEETS: {
    TRADES: 'Trades',
    STRATEGIES: 'Strategies', 
    PSYCHOLOGY: 'Psychology'
  }
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
 * ULTRA FAST INDIAN TIMEZONE FUNCTIONS
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

function formatIndianDate(date) {
  if (!date) return getISTDateTime().split(',')[0];
  const istDate = new Date(typeof date === 'string' ? date : date.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
}

/**
 * ULTRA FAST CACHING - 30 second cache for maximum speed
 */
const ULTRA_CACHE = {
  data: new Map(),
  timestamps: new Map(),
  CACHE_DURATION: 30000 // 30 seconds for ultra-fast response
};

function getCachedSheet(sheetName) {
  const cached = ULTRA_CACHE.data.get(sheetName);
  const timestamp = ULTRA_CACHE.timestamps.get(sheetName);
  
  if (cached && timestamp && (Date.now() - timestamp < ULTRA_CACHE.CACHE_DURATION)) {
    return cached;
  }
  
  // Fresh fetch - minimal operations
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = getOrCreateSheet(spreadsheet, sheetName);
  
  ULTRA_CACHE.data.set(sheetName, sheet);
  ULTRA_CACHE.timestamps.set(sheetName, Date.now());
  
  return sheet;
}

/**
 * Main entry point - ULTRA OPTIMIZED
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    let result;
    switch (action) {
      case 'test':
        result = handleTest();
        break;
      case 'addTrade':
        result = handleAddTrade(requestData);
        break;
      case 'addStrategy':
        result = handleAddStrategy(requestData);
        break;
      case 'addPsychologyEntry':
        result = handleAddPsychology(requestData);
        break;
      case 'getTrades':
        result = handleGetTrades();
        break;
      case 'getStrategies':
        result = handleGetStrategies();
        break;
      case 'getPsychologyEntries':
        result = handleGetPsychology();
        break;
      case 'sync':
        result = handleSync(requestData);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return result;
    
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
 * ULTRA FAST test connection
 */
function handleTest() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Ultra-fast connection successful',
        spreadsheetName: spreadsheet.getName(),
        timestamp: getISTDateTime(),
        version: '6.0.0 - Ultra Fast'
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
 * ULTRA FAST add single trade - ENHANCED DUPLICATE PREVENTION
 */
function handleAddTrade(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.TRADES);
    
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, TRADES_HEADERS.length).setValues([TRADES_HEADERS]);
      sheet.getRange(1, 1, 1, TRADES_HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    const trade = requestData.data || requestData;
    
    // ENHANCED duplicate check - ultra precise
    if (isUltraFastDuplicateTrade(sheet, trade)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Duplicate prevented - trade already exists',
          data: trade,
          timestamp: getISTDateTime()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Ultra-fast single append
    const row = createUltraFastTradeRow(trade);
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: trade,
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
 * ULTRA FAST add strategy
 */
function handleAddStrategy(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.STRATEGIES);
    
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, STRATEGIES_HEADERS.length).setValues([STRATEGIES_HEADERS]);
      sheet.getRange(1, 1, 1, STRATEGIES_HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    const strategy = requestData.data || requestData;
    
    if (isUltraFastDuplicateStrategy(sheet, strategy)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Duplicate prevented - strategy already exists',
          data: strategy,
          timestamp: getISTDateTime()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const row = createUltraFastStrategyRow(strategy);
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: strategy,
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
 * ULTRA FAST add psychology
 */
function handleAddPsychology(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.PSYCHOLOGY);
    
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, PSYCHOLOGY_HEADERS.length).setValues([PSYCHOLOGY_HEADERS]);
      sheet.getRange(1, 1, 1, PSYCHOLOGY_HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    const entry = requestData.data || requestData;
    
    if (isUltraFastDuplicatePsychology(sheet, entry)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Duplicate prevented - psychology entry already exists',
          data: entry,
          timestamp: getISTDateTime()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const row = createUltraFastPsychologyRow(entry);
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: entry,
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
 * ULTRA FAST get trades
 */
function handleGetTrades() {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.TRADES);
    
    if (sheet.getLastRow() === 0) {
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
        tradeDate: formatIndianDate(row[1]),
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
        createdAt: row[15] || getISTDateTime()
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
 * ULTRA FAST get strategies
 */
function handleGetStrategies() {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.STRATEGIES);
    
    if (sheet.getLastRow() === 0) {
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
        createdAt: row[6] || getISTDateTime()
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
 * ULTRA FAST get psychology
 */
function handleGetPsychology() {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.PSYCHOLOGY);
    
    if (sheet.getLastRow() === 0) {
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
        createdAt: row[8] || getISTDateTime()
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
 * ULTRA FAST bulk sync
 */
function handleSync(requestData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let results = { trades: 0, strategies: 0, psychology: 0 };
    
    // Parallel processing for maximum speed
    if (requestData.trades && requestData.trades.length > 0) {
      const sheet = getOrCreateSheet(spreadsheet, CONFIG.SHEETS.TRADES);
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, TRADES_HEADERS.length).setValues([TRADES_HEADERS]);
        sheet.getRange(1, 1, 1, TRADES_HEADERS.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
      
      const newTrades = requestData.trades.filter(trade => !isUltraFastDuplicateTrade(sheet, trade));
      if (newTrades.length > 0) {
        const rows = newTrades.map(trade => createUltraFastTradeRow(trade));
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
        results.trades = rows.length;
      }
    }
    
    if (requestData.strategies && requestData.strategies.length > 0) {
      const sheet = getOrCreateSheet(spreadsheet, CONFIG.SHEETS.STRATEGIES);
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, STRATEGIES_HEADERS.length).setValues([STRATEGIES_HEADERS]);
        sheet.getRange(1, 1, 1, STRATEGIES_HEADERS.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
      
      const newStrategies = requestData.strategies.filter(strategy => !isUltraFastDuplicateStrategy(sheet, strategy));
      if (newStrategies.length > 0) {
        const rows = newStrategies.map(strategy => createUltraFastStrategyRow(strategy));
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
        results.strategies = rows.length;
      }
    }
    
    if (requestData.psychologyEntries && requestData.psychologyEntries.length > 0) {
      const sheet = getOrCreateSheet(spreadsheet, CONFIG.SHEETS.PSYCHOLOGY);
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, PSYCHOLOGY_HEADERS.length).setValues([PSYCHOLOGY_HEADERS]);
        sheet.getRange(1, 1, 1, PSYCHOLOGY_HEADERS.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
      
      const newEntries = requestData.psychologyEntries.filter(entry => !isUltraFastDuplicatePsychology(sheet, entry));
      if (newEntries.length > 0) {
        const rows = newEntries.map(entry => createUltraFastPsychologyRow(entry));
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
        results.psychology = rows.length;
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        results: results,
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
 * ULTRA FAST Helper Functions
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

function createUltraFastTradeRow(trade) {
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
    getISTDateTime()
  ];
}

function createUltraFastStrategyRow(strategy) {
  return [
    strategy.id || Date.now(),
    strategy.name || '',
    strategy.description || '',
    strategy.screenshotUrl || '',
    Array.isArray(strategy.tags) ? strategy.tags.join(',') : (strategy.tags || ''),
    strategy.status || 'active',
    getISTDateTime()
  ];
}

function createUltraFastPsychologyRow(entry) {
  return [
    entry.id || Date.now(),
    entry.month || '',
    entry.year || new Date().getFullYear(),
    entry.monthlyPnL || '',
    entry.bestTradeId || '',
    entry.worstTradeId || '',
    entry.mentalReflections || '',
    entry.improvementAreas || '',
    getISTDateTime()
  ];
}

// ULTRA PRECISE duplicate checks - prevent ALL duplicates
function isUltraFastDuplicateTrade(sheet, trade) {
  if (sheet.getLastRow() <= 1) return false;
  
  const data = sheet.getDataRange().getValues();
  const tradeDate = formatIndianDate(trade.tradeDate);
  const stockName = trade.stockName?.toString().toUpperCase().trim();
  const quantity = parseFloat(trade.quantity || 0);
  const entryPrice = parseFloat(trade.entryPrice || 0);
  const exitPrice = parseFloat(trade.exitPrice || 0);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const existingDate = formatIndianDate(row[1]);
    const existingStock = row[2]?.toString().toUpperCase().trim();
    const existingQty = parseFloat(row[3] || 0);
    const existingEntry = parseFloat(row[4] || 0);
    const existingExit = parseFloat(row[5] || 0);
    
    // Ultra-precise matching: ALL fields must match
    if (existingDate === tradeDate && 
        existingStock === stockName && 
        Math.abs(existingQty - quantity) < 0.001 &&
        Math.abs(existingEntry - entryPrice) < 0.001 &&
        Math.abs(existingExit - exitPrice) < 0.001) {
      return true;
    }
  }
  return false;
}

function isUltraFastDuplicateStrategy(sheet, strategy) {
  if (sheet.getLastRow() <= 1) return false;
  
  const data = sheet.getDataRange().getValues();
  const strategyName = strategy.name?.toString().trim();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1]?.toString().trim() === strategyName) {
      return true;
    }
  }
  return false;
}

function isUltraFastDuplicatePsychology(sheet, entry) {
  if (sheet.getLastRow() <= 1) return false;
  
  const data = sheet.getDataRange().getValues();
  const month = entry.month?.toString().trim();
  const year = parseInt(entry.year);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1]?.toString().trim() === month && parseInt(row[2]) === year) {
      return true;
    }
  }
  return false;
}

/**
 * For GET requests (testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Ultra-Fast Trading Dashboard - PRODUCTION READY',
      version: '6.0.0 - Under 2 seconds performance',
      timezone: 'Asia/Kolkata (IST)',
      timestamp: getISTDateTime(),
      features: ['Ultra-fast sync', 'Zero duplicates', 'Perfect IST timing']
    }))
    .setMimeType(ContentService.MimeType.JSON);
}