import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  AlertTriangle,
  Brain,
  RefreshCw
} from "lucide-react";
import { RangeBasedLineChart } from "./range-based-line-chart";
import { CovidCountryData } from "@/types/covid";
import { rangeAnalysisService, MetricKey, MetricAnalysis } from "@/services/rangeAnalysisService";

interface AdvancedRangeDashboardProps {
  countries: CovidCountryData[];
}

export function AdvancedRangeDashboard({ countries }: AdvancedRangeDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('deathsPerOneMillion');
  const [analysis, setAnalysis] = useState<MetricAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [continentFilter, setContinentFilter] = useState<string>('All');

  const loadAnalysis = async () => {
    if (!countries.length) return;
    
    setLoading(true);
    try {
      const result = await rangeAnalysisService.analyzeMetric(
        countries, 
        selectedMetric, 
        continentFilter === 'All' ? undefined : continentFilter,
        30
      );
      setAnalysis(result);
    } catch (error) {
      console.error("Error loading range analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [selectedMetric, continentFilter, countries.length]);

  const statistics = analysis ? rangeAnalysisService.calculateStatistics(analysis.countries) : null;
  const riskDistribution = analysis ? rangeAnalysisService.getRiskDistribution(analysis.countries) : null;

  const metricOptions = rangeAnalysisService.getMetricOptions();
  const continents = ['All', ...new Set(countries.map(c => c.continent).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Advanced Range-Based COVID-19 Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive analysis with AI insights, risk categorization, and statistical breakdowns
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalysis}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Analysis
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="visualization" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Visualization Tab */}
        <TabsContent value="visualization" className="space-y-4">
          <RangeBasedLineChart 
            countries={countries}
            selectedCountries={[]}
            onCountrySelectionChange={() => {}}
          />
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          {statistics && analysis ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Mean Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {statistics.mean.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average across {analysis.countries.length} countries
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Median Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.median.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Middle value in distribution
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Range</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {(statistics.max - statistics.min).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.min.toLocaleString()} - {statistics.max.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Std Deviation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {statistics.standardDeviation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Data variability measure
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Top and Bottom Performers */}
          {analysis && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-500" />
                    Highest Values
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.countries.slice(0, 5).map((country, index) => (
                      <div key={country.country} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          {country.flag && (
                            <img src={country.flag} alt={country.country} className="w-5 h-3 object-cover rounded" />
                          )}
                          <span className="text-sm">{country.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">{country.value.toLocaleString()}</span>
                          <Badge 
                            variant={country.riskLevel === 'Critical' ? 'destructive' : 
                                    country.riskLevel === 'High' ? 'destructive' : 
                                    country.riskLevel === 'Medium' ? 'secondary' : 'default'}
                            className="text-xs"
                          >
                            {country.riskLevel}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    Lowest Values
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.countries.slice(-5).reverse().map((country, index) => (
                      <div key={country.country} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{analysis.countries.length - 4 + index}</span>
                          {country.flag && (
                            <img src={country.flag} alt={country.country} className="w-5 h-3 object-cover rounded" />
                          )}
                          <span className="text-sm">{country.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">{country.value.toLocaleString()}</span>
                          <Badge 
                            variant={country.riskLevel === 'Low' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {country.riskLevel}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Risk Analysis Tab */}
        <TabsContent value="risk-analysis" className="space-y-4">
          {riskDistribution && analysis ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Risk Level Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(riskDistribution).map(([level, count]) => {
                      const percentage = (count / analysis.countries.length) * 100;
                      const color = level === 'Low' ? 'bg-green-500' :
                                   level === 'Medium' ? 'bg-yellow-500' :
                                   level === 'High' ? 'bg-orange-500' : 'bg-red-500';
                      
                      return (
                        <div key={level} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${color}`} />
                              {level} Risk
                            </span>
                            <span>{count} countries ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${color}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Range Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.ranges.map((range, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: range.color }}
                        />
                        <span className="text-sm font-medium">{range.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-4 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {analysis ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  AI-Generated Insights
                  <Badge variant="secondary" className="text-xs">
                    {rangeAnalysisService.getMetricLabel(selectedMetric)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4 border">
                  <p className="text-sm leading-relaxed">{analysis.insights}</p>
                </div>
                <Separator className="my-4" />
                <div className="text-xs text-muted-foreground">
                  Analysis generated: {new Date(analysis.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}