import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trade } from "@shared/schema";
import { GoogleSheetsAPI } from "@/lib/google-sheets";
import { useAppContext } from "@/contexts/app-context";
import { useToast } from "@/hooks/use-toast";

export function useTrades() {
  const { settings } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const api = settings ? new GoogleSheetsAPI(settings.googleScriptUrl || "", settings.googleSheetId || "") : null;

  const query = useQuery({
    queryKey: ["trades"],
    queryFn: async () => {
      if (!api) throw new Error("Google Sheets not configured");
      return api.getTrades();
    },
    enabled: !!api,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const addTradeMutation = useMutation({
    mutationFn: async (trade: Omit<Trade, "id" | "createdAt">) => {
      if (!api) throw new Error("Google Sheets not configured");
      return api.addTrade(trade);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast({
        title: "Success",
        description: "Trade added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTradeMutation = useMutation({
    mutationFn: async ({ id, ...trade }: { id: number } & Partial<Trade>) => {
      if (!api) throw new Error("Google Sheets not configured");
      return api.updateTrade(id, trade);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast({
        title: "Success",
        description: "Trade updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTradeMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!api) throw new Error("Google Sheets not configured");
      return api.deleteTrade(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast({
        title: "Success",
        description: "Trade deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    trades: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addTrade: addTradeMutation.mutate,
    updateTrade: updateTradeMutation.mutate,
    deleteTrade: deleteTradeMutation.mutate,
    isAdding: addTradeMutation.isPending,
    isUpdating: updateTradeMutation.isPending,
    isDeleting: deleteTradeMutation.isPending,
  };
}

export function useTradesByDate(date: string) {
  const { settings } = useAppContext();
  
  const api = settings ? new GoogleSheetsAPI(settings.googleScriptUrl || "", settings.googleSheetId || "") : null;

  return useQuery({
    queryKey: ["trades", "date", date],
    queryFn: async () => {
      if (!api) throw new Error("Google Sheets not configured");
      return api.getTradesByDate(date);
    },
    enabled: !!api && !!date,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
