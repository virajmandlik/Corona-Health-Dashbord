import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Brain, RefreshCw, AlertTriangle } from "lucide-react";
import { CovidCountryData } from "@/types/covid";
import { aiService } from "@/services/aiService";

interface GlobalAIInsightsProps {
  countries: CovidCountryData[];
}

export function GlobalAIInsights({ countries }: GlobalAIInsightsProps) {
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const generateInsights = async () => {
    if (!countries.length) return;

    setLoading(true);
    setError(null);
    
    try {
      const globalInsights = await aiService.generateGlobalInsights(countries);
      setInsights(globalInsights);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error("Error generating global insights:", err);
      setError("Failed to generate global AI insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countries.length > 0 && !insights) {
      generateInsights();
    }
  }, [countries.length]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <Brain className="h-5 w-5 text-purple-500" />
            Global AI Insights
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateInsights}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-3/6" />
          </div>
        ) : error ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : insights ? (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
              <p className="text-sm leading-relaxed">{insights}</p>
            </div>
            
            {lastUpdated && (
              <div className="text-xs text-muted-foreground border-t pt-2 flex justify-between items-center">
                <span>Last updated: {new Date(lastUpdated).toLocaleString()}</span>
                {!aiService.getApiStatus() && (
                  <Badge variant="secondary" className="text-xs">
                    Offline Mode
                  </Badge>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click refresh to generate global AI insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}