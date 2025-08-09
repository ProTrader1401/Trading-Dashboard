import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trade } from "@shared/schema";
import { formatCurrency } from "@/lib/calculations";

interface PnLChartProps {
  trades: Trade[];
}

export default function PnLChart({ trades }: PnLChartProps) {
  // Group trades by date and calculate daily P&L
  const dailyData = trades.reduce((acc, trade) => {
    const date = trade.tradeDate;
    const pnl = parseFloat(trade.profitLoss?.toString() || "0");
    
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += pnl;
    
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(dailyData)
    .map(([date, pnl]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      pnl,
      profit: pnl > 0 ? pnl : 0,
      loss: pnl < 0 ? pnl : 0,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30); // Last 30 days

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className={`text-sm ${data.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
            P&L: {formatCurrency(data.pnl)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily P&L (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="profit"
                fill="hsl(142, 76%, 36%)"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="loss"
                fill="hsl(0, 84%, 60%)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
