import { Trade } from "@shared/schema";

export function getAnalyticsReadyTrades(trades: Trade[], strategies: any[] = []): Trade[] {
  return trades.filter(trade => {
    // Only include trades that were actually taken
    if (!trade.isTradeTaken) return false;
    
    // If no strategies provided, include all taken trades
    if (strategies.length === 0) return true;
    
    // Find the strategy for this trade
    const strategy = strategies.find(s => s.name === trade.whichSetup);
    
    // Only include if strategy exists and is active
    return strategy && strategy.status === 'active';
  });
}

export function calculatePnL(entryPrice: number, exitPrice: number, quantity: number): number {
  // Handle string inputs and convert to numbers
  const entry = typeof entryPrice === 'string' ? parseFloat(entryPrice) : entryPrice;
  const exit = typeof exitPrice === 'string' ? parseFloat(exitPrice) : exitPrice;
  const qty = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  
  // Return 0 if any values are invalid
  if (isNaN(entry) || isNaN(exit) || isNaN(qty) || entry <= 0 || qty <= 0) {
    return 0;
  }
  
  return (exit - entry) * qty;
}

export function calculatePercentage(entryPrice: number, exitPrice: number): number {
  return ((exitPrice - entryPrice) / entryPrice) * 100;
}

export function calculateWinRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  
  const winningTrades = trades.filter(trade => {
    // Get P&L from field or calculate it
    let pnl = 0;
    if (trade.profitLoss) {
      pnl = typeof trade.profitLoss === 'string' ? parseFloat(trade.profitLoss) : trade.profitLoss;
    } else if (trade.entryPrice && trade.exitPrice && trade.quantity) {
      pnl = calculatePnL(
        parseFloat(trade.entryPrice.toString()),
        parseFloat(trade.exitPrice.toString()),
        parseFloat(trade.quantity.toString())
      );
    }
    return pnl > 0;
  });
  
  return (winningTrades.length / trades.length) * 100;
}

export function calculateTotalPnL(trades: Trade[]): number {
  return trades.reduce((total, trade) => {
    // First try to use profitLoss field if it exists and is valid
    if (trade.profitLoss) {
      const pnl = typeof trade.profitLoss === 'string' ? parseFloat(trade.profitLoss) : trade.profitLoss;
      if (!isNaN(pnl)) {
        return total + pnl;
      }
    }
    
    // If profitLoss is missing or invalid, calculate from entry/exit prices
    if (trade.entryPrice && trade.exitPrice && trade.quantity) {
      const calculatedPnL = calculatePnL(
        parseFloat(trade.entryPrice.toString()),
        parseFloat(trade.exitPrice.toString()), 
        parseFloat(trade.quantity.toString())
      );
      return total + calculatedPnL;
    }
    
    return total;
  }, 0);
}

export function calculateAverageWin(trades: Trade[]): number {
  const winningTrades = trades.filter(trade => 
    trade.profitLoss && parseFloat(trade.profitLoss.toString()) > 0
  );
  
  if (winningTrades.length === 0) return 0;
  
  const totalWins = winningTrades.reduce((total, trade) => 
    total + parseFloat(trade.profitLoss?.toString() || "0"), 0
  );
  
  return totalWins / winningTrades.length;
}

export function calculateAverageLoss(trades: Trade[]): number {
  const losingTrades = trades.filter(trade => 
    trade.profitLoss && parseFloat(trade.profitLoss.toString()) < 0
  );
  
  if (losingTrades.length === 0) return 0;
  
  const totalLosses = losingTrades.reduce((total, trade) => 
    total + parseFloat(trade.profitLoss?.toString() || "0"), 0
  );
  
  return totalLosses / losingTrades.length;
}

export function calculateMaxDrawdown(trades: Trade[]): number {
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnL = 0;
  
  trades.forEach(trade => {
    runningPnL += parseFloat(trade.profitLoss?.toString() || "0");
    
    if (runningPnL > peak) {
      peak = runningPnL;
    }
    
    const drawdown = peak - runningPnL;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });
  
  return maxDrawdown;
}



export function formatCurrency(amount: number | string): string {
  // Handle string inputs
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

export function getTradesByDateRange(trades: Trade[], startDate: string, endDate: string): Trade[] {
  return trades.filter(trade => {
    const tradeDate = new Date(trade.tradeDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return tradeDate >= start && tradeDate <= end;
  });
}

export function groupTradesByStrategy(trades: Trade[]): Record<string, Trade[]> {
  return trades.reduce((groups, trade) => {
    const strategy = trade.whichSetup || "No Strategy";
    if (!groups[strategy]) {
      groups[strategy] = [];
    }
    groups[strategy].push(trade);
    return groups;
  }, {} as Record<string, Trade[]>);
}

export function calculateProfitFactor(trades: Trade[], strategies: Strategy[] = []): number {
  const analyticsReadyTrades = getAnalyticsReadyTrades(trades, strategies);
  const winningTrades = analyticsReadyTrades.filter(trade => {
    let pnl = 0;
    if (trade.profitLoss) {
      pnl = typeof trade.profitLoss === 'string' ? parseFloat(trade.profitLoss) : trade.profitLoss;
    } else if (trade.entryPrice && trade.exitPrice && trade.quantity) {
      pnl = calculatePnL(
        parseFloat(trade.entryPrice.toString()),
        parseFloat(trade.exitPrice.toString()),
        parseFloat(trade.quantity.toString())
      );
    }
    return pnl > 0;
  });
  
  const losingTrades = analyticsReadyTrades.filter(trade => {
    let pnl = 0;
    if (trade.profitLoss) {
      pnl = typeof trade.profitLoss === 'string' ? parseFloat(trade.profitLoss) : trade.profitLoss;
    } else if (trade.entryPrice && trade.exitPrice && trade.quantity) {
      pnl = calculatePnL(
        parseFloat(trade.entryPrice.toString()),
        parseFloat(trade.exitPrice.toString()),
        parseFloat(trade.quantity.toString())
      );
    }
    return pnl < 0;
  });
  
  const totalProfits = winningTrades.reduce((total, trade) => {
    let pnl = 0;
    if (trade.profitLoss) {
      pnl = typeof trade.profitLoss === 'string' ? parseFloat(trade.profitLoss) : trade.profitLoss;
    } else if (trade.entryPrice && trade.exitPrice && trade.quantity) {
      pnl = calculatePnL(
        parseFloat(trade.entryPrice.toString()),
        parseFloat(trade.exitPrice.toString()),
        parseFloat(trade.quantity.toString())
      );
    }
    return total + Math.abs(pnl);
  }, 0);
  
  const totalLosses = losingTrades.reduce((total, trade) => {
    let pnl = 0;
    if (trade.profitLoss) {
      pnl = typeof trade.profitLoss === 'string' ? parseFloat(trade.profitLoss) : trade.profitLoss;
    } else if (trade.entryPrice && trade.exitPrice && trade.quantity) {
      pnl = calculatePnL(
        parseFloat(trade.entryPrice.toString()),
        parseFloat(trade.exitPrice.toString()),
        parseFloat(trade.quantity.toString())
      );
    }
    return total + Math.abs(pnl);
  }, 0);
  
  return totalLosses === 0 ? (totalProfits > 0 ? totalProfits : 0) : totalProfits / totalLosses;
}
