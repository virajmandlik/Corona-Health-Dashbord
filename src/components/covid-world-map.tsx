import { useState, useEffect, useMemo } from "react";
import WorldMap from "react-svg-worldmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Globe, 
  Activity, 
  AlertTriangle, 
  Heart, 
  Users, 
  TestTube,
  Brain,
  RefreshCw,
  Info
} from "lucide-react";
import { CovidCountryData } from "@/types/covid";
import { countryMappingService } from "@/services/countryMappingService";
import { aiService } from "@/services/aiService";
import { ErrorBoundary, WorldMapErrorFallback } from "./error-boundary";

interface CovidWorldMapProps {
  countries: CovidCountryData[];
  loading?: boolean;
}

type MapMetric = 'cases' | 'deaths' | 'recovered' | 'active' | 'casesPerOneMillion' | 'deathsPerOneMillion' | 'testsPerOneMillion';

interface WorldMapData {
  country: string;
  value: number;
}

const METRIC_OPTIONS = [
  { key: 'cases' as MapMetric, label: 'Total Cases', icon: Activity, color: '#f97316', suffix: 'cases' },
  { key: 'deaths' as MapMetric, label: 'Total Deaths', icon: AlertTriangle, color: '#ef4444', suffix: 'deaths' },
  { key: 'recovered' as MapMetric, label: 'Total Recovered', icon: Heart, color: '#22c55e', suffix: 'recovered' },
  { key: 'active' as MapMetric, label: 'Active Cases', icon: Users, color: '#3b82f6', suffix: 'active' },
  { key: 'casesPerOneMillion' as MapMetric, label: 'Cases per Million', icon: Activity, color: '#f59e0b', suffix: 'per million' },
  { key: 'deathsPerOneMillion' as MapMetric, label: 'Deaths per Million', icon: AlertTriangle, color: '#dc2626', suffix: 'per million' },
  { key: 'testsPerOneMillion' as MapMetric, label: 'Tests per Million', icon: TestTube, color: '#8b5cf6', suffix: 'tests per million' },
];

export function CovidWorldMap({ countries, loading = false }: CovidWorldMapProps) {
  const [selectedMetric, setSelectedMetric] = useState<MapMetric>('cases');
  const [mapSize, setMapSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const selectedMetricConfig = METRIC_OPTIONS.find(m => m.key === selectedMetric)!;

  // Prepare data for world map
  const worldMapData = useMemo(() => {
    if (!countries.length) return [];

    const mapData: WorldMapData[] = [];
    let unmappedCount = 0;

    countries.forEach(country => {
      try {
        const iso2Code = countryMappingService.getISO2Code(country.country);
        if (iso2Code && iso2Code !== 'xx' && iso2Code.length === 2) { // Ensure valid ISO2 code
          const value = Number(country[selectedMetric] || 0);
          if (value > 0 && isFinite(value)) {
            mapData.push({
              country: iso2Code.toLowerCase(), // Ensure lowercase for consistency
              value: value
            });
          }
        } else {
          unmappedCount++;
        }
      } catch (error) {
        console.warn(`Error processing country ${country.country}:`, error);
        unmappedCount++;
      }
    });

    if (unmappedCount > 0) {
      console.log(`${unmappedCount} countries could not be mapped to the world map`);
    }

    // Validate and clean the data
    const validData = mapData.filter(item => 
      item.country && 
      typeof item.country === 'string' && 
      item.country.length === 2 &&
      typeof item.value === 'number' && 
      isFinite(item.value) && 
      item.value > 0
    );

    return validData.sort((a, b) => b.value - a.value);
  }, [countries, selectedMetric]);

  // Get statistics for the current metric
  const statistics = useMemo(() => {
    if (!worldMapData.length) return null;

    const values = worldMapData.map(d => d.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = total / values.length;

    return {
      total,
      max,
      min,
      avg,
      countries: worldMapData.length
    };
  }, [worldMapData]);

  // Generate AI insights for the world map data
  const generateMapInsights = async () => {
    if (!worldMapData.length) return;

    setLoadingInsight(true);
    try {
      const topCountries = worldMapData.slice(0, 5);
      const metricLabel = selectedMetricConfig.label;
      
      const question = `Analyze the global ${metricLabel} distribution across countries. Top 5 countries: ${topCountries.map(c => `${c.country.toUpperCase()}: ${c.value.toLocaleString()}`).join(', ')}.
      
      Provide a brief 2-3 sentence global analysis focusing on:
      1. Geographic patterns or regional trends
      2. Notable disparities between countries
      3. Key insights for global health monitoring
      
      Keep response concise and actionable.`;

      const relevantCountries = countries.filter(c => 
        topCountries.some(tc => countryMappingService.getISO2Code(c.country) === tc.country)
      );

      const insight = await aiService.generateGlobalInsights(relevantCountries);
      setAiInsight(insight);
    } catch (error) {
      console.error("Error generating map insights:", error);
      setAiInsight("Global COVID-19 data shows significant variation across regions, reflecting differences in healthcare systems, population density, and pandemic response strategies.");
    } finally {
      setLoadingInsight(false);
    }
  };

  useEffect(() => {
    if (worldMapData.length > 0) {
      generateMapInsights();
    }
  }, [selectedMetric, worldMapData.length]);

  // Custom tooltip for the world map
  const getTooltipContent = (countryCode: any, value: any) => {
    try {
      // Handle the case where parameters might be objects or undefined
      let code = '';
      let numValue = 0;
      
      if (typeof countryCode === 'string') {
        code = countryCode.toLowerCase();
      } else if (countryCode && typeof countryCode === 'object' && countryCode.country) {
        code = String(countryCode.country).toLowerCase();
      } else {
        code = String(countryCode || '').toLowerCase();
      }
      
      if (typeof value === 'number') {
        numValue = value;
      } else if (value && typeof value === 'object' && value.value) {
        numValue = Number(value.value);
      } else {
        numValue = Number(value || 0);
      }
      
      // Find the country data
      const country = countries.find(c => {
        const iso2 = countryMappingService.getISO2Code(c.country);
        return iso2 && iso2.toLowerCase() === code;
      });
      
      if (!country) {
        return `${code.toUpperCase()}: ${numValue.toLocaleString()} ${selectedMetricConfig.suffix}`;
      }
      
      return `${country.country}: ${numValue.toLocaleString()} ${selectedMetricConfig.suffix}`;
    } catch (error) {
      console.warn('Error in tooltip:', error);
      return `Data: ${String(value || 0)} ${selectedMetricConfig.suffix}`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Global COVID-19 World Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[400px] rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Global COVID-19 World Map
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Interactive world map showing {selectedMetricConfig.label.toLowerCase()} across countries
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateMapInsights}
              disabled={loadingInsight}
              className="flex items-center gap-2"
            >
              <Brain className={`h-4 w-4 ${loadingInsight ? 'animate-pulse' : ''}`} />
              {loadingInsight ? 'Analyzing...' : 'AI Insight'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <selectedMetricConfig.icon className="h-4 w-4" />
            <Select value={selectedMetric} onValueChange={(value: MapMetric) => setSelectedMetric(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {METRIC_OPTIONS.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Size:</span>
            <Select value={mapSize} onValueChange={(value: 'sm' | 'md' | 'lg' | 'xl') => setMapSize(value)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">X-Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {statistics && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{statistics.countries} countries mapped</span>
              <span>Max: {statistics.max.toLocaleString()}</span>
              <span>Avg: {statistics.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* World Map */}
        <div className="flex justify-center">
          <div className="w-full max-w-6xl">
            {worldMapData.length > 0 ? (
              <ErrorBoundary fallback={WorldMapErrorFallback}>
                <div className="relative">
                  <WorldMap
                    color={selectedMetricConfig.color}
                    title=""
                    value-suffix={selectedMetricConfig.suffix}
                    size={mapSize}
                    data={worldMapData}
                    tooltipTextFunction={getTooltipContent}
                    styleFunction={(context) => {
                      try {
                        const { countryCode, countryValue, color, minValue, maxValue } = context || {};
                        
                        // Ensure all values are numbers
                        const value = Number(countryValue || 0);
                        const min = Number(minValue || 0);
                        const max = Number(maxValue || 0);
                        
                        // Calculate opacity based on value range
                        const opacity = min === max ? 0.7 : 
                          0.3 + (0.7 * (value - min) / (max - min));
                        
                        return {
                          fill: color || selectedMetricConfig.color,
                          fillOpacity: Math.max(0.3, Math.min(1, opacity)),
                          stroke: "#333",
                          strokeWidth: 0.5,
                          strokeOpacity: 0.5,
                          cursor: "pointer"
                        };
                      } catch (error) {
                        console.warn("Error in styleFunction:", error);
                        return {
                          fill: selectedMetricConfig.color,
                          fillOpacity: 0.5,
                          stroke: "#333",
                          strokeWidth: 0.5,
                          strokeOpacity: 0.5,
                          cursor: "pointer"
                        };
                      }
                    }}
                  />
                </div>
              </ErrorBoundary>
            ) : (
              <div className="flex items-center justify-center h-[400px] bg-muted/50 rounded-lg">
                <div className="text-center">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No data available for world map</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Countries</span>
                </div>
                <div className="text-2xl font-bold">{statistics.countries}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <div className="text-2xl font-bold">{statistics.total.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Highest</span>
                </div>
                <div className="text-2xl font-bold">{statistics.max.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Average</span>
                </div>
                <div className="text-2xl font-bold">
                  {statistics.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Insights */}
        {aiInsight && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                Global Map Insights
                {!aiService.getApiStatus() && (
                  <Badge variant="secondary" className="text-xs">
                    Offline Mode
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border">
                <p className="text-sm leading-relaxed">{aiInsight}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend and Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Info className="h-3 w-3" />
            <span>Darker colors indicate higher values. Hover over countries for details.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Metric: {selectedMetricConfig.label}</span>
            <span>Data points: {worldMapData.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}