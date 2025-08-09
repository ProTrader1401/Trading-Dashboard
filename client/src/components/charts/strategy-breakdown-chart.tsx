import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency, groupTradesByStrategy, calculateTotalPnL } from "@/lib/calculations";

interface StrategyBreakdownChartProps {
  trades: any[];
}

const COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(221, 83%, 53%)",
  "hsl(0, 84%, 60%)",
  "hsl(45, 93%, 47%)",
  "hsl(280, 65%, 60%)",
  "hsl(160, 60%, 45%)",
];

export default function StrategyBreakdownChart({ trades }: StrategyBreakdownChartProps) {
  const strategyGroups = groupTradesByStrategy(trades);
  
  const strategyData = Object.entries(strategyGroups).map(([strategy, strategyTrades], index) => ({
    strategy: strategy === "No Strategy" ? "Unassigned" : strategy,
    trades: strategyTrades.length,
    pnl: calculateTotalPnL(strategyTrades),
    color: COLORS[index % COLORS.length],
    percentage: (strategyTrades.length / trades.length) * 100,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.strategy}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">Trades: {data.trades} ({data.percentage.toFixed(1)}%)</p>
            <p className="text-sm">
              P&L: <span className={data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(data.pnl)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {strategyData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p>No strategy data available</p>
                <p className="text-sm">Add strategies to your trades</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between h-full">
              <div className="flex-1 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={strategyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="trades"
                    >
                      {strategyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="ml-6 space-y-3 max-w-xs">
                <h4 className="font-semibold text-gray-900">Strategy Legend</h4>
                {strategyData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between space-x-3">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium truncate max-w-[120px]" title={item.strategy}>
                        {item.strategy}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.trades}</p>
                      <p className={`text-xs ${item.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.pnl)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}