import { useAppContext } from "@/contexts/app-context";
import { useToast } from "@/hooks/use-toast";

export function useSettings() {
  const { settings, updateSettings, isLoading } = useAppContext();
  const { toast } = useToast();

  const saveSettings = async (newSettings: Partial<NonNullable<typeof settings>>) => {
    try {
      // Save to backend first
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save settings to backend");
      }

      // Update local context
      updateSettings(newSettings);
      
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    settings,
    saveSettings,
    isLoading,
  };
}
