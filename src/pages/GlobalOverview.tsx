import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Globe, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  Heart,
  Users,
  RefreshCw,
  MapPin,
  BarChart3
} from "lucide-react";
import { CovidWorldMap } from "@/components/covid-world-map";
import { GlobalAIInsights } from "@/components/global-ai-insights";
import { Layout } from "@/components/layout";
import { covidApi } from "@/services/covidApi";
import { CovidCountryData } from "@/types/covid";

interface GlobalStats {
  totalCases: number;
  totalDeaths: number;
  totalRecovered: number;
  totalActive: number;
  totalPopulation: number;
  countriesCount: number;
  avgCasesPerMillion: number;
  avgDeathsPerMillion: number;
  globalMortalityRate: number;
  globalRecoveryRate: number;
}

interface ContinentStats {
  continent: string;
  countries: number;
  cases: number;
  deaths: number;
  recovered: number;
  active: number;
  population: number;
}

const GlobalOverview = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const { 
    data: countries = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['countries', refreshKey],
    queryFn: covidApi.getAllCountries,
  });

  const { 
    data: globalData,
    isLoading: globalLoading
  } = useQuery({
    queryKey: ['global-stats', refreshKey],
    queryFn: covidApi.getGlobalStats,
  });

  // Calculate global statistics
  const globalStats: GlobalStats = {
    totalCases: globalData?.cases || countries.reduce((sum, c) => sum + (c.cases || 0), 0),
    totalDeaths: globalData?.deaths || countries.reduce((sum, c) => sum + (c.deaths || 0), 0),
    totalRecovered: globalData?.recovered || countries.reduce((sum, c) => sum + (c.recovered || 0), 0),
    totalActive: globalData?.active || countries.reduce((sum, c) => sum + (c.active || 0), 0),
    totalPopulation: countries.reduce((sum, c) => sum + (c.population || 0), 0),
    countriesCount: countries.length,
    avgCasesPerMillion: countries.length > 0 ? countries.reduce((sum, c) => sum + (c.casesPerOneMillion || 0), 0) / countries.length : 0,
    avgDeathsPerMillion: countries.length > 0 ? countries.reduce((sum, c) => sum + (c.deathsPerOneMillion || 0), 0) / countries.length : 0,
    globalMortalityRate: globalData?.cases > 0 ? (globalData.deaths / globalData.cases) * 100 : 0,
    globalRecoveryRate: globalData?.cases > 0 ? (globalData.recovered / globalData.cases) * 100 : 0,
  };

  // Calculate continent-wise statistics
  const continentStats: ContinentStats[] = countries.reduce((acc, country) => {
    const continent = country.continent || 'Unknown';
    const existing = acc.find(c => c.continent === continent);
    
    if (existing) {
      existing.countries += 1;
      existing.cases += country.cases || 0;
      existing.deaths += country.deaths || 0;
      existing.recovered += country.recovered || 0;
      existing.active += country.active || 0;
      existing.population += country.population || 0;
    } else {
      acc.push({
        continent,
        countries: 1,
        cases: country.cases || 0,
        deaths: country.deaths || 0,
        recovered: country.recovered || 0,
        active: country.active || 0,
        population: country.population || 0,
      });
    }
    return acc;
  }, [] as ContinentStats[]).sort((a, b) => b.cases - a.cases);

  // Get top countries by different metrics
  const topCountries = {
    cases: [...countries].sort((a, b) => (b.cases || 0) - (a.cases || 0)).slice(0, 10),
    deaths: [...countries].sort((a, b) => (b.deaths || 0) - (a.deaths || 0)).slice(0, 10),
    recovered: [...countries].sort((a, b) => (b.recovered || 0) - (a.recovered || 0)).slice(0, 10),
    active: [...countries].sort((a, b) => (b.active || 0) - (a.active || 0)).slice(0, 10),
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load global COVID-19 data. Please check your internet connection and try again.
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
            <h1 className="text-3xl font-bold tracking-tight">Global Overview</h1>
            <p className="text-muted-foreground">
              Comprehensive worldwide COVID-19 statistics and analysis
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

      {/* Global Statistics Cards */}
      {isLoading || globalLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium">Total Cases</span>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {globalStats.totalCases.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {globalStats.avgCasesPerMillion.toLocaleString(undefined, { maximumFractionDigits: 0 })} per million
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">Total Deaths</span>
              </div>
              <div className="text-3xl font-bold text-red-600">
                {globalStats.totalDeaths.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mortality Rate: {globalStats.globalMortalityRate.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Total Recovered</span>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {globalStats.totalRecovered.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recovery Rate: {globalStats.globalRecoveryRate.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Active Cases</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {globalStats.totalActive.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {globalStats.countriesCount} countries reporting
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="world-map" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="world-map" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            World Map
          </TabsTrigger>
          <TabsTrigger value="continents" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Continents
          </TabsTrigger>
          <TabsTrigger value="rankings" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Rankings
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* World Map Tab */}
        <TabsContent value="world-map" className="space-y-4">
          <CovidWorldMap countries={countries} loading={isLoading} />
        </TabsContent>

        {/* Continents Tab */}
        <TabsContent value="continents" className="space-y-4">
          <div className="grid gap-4">
            {continentStats.map((continent) => (
              <Card key={continent.continent}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{continent.continent}</span>
                    <Badge variant="outline">{continent.countries} countries</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {continent.cases.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Cases</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {continent.deaths.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Deaths</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {continent.recovered.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Recovered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {continent.active.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Active</div>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Population: {continent.population.toLocaleString()} • 
                    Mortality Rate: {continent.cases > 0 ? ((continent.deaths / continent.cases) * 100).toFixed(2) : 0}%
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rankings Tab */}
        <TabsContent value="rankings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Cases */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  Top Countries by Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topCountries.cases.map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        {country.countryInfo?.flag && (
                          <img src={country.countryInfo.flag} alt={country.country} className="w-5 h-3 object-cover rounded" />
                        )}
                        <span className="text-sm">{country.country}</span>
                      </div>
                      <span className="text-sm font-mono">{(country.cases || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Deaths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Top Countries by Deaths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topCountries.deaths.map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        {country.countryInfo?.flag && (
                          <img src={country.countryInfo.flag} alt={country.country} className="w-5 h-3 object-cover rounded" />
                        )}
                        <span className="text-sm">{country.country}</span>
                      </div>
                      <span className="text-sm font-mono">{(country.deaths || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <GlobalAIInsights countries={countries} />
        </TabsContent>
      </Tabs>
    </div>
    </Layout>
  );
};

export default GlobalOverview;