import { CovidCountryData } from "@/types/covid";
import { aiService } from "./aiService";

export type MetricKey = 'deathsPerOneMillion' | 'casesPerOneMillion' | 'testsPerOneMillion' | 'activePerOneMillion' | 'recoveredPerOneMillion' | 'criticalPerOneMillion';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface RangeConfig {
  min: number;
  max: number;
  color: string;
  label: string;
}

export interface MetricAnalysis {
  metric: MetricKey;
  countries: CountryMetricData[];
  ranges: RangeConfig[];
  insights: string;
  timestamp: number;
}

export interface CountryMetricData {
  country: string;
  value: number;
  continent: string;
  flag: string;
  riskLevel: RiskLevel;
  range: string;
  color: string;
  percentile: number;
}

export class RangeAnalysisService {
  private static instance: RangeAnalysisService;
  private cache: Map<string, MetricAnalysis> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): RangeAnalysisService {
    if (!RangeAnalysisService.instance) {
      RangeAnalysisService.instance = new RangeAnalysisService();
    }
    return RangeAnalysisService.instance;
  }

  private readonly RANGE_CONFIGS: Record<MetricKey, RangeConfig[]> = {
    deathsPerOneMillion: [
      { min: 0, max: 500, color: '#22c55e', label: 'Low Risk (0-500)' },
      { min: 501, max: 1500, color: '#eab308', label: 'Medium Risk (501-1500)' },
      { min: 1501, max: 3000, color: '#f97316', label: 'High Risk (1501-3000)' },
      { min: 3001, max: Infinity, color: '#ef4444', label: 'Critical Risk (3000+)' },
    ],
    casesPerOneMillion: [
      { min: 0, max: 50000, color: '#22c55e', label: 'Low Spread (0-50K)' },
      { min: 50001, max: 150000, color: '#eab308', label: 'Medium Spread (50K-150K)' },
      { min: 150001, max: 300000, color: '#f97316', label: 'High Spread (150K-300K)' },
      { min: 300001, max: Infinity, color: '#ef4444', label: 'Very High Spread (300K+)' },
    ],
    testsPerOneMillion: [
      { min: 0, max: 100000, color: '#ef4444', label: 'Insufficient Testing (0-100K)' },
      { min: 100001, max: 500000, color: '#f97316', label: 'Moderate Testing (100K-500K)' },
      { min: 500001, max: 1000000, color: '#eab308', label: 'Good Testing (500K-1M)' },
      { min: 1000001, max: Infinity, color: '#22c55e', label: 'Excellent Testing (1M+)' },
    ],
    activePerOneMillion: [
      { min: 0, max: 1000, color: '#22c55e', label: 'Low Activity (0-1K)' },
      { min: 1001, max: 5000, color: '#eab308', label: 'Medium Activity (1K-5K)' },
      { min: 5001, max: 15000, color: '#f97316', label: 'High Activity (5K-15K)' },
      { min: 15001, max: Infinity, color: '#ef4444', label: 'Very High Activity (15K+)' },
    ],
    recoveredPerOneMillion: [
      { min: 0, max: 50000, color: '#ef4444', label: 'Low Recovery (0-50K)' },
      { min: 50001, max: 150000, color: '#f97316', label: 'Medium Recovery (50K-150K)' },
      { min: 150001, max: 300000, color: '#eab308', label: 'Good Recovery (150K-300K)' },
      { min: 300001, max: Infinity, color: '#22c55e', label: 'Excellent Recovery (300K+)' },
    ],
    criticalPerOneMillion: [
      { min: 0, max: 10, color: '#22c55e', label: 'Low Critical (0-10)' },
      { min: 11, max: 50, color: '#eab308', label: 'Medium Critical (11-50)' },
      { min: 51, max: 100, color: '#f97316', label: 'High Critical (51-100)' },
      { min: 101, max: Infinity, color: '#ef4444', label: 'Very High Critical (100+)' },
    ],
  };

  private readonly METRIC_LABELS: Record<MetricKey, string> = {
    deathsPerOneMillion: 'Deaths per Million',
    casesPerOneMillion: 'Cases per Million',
    testsPerOneMillion: 'Tests per Million',
    activePerOneMillion: 'Active Cases per Million',
    recoveredPerOneMillion: 'Recovered per Million',
    criticalPerOneMillion: 'Critical Cases per Million',
  };

  private calculatePercentile(value: number, allValues: number[]): number {
    const sorted = allValues.sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return (index / sorted.length) * 100;
  }

  private getRangeInfo(value: number, metric: MetricKey): { range: RangeConfig; riskLevel: RiskLevel } {
    const ranges = this.RANGE_CONFIGS[metric];
    for (const range of ranges) {
      if (value >= range.min && value <= range.max) {
        const riskLevel: RiskLevel = 
          range.label.includes('Low') || range.label.includes('Excellent') ? 'Low' :
          range.label.includes('Medium') || range.label.includes('Good') || range.label.includes('Moderate') ? 'Medium' :
          range.label.includes('High') ? 'High' : 'Critical';
        return { range, riskLevel };
      }
    }
    return { 
      range: ranges[ranges.length - 1], 
      riskLevel: 'Critical' 
    };
  }

  private async generateInsights(metric: MetricKey, countries: CountryMetricData[]): Promise<string> {
    try {
      const topCountries = countries.slice(0, 5);
      const metricLabel = this.METRIC_LABELS[metric];
      
      const question = `Analyze the ${metricLabel} data for these top countries: 
      ${topCountries.map(c => `${c.country}: ${c.value.toLocaleString()} (${c.range})`).join(', ')}.
      
      Provide a brief analysis covering:
      1. Key patterns in the data distribution
      2. Notable outliers or concerning trends
      3. Potential factors influencing these metrics
      4. Actionable insights for public health
      
      Keep response under 150 words and focus on actionable insights.`;

      const covidCountries = countries.map(c => ({
        country: c.country,
        continent: c.continent,
        [metric]: c.value,
      })) as any[];

      const insight = await aiService.generateGlobalInsights(covidCountries);
      return insight;
    } catch (error) {
      console.error("Error generating range analysis insights:", error);
      return this.getFallbackInsight(metric, countries);
    }
  }

  private getFallbackInsight(metric: MetricKey, countries: CountryMetricData[]): string {
    const metricLabel = this.METRIC_LABELS[metric];
    const topCountries = countries.slice(0, 3);
    const avgValue = countries.reduce((sum, c) => sum + c.value, 0) / countries.length;
    
    const highRiskCount = countries.filter(c => c.riskLevel === 'Critical' || c.riskLevel === 'High').length;
    const lowRiskCount = countries.filter(c => c.riskLevel === 'Low').length;
    
    return `${metricLabel} analysis shows significant variation across countries. Top performers include ${topCountries.map(c => c.country).join(', ')} with values ranging from ${Math.min(...topCountries.map(c => c.value)).toLocaleString()} to ${Math.max(...topCountries.map(c => c.value)).toLocaleString()}. Average across all countries is ${avgValue.toLocaleString()}. ${highRiskCount} countries show high/critical levels while ${lowRiskCount} countries maintain low-risk status. This suggests varying healthcare capacities and pandemic response effectiveness across regions.`;
  }

  async analyzeMetric(
    countries: CovidCountryData[], 
    metric: MetricKey, 
    continentFilter?: string,
    limit: number = 50
  ): Promise<MetricAnalysis> {
    const cacheKey = `${metric}-${continentFilter || 'all'}-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }

    // Filter countries
    let filteredCountries = countries.filter(c => c[metric] != null && c[metric] > 0);
    if (continentFilter && continentFilter !== 'All') {
      filteredCountries = filteredCountries.filter(c => c.continent === continentFilter);
    }

    // Calculate all values for percentile calculation
    const allValues = filteredCountries.map(c => c[metric] || 0);

    // Process country data
    const countryData: CountryMetricData[] = filteredCountries
      .map(country => {
        const value = country[metric] || 0;
        const { range, riskLevel } = this.getRangeInfo(value, metric);
        const percentile = this.calculatePercentile(value, allValues);

        return {
          country: country.country,
          value,
          continent: country.continent || 'Unknown',
          flag: country.countryInfo?.flag || '',
          riskLevel,
          range: range.label,
          color: range.color,
          percentile,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

    // Generate AI insights
    const insights = await this.generateInsights(metric, countryData);

    const analysis: MetricAnalysis = {
      metric,
      countries: countryData,
      ranges: this.RANGE_CONFIGS[metric],
      insights,
      timestamp: Date.now(),
    };

    this.cache.set(cacheKey, analysis);
    return analysis;
  }

  getMetricOptions(): Array<{ key: MetricKey; label: string }> {
    return Object.entries(this.METRIC_LABELS).map(([key, label]) => ({
      key: key as MetricKey,
      label,
    }));
  }

  getRangeConfig(metric: MetricKey): RangeConfig[] {
    return this.RANGE_CONFIGS[metric];
  }

  getMetricLabel(metric: MetricKey): string {
    return this.METRIC_LABELS[metric];
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Statistical analysis methods
  calculateStatistics(countries: CountryMetricData[]): {
    mean: number;
    median: number;
    standardDeviation: number;
    min: number;
    max: number;
    q1: number;
    q3: number;
  } {
    const values = countries.map(c => c.value).sort((a, b) => a - b);
    const n = values.length;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const median = n % 2 === 0 ? (values[n/2 - 1] + values[n/2]) / 2 : values[Math.floor(n/2)];
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);
    
    const q1 = values[Math.floor(n * 0.25)];
    const q3 = values[Math.floor(n * 0.75)];
    
    return {
      mean,
      median,
      standardDeviation,
      min: values[0],
      max: values[n - 1],
      q1,
      q3,
    };
  }

  // Risk distribution analysis
  getRiskDistribution(countries: CountryMetricData[]): Record<RiskLevel, number> {
    const distribution: Record<RiskLevel, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    countries.forEach(country => {
      distribution[country.riskLevel]++;
    });

    return distribution;
  }
}

export const rangeAnalysisService = RangeAnalysisService.getInstance();