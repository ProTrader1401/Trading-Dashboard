import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, TrendingUp, TrendingDown, Brain, Book, Edit, Trash2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTrades } from "@/hooks/use-trades";
import { usePsychology } from "@/hooks/use-psychology";
import { calculateTotalPnL, formatCurrency, getTradesByDateRange } from "@/lib/calculations";
import { formatDateForDisplay, formatDateForInput } from "@/utils/date-utils";

const psychologyEntrySchema = z.object({
  entryDate: z.string().min(1, "Entry date is required"),
  dailyPnL: z.string().optional(),
  bestTradeId: z.coerce.number().optional(),
  worstTradeId: z.coerce.number().optional(),
  mentalReflections: z.string().optional(),
  improvementAreas: z.string().optional(),
});

type PsychologyEntryForm = z.infer<typeof psychologyEntrySchema>;

export default function PsychologyEnhanced() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const { trades } = useTrades();
  const { entries, isLoading, addEntry, updateEntry, deleteEntry, isAdding, isUpdating, isDeleting } = usePsychology();

  const form = useForm<PsychologyEntryForm>({
    resolver: zodResolver(psychologyEntrySchema),
    defaultValues: {
      entryDate: new Date().toISOString().split('T')[0],
      dailyPnL: "",
      bestTradeId: undefined,
      worstTradeId: undefined,
      mentalReflections: "",
      improvementAreas: "",
    },
  });

  // Reset form when selectedEntry changes
  useEffect(() => {
    if (selectedEntry) {
      form.reset({
        entryDate: selectedEntry.entryDate || new Date().toISOString().split('T')[0],
        dailyPnL: selectedEntry.dailyPnL || "",
        bestTradeId: selectedEntry.bestTradeId || undefined,
        worstTradeId: selectedEntry.worstTradeId || undefined,
        mentalReflections: selectedEntry.mentalReflections || "",
        improvementAreas: selectedEntry.improvementAreas || "",
      });
    } else {
      form.reset({
        entryDate: new Date().toISOString().split('T')[0],
        dailyPnL: "",
        bestTradeId: undefined,
        worstTradeId: undefined,
        mentalReflections: "",
        improvementAreas: "",
      });
    }
  }, [selectedEntry, form]);

  const onSubmit = async (data: PsychologyEntryForm) => {
    try {
      if (selectedEntry) {
        // Update existing entry
        await updateEntry({
          id: selectedEntry.id,
          entryDate: data.entryDate,
          dailyPnL: data.dailyPnL || null,
          bestTradeId: data.bestTradeId || null,
          worstTradeId: data.worstTradeId || null,
          mentalReflections: data.mentalReflections || null,
          improvementAreas: data.improvementAreas || null,
        });
        setIsEditDialogOpen(false);
      } else {
        // Add new entry
        await addEntry({
          entryDate: data.entryDate,
          dailyPnL: data.dailyPnL || null,
          bestTradeId: data.bestTradeId || null,
          worstTradeId: data.worstTradeId || null,
          mentalReflections: data.mentalReflections || null,
          improvementAreas: data.improvementAreas || null,
        });
        setIsAddDialogOpen(false);
      }
      
      form.reset();
      setSelectedEntry(null);
    } catch (error) {
      console.error('Failed to save psychology entry:', error);
    }
  };

  const handleEdit = (entry: any) => {
    setSelectedEntry(entry);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEntry(id);
    } catch (error) {
      console.error('Failed to delete psychology entry:', error);
    }
  };

  const handleAddNew = () => {
    setSelectedEntry(null);
    setIsAddDialogOpen(true);
  };

  // Calculate today's data from trades
  const today = new Date().toISOString().split('T')[0];
  const todaysTrades = trades.filter(trade => trade.tradeDate === today);
  const todaysPnL = calculateTotalPnL(todaysTrades);
  
  const bestTrade = todaysTrades.reduce((best, trade) => {
    const pnl = parseFloat(trade.profitLoss?.toString() || "0");
    const bestPnl = parseFloat(best?.profitLoss?.toString() || "0");
    return pnl > bestPnl ? trade : best;
  }, todaysTrades[0]);
  
  const worstTrade = todaysTrades.reduce((worst, trade) => {
    const pnl = parseFloat(trade.profitLoss?.toString() || "0");
    const worstPnl = parseFloat(worst?.profitLoss?.toString() || "0");
    return pnl < worstPnl ? trade : worst;
  }, todaysTrades[0]);

  // Sort entries by date (most recent first)
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
  );

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Daily Psychology Journal</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your daily mental state and trading reflections</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Daily Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Daily Psychology Entry</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="entryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dailyPnL"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily P&L</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder={`Today's calculated: ${formatCurrency(todaysPnL)}`}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bestTradeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Best Trade ID (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder={bestTrade ? `Suggested: ${bestTrade.id}` : "No trades today"}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="worstTradeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Worst Trade ID (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder={worstTrade ? `Suggested: ${worstTrade.id}` : "No trades today"}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="mentalReflections"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mental Reflections</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="How did you feel today? What mental patterns did you notice?"
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="improvementAreas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Areas for Improvement</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What can you improve tomorrow? What lessons did you learn?"
                          rows={4}
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
                    disabled={isAdding}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isAdding}>
                    {isAdding ? "Saving..." : "Add Entry"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${todaysPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(todaysPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              {todaysTrades.length} trades today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Trade</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {bestTrade 
                ? formatCurrency(parseFloat(bestTrade.profitLoss?.toString() || "0"))
                : "₹0"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {bestTrade?.stockName || "No trades"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worst Trade</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {worstTrade 
                ? formatCurrency(parseFloat(worstTrade.profitLoss?.toString() || "0"))
                : "₹0"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {worstTrade?.stockName || "No trades"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Psychology Entries */}
      <div className="space-y-6">
        {sortedEntries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">No psychology entries yet</p>
                <p className="text-sm">Start tracking your daily mental state and reflections</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Book className="w-5 h-5" />
                    <span>{formatDateForDisplay(entry.entryDate)}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {entry.dailyPnL && (
                      <Badge variant={parseFloat(entry.dailyPnL) >= 0 ? "default" : "destructive"}>
                        {formatCurrency(parseFloat(entry.dailyPnL))}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                      disabled={isUpdating}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Psychology Entry</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this psychology entry for {formatDateForDisplay(entry.entryDate)}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(entry.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entry.mentalReflections && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Mental Reflections</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {entry.mentalReflections}
                      </p>
                    </div>
                  )}
                  
                  {entry.improvementAreas && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Areas for Improvement</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {entry.improvementAreas}
                      </p>
                    </div>
                  )}

                  {(entry.bestTradeId || entry.worstTradeId) && (
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      {entry.bestTradeId && (
                        <span>Best Trade: #{entry.bestTradeId}</span>
                      )}
                      {entry.worstTradeId && (
                        <span>Worst Trade: #{entry.worstTradeId}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Psychology Entry</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dailyPnL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily P&L</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Enter daily P&L" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bestTradeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Best Trade ID (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Trade ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="worstTradeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Worst Trade ID (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Trade ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="mentalReflections"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mental Reflections</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="How did you feel today? What mental patterns did you notice?"
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="improvementAreas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Areas for Improvement</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What can you improve tomorrow? What lessons did you learn?"
                        rows={4}
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
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Entry"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}