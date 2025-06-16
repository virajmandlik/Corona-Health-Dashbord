import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, 
  BarChart3,
  Activity,
  AlertTriangle,
  Heart,
  Users,
  RefreshCw,
  Search,
  Filter,
  Clock,
  Zap,
  Globe,
  Calendar,
  Calculator,
  TrendingDown
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line, AreaChart, Area } from "recharts";
import { CountrySelector } from "@/components/country-selector";
import { StatsCard } from "@/components/stats-card";
import { AIInsightsCard } from "@/components/ai-insights-card";
import { AIKPIDashboard } from "@/components/ai-kpi-dashboard";
import { HistoricalTrendChart } from "@/components/historical-trend-chart";
import { CountryComparisonChart } from "@/components/country-comparison-chart";
import { AdvancedRangeDashboard } from "@/components/advanced-range-dashboard";
import { DateRangeSelector } from "@/components/date-range-selector";
import { covidApi } from "@/services/covidApi";
import { CovidCountryData } from "@/types/covid";
import { useToast } from "@/hooks/use-toast";
import { aiService } from "@/services/aiService";
import { Layout } from "@/components/layout";

interface PopulationAnalysis {
  country: string;
  population: number;
  cases: number;
  deaths: number;
  recovered: number;
  casesPerMillion: number;
  deathsPerMillion: number;
  recoveredPerMillion: number;
  mortalityRate: number;
  recoveryRate: number;
  continent: string;
  flag: string;
}

interface LiveUpdate {
  country: string;
  todayCases: number;
  todayDeaths: number;
  todayRecovered: number;
  flag: string;
  continent: string;
  timestamp: number;
}

interface TrendData {
  time: string;
  cases: number;
  deaths: number;
  recovered: number;
}

const CountryAnalytics = () => {
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [selectedDays, setSelectedDays] = useState(30);
  const [comparisonCountries, setComparisonCountries] = useState<string[]>([]);
  
  // Population Data states
  const [selectedContinent, setSelectedContinent] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("population");
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  // Live Tracking states
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [liveInsight, setLiveInsight] = useState<string>("");
  const [loadingLiveInsight, setLoadingLiveInsight] = useState(false);
  
  const { toast } = useToast();

  const { 
    data: countries = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['countries'],
    queryFn: covidApi.getAllCountries,
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
  });

  const { 
    data: globalData,
    isLoading: globalLoading,
    refetch: refetchGlobal
  } = useQuery({
    queryKey: ['global-stats'],
    queryFn: covidApi.getGlobalStats,
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
  });

  const selectedCountryData = countries.find(
    country => country.country === selectedCountry
  );

  // Get comparison data
  const comparisonData = countries.filter(country => 
    comparisonCountries.includes(country.country)
  );

  // Get similar countries (same continent, similar population)
  const similarCountries = countries.filter(country => {
    if (!selectedCountryData || country.country === selectedCountry) return false;
    
    const sameContinentWeight = country.continent === selectedCountryData.continent ? 1 : 0;
    const populationRatio = Math.min(
      (country.population || 0) / (selectedCountryData.population || 1),
      (selectedCountryData.population || 1) / (country.population || 1)
    );
    const populationWeight = populationRatio > 0.1 ? populationRatio : 0;
    
    return (sameContinentWeight + populationWeight) > 0.5;
  }).slice(0, 5);

  // Population Data processing
  const populationData = useMemo((): PopulationAnalysis[] => {
    return countries
      .filter(country => country.population && country.population > 0)
      .map(country => ({
        country: country.country,
        population: country.population || 0,
        cases: country.cases || 0,
        deaths: country.deaths || 0,
        recovered: country.recovered || 0,
        casesPerMillion: country.casesPerOneMillion || 0,
        deathsPerMillion: country.deathsPerOneMillion || 0,
        recoveredPerMillion: country.recoveredPerOneMillion || 0,
        mortalityRate: country.cases > 0 ? (country.deaths / country.cases) * 100 : 0,
        recoveryRate: country.cases > 0 ? (country.recovered / country.cases) * 100 : 0,
        continent: country.continent || 'Unknown',
        flag: country.countryInfo?.flag || '',
      }))
      .filter(country => selectedContinent === "All" || country.continent === selectedContinent)
      .sort((a, b) => {
        switch (sortBy) {
          case "population": return b.population - a.population;
          case "cases": return b.cases - a.cases;
          case "casesPerMillion": return b.casesPerMillion - a.casesPerMillion;
          case "mortalityRate": return b.mortalityRate - a.mortalityRate;
          default: return b.population - a.population;
        }
      });
  }, [countries, selectedContinent, sortBy]);

  // Get continents for population filter
  const continents = useMemo(() => {
    const unique = [...new Set(countries.map(c => c.continent).filter(Boolean))];
    return ['All', ...unique.sort()];
  }, [countries]);

  // Population categories
  const populationCategories = useMemo(() => {
    const categories = {
      'Mega (>100M)': populationData.filter(c => c.population > 100000000),
      'Large (10M-100M)': populationData.filter(c => c.population >= 10000000 && c.population <= 100000000),
      'Medium (1M-10M)': populationData.filter(c => c.population >= 1000000 && c.population < 10000000),
      'Small (<1M)': populationData.filter(c => c.population < 1000000),
    };

    return Object.entries(categories).map(([category, data]) => ({
      category,
      count: data.length,
      totalPopulation: data.reduce((sum, c) => sum + c.population, 0),
      totalCases: data.reduce((sum, c) => sum + c.cases, 0),
      totalDeaths: data.reduce((sum, c) => sum + c.deaths, 0),
      avgCasesPerMillion: data.length > 0 ? data.reduce((sum, c) => sum + c.casesPerMillion, 0) / data.length : 0,
      avgDeathsPerMillion: data.length > 0 ? data.reduce((sum, c) => sum + c.deathsPerMillion, 0) / data.length : 0,
    }));
  }, [populationData]);

  // Live Tracking data processing
  const liveUpdates: LiveUpdate[] = countries
    .filter(country => 
      (country.todayCases || 0) > 0 || 
      (country.todayDeaths || 0) > 0 || 
      (country.todayRecovered || 0) > 0
    )
    .map(country => ({
      country: country.country,
      todayCases: country.todayCases || 0,
      todayDeaths: country.todayDeaths || 0,
      todayRecovered: country.todayRecovered || 0,
      flag: country.countryInfo?.flag || '',
      continent: country.continent || 'Unknown',
      timestamp: country.updated || Date.now(),
    }))
    .sort((a, b) => (b.todayCases + b.todayDeaths + b.todayRecovered) - (a.todayCases + a.todayDeaths + a.todayRecovered))
    .slice(0, 20);

  // Calculate global today's totals
  const globalToday = {
    cases: countries.reduce((sum, c) => sum + (c.todayCases || 0), 0),
    deaths: countries.reduce((sum, c) => sum + (c.todayDeaths || 0), 0),
    recovered: countries.reduce((sum, c) => sum + (c.todayRecovered || 0), 0),
    activeCountries: liveUpdates.length,
  };

  // Generate trend data (simulated for demo)
  const trendData: TrendData[] = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (23 - i));
    return {
      time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      cases: Math.floor(Math.random() * 1000) + 500,
      deaths: Math.floor(Math.random() * 50) + 10,
      recovered: Math.floor(Math.random() * 800) + 200,
    };
  });

  // Chart data for population vs cases
  const scatterData = populationData.slice(0, 50).map(country => ({
    x: country.population / 1000000, // Population in millions
    y: country.casesPerMillion,
    name: country.country,
    continent: country.continent,
  }));

  useEffect(() => {
    if (countries.length > 0 && !selectedCountry) {
      setSelectedCountry(countries[0].country);
    }
  }, [countries, selectedCountry]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading data",
        description: "Failed to fetch COVID-19 data. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleAddComparison = (country: string) => {
    if (!comparisonCountries.includes(country) && comparisonCountries.length < 5) {
      setComparisonCountries([...comparisonCountries, country]);
    }
  };

  const handleRemoveComparison = (country: string) => {
    setComparisonCountries(comparisonCountries.filter(c => c !== country));
  };

  // Population Data handlers
  const generatePopulationInsights = async () => {
    setLoadingInsight(true);
    try {
      const topPopulated = populationData.slice(0, 5);
      const question = `Analyze the relationship between population size and COVID-19 impact for these countries: ${topPopulated.map(c => `${c.country} (Pop: ${c.population.toLocaleString()}, Cases/M: ${c.casesPerMillion.toLocaleString()})`).join(', ')}.
      
      Provide insights on:
      1. How population density affects COVID-19 spread
      2. Correlation between population size and cases per million
      3. Key patterns in population-based COVID-19 outcomes
      
      Keep response under 150 words.`;

      const insight = await aiService.generateGlobalInsights(countries.slice(0, 10));
      setAiInsight(insight);
    } catch (error) {
      setAiInsight("Population analysis shows varying COVID-19 impacts across different population sizes. Larger countries often face greater challenges in pandemic management due to scale, while smaller nations may achieve better per-capita outcomes through focused interventions.");
    } finally {
      setLoadingInsight(false);
    }
  };

  // Live Tracking handlers
  const generateLiveInsights = async () => {
    setLoadingLiveInsight(true);
    try {
      const topUpdates = liveUpdates.slice(0, 5);
      const question = `Analyze today's COVID-19 updates: ${topUpdates.map(u => `${u.country}: +${u.todayCases} cases, +${u.todayDeaths} deaths`).join(', ')}. 
      
      Global today: +${globalToday.cases} cases, +${globalToday.deaths} deaths from ${globalToday.activeCountries} countries.
      
      Provide a brief real-time analysis focusing on:
      1. Current hotspots and emerging trends
      2. Notable changes from recent patterns
      3. Key areas requiring attention
      
      Keep response under 120 words.`;

      const insight = await aiService.generateGlobalInsights(countries.slice(0, 10));
      setLiveInsight(insight);
    } catch (error) {
      setLiveInsight("Live tracking shows ongoing COVID-19 activity across multiple regions. Today's updates indicate continued transmission with varying intensity across countries. Monitoring systems remain active to track emerging patterns and support public health responses.");
    } finally {
      setLoadingLiveInsight(false);
    }
  };

  const handleManualRefresh = () => {
    setLastUpdate(new Date());
    refetch();
    refetchGlobal();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    if (!autoRefresh) {
      setLastUpdate(new Date());
    }
  };

  // Auto-refresh effect for Live Tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        setLastUpdate(new Date());
        refetch();
        refetchGlobal();
      }, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, refetch, refetchGlobal]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load country analytics data. Please check your internet connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Country Analytics</h1>
          <p className="text-muted-foreground">
            Detailed analysis and insights for individual countries
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Country Selection and Controls */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Select Country
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CountrySelector
              countries={countries}
              selectedCountry={selectedCountry}
              onCountrySelect={setSelectedCountry}
              loading={isLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Time Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DateRangeSelector
              selectedDays={selectedDays}
              onDaysChange={setSelectedDays}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCountryData ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Continent:</span>
                  <Badge variant="outline">{selectedCountryData.continent}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Population:</span>
                  <span className="font-mono">{selectedCountryData.population?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cases/Million:</span>
                  <span className="font-mono">{selectedCountryData.casesPerOneMillion?.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Statistics */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[120px]" />
                <Skeleton className="h-4 w-[80px] mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : selectedCountryData ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total Cases"
            value={selectedCountryData.cases}
            todayValue={selectedCountryData.todayCases}
            icon={<Activity className="h-4 w-4 text-orange-500" />}
            color="warning"
          />
          <StatsCard
            title="Deaths"
            value={selectedCountryData.deaths}
            todayValue={selectedCountryData.todayDeaths}
            icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
            color="destructive"
          />
          <StatsCard
            title="Recovered"
            value={selectedCountryData.recovered}
            todayValue={selectedCountryData.todayRecovered}
            icon={<Heart className="h-4 w-4 text-green-500" />}
            color="success"
          />
          <StatsCard
            title="Active Cases"
            value={selectedCountryData.active}
            icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          />
          <StatsCard
            title="Critical Cases"
            value={selectedCountryData.critical}
            icon={<AlertTriangle className="h-4 w-4 text-purple-500" />}
          />
          <StatsCard
            title="Tests Conducted"
            value={selectedCountryData.tests}
            icon={<BarChart3 className="h-4 w-4 text-cyan-500" />}
          />
        </div>
      ) : null}

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="population">Population Data</TabsTrigger>
          <TabsTrigger value="live">Live Tracking</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {selectedCountryData && (
            <>
              {/* KPI Dashboard */}
              <AIKPIDashboard 
                countries={countries} 
                selectedCountry={selectedCountry} 
              />

              {/* Country Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Country Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      {selectedCountryData.countryInfo?.flag && (
                        <img 
                          src={selectedCountryData.countryInfo.flag} 
                          alt={selectedCountryData.country} 
                          className="w-12 h-8 object-cover rounded border"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{selectedCountryData.country}</h3>
                        <p className="text-sm text-muted-foreground">{selectedCountryData.continent}</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Population:</span>
                        <span className="text-sm font-mono">{selectedCountryData.population?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Cases per Million:</span>
                        <span className="text-sm font-mono">{selectedCountryData.casesPerOneMillion?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Deaths per Million:</span>
                        <span className="text-sm font-mono">{selectedCountryData.deathsPerOneMillion?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Tests per Million:</span>
                        <span className="text-sm font-mono">{selectedCountryData.testsPerOneMillion?.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Similar Countries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {similarCountries.map((country) => (
                        <div key={country.country} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {country.countryInfo?.flag && (
                              <img src={country.countryInfo.flag} alt={country.country} className="w-5 h-3 object-cover rounded" />
                            )}
                            <span className="text-sm">{country.country}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddComparison(country.country)}
                            disabled={comparisonCountries.includes(country.country)}
                          >
                            Compare
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {selectedCountry && (
            <HistoricalTrendChart
              country={selectedCountry}
              days={selectedDays}
            />
          )}
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <CountryComparisonChart
              countries={countries}
              selectedCountry={selectedCountry}
              metric="cases"
              title="Total Cases Comparison"
            />
            <CountryComparisonChart
              countries={countries}
              selectedCountry={selectedCountry}
              metric="deaths"
              title="Deaths Comparison"
            />
          </div>

          {/* Comparison Countries Management */}
          {comparisonCountries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Comparison Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {comparisonCountries.map((country) => (
                    <Badge key={country} variant="secondary" className="flex items-center gap-1">
                      {country}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => handleRemoveComparison(country)}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {selectedCountryData && (
            <AIInsightsCard countryData={selectedCountryData} />
          )}
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <AdvancedRangeDashboard countries={countries} />
        </TabsContent>

        {/* Population Data Tab */}
        <TabsContent value="population" className="space-y-4">
          {/* Population Data Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Population Data Analysis</h2>
              <p className="text-muted-foreground">
                COVID-19 impact analysis based on population demographics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={generatePopulationInsights}
                disabled={loadingInsight}
                className="flex items-center gap-2"
              >
                <Calculator className={`h-4 w-4 ${loadingInsight ? 'animate-pulse' : ''}`} />
                {loadingInsight ? 'Analyzing...' : 'AI Analysis'}
              </Button>
            </div>
          </div>

          {/* Population Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <Select value={selectedContinent} onValueChange={setSelectedContinent}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select continent" />
                </SelectTrigger>
                <SelectContent>
                  {continents.map((continent) => (
                    <SelectItem key={continent} value={continent}>
                      {continent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="population">Population</SelectItem>
                  <SelectItem value="cases">Total Cases</SelectItem>
                  <SelectItem value="casesPerMillion">Cases per Million</SelectItem>
                  <SelectItem value="mortalityRate">Mortality Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline">
              {populationData.length} countries
            </Badge>
          </div>

          {/* Population Categories Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {populationCategories.map((category) => (
              <Card key={category.category}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">{category.category}</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {category.count}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Pop: {category.totalPopulation.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg Cases/M: {category.avgCasesPerMillion.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Insights for Population */}
          {aiInsight && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-purple-500" />
                  Population Analysis Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4 border">
                  <p className="text-sm leading-relaxed">{aiInsight}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Population Data Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Population Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Population Distribution by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={populationCategories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Population vs Cases Scatter */}
            <Card>
              <CardHeader>
                <CardTitle>Population vs Cases per Million</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Relationship between population size and COVID-19 cases per million
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={scatterData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="x" 
                      name="Population (Millions)" 
                      type="number"
                      domain={['dataMin', 'dataMax']}
                    />
                    <YAxis 
                      dataKey="y" 
                      name="Cases per Million" 
                      type="number"
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        typeof value === 'number' ? value.toLocaleString() : value,
                        name === 'x' ? 'Population (Millions)' : 'Cases per Million'
                      ]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.name;
                        }
                        return '';
                      }}
                    />
                    <Scatter dataKey="y" fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Live Tracking Tab */}
        <TabsContent value="live" className="space-y-4">
          {/* Live Tracking Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Activity className="h-6 w-6 text-green-500" />
                Live Tracking
              </h2>
              <p className="text-muted-foreground">
                Real-time COVID-19 updates and monitoring
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={generateLiveInsights}
                disabled={loadingLiveInsight}
                className="flex items-center gap-2"
              >
                <Zap className={`h-4 w-4 ${loadingLiveInsight ? 'animate-pulse' : ''}`} />
                {loadingLiveInsight ? 'Analyzing...' : 'Live Analysis'}
              </Button>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                onClick={toggleAutoRefresh}
                className="flex items-center gap-2"
              >
                <Clock className={`h-4 w-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
                {autoRefresh ? 'Auto ON' : 'Auto OFF'}
              </Button>
              <Button
                variant="outline"
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Live Status Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-sm font-medium">
                      {autoRefresh ? 'Live Monitoring' : 'Manual Mode'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Last Update: {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">{globalToday.activeCountries} countries reporting today</span>
                  </div>
                </div>
                {autoRefresh && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Next refresh in:</span>
                    <Badge variant="outline">{refreshInterval}s</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Global Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium">Today's Cases</span>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  +{globalToday.cases.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  New cases reported today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium">Today's Deaths</span>
                </div>
                <div className="text-3xl font-bold text-red-600">
                  +{globalToday.deaths.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  New deaths reported today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Today's Recovered</span>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  +{globalToday.recovered.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  New recoveries reported today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Active Countries</span>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {globalToday.activeCountries}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Countries with updates today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Live Insights */}
          {liveInsight && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Live Analysis
                  <Badge variant="secondary" className="text-xs">Real-time</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg p-4 border">
                  <p className="text-sm leading-relaxed">{liveInsight}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Updates List */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Live Updates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Countries with new COVID-19 data reported today
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {liveUpdates.map((update) => (
                  <div key={update.country} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {update.flag && (
                        <img src={update.flag} alt={update.country} className="w-8 h-5 object-cover rounded" />
                      )}
                      <div>
                        <div className="font-medium">{update.country}</div>
                        <div className="text-sm text-muted-foreground">{update.continent}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-right">
                      <div>
                        <div className="text-lg font-bold text-orange-600">
                          +{update.todayCases.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Cases</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">
                          +{update.todayDeaths.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Deaths</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          +{update.todayRecovered.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Recovered</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
};

export default CountryAnalytics;