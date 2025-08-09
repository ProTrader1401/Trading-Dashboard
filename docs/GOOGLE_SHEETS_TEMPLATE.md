# Google Sheets Template Structure

This document outlines the exact structure and formatting that will be created in your Google Sheets when you integrate with the Trading Dashboard.

## Sheet Overview

Your Google Spreadsheet will automatically create 4 main sheets:

1. **Trades** - All your trading data
2. **Strategies** - Your trading strategies
3. **Psychology** - Monthly reflection entries
4. **Settings** - Configuration data

## 1. Trades Sheet Structure

### Column Headers (Row 1)
| Column | Header | Description | Data Type |
|--------|--------|-------------|-----------|
| A | ID | Unique trade identifier | Number |
| B | Trade Date | Date of the trade | Date (YYYY-MM-DD) |
| C | Stock Name | Stock symbol/name | Text |
| D | Quantity | Number of shares | Number |
| E | Entry Price | Price at which you entered | Decimal |
| F | Exit Price | Price at which you exited | Decimal |
| G | Stop Loss | Your stop loss price | Decimal |
| H | Target Price | Your target price | Decimal |
| I | P&L | Profit or Loss amount | Number |
| J | Setup Followed | Whether you followed your setup | TRUE/FALSE |
| K | Which Setup | Name of the strategy used | Text |
| L | Emotion | Your emotional state | Text |
| M | Notes | Trade notes | Text |
| N | Psychology Reflections | Mental analysis | Text |
| O | Screenshot Link | Link to trade screenshot | URL |
| P | Created At | When trade was added | DateTime |

### Formatting Features
- **Header Row**: Blue background (#4285f4) with white text
- **P&L Column**: 
  - Positive values: Light green background (#d9ead3) with dark green text (#137333)
  - Negative values: Light red background (#fce5cd) with dark red text (#d50000)
- **Frozen Header**: First row stays visible when scrolling
- **Auto-sized Columns**: Optimized widths for readability

### Sample Data Example
```
ID | Trade Date | Stock Name | Quantity | Entry Price | Exit Price | P&L    | Setup Followed | Which Setup      | Emotion
1  | 2024-01-15 | RELIANCE   | 100      | 2450.50     | 2475.25    | 2475   | TRUE           | Breakout Momentum| Confident
2  | 2024-01-15 | TCS        | 50       | 3580.00     | 3562.50    | -875   | TRUE           | Mean Reversion   | Neutral
```

## 2. Strategies Sheet Structure

### Column Headers (Row 1)
| Column | Header | Description | Data Type |
|--------|--------|-------------|-----------|
| A | ID | Unique strategy identifier | Number |
| B | Name | Strategy name | Text |
| C | Description | Detailed description | Text |
| D | Status | Current status | Text (active/testing/deprecated) |
| E | Tags | Strategy tags | Text (comma-separated) |
| F | Screenshot URL | Link to strategy screenshot | URL |
| G | Created At | When strategy was added | DateTime |

### Formatting Features
- **Header Row**: Green background (#34a853) with white text
- **Status Column**:
  - Active: Light green background (#d9ead3) with dark green text (#137333)
  - Testing: Light yellow background (#fff2cc) with dark yellow text (#bf9000)
  - Deprecated: Light red background (#fce5cd) with dark red text (#d50000)
- **Frozen Header**: First row stays visible when scrolling

### Sample Data Example
```
ID | Name              | Description                           | Status | Tags              | Created At
1  | Breakout Momentum | Trading breakouts above resistance    | active | momentum,breakout | 2024-01-15 10:30:00
2  | Mean Reversion    | Trading oversold stocks in uptrends   | testing| reversion,support | 2024-01-15 10:35:00
```

## 3. Psychology Sheet Structure

### Column Headers (Row 1)
| Column | Header | Description | Data Type |
|--------|--------|-------------|-----------|
| A | ID | Unique entry identifier | Number |
| B | Month | Month name | Text |
| C | Year | Year | Number |
| D | Monthly P&L | Total P&L for the month | Number |
| E | Best Trade ID | ID of best trade this month | Number |
| F | Worst Trade ID | ID of worst trade this month | Number |
| G | Mental Reflections | Psychological analysis | Text |
| H | Improvement Areas | Areas to improve | Text |
| I | Created At | When entry was added | DateTime |

### Formatting Features
- **Header Row**: Red background (#ea4335) with white text
- **Wide Columns**: Mental Reflections and Improvement Areas have extra width (300px)
- **Frozen Header**: First row stays visible when scrolling

### Sample Data Example
```
ID | Month   | Year | Monthly P&L | Best Trade ID | Mental Reflections                    | Improvement Areas
1  | January | 2024 | 5425        | 1             | Good discipline with risk management  | Need to work on position sizing
```

## 4. Backup Sheets

### Automatic Backup Creation
The system creates backup sheets with names like:
- `Backup_20240115_143052` (Format: Backup_YYYYMMDD_HHMMSS)

### Backup Content
Each backup contains:
1. **Header sections** for each main sheet (=== Trades ===, === Strategies ===, etc.)
2. **Complete data snapshot** from time of backup
3. **Timestamp** in Indian Standard Time (GMT+5:30)
4. **Formatted data** maintaining original structure

## Color Coding System

### Trade P&L Visualization
- 🟢 **Green**: Profitable trades (positive P&L)
- 🔴 **Red**: Loss trades (negative P&L)
- ⚪ **White**: Break-even or no data

### Strategy Status Visualization
- 🟢 **Green**: Active strategies (currently in use)
- 🟡 **Yellow**: Testing strategies (being evaluated)
- 🔴 **Red**: Deprecated strategies (no longer used)

## Performance Analytics

### Built-in Formulas You Can Add

**Win Rate Calculation:**
```
=COUNTIF(I:I,">0")/COUNTA(I:I)*100
```

**Total P&L:**
```
=SUM(I:I)
```

**Average Win:**
```
=AVERAGEIF(I:I,">0")
```

**Average Loss:**
```
=AVERAGEIF(I:I,"<0")
```

**Best Trading Day:**
```
=INDEX(B:B,MATCH(MAX(I:I),I:I,0))
```

**Most Traded Stock:**
```
=INDEX(C:C,MODE(MATCH(C:C,C:C,0)))
```

## Data Validation Rules

The sheets are configured with:

### Trades Sheet
- **Date Format**: YYYY-MM-DD only
- **Quantity**: Positive numbers only
- **Prices**: Decimal numbers with 2 decimal places
- **Setup Followed**: TRUE/FALSE dropdown
- **Emotion**: Predefined list (Confident, Neutral, Fearful, Excited, Anxious)

### Strategies Sheet
- **Status**: Dropdown (active, testing, deprecated)
- **Name**: Required field, no duplicates

### Psychology Sheet
- **Month**: Dropdown of month names
- **Year**: Current year ± 5 years range
- **Trade IDs**: Must reference existing trade IDs

## Mobile Responsiveness

### Google Sheets Mobile App
- **Optimized Column Widths**: Readable on mobile devices
- **Frozen Headers**: Always visible while scrolling
- **Color Coding**: Maintained across all devices
- **Touch-Friendly**: Easy editing on tablets and phones

### Offline Access
- **Google Sheets Mobile**: Works offline with sync when online
- **Data Integrity**: Changes merge seamlessly
- **Real-time Updates**: Instant sync across all devices

## Advanced Features

### Conditional Formatting Examples

**Highlight Winning Streaks:**
```
Custom Formula: =AND(I2>0,I1>0,I3>0)
Format: Green background
```

**Mark Large Losses:**
```
Custom Formula: =I2<-1000
Format: Red background, bold text
```

**Strategy Performance Tracking:**
```
Custom Formula: =COUNTIF($K$2:$K,"Breakout Momentum")
Format: Border highlight
```

### Data Import/Export

**Export Options:**
- CSV for external analysis
- PDF for reporting
- Excel format for advanced analysis

**Import Capabilities:**
- CSV data import
- Copy-paste from other sheets
- Google Forms integration possible

## Security & Privacy

### Access Control
- **Private by Default**: Only you can access unless shared
- **Granular Permissions**: View-only, edit, or comment access
- **Link Sharing**: Control who can access via links
- **Audit Trail**: Google maintains access logs

### Data Backup
- **Google's Infrastructure**: Enterprise-grade backup
- **Version History**: Access previous versions
- **Recovery Options**: Restore from any point in time
- **Export Capability**: Download your data anytime

## Performance Considerations

### Large Dataset Handling
- **Optimized for 10,000+ trades**
- **Efficient formulas** avoid circular references
- **Indexed lookups** for fast performance
- **Automatic cleanup** of temporary data

### Sync Performance
- **Batch Operations**: Multiple trades sync together
- **Delta Updates**: Only changes are transmitted
- **Error Recovery**: Failed syncs are retried
- **Network Resilience**: Works on slow connections

This template ensures your trading data is organized, accessible, and ready for analysis in Google Sheets! 📊