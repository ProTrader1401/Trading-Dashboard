import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Strategy } from "@shared/schema";
import { GoogleSheetsAPI } from "@/lib/google-sheets";
import { useAppContext } from "@/contexts/app-context";
import { useToast } from "@/hooks/use-toast";

export function useStrategies() {
  const { settings } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const api = settings ? new GoogleSheetsAPI(settings.googleScriptUrl || "", settings.googleSheetId || "") : null;

  const query = useQuery({
    queryKey: ["strategies"],
    queryFn: async () => {
      if (!api) throw new Error("Google Sheets not configured");
      return api.getStrategies();
    },
    enabled: !!api,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const addStrategyMutation = useMutation({
    mutationFn: async (strategy: Omit<Strategy, "id" | "createdAt">) => {
      if (!api) throw new Error("Google Sheets not configured");
      return api.addStrategy(strategy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast({
        title: "Success",
        description: "Strategy added successfully",
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

  const updateStrategyMutation = useMutation({
    mutationFn: async ({ id, ...strategy }: { id: number } & Partial<Strategy>) => {
      if (!api) throw new Error("Google Sheets not configured");
      return api.updateStrategy(id, strategy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast({
        title: "Success",
        description: "Strategy updated successfully",
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

  const deleteStrategyMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!api) throw new Error("Google Sheets not configured");
      return api.deleteStrategy(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast({
        title: "Success",
        description: "Strategy deleted successfully",
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
    strategies: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addStrategy: addStrategyMutation.mutate,
    updateStrategy: updateStrategyMutation.mutate,
    deleteStrategy: deleteStrategyMutation.mutate,
    isAdding: addStrategyMutation.isPending,
    isUpdating: updateStrategyMutation.isPending,
    isDeleting: deleteStrategyMutation.isPending,
  };
}
