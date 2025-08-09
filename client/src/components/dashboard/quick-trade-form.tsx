import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Eraser, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useTrades } from "@/hooks/use-trades";
import { calculatePnL } from "@/lib/calculations";
import { Link } from "wouter";

const quickTradeSchema = z.object({
  stockName: z.string().min(1, "Stock name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  entryPrice: z.coerce.number().min(0.01, "Entry price must be greater than 0"),
  exitPrice: z.coerce.number().min(0.01, "Exit price must be greater than 0"),
});

type QuickTradeForm = z.infer<typeof quickTradeSchema>;

export default function QuickTradeForm() {
  const { addTrade, isAdding } = useTrades();
  
  const form = useForm<QuickTradeForm>({
    resolver: zodResolver(quickTradeSchema),
    defaultValues: {
      stockName: "",
      quantity: 0,
      entryPrice: 0,
      exitPrice: 0,
    },
  });

  const onSubmit = (data: QuickTradeForm) => {
    const profitLoss = calculatePnL(data.entryPrice, data.exitPrice, data.quantity);
    
    addTrade({
      tradeDate: new Date().toISOString().split('T')[0],
      stockName: data.stockName.toUpperCase(),
      quantity: data.quantity,
      entryPrice: data.entryPrice.toString(),
      exitPrice: data.exitPrice.toString(),
      profitLoss: profitLoss.toString(),
      setupFollowed: false,
      whichSetup: null,
      emotion: null,
      notes: null,
      psychologyReflections: null,
      screenshotLink: null,
      stopLoss: null,
      targetPrice: null,
    });
    
    form.reset();
  };

  const clearForm = () => {
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Quick Trade Entry</CardTitle>
          <Link href="/trades">
            <Button variant="ghost" size="sm">
              View Full Form <ExternalLink className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormLabel>Exit Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="2,475.25" {...field} />
                    </FormControl>
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
                      <span className="text-sm text-gray-600">
                        {field.value ? "Yes, I took this trade" : "No, I didn't take this trade"}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isAdding}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isAdding ? "Adding..." : "Add Trade"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={clearForm}
              >
                <Eraser className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
