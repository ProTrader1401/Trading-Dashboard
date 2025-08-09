import { useAppContext } from "@/contexts/app-context";
import { useToast } from "@/hooks/use-toast";

export function useSettings() {
  const { settings, updateSettings, isLoading } = useAppContext();
  const { toast } = useToast();

  const saveSettings = (newSettings: Partial<NonNullable<typeof settings>>) => {
    try {
      updateSettings(newSettings);
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  return {
    settings,
    saveSettings,
    isLoading,
  };
}
