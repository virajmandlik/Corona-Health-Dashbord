
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, TrendingUp } from "lucide-react";
import { CovidCountryData } from "@/types/covid";

interface SimpleWorldMapFallbackProps {
  countries: CovidCountryData[];
  selectedMetric: string;
  metricLabel: string;
}

export function SimpleWorldMapFallback({ countries, selectedMetric, metricLabel }: SimpleWorldMapFallbackProps) {
  // Group countries by continent
  const continentData = countries.reduce((acc, country) => {
    const continent = country.continent || 'Unknown';
    if (!acc[continent]) {
      acc[continent] = [];
    }
    acc[continent].push(country);
    return acc;
  }, {} as Record<string, CovidCountryData[]>);

  // Get top countries globally
  const topCountries = [...countries]
    .sort((a, b) => (b[selectedMetric as keyof CovidCountryData] as number || 0) - (a[selectedMetric as keyof CovidCountryData] as number || 0))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Global {metricLabel} Overview
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Interactive world map is temporarily unavailable. Showing continental and country breakdowns instead.
          </p>
        </CardHeader>
      </Card>

      {/* Continental Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(continentData).map(([continent, continentCountries]) => {
          const totalValue = continentCountries.reduce((sum, country) => 
            sum + (country[selectedMetric as keyof CovidCountryData] as number || 0), 0
          );
          const avgValue = totalValue / continentCountries.length;
          const topCountry = continentCountries.reduce((max, country) => 
            (country[selectedMetric as keyof CovidCountryData] as number || 0) > 
            (max[selectedMetric as keyof CovidCountryData] as number || 0) ? country : max
          );

          return (
            <Card key={continent}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{continent}</span>
                  <Badge variant="outline">{continentCountries.length} countries</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {totalValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total {metricLabel}</div>
                </div>
                
                <div>
                  <div className="text-lg font-semibold">
                    {avgValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-sm text-muted-foreground">Average per country</div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">Top: {topCountry.country}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(topCountry[selectedMetric as keyof CovidCountryData] as number || 0).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top Countries Global Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Top 10 Countries by {metricLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {topCountries.map((country, index) => (
              <div key={country.country} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <span className="text-sm font-bold">#{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {country.countryInfo?.flag && (
                      <img 
                        src={country.countryInfo.flag} 
                        alt={country.country} 
                        className="w-6 h-4 object-cover rounded"
                      />
                    )}
                    <div>
                      <div className="font-medium">{country.country}</div>
                      <div className="text-sm text-muted-foreground">{country.continent}</div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {(country[selectedMetric as keyof CovidCountryData] as number || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {metricLabel.toLowerCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Geographic Distribution Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-500" />
            Geographic Distribution Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-3">By Continent</h4>
              <div className="space-y-2">
                {Object.entries(continentData)
                  .sort(([,a], [,b]) => {
                    const aTotal = a.reduce((sum, country) => sum + (country[selectedMetric as keyof CovidCountryData] as number || 0), 0);
                    const bTotal = b.reduce((sum, country) => sum + (country[selectedMetric as keyof CovidCountryData] as number || 0), 0);
                    return bTotal - aTotal;
                  })
                  .map(([continent, continentCountries]) => {
                    const total = continentCountries.reduce((sum, country) => 
                      sum + (country[selectedMetric as keyof CovidCountryData] as number || 0), 0
                    );
                    const globalTotal = countries.reduce((sum, country) => 
                      sum + (country[selectedMetric as keyof CovidCountryData] as number || 0), 0
                    );
                    const percentage = globalTotal > 0 ? (total / globalTotal) * 100 : 0;

                    return (
                      <div key={continent} className="flex items-center justify-between">
                        <span className="text-sm">{continent}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">{total.toLocaleString()}</span>
                          <Badge variant="outline" className="text-xs">
                            {percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Key Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Countries:</span>
                  <span className="font-mono">{countries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total {metricLabel}:</span>
                  <span className="font-mono">
                    {countries.reduce((sum, country) => 
                      sum + (country[selectedMetric as keyof CovidCountryData] as number || 0), 0
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Average per Country:</span>
                  <span className="font-mono">
                    {(countries.reduce((sum, country) => 
                      sum + (country[selectedMetric as keyof CovidCountryData] as number || 0), 0
                    ) / countries.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Continents Represented:</span>
                  <span className="font-mono">{Object.keys(continentData).length}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}