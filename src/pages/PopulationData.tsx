import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  TrendingUp,
  BarChart3,
  Activity,
  AlertTriangle,
  Heart,
  RefreshCw,
  Globe,
  Calculator
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line } from "recharts";
import { covidApi } from "@/services/covidApi";
import { CovidCountryData } from "@/types/covid";
import { aiService } from "@/services/aiService";

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

const PopulationData = () => {
  const [selectedContinent, setSelectedContinent] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("population");
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  const { 
    data: countries = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['countries'],
    queryFn: covidApi.getAllCountries,
  });

  // Process population data
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

  // Get continents
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

  // Generate AI insights
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

  // Chart data for population vs cases
  const scatterData = populationData.slice(0, 50).map(country => ({
    x: country.population / 1000000, // Population in millions
    y: country.casesPerMillion,
    name: country.country,
    continent: country.continent,
  }));

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load population data. Please check your internet connection and try again.
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
          <h1 className="text-3xl font-bold tracking-tight">Population Data</h1>
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
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
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

      {/* AI Insights */}
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
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

            {/* Cases per Million by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Average Cases per Million by Population Size</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={populationCategories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgCasesPerMillion" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Correlation Tab */}
        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Population vs Cases per Million</CardTitle>
              <p className="text-sm text-muted-foreground">
                Scatter plot showing relationship between population size and COVID-19 cases per million
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
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
        </TabsContent>

        {/* Rankings Tab */}
        <TabsContent value="rankings" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {populationData.slice(0, 20).map((country, index) => (
                <Card key={country.country}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                          <span className="text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {country.flag && (
                            <img src={country.flag} alt={country.country} className="w-6 h-4 object-cover rounded" />
                          )}
                          <div>
                            <div className="font-medium">{country.country}</div>
                            <div className="text-sm text-muted-foreground">{country.continent}</div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-right">
                        <div>
                          <div className="text-sm font-medium">{country.population.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Population</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{country.cases.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Cases</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{country.casesPerMillion.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Cases/M</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{country.mortalityRate.toFixed(2)}%</div>
                          <div className="text-xs text-muted-foreground">Mortality</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Key Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Countries:</span>
                    <span className="text-sm font-mono">{populationData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Population:</span>
                    <span className="text-sm font-mono">
                      {populationData.reduce((sum, c) => sum + c.population, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Population:</span>
                    <span className="text-sm font-mono">
                      {(populationData.reduce((sum, c) => sum + c.population, 0) / populationData.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Largest Country:</span>
                    <span className="text-sm font-mono">{populationData[0]?.country}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Population Impact Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>Large Countries:</strong> Face scale challenges but often have better healthcare infrastructure.
                </p>
                <p>
                  <strong>Medium Countries:</strong> Balance between manageable size and resource availability.
                </p>
                <p>
                  <strong>Small Countries:</strong> Can implement focused interventions but may lack resources.
                </p>
                <p>
                  <strong>Population Density:</strong> Often correlates with transmission rates more than absolute population.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PopulationData;