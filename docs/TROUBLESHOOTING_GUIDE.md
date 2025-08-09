# Troubleshooting Guide

This guide helps you resolve common issues with your IntraDay Trading Dashboard and Google Sheets integration.

## Google Apps Script Errors

### Error: "Cannot read properties of undefined (reading 'getSheetByName')"

**Cause:** The Google Apps Script cannot access your spreadsheet because the SPREADSHEET_ID is not configured correctly.

**Solution:**
1. **Get Your Correct Spreadsheet ID**
   - Open your Google Sheet in browser
   - Look at the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`
   - Copy the long string between `/d/` and `/edit`

2. **Update Your Google Apps Script**
   - Go to your Apps Script editor
   - Find this line in Code.gs:
   ```javascript
   SPREADSHEET_ID: '', // IMPORTANT: Replace with your actual Sheet ID
   ```
   - Replace the empty string with your actual ID:
   ```javascript
   SPREADSHEET_ID: '1abcdefghijklmnopqrstuvwxyz123456789',
   ```

3. **Test Your Configuration**
   - In Apps Script editor, click on function dropdown
   - Select `testConfiguration`
   - Click Run
   - Check the logs - you should see ✅ success messages

### Error: "Cannot access spreadsheet with ID"

**Cause:** Your Google account doesn't have permission to access the spreadsheet.

**Solution:**
1. **Check Spreadsheet Ownership**
   - Make sure you own the Google Sheet
   - Or make sure it's shared with your Google account

2. **Verify Permissions**
   - Open the Google Sheet directly
   - Confirm you can edit it
   - If not, contact the owner for edit permissions

### Error: "Script function not found: doPost"

**Cause:** The Google Apps Script deployment is outdated or incorrect.

**Solution:**
1. **Redeploy the Web App**
   - Go to Deploy > Manage deployments
   - Click pencil icon to edit
   - Create new version
   - Click Deploy

2. **Check Deployment Settings**
   - Execute as: Me
   - Who has access: Anyone
   - Save the new Web App URL

## Dashboard Connection Issues

### Error: "Connection failed" in Dashboard Settings

**Possible Causes & Solutions:**

#### Wrong Google Script URL
- Check your Web App URL from Apps Script deployment
- Should look like: `https://script.google.com/macros/s/ABC123.../exec`
- Must end with `/exec`, not `/dev`

#### Google Apps Script Not Deployed
1. Go to your Apps Script project
2. Click Deploy > New deployment
3. Select Web app type
4. Set proper permissions
5. Copy the new URL to your dashboard

#### Network/Firewall Issues
- Try testing the connection from a different network
- Check if your organization blocks Google Apps Script

### Error: "Google Script URL not configured"

**Solution:**
1. Go to Dashboard Settings page
2. Enter your Google Apps Script Web App URL
3. Enter your Google Sheets ID
4. Click Test Connection

## Data Sync Issues

### Data Not Appearing in Google Sheets

**Check These Steps:**

1. **Verify Integration Setup**
   ```bash
   # Test the connection from your dashboard
   curl -X POST http://localhost:5000/api/test-google-connection
   ```

2. **Check Apps Script Logs**
   - Go to Apps Script editor
   - View > Logs
   - Look for error messages

3. **Force Manual Sync**
   ```bash
   # Force a sync from your backend
   curl -X POST http://localhost:5000/api/sync-to-sheets
   ```

4. **Verify Data in Dashboard**
   ```bash
   # Check if data exists in the app
   curl -X GET http://localhost:5000/api/trades
   ```

### Slow Sync Performance

**Optimizations:**

1. **Reduce Data Volume**
   - Archive old trades periodically
   - Limit sync to recent data only

2. **Check Network Connection**
   - Google Sheets API can be slow on poor connections
   - Consider sync during off-peak hours

3. **Monitor Timeouts**
   - Current timeout is 15 seconds for automatic sync
   - 30 seconds for manual sync
   - Increase if needed for large datasets

## Backend Performance Issues

### High Memory Usage

**Check Current Usage:**
```bash
curl -X GET http://localhost:5000/api/health
```

**Solutions:**
1. **Restart the Application**
   ```bash
   npm run dev
   ```

2. **Reduce Demo Data**
   - Remove excessive demo trades
   - Keep only essential test data

3. **Monitor Growth**
   - Large number of trades (>10,000) may require optimization
   - Consider data archiving strategies

### Slow API Responses

**Benchmark Performance:**
```bash
# Test response times
time curl -X GET http://localhost:5000/api/trades
time curl -X GET http://localhost:5000/api/analytics/summary
```

**Expected Response Times:**
- Health check: < 10ms
- Get trades: < 50ms  
- Analytics: < 200ms
- Create trade: < 100ms

**Solutions for Slow Responses:**
1. **Check Data Volume**
   - Large datasets may slow down operations
   - Consider pagination for large trade lists

2. **Verify System Resources**
   - Ensure adequate RAM available
   - Check CPU usage during operations

3. **Optimize Queries**
   - Date-based filtering is most efficient
   - Avoid complex analytics on large datasets

## Common Setup Mistakes

### Mistake 1: Using Development URL Instead of Deployment URL

**Wrong:**
```
https://script.google.com/macros/d/ABC123.../edit
```

**Correct:**
```
https://script.google.com/macros/s/ABC123.../exec
```

### Mistake 2: Incorrect Spreadsheet ID

**Wrong:** Using the entire URL
```
https://docs.google.com/spreadsheets/d/1ABC123.../edit#gid=0
```

**Correct:** Only the ID part
```
1ABC123DEF456GHI789JKL012MNO345PQR678STU901
```

### Mistake 3: Insufficient Permissions

**Apps Script Permissions:**
- Execute as: Me (your-email@gmail.com)
- Who has access: Anyone
- Required for external API calls

**Google Sheets Permissions:**
- You must own the sheet OR have edit access
- Sharing settings should allow your Apps Script to access

## Testing Your Setup

### Step 1: Test Apps Script Directly

1. Open your Apps Script project
2. Select `testConfiguration` function
3. Click Run
4. Check logs for success messages

### Step 2: Test Connection from Dashboard

1. Go to Settings page in your dashboard
2. Enter your URLs
3. Click "Test Connection"
4. Should show: "✅ Connection successful"

### Step 3: Test Data Flow

1. Add a test trade in your dashboard
2. Check if it appears in Google Sheets
3. Verify formatting and data accuracy

### Step 4: Performance Test

```bash
# Test multiple operations
curl -X GET http://localhost:5000/api/health
curl -X GET http://localhost:5000/api/trades
curl -X POST http://localhost:5000/api/test-google-connection
```

## Getting Help

### Information to Collect

When seeking help, provide:

1. **Error Messages**
   - Exact error text from browser console
   - Apps Script execution logs
   - Server logs from terminal

2. **Configuration Details**
   - Google Sheets URL (without exposing ID)
   - Apps Script deployment type
   - Browser and version

3. **Steps to Reproduce**
   - What you clicked/entered
   - Expected vs actual behavior
   - When the issue started

### Diagnostic Commands

```bash
# Check server health
curl -X GET http://localhost:5000/api/health

# Test Google connection
curl -X POST http://localhost:5000/api/test-google-connection

# Check data integrity
curl -X GET http://localhost:5000/api/trades | jq length

# View server logs
npm run dev | grep -E "(error|failed|timeout)"
```

### Logs to Check

1. **Browser Console** (F12 > Console)
   - JavaScript errors
   - Network request failures

2. **Apps Script Logs** (View > Logs)
   - Execution errors
   - Permission issues

3. **Server Terminal**
   - API request logs
   - Sync status messages
   - Performance metrics

## Emergency Recovery

### If Data Appears Lost

1. **Check Google Sheets Backup**
   - Look for `Backup_YYYYMMDD_HHMMSS` sheets
   - Data may be in backup sheets

2. **Restart Services**
   ```bash
   # Restart your dashboard
   npm run dev
   
   # Re-deploy Apps Script if needed
   ```

3. **Verify Data Sources**
   - Check if trades exist in dashboard API
   - Confirm Google Sheets permissions
   - Test sync functionality

### If Integration Completely Fails

1. **Work Offline**
   - Dashboard works without Google Sheets
   - Data stored in memory during session
   - Export data manually when fixed

2. **Create New Integration**
   - Create fresh Google Sheet
   - Deploy new Apps Script
   - Update dashboard settings

3. **Data Recovery**
   - Export existing data via API
   - Import to new Google Sheets setup
   - Verify data integrity

Remember: Your trading data is primarily stored in Google Sheets, so it's safe even if the dashboard has temporary issues!