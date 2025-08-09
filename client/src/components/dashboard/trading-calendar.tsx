import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTrades } from "@/hooks/use-trades";
import { calculateTotalPnL, formatCurrency } from "@/lib/calculations";

export default function TradingCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);
  const { trades } = useTrades();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const getTradeDataForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const dayTrades = trades.filter(trade => trade.tradeDate === dateString);
    const pnl = calculateTotalPnL(dayTrades);
    return { count: dayTrades.length, pnl, trades: dayTrades };
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const CalendarContent = ({ isExpanded = false }: { isExpanded?: boolean }) => (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={previousMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${isExpanded ? 'text-xl' : 'text-base'}`}>
          {monthNames[month]} {year}
        </h3>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((day) => (
          <div key={day} className={`text-center font-medium text-gray-500 dark:text-gray-400 py-2 ${
            isExpanded ? 'text-sm' : 'text-xs'
          }`}>
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === month;
          const isToday = day.toDateString() === new Date().toDateString();
          const tradeData = getTradeDataForDate(day);
          
          return (
            <div
              key={index}
              className={`
                text-center rounded transition-colors relative group cursor-pointer
                ${isExpanded ? 'p-3' : 'py-2 text-sm'}
                ${isCurrentMonth 
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100' 
                  : 'text-gray-400 dark:text-gray-600'
                }
                ${isToday ? 'bg-primary text-white font-medium hover:bg-primary/90' : ''}
              `}
              title={tradeData.count > 0 ? `${tradeData.count} trades, P&L: ${formatCurrency(tradeData.pnl)}` : ''}
            >
              <div className={isExpanded ? 'text-lg' : 'text-sm'}>
                {day.getDate()}
              </div>
              
              {/* Trade Indicators */}
              {tradeData.count > 0 && (
                <div className="space-y-1">
                  <div className={`
                    ${isExpanded ? 'w-2 h-2 mx-auto' : 'absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1'} 
                    rounded-full
                    ${tradeData.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}
                  `} />
                  
                  {isExpanded && (
                    <div className="text-xs space-y-0.5">
                      <div className="text-gray-600 dark:text-gray-400">
                        {tradeData.count} trade{tradeData.count > 1 ? 's' : ''}
                      </div>
                      <div className={`font-medium ${
                        tradeData.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(tradeData.pnl)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Calendar Legend */}
      <div className="flex items-center justify-center space-x-4 text-xs text-gray-600 dark:text-gray-300">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Profit</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>Loss</span>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-gray-100">Trading Calendar</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Trading Calendar - Expanded View</span>
                  <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    {monthNames[month]} {year}
                  </div>
                </DialogTitle>
              </DialogHeader>
              <CalendarContent isExpanded={true} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <CalendarContent />
      </CardContent>
    </Card>
  );
}