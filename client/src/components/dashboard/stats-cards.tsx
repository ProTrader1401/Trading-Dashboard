import { TrendingUp, TrendingDown, Target, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTrades } from "@/hooks/use-trades";
import { useStrategies } from "@/hooks/use-strategies";
import { calculateTotalPnL, calculateWinRate, formatCurrency, formatPercentage } from "@/lib/calculations";
import { getTradesByDateRange } from "@/lib/calculations";

export default function StatsCards() {
  const { trades, isLoading } = useTrades();
  const { strategies } = useStrategies();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="stats-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todaysTrades = trades.filter(trade => {
    const tradeDate = new Date(trade.tradeDate).toISOString().split('T')[0];
    return tradeDate === today;
  });
  const todaysPnL = calculateTotalPnL(todaysTrades);

  const thisMonth = new Date();
  const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0).toISOString().split('T')[0];
  const monthlyTrades = getTradesByDateRange(trades, monthStart, monthEnd);
  const monthlyPnL = calculateTotalPnL(monthlyTrades, strategies);
  const winRate = calculateWinRate(trades, strategies);

  const stats = [
    {
      title: "Today's P&L",
      value: formatCurrency(todaysPnL),
      change: todaysPnL >= 0 ? "+2.3% from yesterday" : "-2.3% from yesterday",
      icon: todaysPnL >= 0 ? TrendingUp : TrendingDown,
      iconBg: todaysPnL >= 0 ? "bg-green-100" : "bg-red-100",
      iconColor: todaysPnL >= 0 ? "text-profit" : "text-loss",
      valueColor: todaysPnL >= 0 ? "text-profit" : "text-loss",
    },
    {
      title: "Total Trades",
      value: trades.length.toString(),
      change: `${monthlyTrades.length} this month`,
      icon: Target,
      iconBg: "bg-blue-100",
      iconColor: "text-primary",
      valueColor: "text-visible",
    },
    {
      title: "Win Rate",
      value: formatPercentage(winRate),
      change: `${trades.filter(t => t.profitLoss && parseFloat(t.profitLoss.toString()) > 0).length} wins / ${trades.filter(t => t.profitLoss && parseFloat(t.profitLoss.toString()) < 0).length} losses`,
      icon: Target,
      iconBg: "bg-yellow-100",
      iconColor: "text-warning",
      valueColor: "text-visible",
    },
    {
      title: "Monthly P&L",
      value: formatCurrency(monthlyPnL),
      change: monthlyPnL >= 0 ? "+15.2% this month" : "-15.2% this month",
      icon: Calendar,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      valueColor: monthlyPnL >= 0 ? "text-profit" : "text-loss",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.valueColor} dark:text-gray-100`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} dark:bg-opacity-20 rounded-lg flex items-center justify-center transition-colors duration-300`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
