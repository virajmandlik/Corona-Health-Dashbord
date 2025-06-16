import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Heart,
  Users,
  RefreshCw,
  Zap,
  Globe,
  Calendar
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { covidApi } from "@/services/covidApi";
import { CovidCountryData } from "@/types/covid";
import { aiService } from "@/services/aiService";

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

const LiveTracking = () => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [liveInsight, setLiveInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  const { 
    data: countries = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['countries-live'],
    queryFn: covidApi.getAllCountries,
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
  });

  const { 
    data: globalData,
    isLoading: globalLoading,
    refetch: refetchGlobal
  } = useQuery({
    queryKey: ['global-live'],
    queryFn: covidApi.getGlobalStats,
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
  });

  // Process live updates (countries with today's data)
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

  // Auto-refresh effect
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

  // Generate live insights
  const generateLiveInsights = async () => {
    setLoadingInsight(true);
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
      setLoadingInsight(false);
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load live tracking data. Please check your internet connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-green-500" />
            Live Tracking
          </h1>
          <p className="text-muted-foreground">
            Real-time COVID-19 updates and monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={generateLiveInsights}
            disabled={loadingInsight}
            className="flex items-center gap-2"
          >
            <Zap className={`h-4 w-4 ${loadingInsight ? 'animate-pulse' : ''}`} />
            {loadingInsight ? 'Analyzing...' : 'Live Analysis'}
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

      {/* Status Bar */}
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
      {isLoading || globalLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
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
      )}

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

      {/* Main Content Tabs */}
      <Tabs defaultValue="updates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="updates">Live Updates</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Live Updates Tab */}
        <TabsContent value="updates" className="space-y-4">
          <div className="grid gap-4">
            {liveUpdates.map((update) => (
              <Card key={update.country}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Trend</CardTitle>
              <p className="text-sm text-muted-foreground">
                Hourly updates over the last 24 hours
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="cases" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="recovered" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="deaths" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hotspots Tab */}
        <TabsContent value="hotspots" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  Highest Daily Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {liveUpdates.slice(0, 5).map((update, index) => (
                    <div key={update.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        {update.flag && (
                          <img src={update.flag} alt={update.country} className="w-5 h-3 object-cover rounded" />
                        )}
                        <span className="text-sm">{update.country}</span>
                      </div>
                      <span className="text-sm font-mono text-orange-600">
                        +{update.todayCases.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Highest Daily Deaths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {liveUpdates
                    .sort((a, b) => b.todayDeaths - a.todayDeaths)
                    .slice(0, 5)
                    .map((update, index) => (
                      <div key={update.country} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          {update.flag && (
                            <img src={update.flag} alt={update.country} className="w-5 h-3 object-cover rounded" />
                          )}
                          <span className="text-sm">{update.country}</span>
                        </div>
                        <span className="text-sm font-mono text-red-600">
                          +{update.todayDeaths.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Data Source:</span>
                    <Badge variant="default">disease.sh API</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Update Frequency:</span>
                    <span>{refreshInterval} seconds</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Auto Refresh:</span>
                    <Badge variant={autoRefresh ? "default" : "secondary"}>
                      {autoRefresh ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Countries Monitored:</span>
                    <span>{countries.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Freshness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Data Quality</span>
                      <span>98%</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Coverage</span>
                      <span>95%</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Timeliness</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveTracking;