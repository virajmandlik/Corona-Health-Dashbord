"use client"

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, Filter, BarChart3 } from "lucide-react";
import { CartesianGrid, Dot, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CovidCountryData } from "@/types/covid";
import { aiService } from "@/services/aiService";

interface RangeBasedLineChartProps {
  countries: CovidCountryData[];
  selectedCountries?: string[];
  onCountrySelectionChange?: (countries: string[]) => void;
}

type MetricKey = 'deathsPerOneMillion' | 'casesPerOneMillion' | 'testsPerOneMillion' | 'activePerOneMillion' | 'recoveredPerOneMillion' | 'criticalPerOneMillion';
type ContinentFilter = 'All' | 'Asia' | 'Europe' | 'Africa' | 'North America' | 'South America' | 'Australia-Oceania';

interface ChartDataPoint {
  country: string;
  value: number;
  continent: string;
  flag: string;
  fill: string;
  range: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

const METRIC_OPTIONS = [
  { key: 'deathsPerOneMillion' as MetricKey, label: 'Deaths per Million', color: 'hsl(var(--destructive))' },
  { key: 'casesPerOneMillion' as MetricKey, label: 'Cases per Million', color: 'hsl(var(--warning))' },
  { key: 'testsPerOneMillion' as MetricKey, label: 'Tests per Million', color: 'hsl(var(--primary))' },
  { key: 'activePerOneMillion' as MetricKey, label: 'Active per Million', color: 'hsl(var(--info))' },
  { key: 'recoveredPerOneMillion' as MetricKey, label: 'Recovered per Million', color: 'hsl(var(--success))' },
  { key: 'criticalPerOneMillion' as MetricKey, label: 'Critical per Million', color: 'hsl(var(--accent))' },
];

const RANGE_CONFIGS = {
  deathsPerOneMillion: {
    ranges: [
      { min: 0, max: 500, color: '#22c55e', label: 'Low (0-500)' },
      { min: 501, max: 1500, color: '#eab308', label: 'Medium (501-1500)' },
      { min: 1501, max: 3000, color: '#f97316', label: 'High (1501-3000)' },
      { min: 3001, max: Infinity, color: '#ef4444', label: 'Critical (3000+)' },
    ]
  },
  casesPerOneMillion: {
    ranges: [
      { min: 0, max: 50000, color: '#22c55e', label: 'Low (0-50K)' },
      { min: 50001, max: 150000, color: '#eab308', label: 'Medium (50K-150K)' },
      { min: 150001, max: 300000, color: '#f97316', label: 'High (150K-300K)' },
      { min: 300001, max: Infinity, color: '#ef4444', label: 'Critical (300K+)' },
    ]
  },
  testsPerOneMillion: {
    ranges: [
      { min: 0, max: 100000, color: '#ef4444', label: 'Low (0-100K)' },
      { min: 100001, max: 500000, color: '#f97316', label: 'Medium (100K-500K)' },
      { min: 500001, max: 1000000, color: '#eab308', label: 'High (500K-1M)' },
      { min: 1000001, max: Infinity, color: '#22c55e', label: 'Excellent (1M+)' },
    ]
  },
  activePerOneMillion: {
    ranges: [
      { min: 0, max: 1000, color: '#22c55e', label: 'Low (0-1K)' },
      { min: 1001, max: 5000, color: '#eab308', label: 'Medium (1K-5K)' },
      { min: 5001, max: 15000, color: '#f97316', label: 'High (5K-15K)' },
      { min: 15001, max: Infinity, color: '#ef4444', label: 'Critical (15K+)' },
    ]
  },
  recoveredPerOneMillion: {
    ranges: [
      { min: 0, max: 50000, color: '#ef4444', label: 'Low (0-50K)' },
      { min: 50001, max: 150000, color: '#f97316', label: 'Medium (50K-150K)' },
      { min: 150001, max: 300000, color: '#eab308', label: 'High (150K-300K)' },
      { min: 300001, max: Infinity, color: '#22c55e', label: 'Excellent (300K+)' },
    ]
  },
  criticalPerOneMillion: {
    ranges: [
      { min: 0, max: 10, color: '#22c55e', label: 'Low (0-10)' },
      { min: 11, max: 50, color: '#eab308', label: 'Medium (11-50)' },
      { min: 51, max: 100, color: '#f97316', label: 'High (51-100)' },
      { min: 101, max: Infinity, color: '#ef4444', label: 'Critical (100+)' },
    ]
  },
};

export function RangeBasedLineChart({ countries, selectedCountries = [], onCountrySelectionChange }: RangeBasedLineChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('deathsPerOneMillion');
  const [continentFilter, setContinentFilter] = useState<ContinentFilter>('All');
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  const continents = useMemo(() => {
    const uniqueContinents = [...new Set(countries.map(c => c.continent).filter(Boolean))];
    return ['All', ...uniqueContinents.sort()] as ContinentFilter[];
  }, [countries]);

  const getColorForValue = (value: number, metric: MetricKey): { color: string; range: string; riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' } => {
    const ranges = RANGE_CONFIGS[metric].ranges;
    for (const range of ranges) {
      if (value >= range.min && value <= range.max) {
        const riskLevel = range.label.includes('Low') || range.label.includes('Excellent') ? 'Low' :
                         range.label.includes('Medium') ? 'Medium' :
                         range.label.includes('High') ? 'High' : 'Critical';
        return { color: range.color, range: range.label, riskLevel };
      }
    }
    return { color: '#6b7280', range: 'Unknown', riskLevel: 'Medium' };
  };

  const chartData = useMemo(() => {
    let filteredCountries = countries;
    
    if (continentFilter !== 'All') {
      filteredCountries = countries.filter(c => c.continent === continentFilter);
    }

    return filteredCountries
      .map((country, index) => {
        const value = country[selectedMetric] || 0;
        const colorInfo = getColorForValue(value, selectedMetric);
        
        return {
          country: country.country,
          value,
          continent: country.continent || 'Unknown',
          flag: country.countryInfo?.flag || '',
          fill: colorInfo.color,
          range: colorInfo.range,
          riskLevel: colorInfo.riskLevel,
          index,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Show top 20 countries
  }, [countries, selectedMetric, continentFilter]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: METRIC_OPTIONS.find(m => m.key === selectedMetric)?.label || "Value",
        color: METRIC_OPTIONS.find(m => m.key === selectedMetric)?.color || "hsl(var(--primary))",
      },
    };

    chartData.forEach((item, index) => {
      config[item.country] = {
        label: item.country,
        color: item.fill,
      };
    });

    return config;
  }, [selectedMetric, chartData]);

  const generateAIInsight = async () => {
    if (!chartData.length) return;

    setLoadingInsight(true);
    try {
      const topCountries = chartData.slice(0, 5);
      const metricLabel = METRIC_OPTIONS.find(m => m.key === selectedMetric)?.label;
      
      const question = `Analyze the ${metricLabel} data for these countries: ${topCountries.map(c => `${c.country} (${c.value.toLocaleString()})`).join(', ')}. 
      
      Provide a brief 2-3 sentence analysis focusing on:
      1. Key patterns or trends in the data
      2. Notable outliers or concerning values
      3. Potential factors influencing these metrics
      
      Keep the response concise and actionable.`;

      const insight = await aiService.generateGlobalInsights(countries.filter(c => 
        topCountries.some(tc => tc.country === c.country)
      ));
      
      setAiInsight(insight);
    } catch (error) {
      console.error("Error generating AI insight:", error);
      setAiInsight("Unable to generate AI insight at this time.");
    } finally {
      setLoadingInsight(false);
    }
  };

  useEffect(() => {
    if (chartData.length > 0) {
      generateAIInsight();
    }
  }, [selectedMetric, continentFilter, chartData.length]);

  const rangeColors = RANGE_CONFIGS[selectedMetric].ranges;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Range-Based Analysis: {METRIC_OPTIONS.find(m => m.key === selectedMetric)?.label}
            </CardTitle>
            <CardDescription>
              COVID-19 metrics with color-coded risk levels and AI insights
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateAIInsight}
            disabled={loadingInsight}
            className="flex items-center gap-2"
          >
            <TrendingUp className={`h-4 w-4 ${loadingInsight ? 'animate-pulse' : ''}`} />
            {loadingInsight ? 'Analyzing...' : 'AI Insight'}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={selectedMetric} onValueChange={(value: MetricKey) => setSelectedMetric(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {METRIC_OPTIONS.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Continent:</span>
            <Select value={continentFilter} onValueChange={(value: ContinentFilter) => setContinentFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
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
        </div>

        {/* Range Legend */}
        <div className="flex flex-wrap gap-2">
          {rangeColors.map((range, index) => (
            <Badge
              key={index}
              variant="outline"
              className="flex items-center gap-2"
              style={{ borderColor: range.color }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: range.color }}
              />
              {range.label}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{
                top: 24,
                left: 24,
                right: 24,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="country"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={10}
                interval={0}
              />
              <YAxis 
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
              />
              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartDataPoint;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {data.flag && (
                            <img src={data.flag} alt={data.country} className="w-6 h-4 object-cover rounded" />
                          )}
                          <span className="font-semibold">{data.country}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>Value: {data.value.toLocaleString()}</div>
                          <div>Range: {data.range}</div>
                          <div>Continent: {data.continent}</div>
                          <div className="flex items-center gap-2">
                            Risk Level: 
                            <Badge variant={data.riskLevel === 'Low' ? 'default' : 
                                          data.riskLevel === 'Medium' ? 'secondary' : 'destructive'}>
                              {data.riskLevel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                dataKey="value"
                type="monotone"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={({ payload, ...props }) => {
                  const data = payload as ChartDataPoint;
                  return (
                    <Dot
                      key={data.country}
                      r={6}
                      cx={props.cx}
                      cy={props.cy}
                      fill={data.fill}
                      stroke={data.fill}
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{
                  r: 8,
                  stroke: "var(--color-value)",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-4 text-sm">
        {aiInsight && (
          <>
            <Separator />
            <div className="w-full">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="font-semibold">AI Insight</span>
                {!aiService.getApiStatus() && (
                  <Badge variant="secondary" className="text-xs">
                    Offline Mode
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-md">
                {aiInsight}
              </p>
            </div>
          </>
        )}
        
        <div className="flex gap-2 leading-none font-medium">
          Showing top 20 countries by {METRIC_OPTIONS.find(m => m.key === selectedMetric)?.label.toLowerCase()}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Data filtered by: {continentFilter} • Color-coded by risk ranges
        </div>
      </CardFooter>
    </Card>
  );
}