import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Filter, Calendar, Download, FileDown, X, Eye, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import TradeDetailModal from "@/components/trade/trade-detail-modal";
import { useTrades } from "@/hooks/use-trades";
import { useStrategies } from "@/hooks/use-strategies";
import { calculatePnL, formatCurrency, formatPercentage, calculatePercentage } from "@/lib/calculations";
import { formatDateForDisplay, isValidDate } from "@/utils/date-utils";

const tradeSchema = z.object({
  tradeDate: z.string().min(1, "Trade date is required"),
  stockName: z.string().min(1, "Stock name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  entryPrice: z.coerce.number().min(0.01, "Entry price must be greater than 0"),
  exitPrice: z.coerce.number().optional(),
  stopLoss: z.coerce.number().optional(),
  targetPrice: z.coerce.number().optional(),
  isTradeTaken: z.boolean().default(false),
  whichSetup: z.string().optional(),
  emotion: z.string().optional(),
  notes: z.string().optional(),
  psychologyReflections: z.string().optional(),
  screenshotLink: z.string().optional(),
});

const filterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  strategy: z.string().optional(),
  emotion: z.string().optional(),
  profitLoss: z.enum(["all", "profit", "loss"]).default("all"),
});

type TradeForm = z.infer<typeof tradeSchema>;
type FilterForm = z.infer<typeof filterSchema>;

const emotions = ["Confident", "Neutral", "Anxious", "Excited", "Fearful", "Greedy", "Disciplined"];

export default function TradeLogEnhanced() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterForm>({
    profitLoss: "all"
  });
  
  const { trades, addTrade, isAdding, isLoading } = useTrades();
  const { strategies } = useStrategies();

  const form = useForm<TradeForm>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      tradeDate: new Date().toISOString().split('T')[0],
      stockName: "",
      quantity: 0,
      entryPrice: 0,
      exitPrice: 0,
      stopLoss: 0,
      targetPrice: 0,
      isTradeTaken: true, // Default to true since most logged trades are taken
      whichSetup: "",
      emotion: "",
      notes: "",
      psychologyReflections: "",
      screenshotLink: "",
    },
  });

  const filterForm = useForm<FilterForm>({
    resolver: zodResolver(filterSchema),
    defaultValues: filters,
  });

  const handleTradeClick = (trade: any) => {
    setSelectedTrade(trade);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTrade(null);
  };
  const onSubmit = (data: TradeForm) => {
    const profitLoss = data.exitPrice 
      ? calculatePnL(data.entryPrice, data.exitPrice, data.quantity)
      : 0;

    addTrade({
      tradeDate: data.tradeDate,
      stockName: data.stockName.toUpperCase(),
      quantity: data.quantity,
      entryPrice: data.entryPrice.toString(),
      exitPrice: data.exitPrice?.toString() || null,
      stopLoss: data.stopLoss?.toString() || null,
      targetPrice: data.targetPrice?.toString() || null,
      profitLoss: profitLoss.toString(),
      isTradeTaken: data.isTradeTaken,
      whichSetup: data.whichSetup || null,
      emotion: data.emotion || null,
      notes: data.notes || null,
      psychologyReflections: data.psychologyReflections || null,
      screenshotLink: data.screenshotLink || null,
    });

    form.reset();
    setIsAddDialogOpen(false);
  };

  const onFilterSubmit = (data: FilterForm) => {
    setFilters(data);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    const defaultFilters = { profitLoss: "all" as const };
    setFilters(defaultFilters);
    filterForm.reset(defaultFilters);
    setSearchTerm("");
  };

  const filteredTrades = trades.filter(trade => {
    // Search filter
    const matchesSearch = !searchTerm || 
      trade.stockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trade.whichSetup && trade.whichSetup.toLowerCase().includes(searchTerm.toLowerCase()));

    // Date range filter
    const matchesDateRange = (!filters.startDate || trade.tradeDate >= filters.startDate) &&
      (!filters.endDate || trade.tradeDate <= filters.endDate);

    // Strategy filter
    const matchesStrategy = !filters.strategy || filters.strategy === 'all-strategies' || trade.whichSetup === filters.strategy;

    // Emotion filter
    const matchesEmotion = !filters.emotion || filters.emotion === 'all-emotions' || trade.emotion === filters.emotion;

    // Profit/Loss filter
    let matchesProfitLoss = true;
    if (filters.profitLoss !== "all") {
      const pnl = trade.profitLoss ? parseFloat(trade.profitLoss) : 0;
      matchesProfitLoss = filters.profitLoss === "profit" ? pnl >= 0 : pnl < 0;
    }

    return matchesSearch && matchesDateRange && matchesStrategy && matchesEmotion && matchesProfitLoss;
  });

  const exportToCSV = () => {
    const headers = [
      "Trade Date", "Stock Name", "Quantity", "Entry Price", "Exit Price", 
      "Stop Loss", "Target Price", "P&L", "P&L %", "Setup Followed", 
      "Strategy", "Emotion", "Notes", "Psychology Reflections", "Screenshot Link"
    ];

    const csvData = filteredTrades.map(trade => {
      const entryPrice = parseFloat(trade.entryPrice || "0");
      const exitPrice = parseFloat(trade.exitPrice || "0");
      const pnl = parseFloat(trade.profitLoss || "0");
      const pnlPercent = exitPrice > 0 ? calculatePercentage(entryPrice, exitPrice) : 0;

      return [
        trade.tradeDate,
        trade.stockName,
        trade.quantity,
        entryPrice,
        exitPrice || "",
        trade.stopLoss || "",
        trade.targetPrice || "",
        pnl,
        pnlPercent.toFixed(2) + "%",
        trade.setupFollowed ? "Yes" : "No",
        trade.whichSetup || "",
        trade.emotion || "",
        (trade.notes || "").replace(/,/g, ";"),
        (trade.psychologyReflections || "").replace(/,/g, ";"),
        trade.screenshotLink || ""
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `trades-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const emotions = ["Confident", "Neutral", "Anxious", "Excited", "Fearful", "Greedy", "Disciplined"];
  const activeFiltersCount = Object.values(filters).filter(value => 
    value && value !== "all" && value !== ""
  ).length + (searchTerm ? 1 : 0);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trade Log</h1>
            <p className="text-gray-600 dark:text-gray-400">Track and analyze your trading performance</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Trade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Trade</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tradeDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="stockName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., RELIANCE" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="entryPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entry Price</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="2450.50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="exitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exit Price (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="2475.25" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="stopLoss"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stop Loss (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="2400.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Price (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="2500.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="whichSetup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strategy/Setup</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select strategy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {strategies.map((strategy) => (
                                <SelectItem key={strategy.id} value={strategy.name}>
                                  {strategy.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="emotion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emotion</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select emotion" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {emotions.map((emotion) => (
                                <SelectItem key={emotion} value={emotion}>
                                  {emotion}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="isTradeTaken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <span>Did I take this trade?</span>
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {field.value ? "Yes, I took this trade" : "No, I didn't take this trade"}
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="screenshotLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Screenshot/Chart Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://drive.google.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trade Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter trade notes, observations, etc."
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="psychologyReflections"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Psychology Reflections</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What did you learn? What could be improved?"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isAdding}>
                      {isAdding ? "Adding..." : "Add Trade"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by stock or strategy..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="relative">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge variant="destructive" className="ml-2 px-1 min-w-[1.2rem] h-5">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Filter Trades</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...filterForm}>
                      <form onSubmit={filterForm.handleSubmit(onFilterSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={filterForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={filterForm.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={filterForm.control}
                            name="strategy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Strategy</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="All strategies" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="all-strategies">All strategies</SelectItem>
                                    {strategies.map((strategy) => (
                                      <SelectItem key={strategy.id} value={strategy.name || 'unnamed-strategy'}>
                                        {strategy.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={filterForm.control}
                            name="emotion"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Emotion</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="All emotions" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="all-emotions">All emotions</SelectItem>
                                    {emotions.map((emotion) => (
                                      <SelectItem key={emotion} value={emotion}>
                                        {emotion}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={filterForm.control}
                            name="profitLoss"
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Profit/Loss</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="all">All trades</SelectItem>
                                    <SelectItem value="profit">Profitable only</SelectItem>
                                    <SelectItem value="loss">Losses only</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex justify-between pt-4">
                          <Button type="button" variant="outline" onClick={clearFilters}>
                            Clear All
                          </Button>
                          <div className="space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsFilterOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">
                              Apply Filters
                            </Button>
                          </div>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              <Button variant="outline" onClick={exportToCSV} disabled={filteredTrades.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trades Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Trades ({filteredTrades.length})
              </span>
              {filteredTrades.length !== trades.length && (
                <Badge variant="secondary">
                  Filtered from {trades.length} total
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading trades...</p>
              </div>
            ) : filteredTrades.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  {trades.length === 0 ? "No trades found. Add your first trade to get started." : "No trades match your current filters."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Exit</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>P&L %</TableHead>
                      <TableHead>Trade Taken</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Emotion</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Chart</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.map((trade) => {
                      const entryPrice = parseFloat(trade.entryPrice || "0");
                      const exitPrice = parseFloat(trade.exitPrice || "0");
                      const pnl = parseFloat(trade.profitLoss || "0");
                      const pnlPercent = exitPrice > 0 ? calculatePercentage(entryPrice, exitPrice) : 0;
                      const isProfitable = pnl >= 0;

                      return (
                        <TableRow key={trade.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell className="font-medium">
                            {isValidDate(trade.tradeDate) ? formatDateForDisplay(trade.tradeDate) : trade.tradeDate}
                          </TableCell>
                          <TableCell className="font-medium">{trade.stockName}</TableCell>
                          <TableCell>{trade.quantity}</TableCell>
                          <TableCell>{formatCurrency(entryPrice)}</TableCell>
                          <TableCell>{exitPrice > 0 ? formatCurrency(exitPrice) : "-"}</TableCell>
                          <TableCell>
                            <span className={`font-semibold ${
                              isProfitable 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {formatCurrency(pnl)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {exitPrice > 0 ? (
                              <span className={`font-semibold ${
                                isProfitable 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {formatPercentage(pnlPercent)}
                              </span>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={trade.isTradeTaken ? "default" : "secondary"}>
                              {trade.isTradeTaken ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-visible">
                            {trade.whichSetup ? (
                              <Badge variant="outline">{trade.whichSetup}</Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-visible">
                            {trade.emotion ? (
                              <Badge variant="secondary">{trade.emotion}</Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="max-w-[200px] text-visible">
                            {trade.notes ? (
                              <div className="truncate text-visible" title={trade.notes}>
                                {trade.notes}
                              </div>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            {trade.screenshotLink ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(trade.screenshotLink, '_blank');
                                }}
                                className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTradeClick(trade)}
                              className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      {/* Trade Detail Modal */}
      <TradeDetailModal
        trade={selectedTrade}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />
    </>
  );
}