import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Filter, Calendar, Download, Edit, Trash2, Eye } from "lucide-react";
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
import { useTrades } from "@/hooks/use-trades";
import { useStrategies } from "@/hooks/use-strategies";
import { calculatePnL, formatCurrency, formatPercentage, calculatePercentage } from "@/lib/calculations";
import { formatDateForDisplay, formatDateForInput, isValidDate } from "@/utils/date-utils";

const tradeSchema = z.object({
  tradeDate: z.string().min(1, "Trade date is required"),
  stockName: z.string().min(1, "Stock name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  entryPrice: z.coerce.number().min(0.01, "Entry price must be greater than 0"),
  exitPrice: z.coerce.number().optional(),
  stopLoss: z.coerce.number().optional(),
  targetPrice: z.coerce.number().optional(),
  setupFollowed: z.boolean().default(false),
  whichSetup: z.string().optional(),
  emotion: z.string().optional(),
  notes: z.string().optional(),
  psychologyReflections: z.string().optional(),
  screenshotLink: z.string().optional(),
});

type TradeForm = z.infer<typeof tradeSchema>;

export default function TradeLog() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { trades, addTrade, updateTrade, deleteTrade, isAdding, isLoading, isUpdating, isDeleting } = useTrades();
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
      setupFollowed: false,
      whichSetup: "",
      emotion: "",
      notes: "",
      psychologyReflections: "",
      screenshotLink: "",
    },
  });

  const onSubmit = (data: TradeForm) => {
    const profitLoss = data.exitPrice 
      ? calculatePnL(data.entryPrice, data.exitPrice, data.quantity)
      : 0;

    const tradeData = {
      tradeDate: data.tradeDate,
      stockName: data.stockName.toUpperCase(),
      quantity: data.quantity,
      entryPrice: data.entryPrice.toString(),
      exitPrice: data.exitPrice?.toString() || null,
      stopLoss: data.stopLoss?.toString() || null,
      targetPrice: data.targetPrice?.toString() || null,
      profitLoss: profitLoss.toString(),
      setupFollowed: data.setupFollowed,
      whichSetup: data.whichSetup || null,
      emotion: data.emotion || null,
      notes: data.notes || null,
      psychologyReflections: data.psychologyReflections || null,
      screenshotLink: data.screenshotLink || null,
    });

    if (selectedTrade) {
      updateTrade({ id: selectedTrade.id, ...tradeData });
      setIsEditDialogOpen(false);
    } else {
      addTrade(tradeData);
      setIsAddDialogOpen(false);
    }
    
    form.reset();
    setSelectedTrade(null);
  };

  const filteredTrades = trades.filter(trade =>
    trade.stockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (trade.whichSetup && trade.whichSetup.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const emotions = ["Confident", "Neutral", "Anxious", "Excited", "Fearful", "Greedy", "Disciplined"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trade Log</h1>
          <p className="text-gray-600">Track and analyze your trading performance</p>
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
                          <Input type="number" step="0.01" placeholder="2,450.50" {...field} />
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
                          <Input type="number" step="0.01" placeholder="2,475.25" {...field} />
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
                          <Input type="number" step="0.01" placeholder="2,400.00" {...field} />
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
                          <Input type="number" step="0.01" placeholder="2,500.00" {...field} />
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
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search trades by stock name or strategy..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Trades ({filteredTrades.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading trades...</div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No trades found</p>
              <p className="text-sm">Add your first trade to get started</p>
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
                    <TableHead>%</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Emotion</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade) => {
                    const pnl = parseFloat(trade.profitLoss?.toString() || "0");
                    const percentage = trade.entryPrice && trade.exitPrice
                      ? calculatePercentage(
                          parseFloat(trade.entryPrice.toString()),
                          parseFloat(trade.exitPrice.toString())
                        )
                      : 0;

                    return (
                      <TableRow 
                        key={trade.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => {
                          setSelectedTrade(trade);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <TableCell>{isValidDate(trade.tradeDate) ? formatDateForDisplay(trade.tradeDate) : trade.tradeDate}</TableCell>
                        <TableCell className="font-medium text-visible">{trade.stockName}</TableCell>
                        <TableCell className="text-visible">{trade.quantity}</TableCell>
                        <TableCell className="text-visible">₹{parseFloat(trade.entryPrice?.toString() || "0").toFixed(2)}</TableCell>
                        <TableCell className="text-visible">
                          {trade.exitPrice ? `₹${parseFloat(trade.exitPrice.toString()).toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className={`font-semibold ${pnl >= 0 ? "profit" : "loss"}`}>
                          {formatCurrency(pnl)}
                        </TableCell>
                        <TableCell className={percentage >= 0 ? "text-profit" : "text-loss"}>
                          {trade.exitPrice ? formatPercentage(percentage) : "-"}
                        </TableCell>
                        <TableCell>
                          {trade.whichSetup ? (
                            <Badge variant="outline">{trade.whichSetup}</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {trade.emotion ? (
                            <Badge variant="secondary">{trade.emotion}</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {trade.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTrade(trade);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTrade(trade);
                                form.reset({
                                  tradeDate: formatDateForInput(trade.tradeDate),
                                  stockName: trade.stockName,
                                  quantity: trade.quantity,
                                  entryPrice: parseFloat(trade.entryPrice?.toString() || "0"),
                                  exitPrice: trade.exitPrice ? parseFloat(trade.exitPrice.toString()) : 0,
                                  stopLoss: trade.stopLoss ? parseFloat(trade.stopLoss.toString()) : 0,
                                  targetPrice: trade.targetPrice ? parseFloat(trade.targetPrice.toString()) : 0,
                                  setupFollowed: trade.setupFollowed || false,
                                  whichSetup: trade.whichSetup || "",
                                  emotion: trade.emotion || "",
                                  notes: trade.notes || "",
                                  psychologyReflections: trade.psychologyReflections || "",
                                  screenshotLink: trade.screenshotLink || "",
                                });
                                setIsEditDialogOpen(true);
                              }}
                              disabled={isUpdating}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this trade?')) {
                                  deleteTrade(trade.id);
                                }
                              }}
                              disabled={isDeleting}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Edit Trade Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trade</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Same form fields as add dialog */}
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
                        <Input placeholder="e.g. RELIANCE, TCS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Trade"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Trade Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trade Details</DialogTitle>
          </DialogHeader>
          {selectedTrade && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                  <p className="text-gray-900 dark:text-gray-100">{isValidDate(selectedTrade.tradeDate) ? formatDateForDisplay(selectedTrade.tradeDate) : selectedTrade.tradeDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Stock</label>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedTrade.stockName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedTrade.quantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Entry Price</label>
                  <p className="text-gray-900 dark:text-gray-100">₹{parseFloat(selectedTrade.entryPrice?.toString() || "0").toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Exit Price</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedTrade.exitPrice ? `₹${parseFloat(selectedTrade.exitPrice.toString()).toFixed(2)}` : "Not exited"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">P&L</label>
                  <p className={`font-semibold ${parseFloat(selectedTrade.profitLoss?.toString() || "0") >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(parseFloat(selectedTrade.profitLoss?.toString() || "0"))}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Strategy</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedTrade.whichSetup || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Emotion</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedTrade.emotion || "Not specified"}</p>
                </div>
              </div>
              
              {selectedTrade.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{selectedTrade.notes}</p>
                </div>
              )}
              
              {selectedTrade.psychologyReflections && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Psychology Reflections</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{selectedTrade.psychologyReflections}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedTrade(selectedTrade);
                    form.reset({
                      tradeDate: formatDateForInput(selectedTrade.tradeDate),
                      stockName: selectedTrade.stockName,
                      quantity: selectedTrade.quantity,
                      entryPrice: parseFloat(selectedTrade.entryPrice?.toString() || "0"),
                      exitPrice: selectedTrade.exitPrice ? parseFloat(selectedTrade.exitPrice.toString()) : 0,
                      stopLoss: selectedTrade.stopLoss ? parseFloat(selectedTrade.stopLoss.toString()) : 0,
                      targetPrice: selectedTrade.targetPrice ? parseFloat(selectedTrade.targetPrice.toString()) : 0,
                      setupFollowed: selectedTrade.setupFollowed || false,
                      whichSetup: selectedTrade.whichSetup || "",
                      emotion: selectedTrade.emotion || "",
                      notes: selectedTrade.notes || "",
                      psychologyReflections: selectedTrade.psychologyReflections || "",
                      screenshotLink: selectedTrade.screenshotLink || "",
                    });
                    setIsDetailDialogOpen(false);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Trade
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this trade?')) {
                      deleteTrade(selectedTrade.id);
                      setIsDetailDialogOpen(false);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Trade
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
