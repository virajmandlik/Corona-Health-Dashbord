import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Heart, 
  AlertTriangle,
  Brain,
  BarChart3
} from "lucide-react";
import { CovidCountryData } from "@/types/covid";
import { aiService } from "@/services/aiService";

interface AIKPIDashboardProps {
  countries: CovidCountryData[];
  selectedCountry: string;
}

interface KPIMetric {
  title: string;
  value: number;
  change: number;
  trend: "up" | "down" | "stable";
  icon: React.ReactNode;
  color: string;
  aiInsight?: string;
}

export function AIKPIDashboard({ countries, selectedCountry }: AIKPIDashboardProps) {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>("");

  const selectedCountryData = countries.find(c => c.country === selectedCountry);

  useEffect(() => {
    if (!selectedCountryData || !countries.length) return;

    const generateKPIMetrics = async () => {
      setLoading(true);
      
      try {
        // Calculate global averages for comparison
        const globalAvg = {
          casesPerMillion: countries.reduce((sum, c) => sum + (c.casesPerOneMillion || 0), 0) / countries.length,
          deathsPerMillion: countries.reduce((sum, c) => sum + (c.deathsPerOneMillion || 0), 0) / countries.length,
          recoveryRate: countries.reduce((sum, c) => {
            const total = c.cases || 0;
            const recovered = c.recovered || 0;
            return sum + (total > 0 ? (recovered / total) * 100 : 0);
          }, 0) / countries.length,
          testingRate: countries.reduce((sum, c) => sum + (c.testsPerOneMillion || 0), 0) / countries.length,
        };

        const countryRecoveryRate = selectedCountryData.cases > 0 
          ? (selectedCountryData.recovered / selectedCountryData.cases) * 100 
          : 0;

        const countryMortalityRate = selectedCountryData.cases > 0 
          ? (selectedCountryData.deaths / selectedCountryData.cases) * 100 
          : 0;

        // Generate AI insights for KPIs
        const kpiQuestion = `Analyze these COVID-19 KPIs for ${selectedCountry}:
- Cases per Million: ${selectedCountryData.casesPerOneMillion} (Global avg: ${globalAvg.casesPerMillion.toFixed(0)})
- Deaths per Million: ${selectedCountryData.deathsPerOneMillion} (Global avg: ${globalAvg.deathsPerMillion.toFixed(0)})
- Recovery Rate: ${countryRecoveryRate.toFixed(1)}% (Global avg: ${globalAvg.recoveryRate.toFixed(1)}%)
- Testing Rate: ${selectedCountryData.testsPerOneMillion} (Global avg: ${globalAvg.testingRate.toFixed(0)})

Provide a brief 2-sentence summary of the country's performance relative to global averages.`;

        const aiResponse = await aiService.generateGlobalInsights([selectedCountryData]);
        setAiSummary(aiResponse);

        const metrics: KPIMetric[] = [
          {
            title: "Cases per Million",
            value: selectedCountryData.casesPerOneMillion || 0,
            change: ((selectedCountryData.casesPerOneMillion || 0) - globalAvg.casesPerMillion) / globalAvg.casesPerMillion * 100,
            trend: (selectedCountryData.casesPerOneMillion || 0) > globalAvg.casesPerMillion ? "up" : "down",
            icon: <Activity className="h-4 w-4" />,
            color: "orange",
          },
          {
            title: "Deaths per Million",
            value: selectedCountryData.deathsPerOneMillion || 0,
            change: ((selectedCountryData.deathsPerOneMillion || 0) - globalAvg.deathsPerMillion) / globalAvg.deathsPerMillion * 100,
            trend: (selectedCountryData.deathsPerOneMillion || 0) > globalAvg.deathsPerMillion ? "up" : "down",
            icon: <AlertTriangle className="h-4 w-4" />,
            color: "red",
          },
          {
            title: "Recovery Rate",
            value: countryRecoveryRate,
            change: (countryRecoveryRate - globalAvg.recoveryRate) / globalAvg.recoveryRate * 100,
            trend: countryRecoveryRate > globalAvg.recoveryRate ? "up" : "down",
            icon: <Heart className="h-4 w-4" />,
            color: "green",
          },
          {
            title: "Testing Rate",
            value: selectedCountryData.testsPerOneMillion || 0,
            change: ((selectedCountryData.testsPerOneMillion || 0) - globalAvg.testingRate) / globalAvg.testingRate * 100,
            trend: (selectedCountryData.testsPerOneMillion || 0) > globalAvg.testingRate ? "up" : "down",
            icon: <BarChart3 className="h-4 w-4" />,
            color: "blue",
          },
        ];

        setKpiMetrics(metrics);
      } catch (error) {
        console.error("Error generating KPI metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    generateKPIMetrics();
  }, [selectedCountry, countries.length]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-3 w-3" />;
      case "down": return <TrendingDown className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getTrendColor = (trend: string, isPositiveMetric: boolean = false) => {
    if (trend === "stable") return "secondary";
    
    // For positive metrics (recovery rate, testing rate), up is good
    // For negative metrics (cases, deaths), down is good
    if (isPositiveMetric) {
      return trend === "up" ? "default" : "destructive";
    } else {
      return trend === "up" ? "destructive" : "default";
    }
  };

  const formatValue = (value: number, title: string) => {
    if (title.includes("Rate")) {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI-Powered KPI Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI-Powered KPI Dashboard - {selectedCountry}
        </CardTitle>
        {aiSummary && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <Brain className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <p>{aiSummary}</p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiMetrics.map((metric, index) => {
            const isPositiveMetric = metric.title.includes("Recovery") || metric.title.includes("Testing");
            
            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`text-${metric.color}-500`}>
                      {metric.icon}
                    </div>
                    <span className="text-sm font-medium">{metric.title}</span>
                  </div>
                  <Badge 
                    variant={getTrendColor(metric.trend, isPositiveMetric) as any}
                    className="flex items-center gap-1 text-xs"
                  >
                    {getTrendIcon(metric.trend)}
                    {Math.abs(metric.change).toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className={`text-2xl font-bold text-${metric.color}-500`}>
                    {formatValue(metric.value, metric.title)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    vs global average
                  </div>
                </div>

                {/* Progress bar for visual representation */}
                <div className="space-y-1">
                  <Progress 
                    value={Math.min(Math.abs(metric.change), 100)} 
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {metric.change > 0 ? "Above" : "Below"} global average
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}