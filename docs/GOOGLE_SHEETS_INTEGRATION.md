# Google Sheets Integration Guide

This guide will help you set up Google Sheets integration with your IntraDay Trading Dashboard for persistent data storage and synchronization.

## Overview

The integration allows your trading dashboard to automatically sync all your trading data, strategies, and psychology entries to Google Sheets for:
- **Persistent Storage**: Your data is safely stored in Google Sheets
- **Real-time Sync**: All changes are automatically synchronized
- **Data Analysis**: Use Google Sheets' powerful features for additional analysis
- **Backup & Export**: Easy data backup and export capabilities
- **Mobile Access**: View your data on mobile through Google Sheets app

## Prerequisites

- Google Account with Google Sheets access
- Basic understanding of Google Apps Script (we'll guide you through it)
- Your IntraDay Trading Dashboard running

## Step-by-Step Setup

### Step 1: Create Google Spreadsheet

1. **Go to Google Sheets**
   - Open [Google Sheets](https://sheets.google.com)
   - Click **"+ Blank"** to create a new spreadsheet

2. **Name Your Spreadsheet**
   - Click on "Untitled spreadsheet" at the top
   - Rename it to: **"IntraDay Trading Dashboard Data"**

3. **Get Your Spreadsheet ID**
   - Look at the URL in your browser
   - Copy the long string between `/d/` and `/edit`
   - Example: `https://docs.google.com/spreadsheets/d/1abcdefghijklmnopqrstuvwxyz123456789/edit`
   - Your ID is: `1abcdefghijklmnopqrstuvwxyz123456789`
   - **Save this ID - you'll need it later!**

### Step 2: Set Up Google Apps Script

1. **Open Apps Script**
   - In your Google Sheet, go to **Extensions > Apps Script**
   - This opens a new tab with Apps Script editor

2. **Replace Default Code**
   - Delete all existing code in the editor
   - Copy and paste the entire contents from `google-apps-script/Code.gs`

3. **Update Configuration (CRITICAL STEP)**
   - Find this line in the code:
   ```javascript
   SPREADSHEET_ID: '', // IMPORTANT: Replace with your actual Sheet ID
   ```
   - Replace the empty string with your Sheet ID from Step 1:
   ```javascript
   SPREADSHEET_ID: '1abcdefghijklmnopqrstuvwxyz123456789', // Your actual ID here
   ```

4. **Test Your Configuration**
   - In the function dropdown, select `testConfiguration`
   - Click **Run**
   - Check the logs - you should see ✅ success messages
   - If you see errors, double-check your Sheet ID

5. **Save Your Script**
   - Click **Save** (Ctrl+S)
   - Name your project: **"Trading Dashboard Sync"**

### Step 3: Deploy as Web App

1. **Deploy the Script**
   - Click **Deploy > New deployment**
   - Click the gear icon next to "Type" and select **"Web app"**

2. **Configure Deployment**
   - **Description**: "Trading Dashboard API v1.0"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
   - Click **Deploy**

3. **Authorize Permissions**
   - Google will ask for permissions
   - Click **Review permissions**
   - Choose your Google account
   - Click **Advanced** then **Go to Trading Dashboard Sync (unsafe)**
   - Click **Allow**

4. **Copy Web App URL**
   - After deployment, copy the **Web app URL**
   - It looks like: `https://script.google.com/macros/s/ABC123.../exec`
   - **Save this URL - you'll need it in your dashboard!**

### Step 4: Configure Your Dashboard

1. **Open Your Trading Dashboard**
   - Go to your running application
   - Navigate to **Settings** page

2. **Enter Integration Details**
   - **Google Sheet ID**: Paste your spreadsheet ID from Step 1
   - **Google Script URL**: Paste your web app URL from Step 3
   - Click **Save Settings**

3. **Test Connection**
   - Click **Test Connection** button
   - You should see: "✅ Connection successful"
   - If you see an error, double-check your URLs

### Step 5: Verify Data Sync

1. **Add a Test Trade**
   - Go to Dashboard and add a sample trade
   - Fill in basic details like:
     - Stock Name: RELIANCE
     - Quantity: 100
     - Entry Price: 2500
     - Date: Today

2. **Check Google Sheets**
   - Go back to your Google Sheet
   - You should see new tabs: "Trades", "Strategies", "Psychology"
   - Your test trade should appear in the "Trades" tab
   - Data should be formatted with colors and proper column widths

## Features & Functionality

### Automatic Data Sync
- **Real-time**: Data syncs immediately when you make changes
- **Bi-directional**: Changes sync from app to sheets
- **Robust**: Handles network failures gracefully

### Sheet Structure

#### Trades Sheet
- All your trading data with profit/loss color coding
- Green for profitable trades, red for losses
- Comprehensive trade details including psychology notes

#### Strategies Sheet  
- Your trading strategies with status indicators
- Active (green), Testing (yellow), Deprecated (red)
- Screenshots and performance tracking

#### Psychology Sheet
- Monthly reflection entries
- Links to best/worst trades
- Mental state tracking and improvement areas

### Advanced Features

#### Automatic Backups
- Creates timestamped backups automatically
- Backup sheets named: `Backup_YYYYMMDD_HHMMSS`
- Keeps historical snapshots of your data

#### Performance Analytics
- Built-in functions to calculate win rates
- P&L summaries and performance metrics
- Easy to extend with custom formulas

#### Error Handling
- Robust error handling and logging
- Detailed error messages for troubleshooting
- Automatic retry mechanisms

## Troubleshooting

### Common Issues

**❌ "Connection failed" Error**
- Check your Sheet ID is correct (no spaces or extra characters)
- Verify your Google Script URL is complete
- Make sure the Google Sheet is accessible

**❌ "Permission denied" Error**
- Re-deploy your Apps Script with "Anyone" access
- Check if script execution is enabled
- Verify you authorized all required permissions

**❌ Data not appearing in sheets**
- Refresh your Google Sheet browser tab
- Check the Apps Script logs for errors
- Verify your test data has required fields

**❌ Formatting issues**
- Clear and re-sync data from dashboard settings
- Check if sheet names match CONFIG settings
- Verify column headers are correct

### Advanced Troubleshooting

1. **Check Apps Script Logs**
   - Go to Apps Script editor
   - View > Logs
   - Look for error messages

2. **Test Script Manually**
   - In Apps Script, click Run
   - Check for any runtime errors
   - Verify permissions are granted

3. **Verify Sheet Permissions**
   - Make sure you own the Google Sheet
   - Check sharing settings if needed

## Performance Optimization

### For Large Datasets (>1000 trades)
- Enable automatic cleanup in CONFIG
- Use batch operations for bulk imports  
- Consider archiving old data periodically

### Network Optimization
- Sync happens asynchronously
- App remains responsive during sync
- Failed syncs are retried automatically

## Security Considerations

### Data Privacy
- Data is stored in your private Google Sheet
- Only you have access unless you share the sheet
- Apps Script runs under your Google account

### Access Control
- Web app is deployed with "Anyone" access for functionality
- Consider restricting to "Anyone with link" for added security
- Your Google account controls all access permissions

## Maintenance

### Regular Tasks
1. **Monthly Backup Review**: Check backup sheets are created
2. **Performance Check**: Verify sync speed and reliability  
3. **Data Validation**: Spot check data accuracy between app and sheets
4. **Script Updates**: Check for new versions or improvements

### Updates
When updating the dashboard:
1. Check if Google Apps Script needs updates
2. Test functionality after any changes
3. Backup your data before major updates

## API Reference

The Google Apps Script exposes these endpoints:

### POST /exec (Main endpoint)
**Sync Data:**
```json
{
  "action": "sync",
  "trades": [...],
  "strategies": [...],
  "psychologyEntries": [...]
}
```

**Test Connection:**
```json
{
  "action": "test"
}
```

**Create Backup:**
```json
{
  "action": "backup"
}
```

### Response Format
```json
{
  "success": true,
  "results": {
    "trades": 5,
    "strategies": 3,
    "psychology": 2
  },
  "timestamp": "2025-01-24T12:00:00.000Z"
}
```

## Support

If you encounter issues:

1. **Check this documentation** for common solutions
2. **Review Apps Script logs** for detailed error messages
3. **Test with minimal data** to isolate issues
4. **Verify permissions** are correctly set

Your trading data is now safely synced to Google Sheets with powerful analytics capabilities! 📊

---

**Next Steps:**
- Explore Google Sheets formulas for custom analysis
- Set up conditional formatting for better visualization
- Create charts and graphs for performance tracking
- Export data for tax reporting or external analysis

Happy Trading! 🚀