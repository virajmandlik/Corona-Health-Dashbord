import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from "lucide-react";
import { CovidCountryData } from "@/types/covid";
import { aiService, AIInsight } from "@/services/aiService";

interface AIInsightsCardProps {
  countryData: CovidCountryData;
}

export function AIInsightsCard({ countryData }: AIInsightsCardProps) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryData) return;

    const generateInsight = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const aiInsight = await aiService.analyzeCountryData(countryData);
        setInsight(aiInsight);
      } catch (err) {
        console.error("Error generating AI insight:", err);
        setError("Failed to generate AI analysis");
      } finally {
        setLoading(false);
      }
    };

    generateInsight();
  }, [countryData.country, countryData.cases, countryData.deaths]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "Critical": return "destructive";
      case "High": return "destructive";
      case "Medium": return "secondary";
      case "Low": return "default";
      default: return "default";
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case "Critical": return <AlertTriangle className="h-4 w-4" />;
      case "High": return <AlertTriangle className="h-4 w-4" />;
      case "Medium": return <TrendingUp className="h-4 w-4" />;
      case "Low": return <CheckCircle className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!insight) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Analysis for {insight.country}
          </div>
          <Badge 
            variant={getRiskLevelColor(insight.riskLevel) as any}
            className="flex items-center gap-1"
          >
            {getRiskLevelIcon(insight.riskLevel)}
            {insight.riskLevel} Risk
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analysis */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Situation Analysis
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insight.analysis}
          </p>
        </div>

        {/* Key Metrics */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Key Metrics
          </h4>
          <div className="grid gap-2">
            {insight.keyMetrics.map((metric, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">{metric}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Recommendations
          </h4>
          <div className="grid gap-2">
            {insight.recommendations.map((recommendation, index) => (
              <div 
                key={index}
                className="flex items-start gap-2 p-2 bg-muted/50 rounded-md"
              >
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                <span className="text-sm">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamp and Status */}
        <div className="text-xs text-muted-foreground border-t pt-2 flex justify-between items-center">
          <span>Analysis generated: {new Date(insight.timestamp).toLocaleString()}</span>
          {!aiService.getApiStatus() && (
            <Badge variant="secondary" className="text-xs">
              Offline Mode
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}