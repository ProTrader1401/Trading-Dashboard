import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTrades } from "@/hooks/use-trades";
import { useStrategies } from "@/hooks/use-strategies";
import { calculateTotalPnL, formatCurrency, groupTradesByStrategy, getAnalyticsReadyTrades } from "@/lib/calculations";

export default function QuickStats() {
  const { trades, isLoading: tradesLoading } = useTrades();
  const { strategies, isLoading: strategiesLoading } = useStrategies();

  if (tradesLoading || strategiesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const analyticsReadyTrades = getAnalyticsReadyTrades(trades, strategies);
  const avgTradeSize = analyticsReadyTrades.length > 0
    ? analyticsReadyTrades.reduce((sum, trade) => {
        const entryPrice = parseFloat(trade.entryPrice?.toString() || "0");
        return sum + (entryPrice * trade.quantity);
      }, 0) / analyticsReadyTrades.length
    : 0;

  const strategyPerformance = groupTradesByStrategy(trades, strategies);
  const bestStrategy = Object.entries(strategyPerformance)
    .map(([strategy, strategyTrades]) => ({
      strategy,
      pnl: calculateTotalPnL(strategyTrades, strategies),
    }))
    .sort((a, b) => b.pnl - a.pnl)[0];

  const worstStrategy = Object.entries(strategyPerformance)
    .map(([strategy, strategyTrades]) => ({
      strategy,
      pnl: calculateTotalPnL(strategyTrades, strategies),
    }))
    .sort((a, b) => a.pnl - b.pnl)[0];

  const activeStrategies = strategies.filter(s => s.status === "active").length;
  
  const currentMonth = new Date();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const tradingDaysThisMonth = new Set(
    trades
      .filter(trade => {
        const tradeDate = new Date(trade.tradeDate);
        return tradeDate.getMonth() === currentMonth.getMonth() && 
               tradeDate.getFullYear() === currentMonth.getFullYear();
      })
      .map(trade => trade.tradeDate)
  ).size;

  const targetProgress = Math.min((tradingDaysThisMonth / 22) * 100, 100); // Assuming 22 trading days per month

  const stats = [
    { label: "Avg Trade Size", value: formatCurrency(avgTradeSize) },
    { label: "Best Strategy", value: bestStrategy?.strategy || "None", color: "text-profit" },
    { label: "Worst Strategy", value: worstStrategy?.strategy || "None", color: "text-loss" },
    { label: "Active Strategies", value: activeStrategies.toString() },
    { label: "Trading Days", value: `${tradingDaysThisMonth}/22` },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</span>
              <span className={`font-semibold ${stat.color || 'text-gray-900 dark:text-gray-100'}`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-300">Monthly Target</span>
            <span className="text-gray-900 dark:text-gray-100">{Math.round(targetProgress)}%</span>
          </div>
          <Progress value={targetProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
