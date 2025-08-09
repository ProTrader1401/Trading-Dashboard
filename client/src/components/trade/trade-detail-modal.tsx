import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Edit, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign,
  ExternalLink,
  Save,
  X,
  AlertTriangle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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

interface TradeDetailModalProps {
  trade: any;
  isOpen: boolean;
  onClose: () => void;
}

const emotions = ["Confident", "Neutral", "Anxious", "Excited", "Fearful", "Greedy", "Disciplined"];

export default function TradeDetailModal({ trade, isOpen, onClose }: TradeDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { updateTrade, deleteTrade, isUpdating, isDeleting } = useTrades();
  const { strategies } = useStrategies();

  const form = useForm<TradeForm>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      tradeDate: trade ? formatDateForInput(trade.tradeDate) : "",
      stockName: trade?.stockName || "",
      quantity: trade?.quantity || 0,
      entryPrice: parseFloat(trade?.entryPrice?.toString() || "0"),
      exitPrice: trade?.exitPrice ? parseFloat(trade.exitPrice.toString()) : undefined,
      stopLoss: trade?.stopLoss ? parseFloat(trade.stopLoss.toString()) : undefined,
      targetPrice: trade?.targetPrice ? parseFloat(trade.targetPrice.toString()) : undefined,
      isTradeTaken: trade?.isTradeTaken || trade?.setupFollowed || false,
      whichSetup: trade?.whichSetup || "",
      emotion: trade?.emotion || "",
      notes: trade?.notes || "",
      psychologyReflections: trade?.psychologyReflections || "",
      screenshotLink: trade?.screenshotLink || "",
    },
  });

  const onSubmit = (data: TradeForm) => {
    const profitLoss = data.exitPrice 
      ? calculatePnL(data.entryPrice, data.exitPrice, data.quantity)
      : 0;

    const tradeData = {
      id: trade.id,
      tradeDate: data.tradeDate,
      stockName: data.stockName.toUpperCase(),
      quantity: data.quantity,
      entryPrice: data.entryPrice.toString(),
      exitPrice: data.exitPrice?.toString() || null,
      stopLoss: data.stopLoss?.toString() || null,
      targetPrice: data.targetPrice?.toString() || null,
      profitLoss: profitLoss.toString(),
      isTradeTaken: data.isTradeTaken,
      setupFollowed: data.isTradeTaken,
      whichSetup: data.whichSetup || null,
      emotion: data.emotion || null,
      notes: data.notes || null,
      psychologyReflections: data.psychologyReflections || null,
      screenshotLink: data.screenshotLink || null,
    };

    updateTrade(tradeData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteTrade(trade.id);
    onClose();
  };

  if (!trade) return null;

  const pnl = parseFloat(trade.profitLoss?.toString() || "0");
  const percentage = trade.entryPrice && trade.exitPrice
    ? calculatePercentage(
        parseFloat(trade.entryPrice.toString()),
        parseFloat(trade.exitPrice.toString())
      )
    : 0;

  const isProfitable = pnl >= 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">
                  {trade.stockName.substring(0, 3)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {trade.stockName}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Trade #{trade.id}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this trade? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          <FormLabel>Exit Price</FormLabel>
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
                          <FormLabel>Stop Loss</FormLabel>
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
                          <FormLabel>Target Price</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="2500.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                                <span className="text-sm text-gray-600">
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
                      name="whichSetup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strategy/Setup</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUpdating}>
                      <Save className="w-4 h-4 mr-2" />
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          ) : (
            <motion.div
              key="viewing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* P&L Summary Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      {isProfitable ? (
                        <TrendingUp className="w-8 h-8 text-green-500" />
                      ) : (
                        <TrendingDown className="w-8 h-8 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Profit & Loss</p>
                    <p className={`text-3xl font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(pnl)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Return %</p>
                    <p className={`text-3xl font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {trade.exitPrice ? formatPercentage(percentage) : "N/A"}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="w-8 h-8 text-purple-500" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Trade Value</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(parseFloat(trade.entryPrice?.toString() || "0") * trade.quantity)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trade Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Trade Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</span>
                      </div>
                      <span className="text-gray-900 dark:text-gray-100">
                        {isValidDate(trade.tradeDate) ? formatDateForDisplay(trade.tradeDate) : trade.tradeDate}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</span>
                      <span className="text-gray-900 dark:text-gray-100">{trade.quantity} shares</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Entry Price</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        ₹{parseFloat(trade.entryPrice?.toString() || "0").toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Exit Price</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {trade.exitPrice ? `₹${parseFloat(trade.exitPrice.toString()).toFixed(2)}` : "Not exited"}
                      </span>
                    </div>
                    
                    {trade.stopLoss && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stop Loss</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          ₹{parseFloat(trade.stopLoss.toString()).toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {trade.targetPrice && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Price</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          ₹{parseFloat(trade.targetPrice.toString()).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Strategy & Psychology</h3>
                  
                  <div className="space-y-3">
                    {trade.whichSetup && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Strategy</span>
                        <div className="mt-1">
                          <Badge variant="outline">{trade.whichSetup}</Badge>
                        </div>
                      </div>
                    )}
                    
                    {trade.emotion && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Emotion</span>
                        <div className="mt-1">
                          <Badge variant="secondary">{trade.emotion}</Badge>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trade Taken</span>
                      <div className="mt-1">
                        <Badge variant={trade.isTradeTaken ? "default" : "destructive"}>
                          {trade.isTradeTaken ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes and Reflections */}
              {(trade.notes || trade.psychologyReflections) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    {trade.notes && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Trade Notes</h4>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{trade.notes}</p>
                        </div>
                      </div>
                    )}
                    
                    {trade.psychologyReflections && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Psychology Reflections</h4>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{trade.psychologyReflections}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Screenshot */}
              {trade.screenshotLink && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Chart/Screenshot</h4>
                    <Button variant="outline" asChild>
                      <a href={trade.screenshotLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Screenshot
                      </a>
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}