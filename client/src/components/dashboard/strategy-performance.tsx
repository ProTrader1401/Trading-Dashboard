import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useStrategies } from "@/hooks/use-strategies";
import { useTrades } from "@/hooks/use-trades";
import { calculateTotalPnL, calculateWinRate, formatCurrency, formatPercentage, getAnalyticsReadyTrades } from "@/lib/calculations";

export default function StrategyPerformance() {
  const { strategies, isLoading: strategiesLoading } = useStrategies();
  const { trades, isLoading: tradesLoading } = useTrades();

  if (strategiesLoading || tradesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategy Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStrategyStats = (strategyName: string) => {
    const strategyTrades = getAnalyticsReadyTrades(trades, strategies).filter(trade => trade.whichSetup === strategyName);
    return {
      trades: strategyTrades.length,
      winRate: calculateWinRate(strategyTrades, strategies),
      pnl: calculateTotalPnL(strategyTrades, strategies),
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Strategy Performance</CardTitle>
          <div className="flex items-center space-x-2">
            <Select defaultValue="7days">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/strategies">
              <Button variant="ghost" size="sm">
                Manage Strategies <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {strategies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No strategies found</p>
            <p className="text-sm">Create your first strategy to track performance</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.slice(0, 6).map((strategy) => {
              const stats = getStrategyStats(strategy.name);
              
              return (
                <div
                  key={strategy.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{strategy.name}</h3>
                    <Badge 
                      variant={strategy.status === "active" ? "default" : strategy.status === "testing" ? "secondary" : "destructive"}
                    >
                      {strategy.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Trades</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{stats.trades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Win Rate</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatPercentage(stats.winRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">P&L</span>
                      <span className={`text-sm font-medium ${stats.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {formatCurrency(stats.pnl)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
