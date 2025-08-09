import { Filter, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import TradeDetailModal from "@/components/trade/trade-detail-modal";
import { useTrades } from "@/hooks/use-trades";
import { formatCurrency, formatPercentage, calculatePercentage } from "@/lib/calculations";
import { Link } from "wouter";

export default function RecentTrades() {
  const { trades, isLoading } = useTrades();
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleTradeClick = (trade: any) => {
    setSelectedTrade(trade);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTrade(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div>
                  <div className="w-16 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-12 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentTrades = trades
    .sort((a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime())
    .slice(0, 5);

  return (
    <>
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Trades</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
            <Link href="/trades">
              <Button variant="ghost" size="sm">
                View All <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recentTrades.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No trades found</p>
            <p className="text-sm">Add your first trade to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTrades.map((trade) => {
              const pnl = parseFloat(trade.profitLoss?.toString() || "0");
              const percentage = trade.entryPrice && trade.exitPrice 
                ? calculatePercentage(parseFloat(trade.entryPrice.toString()), parseFloat(trade.exitPrice.toString()))
                : 0;
              
              const stockSymbol = trade.stockName.length > 4 
                ? trade.stockName.substring(0, 4)
                : trade.stockName;

              return (
                <div 
                  key={trade.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => handleTradeClick(trade)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">{stockSymbol}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{trade.stockName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(trade.tradeDate).toLocaleDateString()} • {trade.quantity} shares
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {formatCurrency(pnl)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatPercentage(percentage)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      </Card>

      {/* Trade Detail Modal */}
      <TradeDetailModal
        trade={selectedTrade}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />
    </>
  );
}
