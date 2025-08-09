import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trade } from "@shared/schema";
import { formatCurrency } from "@/lib/calculations";

interface EquityCurveProps {
  trades: Trade[];
}

export default function EquityCurve({ trades }: EquityCurveProps) {
  // Sort trades by date and calculate cumulative P&L
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime()
  );

  let cumulativePnL = 0;
  const equityData = sortedTrades.map((trade, index) => {
    cumulativePnL += parseFloat(trade.profitLoss?.toString() || "0");
    return {
      date: new Date(trade.tradeDate).toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric" 
      }),
      equity: cumulativePnL,
      tradeNumber: index + 1,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm">Trade #{data.tradeNumber}</p>
          <p className="text-sm">
            Equity: <span className={data.equity >= 0 ? 'text-profit' : 'text-loss'}>
              {formatCurrency(data.equity)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const maxEquity = Math.max(...equityData.map(d => d.equity));
  const minEquity = Math.min(...equityData.map(d => d.equity));
  const currentEquity = equityData[equityData.length - 1]?.equity || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Equity Curve</CardTitle>
          <div className="text-right">
            <p className="text-sm text-gray-600">Current Equity</p>
            <p className={`text-lg font-bold ${currentEquity >= 0 ? 'text-profit' : 'text-loss'}`}>
              {formatCurrency(currentEquity)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {equityData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p>No equity data available</p>
                <p className="text-sm">Add some trades to see your equity curve</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityData}>
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
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(221, 83%, 53%)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(221, 83%, 53%)", strokeWidth: 2 }}
                />
                {/* Add a zero line */}
                <Line
                  type="monotone"
                  dataKey={() => 0}
                  stroke="#e5e7eb"
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Summary Stats */}
        {equityData.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Peak Equity</p>
              <p className="font-medium text-profit">{formatCurrency(maxEquity)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valley Equity</p>
              <p className="font-medium text-loss">{formatCurrency(minEquity)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Trades</p>
              <p className="font-medium">{equityData.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Drawdown</p>
              <p className="font-medium text-loss">
                {formatCurrency(maxEquity - currentEquity)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
