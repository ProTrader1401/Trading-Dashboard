import { useState } from "react";
import { Smile, Meh, Frown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePsychology } from "@/hooks/use-psychology";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Emotion = "confident" | "neutral" | "anxious";

export default function EmotionTracker() {
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>("confident");
  const [note, setNote] = useState("");
  const { addEntry, isAdding } = usePsychology();
  const { toast } = useToast();

  const emotions = [
    { 
      type: "confident" as Emotion, 
      icon: Smile, 
      label: "Confident",
      color: "border-green-200 bg-green-50 text-green-700",
      activeColor: "border-green-300"
    },
    { 
      type: "neutral" as Emotion, 
      icon: Meh, 
      label: "Neutral",
      color: "border-gray-200 bg-gray-50 text-gray-600",
      activeColor: "border-gray-300"
    },
    { 
      type: "anxious" as Emotion, 
      icon: Frown, 
      label: "Anxious",
      color: "border-red-200 bg-red-50 text-red-700",
      activeColor: "border-red-300"
    },
  ];

  const handleEmotionSelect = (emotion: Emotion) => {
    setSelectedEmotion(emotion);
  };

  const saveEmotionEntry = async () => {
    if (!selectedEmotion && !note.trim()) {
      toast({
        title: "Nothing to save",
        description: "Please select an emotion or add a note",
        variant: "destructive",
      });
      return;
    }

    try {
      await addEntry({
        entryDate: new Date().toISOString().split('T')[0],
        monthlyPnL: "0", // Will be calculated from today's trades
        bestTradeId: null,
        worstTradeId: null,
        mentalReflections: note.trim() || `Feeling ${selectedEmotion} today`,
        improvementAreas: "",
      });

      toast({
        title: "Entry Saved!",
        description: "Your daily psychology entry has been saved",
      });

      // Reset form
      setNote("");
      setSelectedEmotion("confident");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save psychology entry",
        variant: "destructive",
      });
    }
  };

  const openEmotionLog = () => {
    // Navigate to psychology page
    window.location.href = "/psychology";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Today's Emotion</CardTitle>
          <Button variant="ghost" size="sm" onClick={saveEmotionEntry} disabled={isAdding}>
            {isAdding ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Emotion Selector */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {emotions.map((emotion) => {
            const Icon = emotion.icon;
            const isActive = selectedEmotion === emotion.type;
            
            return (
              <button
                key={emotion.type}
                onClick={() => handleEmotionSelect(emotion.type)}
                className={cn(
                  "p-3 rounded-lg border-2 transition-colors",
                  isActive ? `${emotion.color} ${emotion.activeColor}` : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 mb-1 mx-auto",
                  isActive ? emotion.color.split(' ')[2] : "text-gray-500"
                )} />
                <div className={cn(
                  "text-xs font-medium",
                  isActive ? emotion.color.split(' ')[2] : "text-gray-600"
                )}>
                  {emotion.label}
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Quick Note */}
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Quick thoughts about today's trading..."
          rows={3}
          className="resize-none"
        />
      </CardContent>
    </Card>
  );
}