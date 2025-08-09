import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, ExternalLink, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useStrategies } from "@/hooks/use-strategies";
import { useTrades } from "@/hooks/use-trades";
import { calculateTotalPnL, calculateWinRate, formatCurrency, formatPercentage } from "@/lib/calculations";

const strategySchema = z.object({
  name: z.string().min(1, "Strategy name is required"),
  description: z.string().optional(),
  screenshotUrl: z.string().optional(),
  status: z.enum(["active", "testing", "deprecated"]).default("active"),
  tags: z.array(z.string()).default([]),
});

type StrategyForm = z.infer<typeof strategySchema>;

export default function Strategies() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { strategies, addStrategy, updateStrategy, deleteStrategy, isAdding, isUpdating, isDeleting, isLoading } = useStrategies();
  const { trades } = useTrades();

  const form = useForm<StrategyForm>({
    resolver: zodResolver(strategySchema),
    defaultValues: {
      name: "",
      description: "",
      screenshotUrl: "",
      status: "active",
      tags: [],
    },
  });

  const onSubmit = (data: StrategyForm) => {
    if (editingStrategy) {
      updateStrategy({ id: editingStrategy.id, ...data });
      setEditingStrategy(null);
    } else {
      addStrategy({
        ...data,
        description: data.description || null,
        screenshotUrl: data.screenshotUrl || null,
        tags: data.tags || null,
      });
    }
    
    form.reset();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (strategy: any) => {
    setEditingStrategy(strategy);
    form.reset({
      name: strategy.name,
      description: strategy.description || "",
      screenshotUrl: strategy.screenshotUrl || "",
      status: strategy.status,
      tags: strategy.tags || [],
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this strategy?")) {
      deleteStrategy(id);
    }
  };

  const getStrategyStats = (strategyName: string) => {
    const strategyTrades = trades.filter(trade => trade.whichSetup === strategyName);
    return {
      trades: strategyTrades.length,
      winRate: calculateWinRate(strategyTrades),
      pnl: calculateTotalPnL(strategyTrades),
    };
  };

  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (strategy.description && strategy.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || strategy.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "testing", label: "Testing" },
    { value: "deprecated", label: "Deprecated" },
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Trading Strategies</h1>
          <p className="text-gray-600">Manage and track your trading strategies</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingStrategy(null);
              form.reset();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingStrategy ? "Edit Strategy" : "Add New Strategy"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strategy Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Breakout Momentum" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your strategy rules and setup..."
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
                  name="screenshotUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Screenshot/Chart URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://drive.google.com/..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="testing">Testing</SelectItem>
                          <SelectItem value="deprecated">Deprecated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingStrategy(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isAdding || isUpdating}>
                    {editingStrategy 
                      ? (isUpdating ? "Updating..." : "Update") 
                      : (isAdding ? "Adding..." : "Add Strategy")
                    }
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
                  placeholder="Search strategies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStrategies.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg mb-2">No strategies found</p>
              <p className="text-sm">Create your first trading strategy to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStrategies.map((strategy) => {
            const stats = getStrategyStats(strategy.name);
            
            return (
              <Card key={strategy.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{strategy.name}</CardTitle>
                      <Badge 
                        variant={
                          strategy.status === "active" ? "default" : 
                          strategy.status === "testing" ? "secondary" : 
                          "destructive"
                        }
                        className="mt-2"
                      >
                        {strategy.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(strategy)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(strategy.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {strategy.description && (
                    <p className="text-sm text-gray-600 mb-4">{strategy.description}</p>
                  )}
                  
                  {strategy.screenshotUrl && (
                    <div className="mb-4">
                      <Button variant="outline" size="sm" asChild>
                        <a href={strategy.screenshotUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Chart
                        </a>
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Trades</span>
                      <span className="text-sm font-medium">{stats.trades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Win Rate</span>
                      <span className="text-sm font-medium">{formatPercentage(stats.winRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">P&L</span>
                      <span className={`text-sm font-medium ${stats.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {formatCurrency(stats.pnl)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
