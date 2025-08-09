import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { formatCurrency } from "@/lib/calculations";

interface MonthlyPerformanceChartProps {
  trades: any[];
}

export default function MonthlyPerformanceChart({ trades }: MonthlyPerformanceChartProps) {
  // Group trades by month and calculate monthly P&L
  const monthlyData = trades.reduce((acc, trade) => {
    const date = new Date(trade.tradeDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthLabel,
        pnl: 0,
        trades: 0,
        wins: 0,
        losses: 0,
      };
    }
    
    const pnl = parseFloat(trade.profitLoss?.toString() || "0");
    acc[monthKey].pnl += pnl;
    acc[monthKey].trades += 1;
    
    if (pnl > 0) {
      acc[monthKey].wins += 1;
    } else if (pnl < 0) {
      acc[monthKey].losses += 1;
    }
    
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .map((data: any) => ({
      ...data,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
      profit: data.pnl > 0 ? data.pnl : 0,
      loss: data.pnl < 0 ? data.pnl : 0,
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">
              P&L: <span className={data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(data.pnl)}
              </span>
            </p>
            <p className="text-sm">Trades: {data.trades}</p>
            <p className="text-sm">Win Rate: {data.winRate.toFixed(1)}%</p>
            <p className="text-sm">Wins: {data.wins} | Losses: {data.losses}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p>No monthly data available</p>
                <p className="text-sm">Add trades to see monthly performance</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="pnl"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  yAxisId="winRate"
                  orientation="right"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  yAxisId="pnl"
                  dataKey="profit"
                  fill="hsl(142, 76%, 36%)"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  yAxisId="pnl"
                  dataKey="loss"
                  fill="hsl(0, 84%, 60%)"
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  yAxisId="winRate"
                  type="monotone"
                  dataKey="winRate"
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(221, 83%, 53%)", strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}