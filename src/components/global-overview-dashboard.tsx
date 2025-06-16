import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  BarChart3, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  Heart,
  Users,
  RefreshCw,
  MapPin
} from "lucide-react";
import { CovidWorldMap } from "./covid-world-map";
import { GlobalAIInsights } from "./global-ai-insights";
import { CovidCountryData } from "@/types/covid";

interface GlobalOverviewDashboardProps {
  countries: CovidCountryData[];
  loading?: boolean;
}

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

export function GlobalOverviewDashboard({ countries, loading = false }: GlobalOverviewDashboardProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate global statistics
  const globalStats = useMemo((): GlobalStats => {
    if (!countries.length) {
      return {
        totalCases: 0,
        totalDeaths: 0,
        totalRecovered: 0,
        totalActive: 0,
        totalPopulation: 0,
        countriesCount: 0,
        avgCasesPerMillion: 0,
        avgDeathsPerMillion: 0,
        globalMortalityRate: 0,
        globalRecoveryRate: 0,
      };
    }

    const stats = countries.reduce((acc, country) => {
      acc.totalCases += country.cases || 0;
      acc.totalDeaths += country.deaths || 0;
      acc.totalRecovered += country.recovered || 0;
      acc.totalActive += country.active || 0;
      acc.totalPopulation += country.population || 0;
      return acc;
    }, {
      totalCases: 0,
      totalDeaths: 0,
      totalRecovered: 0,
      totalActive: 0,
      totalPopulation: 0,
    });

    const avgCasesPerMillion = countries.reduce((sum, c) => sum + (c.casesPerOneMillion || 0), 0) / countries.length;
    const avgDeathsPerMillion = countries.reduce((sum, c) => sum + (c.deathsPerOneMillion || 0), 0) / countries.length;
    const globalMortalityRate = stats.totalCases > 0 ? (stats.totalDeaths / stats.totalCases) * 100 : 0;
    const globalRecoveryRate = stats.totalCases > 0 ? (stats.totalRecovered / stats.totalCases) * 100 : 0;

    return {
      ...stats,
      countriesCount: countries.length,
      avgCasesPerMillion,
      avgDeathsPerMillion,
      globalMortalityRate,
      globalRecoveryRate,
    };
  }, [countries]);

  // Calculate continent-wise statistics
  const continentStats = useMemo((): ContinentStats[] => {
    if (!countries.length) return [];

    const continentMap = new Map<string, ContinentStats>();

    countries.forEach(country => {
      const continent = country.continent || 'Unknown';
      
      if (!continentMap.has(continent)) {
        continentMap.set(continent, {
          continent,
          countries: 0,
          cases: 0,
          deaths: 0,
          recovered: 0,
          active: 0,
          population: 0,
        });
      }

      const stats = continentMap.get(continent)!;
      stats.countries += 1;
      stats.cases += country.cases || 0;
      stats.deaths += country.deaths || 0;
      stats.recovered += country.recovered || 0;
      stats.active += country.active || 0;
      stats.population += country.population || 0;
    });

    return Array.from(continentMap.values()).sort((a, b) => b.cases - a.cases);
  }, [countries]);

  // Get top countries by different metrics
  const topCountries = useMemo(() => {
    if (!countries.length) return { cases: [], deaths: [], recovered: [], active: [] };

    return {
      cases: [...countries].sort((a, b) => (b.cases || 0) - (a.cases || 0)).slice(0, 5),
      deaths: [...countries].sort((a, b) => (b.deaths || 0) - (a.deaths || 0)).slice(0, 5),
      recovered: [...countries].sort((a, b) => (b.recovered || 0) - (a.recovered || 0)).slice(0, 5),
      active: [...countries].sort((a, b) => (b.active || 0) - (a.active || 0)).slice(0, 5),
    };
  }, [countries]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Global COVID-19 Overview
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive global analysis with interactive world map and continental breakdowns
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Global Statistics Cards */}
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
          <TabsTrigger value="top-countries" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Countries
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* World Map Tab */}
        <TabsContent value="world-map" className="space-y-4">
          <CovidWorldMap key={refreshKey} countries={countries} loading={loading} />
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

        {/* Top Countries Tab */}
        <TabsContent value="top-countries" className="space-y-4">
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

            {/* Top Recovered */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-green-500" />
                  Top Countries by Recovered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topCountries.recovered.map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        {country.countryInfo?.flag && (
                          <img src={country.countryInfo.flag} alt={country.country} className="w-5 h-3 object-cover rounded" />
                        )}
                        <span className="text-sm">{country.country}</span>
                      </div>
                      <span className="text-sm font-mono">{(country.recovered || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Active */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Top Countries by Active Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topCountries.active.map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        {country.countryInfo?.flag && (
                          <img src={country.countryInfo.flag} alt={country.country} className="w-5 h-3 object-cover rounded" />
                        )}
                        <span className="text-sm">{country.country}</span>
                      </div>
                      <span className="text-sm font-mono">{(country.active || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-4">
          <GlobalAIInsights countries={countries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}