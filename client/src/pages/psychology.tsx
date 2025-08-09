import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, TrendingUp, TrendingDown, Brain, Book, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTrades } from "@/hooks/use-trades";
import { useAppContext } from "@/contexts/app-context";
import { useToast } from "@/hooks/use-toast";
import { GoogleSheetsAPI } from "@/lib/google-sheets";
import { calculateTotalPnL, formatCurrency, getTradesByDateRange } from "@/lib/calculations";

const psychologyEntrySchema = z.object({
  month: z.string().min(1, "Month is required"),
  year: z.coerce.number().min(2020).max(2030),
  monthlyPnL: z.coerce.number().optional(),
  bestTradeId: z.coerce.number().optional(),
  worstTradeId: z.coerce.number().optional(),
  mentalReflections: z.string().optional(),
  improvementAreas: z.string().optional(),
});

type PsychologyEntryForm = z.infer<typeof psychologyEntrySchema>;

export default function Psychology() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [psychologyEntries, setPsychologyEntries] = useState<any[]>([]);
  const { trades } = useTrades();
  const { settings } = useAppContext();
  const { toast } = useToast();

  const form = useForm<PsychologyEntryForm>({
    resolver: zodResolver(psychologyEntrySchema),
    defaultValues: {
      month: new Date().toLocaleDateString('en-US', { month: 'long' }),
      year: new Date().getFullYear(),
      monthlyPnL: 0,
      bestTradeId: undefined,
      worstTradeId: undefined,
      mentalReflections: "",
      improvementAreas: "",
    },
  });

  const onSubmit = async (data: PsychologyEntryForm) => {
    if (!settings?.googleScriptUrl || !settings?.googleSheetId) {
      toast({
        title: "Error",
        description: "Google Sheets not configured. Please check settings.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const api = new GoogleSheetsAPI(settings.googleScriptUrl, settings.googleSheetId);
      await api.addPsychologyEntry({
        month: data.month,
        year: data.year,
        monthlyPnL: data.monthlyPnL?.toString() || null,
        bestTradeId: data.bestTradeId || null,
        worstTradeId: data.worstTradeId || null,
        mentalReflections: data.mentalReflections || null,
        improvementAreas: data.improvementAreas || null,
      });

      toast({
        title: "Success",
        description: "Psychology entry saved successfully",
      });
      
      form.reset();
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save psychology entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate monthly data from trades
  const getMonthlyData = (month: string, year: number) => {
    const monthIndex = new Date(Date.parse(month + " 1, 2020")).getMonth();
    const startDate = new Date(year, monthIndex, 1).toISOString().split('T')[0];
    const endDate = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0];
    
    const monthlyTrades = getTradesByDateRange(trades, startDate, endDate);
    const monthlyPnL = calculateTotalPnL(monthlyTrades);
    
    const bestTrade = monthlyTrades.reduce((best, trade) => {
      const pnl = parseFloat(trade.profitLoss?.toString() || "0");
      const bestPnl = parseFloat(best?.profitLoss?.toString() || "0");
      return pnl > bestPnl ? trade : best;
    }, monthlyTrades[0]);
    
    const worstTrade = monthlyTrades.reduce((worst, trade) => {
      const pnl = parseFloat(trade.profitLoss?.toString() || "0");
      const worstPnl = parseFloat(worst?.profitLoss?.toString() || "0");
      return pnl < worstPnl ? trade : worst;
    }, monthlyTrades[0]);
    
    return {
      trades: monthlyTrades,
      pnl: monthlyPnL,
      bestTrade,
      worstTrade,
    };
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear();
  const currentMonthData = getMonthlyData(currentMonth, currentYear);

  // Mock psychology entries for demonstration
  const psychologyEntries = [
    {
      id: 1,
      month: "January",
      year: 2024,
      monthlyPnL: 25000,
      mentalReflections: "Started the year with good discipline. Focused on following my trading plan and not overtrading.",
      improvementAreas: "Need to work on position sizing and risk management during volatile days.",
    },
    {
      id: 2,
      month: "February",
      year: 2024,
      monthlyPnL: -8500,
      mentalReflections: "Struggled with FOMO trades. Let emotions drive some decisions instead of following the plan.",
      improvementAreas: "Practice mindfulness before taking trades. Use a checklist to ensure setup criteria are met.",
    },
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Psychology & Reviews</h1>
          <p className="text-gray-600">Track your mental state and monthly reflections</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Monthly Review</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month} value={month}>
                                {month}
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
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
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
                  name="monthlyPnL"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly P&L</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="25000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mentalReflections"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mental Reflections</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="How did you feel this month? What mental patterns did you notice?"
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
                          placeholder="What can you improve next month? What lessons did you learn?"
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
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Add Entry"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Month Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's P&L</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentMonthData.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
              {formatCurrency(currentMonthData.pnl)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonthData.trades.length} trades this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Trade</CardTitle>
            <TrendingUp className="h-4 w-4 text-profit" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-profit">
              {currentMonthData.bestTrade 
                ? formatCurrency(parseFloat(currentMonthData.bestTrade.profitLoss?.toString() || "0"))
                : "₹0"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonthData.bestTrade?.stockName || "No trades"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worst Trade</CardTitle>
            <TrendingDown className="h-4 w-4 text-loss" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-loss">
              {currentMonthData.worstTrade 
                ? formatCurrency(parseFloat(currentMonthData.worstTrade.profitLoss?.toString() || "0"))
                : "₹0"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonthData.worstTrade?.stockName || "No trades"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Year Selection */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Monthly Reviews</h3>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Psychology Entries */}
      <div className="space-y-6">
        {psychologyEntries.filter(entry => entry.year === selectedYear).length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-gray-500">
                <p className="text-lg mb-2">No psychology entries for {selectedYear}</p>
                <p className="text-sm">Start tracking your mental state and monthly reflections</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          psychologyEntries
            .filter(entry => entry.year === selectedYear)
            .map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Book className="w-5 h-5" />
                      <span>{entry.month} {entry.year}</span>
                    </CardTitle>
                    <Badge variant={entry.monthlyPnL >= 0 ? "default" : "destructive"}>
                      {formatCurrency(entry.monthlyPnL)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {entry.mentalReflections && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Mental Reflections</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {entry.mentalReflections}
                        </p>
                      </div>
                    )}
                    
                    {entry.improvementAreas && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Areas for Improvement</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {entry.improvementAreas}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* Emotion Tracking Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Emotion Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {emotions.map((emotion) => {
              const emotionTrades = trades.filter(trade => trade.emotion === emotion);
              const emotionPnL = calculateTotalPnL(emotionTrades);
              
              return (
                <div key={emotion} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{emotion}</p>
                  <p className="text-sm text-gray-600">{emotionTrades.length} trades</p>
                  <p className={`text-sm font-medium ${emotionPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {formatCurrency(emotionPnL)}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
