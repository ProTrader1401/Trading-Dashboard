import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency, calculateTotalPnL } from "@/lib/calculations";
import { Trade } from "@shared/schema";

interface EmotionAnalysisChartProps {
  trades: any[];
}

const EMOTION_COLORS = {
  Confident: "hsl(142, 76%, 36%)",
  Neutral: "hsl(210, 40%, 60%)",
  Anxious: "hsl(0, 84%, 60%)",
  Excited: "hsl(45, 93%, 47%)",
  Fearful: "hsl(0, 70%, 50%)",
  Greedy: "hsl(280, 65%, 60%)",
  Disciplined: "hsl(160, 60%, 45%)",
};

export default function EmotionAnalysisChart({ trades }: EmotionAnalysisChartProps) {
  // Group trades by emotion
  const emotionGroups = trades.reduce((acc, trade) => {
    const emotion = trade.emotion || "Unknown";
    if (!acc[emotion]) {
      acc[emotion] = [];
    }
    acc[emotion].push(trade);
    return acc;
  }, {} as Record<string, any[]>);

  const emotionData = Object.entries(emotionGroups).map(([emotion, emotionTrades]) => {
  const tradesArr = emotionTrades as Trade[];

  const pnl = calculateTotalPnL(tradesArr);
  const winningTrades = tradesArr.filter(
    (t) => parseFloat(t.profitLoss?.toString() || "0") > 0
  ).length;
  const winRate = tradesArr.length > 0 ? (winningTrades / tradesArr.length) * 100 : 0;

  return {
    emotion,
    trades: tradesArr.length,
    pnl,
    winRate,
    avgPnL: tradesArr.length > 0 ? pnl / tradesArr.length : 0,
    color: EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS] || "hsl(210, 40%, 60%)",
  };
}).sort((a, b) => b.pnl - a.pnl);


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">Trades: {data.trades}</p>
            <p className="text-sm">
              Total P&L: <span className={data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(data.pnl)}
              </span>
            </p>
            <p className="text-sm">
              Avg P&L: <span className={data.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(data.avgPnL)}
              </span>
            </p>
            <p className="text-sm">Win Rate: {data.winRate.toFixed(1)}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emotion Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {emotionData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p>No emotion data available</p>
                <p className="text-sm">Add emotions to your trades</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="emotion" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="pnl"
                  radius={[4, 4, 0, 0]}
                  
                >
                {emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Emotion Summary */}
        {emotionData.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {emotionData.slice(0, 4).map((emotion) => (
              <div key={emotion.emotion} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{emotion.emotion}</p>
                <p className={`text-sm font-bold ${emotion.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(emotion.pnl)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{emotion.trades} trades</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}