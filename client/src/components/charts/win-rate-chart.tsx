import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Trade } from "@shared/schema";

interface WinRateChartProps {
  trades: Trade[];
}

export default function WinRateChart({ trades }: WinRateChartProps) {
  const winningTrades = trades.filter(trade => 
    parseFloat(trade.profitLoss?.toString() || "0") > 0
  ).length;
  
  const losingTrades = trades.filter(trade => 
    parseFloat(trade.profitLoss?.toString() || "0") < 0
  ).length;

  const breakEvenTrades = trades.length - winningTrades - losingTrades;

  const data = [
    { name: "Winning", value: winningTrades, color: "hsl(142, 76%, 36%)" },
    { name: "Losing", value: losingTrades, color: "hsl(0, 84%, 60%)" },
    { name: "Break Even", value: breakEvenTrades, color: "hsl(45, 93%, 47%)" },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / trades.length) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">
            {data.value} trades ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Win Rate Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 flex items-center justify-center">
          {trades.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>No trades data available</p>
              <p className="text-sm">Add some trades to see the distribution</p>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              <div className="flex-1 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="ml-8 space-y-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{winRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Win Rate</p>
                </div>
                
                <div className="space-y-2">
                  {data.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
