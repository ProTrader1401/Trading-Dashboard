import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  googleSheetId: z.string().min(1, "Google Sheet ID is required"),
  googleScriptUrl: z.string().url("Please enter a valid URL"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testResult, setTestResult] = useState<string>("");
  const { settings, saveSettings, isLoading } = useSettings();
  const { toast } = useToast();

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      googleSheetId: "",
      googleScriptUrl: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        googleSheetId: settings.googleSheetId || "",
        googleScriptUrl: settings.googleScriptUrl || "",
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SettingsForm) => {
    saveSettings(data).catch(error => {
      console.error("Failed to save settings:", error);
    });
    setConnectionStatus("idle");
  };

  const testConnection = async () => {
    const formData = form.getValues();
    
    if (!formData.googleScriptUrl || !formData.googleSheetId) {
      toast({
        title: "Error",
        description: "Please enter both Google Sheet ID and Script URL",
        variant: "destructive",
      });
      return;
    }

    setConnectionStatus("testing");
    setTestResult("");

    try {
      // First save the settings
      saveSettings(formData);
      
      const isProduction = import.meta.env.PROD;
      
      if (isProduction) {
        // In production, use JSONP to avoid CORS issues
        const result = await new Promise((resolve, reject) => {
          const callbackName = `jsonp_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Create callback function
          (window as any)[callbackName] = (result: any) => {
            delete (window as any)[callbackName];
            document.body.removeChild(script);
            resolve(result);
          };
          
          // Create script element for JSONP
          const script = document.createElement('script');
          const params = new URLSearchParams({
            action: "test",
            data: JSON.stringify({ sheetId: formData.googleSheetId }),
            sheetId: formData.googleSheetId,
            callback: callbackName
          });
          
          script.src = `${formData.googleScriptUrl}?${params.toString()}`;
          script.onerror = () => {
            delete (window as any)[callbackName];
            document.body.removeChild(script);
            reject(new Error('JSONP request failed'));
          };
          
          document.body.appendChild(script);
          
          // Timeout after 15 seconds
          setTimeout(() => {
            if ((window as any)[callbackName]) {
              delete (window as any)[callbackName];
              if (document.body.contains(script)) {
                document.body.removeChild(script);
              }
              reject(new Error('Request timeout'));
            }
          }, 15000);
        });

        if ((result as any).success) {
          setConnectionStatus("success");
          setTestResult("Connection successful! Google Sheets integration is working.");
          toast({
            title: "Success",
            description: "Connection to Google Sheets successful!",
          });
        } else {
          throw new Error((result as any).error || "Connection test failed");
        }
      } else {
        // In development, route through backend to avoid CORS
        const response = await fetch("/api/test-google-connection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            googleSheetId: formData.googleSheetId,
            googleScriptUrl: formData.googleScriptUrl
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setConnectionStatus("success");
            setTestResult("Connection successful! Google Sheets integration is working.");
            toast({
              title: "Success",
              description: "Connection to Google Sheets successful!",
            });
          } else {
            throw new Error(result.error || "Connection test failed");
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      setConnectionStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setTestResult(`Connection failed: ${errorMessage}`);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const ConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case "testing":
        return (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Testing...</span>
          </Badge>
        );
      case "success":
        return (
          <Badge variant="default" className="flex items-center space-x-1 bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            <span>Connected</span>
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
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
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your Google Sheets integration and app preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Google Sheets Integration</CardTitle>
                <ConnectionStatusIndicator />
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="googleSheetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Sheet ID</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The ID from your Google Sheet URL. Found between /d/ and /edit in the URL.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="googleScriptUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Apps Script URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://script.google.com/macros/s/your-script-id/exec"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The deployment URL from your Google Apps Script project.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {testResult && (
                    <Alert variant={connectionStatus === "error" ? "destructive" : "default"}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{testResult}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={testConnection}
                      disabled={connectionStatus === "testing"}
                      className="flex-1"
                    >
                      {connectionStatus === "testing" ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Setup Instructions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>Setup Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">1. Create Google Sheet</h4>
                <p className="text-sm text-gray-600">
                  Create a new Google Sheet and copy the Sheet ID from the URL.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">2. Setup Apps Script</h4>
                <p className="text-sm text-gray-600">
                  Create a Google Apps Script project and deploy it as a web app.
                </p>
                <Button variant="link" size="sm" asChild className="p-0 h-auto">
                  <a href="https://script.google.com" target="_blank" rel="noopener noreferrer">
                    Open Apps Script <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">3. Configure Permissions</h4>
                <p className="text-sm text-gray-600">
                  Grant necessary permissions for the script to access your sheet.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">4. Deploy & Test</h4>
                <p className="text-sm text-gray-600">
                  Deploy the script and use the test connection button to verify.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>App Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Version</span>
                <span className="text-sm font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Environment</span>
                <Badge variant="outline">
                  {import.meta.env.DEV ? "Development" : "Production"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Data Storage</span>
                <span className="text-sm font-medium">Google Sheets</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Need help setting up your trading dashboard?
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Documentation
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
