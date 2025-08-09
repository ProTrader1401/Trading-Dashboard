import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Target, Calendar, Award, AlertTriangle } from "lucide-react";
import PnLChart from "@/components/charts/pnl-chart";
import WinRateChart from "@/components/charts/win-rate-chart";
import EquityCurve from "@/components/charts/equity-curve";
import MonthlyPerformanceChart from "@/components/charts/monthly-performance-chart";
import StrategyBreakdownChart from "@/components/charts/strategy-breakdown-chart";
import EmotionAnalysisChart from "@/components/charts/emotion-analysis-chart";
import { useTrades } from "@/hooks/use-trades";
import { useStrategies } from "@/hooks/use-strategies";
import {
  calculateTotalPnL,
  calculateWinRate,
  calculateAverageWin,
  calculateAverageLoss,
  calculateMaxDrawdown,
  calculateProfitFactor,
  formatCurrency,
  formatPercentage,
  groupTradesByStrategy,
} from "@/lib/calculations";

export default function Analytics() {
  const { trades, isLoading } = useTrades();
  const { strategies } = useStrategies();
  const [timeRange, setTimeRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Filter trades based on selected time range
  const filteredTrades = useMemo(() => {
    if (timeRange === "all") return trades;
    
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        if (!customStartDate || !customEndDate) return trades;
        return trades.filter(trade => {
          const tradeDate = new Date(trade.tradeDate);
          return tradeDate >= new Date(customStartDate) && tradeDate <= new Date(customEndDate);
        });
      default:
        return trades;
    }
    
    return trades.filter(trade => new Date(trade.tradeDate) >= startDate);
  }, [trades, timeRange, customStartDate, customEndDate]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    );
  }

  const totalPnL = calculateTotalPnL(filteredTrades);
  const winRate = calculateWinRate(filteredTrades, strategies);
  const avgWin = calculateAverageWin(filteredTrades, strategies);
  const avgLoss = calculateAverageLoss(filteredTrades, strategies);
  const maxDrawdown = calculateMaxDrawdown(filteredTrades, strategies);
  const profitFactor = calculateProfitFactor(filteredTrades, strategies);

  const strategyGroups = groupTradesByStrategy(filteredTrades, strategies);
  const strategyPerformance = Object.entries(strategyGroups).map(([strategy, strategyTrades]) => ({
    strategy,
    trades: strategyTrades.length,
    pnl: calculateTotalPnL(strategyTrades, strategies),
    winRate: calculateWinRate(strategyTrades, strategies),
  }));

  // Additional analytics
  const analyticsReadyTrades = filteredTrades.filter(t => t.isTradeTaken && (!t.whichSetup || strategies.find(s => s.name === t.whichSetup)?.status === 'active'));
  const winningTrades = analyticsReadyTrades.filter(t => parseFloat(t.profitLoss?.toString() || "0") > 0);
  const losingTrades = analyticsReadyTrades.filter(t => parseFloat(t.profitLoss?.toString() || "0") < 0);
  const bestTrade = filteredTrades.reduce((best, trade) => {
    const pnl = parseFloat(trade.profitLoss?.toString() || "0");
    const bestPnl = parseFloat(best?.profitLoss?.toString() || "0");
    return pnl > bestPnl ? trade : best;
  }, filteredTrades[0]);
  const worstTrade = filteredTrades.reduce((worst, trade) => {
    const pnl = parseFloat(trade.profitLoss?.toString() || "0");
    const worstPnl = parseFloat(worst?.profitLoss?.toString() || "0");
    return pnl < worstPnl ? trade : worst;
  }, filteredTrades[0]);

  // Risk metrics
  const avgTradeSize = analyticsReadyTrades.length > 0 
    ? analyticsReadyTrades.reduce((sum, trade) => {
        const entryPrice = parseFloat(trade.entryPrice?.toString() || "0");
        return sum + (entryPrice * trade.quantity);
      }, 0) / analyticsReadyTrades.length
    : 0;

  const sharpeRatio = calculateSharpeRatio(analyticsReadyTrades);
  const maxConsecutiveLosses = calculateMaxConsecutiveLosses(analyticsReadyTrades);
  const maxConsecutiveWins = calculateMaxConsecutiveWins(analyticsReadyTrades);
  const metrics = [
    {
      title: "Total P&L",
      value: formatCurrency(totalPnL),
      color: totalPnL >= 0 ? "text-profit" : "text-loss",
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      change: totalPnL >= 0 ? "+15.2%" : "-8.4%",
      bgColor: totalPnL >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: "Win Rate",
      value: formatPercentage(winRate),
      color: "text-gray-900",
      icon: Target,
      change: winRate >= 60 ? "Excellent" : winRate >= 50 ? "Good" : "Needs Work",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Profit Factor",
      value: profitFactor.toFixed(2),
      color: profitFactor >= 1.5 ? "text-profit" : profitFactor >= 1 ? "text-warning" : "text-loss",
      icon: Award,
      change: profitFactor >= 1.5 ? "Strong" : profitFactor >= 1 ? "Positive" : "Weak",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: "Max Drawdown",
      value: formatCurrency(maxDrawdown),
      color: "text-loss",
      icon: AlertTriangle,
      change: "Risk metric",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Comprehensive trading performance analysis</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select defaultValue="all" onValueChange={(value) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {timeRange === 'custom' && (
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                placeholder="Start Date"
                className="w-36 text-gray-900 dark:text-gray-100 cursor-pointer"
                max={new Date().toISOString().split('T')[0]}
              />
              <span className="text-gray-500">to</span>
              <Input
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                placeholder="End Date"
                className="w-36 text-gray-900 dark:text-gray-100 cursor-pointer"
                min={customStartDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
      >
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                    <metric.icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {metric.change}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Enhanced Charts with Tabs */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PnLChart trades={filteredTrades} />
            <WinRateChart trades={filteredTrades} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <EquityCurve trades={filteredTrades} />
          </motion.div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-8">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MonthlyPerformanceChart trades={filteredTrades} />
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Best Trade</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {bestTrade ? formatCurrency(parseFloat(bestTrade.profitLoss?.toString() || "0")) : "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">{bestTrade?.stockName}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Worst Trade</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {worstTrade ? formatCurrency(parseFloat(worstTrade.profitLoss?.toString() || "0")) : "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">{worstTrade?.stockName}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Win Rate Progress</span>
                      <span>{formatPercentage(winRate)}</span>
                    </div>
                    <Progress value={winRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Profit Factor</span>
                      <span>{profitFactor.toFixed(2)}</span>
                    </div>
                    <Progress value={Math.min(profitFactor * 33.33, 100)} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="strategies" className="space-y-8">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <StrategyBreakdownChart trades={filteredTrades} />
            <Card>
              <CardHeader>
                <CardTitle>Strategy Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {strategyPerformance
                    .sort((a, b) => b.pnl - a.pnl)
                    .slice(0, 5)
                    .map((strategy, index) => (
                      <div key={strategy.strategy} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{strategy.strategy}</p>
                            <p className="text-sm text-gray-500">{strategy.trades} trades</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${strategy.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(strategy.pnl)}
                          </p>
                          <p className="text-sm text-gray-500">{formatPercentage(strategy.winRate)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="psychology" className="space-y-8">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <EmotionAnalysisChart trades={filteredTrades} />
            <Card>
              <CardHeader>
                <CardTitle>Trading Psychology Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Best Trade</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {maxConsecutiveWins}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">Max Loss Streak</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                      {maxConsecutiveLosses}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Average Trade Size</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(avgTradeSize)}</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Sharpe Ratio</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{sharpeRatio.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Strategy Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {strategyPerformance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No strategy data available</p>
              <p className="text-sm">Add strategies to your trades to see performance breakdown</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Strategy</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Trades</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Win Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {strategyPerformance.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{item.strategy}</td>
                      <td className="py-3 px-4">{item.trades}</td>
                      <td className="py-3 px-4">{formatPercentage(item.winRate)}</td>
                      <td className={`py-3 px-4 font-medium ${item.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(item.pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Trade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Winning Trades</span>
                <span className="font-medium text-profit">
                  {winningTrades.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Losing Trades</span>
                <span className="font-medium text-loss">
                  {losingTrades.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Average Win</span>
                <span className="font-medium text-profit">{formatCurrency(avgWin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Average Loss</span>
                <span className="font-medium text-loss">{formatCurrency(avgLoss)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total Trades</span>
                <span className="font-medium">{filteredTrades.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Profit Factor</span>
                <span className={`font-medium ${profitFactor >= 1.5 ? 'text-profit' : profitFactor >= 1 ? 'text-warning' : 'text-loss'}`}>
                  {profitFactor.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Max Drawdown</span>
                <span className="font-medium text-loss">{formatCurrency(maxDrawdown)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Best Trade</span>
                <span className="font-medium text-profit">
                  {bestTrade ? formatCurrency(parseFloat(bestTrade.profitLoss?.toString() || "0")) : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// Helper functions for additional analytics
function calculateSharpeRatio(trades: any[]): number {
  if (trades.length === 0) return 0;
  
  const returns = trades.map(trade => parseFloat(trade.profitLoss?.toString() || "0"));
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev === 0 ? 0 : avgReturn / stdDev;
}

function calculateMaxConsecutiveLosses(trades: any[]): number {
  let maxLosses = 0;
  let currentLosses = 0;
  
  trades.forEach(trade => {
    const pnl = parseFloat(trade.profitLoss?.toString() || "0");
    if (pnl < 0) {
      currentLosses++;
      maxLosses = Math.max(maxLosses, currentLosses);
    } else {
      currentLosses = 0;
    }
  });
  
  return maxLosses;
}

function calculateMaxConsecutiveWins(trades: any[]): number {
  let maxWins = 0;
  let currentWins = 0;
  
  trades.forEach(trade => {
    const pnl = parseFloat(trade.profitLoss?.toString() || "0");
    if (pnl > 0) {
      currentWins++;
      maxWins = Math.max(maxWins, currentWins);
    } else {
      currentWins = 0;
    }
  });
  
  return maxWins;
}