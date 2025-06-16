
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CovidCountryData } from "@/types/covid";

interface CountryComparisonChartProps {
  countries: CovidCountryData[];
  selectedCountry: string;
  metric: keyof CovidCountryData;
  title: string;
}

export function CountryComparisonChart({ 
  countries, 
  selectedCountry, 
  metric, 
  title 
}: CountryComparisonChartProps) {
  // Get top 10 countries by the selected metric
  const sortedCountries = [...countries]
    .sort((a, b) => (b[metric] as number) - (a[metric] as number))
    .slice(0, 10);

  // Ensure selected country is included if not in top 10
  const selectedCountryData = countries.find(c => c.country === selectedCountry);
  if (selectedCountryData && !sortedCountries.find(c => c.country === selectedCountry)) {
    sortedCountries.pop();
    sortedCountries.push(selectedCountryData);
  }

  const chartData = sortedCountries.map(country => ({
    country: country.country.length > 12 ? country.country.substring(0, 12) + '...' : country.country,
    value: country[metric] as number,
    isSelected: country.country === selectedCountry,
    fullName: country.country
  }));

  const getBarColor = (isSelected: boolean) => {
    if (isSelected) return "hsl(var(--primary))";
    
    // Color coding based on metric
    if (metric === 'cases') return "#f97316"; // Orange
    if (metric === 'deaths') return "#ef4444"; // Red
    if (metric === 'recovered') return "#22c55e"; // Green
    
    return "hsl(var(--muted-foreground))";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="country" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis />
            <Tooltip 
              formatter={(value, name, props) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                props.payload.fullName
              ]}
              labelFormatter={() => ''}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.isSelected)} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
