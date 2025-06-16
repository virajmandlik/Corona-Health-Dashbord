
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { covidApi } from "@/services/covidApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface HistoricalTrendChartProps {
  country: string;
  days: number;
}

export function HistoricalTrendChart({ country, days }: HistoricalTrendChartProps) {
  const { data: historicalData, isLoading, error } = useQuery({
    queryKey: ['historical', country, days],
    queryFn: () => covidApi.getHistoricalData(country, days),
    enabled: !!country,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historical Trend - {country}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !historicalData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historical Trend - {country}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to load historical data for {country}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Convert the timeline data to chart format
  const chartData = Object.keys(historicalData.timeline.cases).map(date => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cases: historicalData.timeline.cases[date],
    deaths: historicalData.timeline.deaths[date],
    recovered: historicalData.timeline.recovered[date],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Trend - {country} (Last {days} days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                name === 'cases' ? 'Total Cases' : 
                name === 'deaths' ? 'Total Deaths' : 'Total Recovered'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="cases" 
              stroke="#f97316" 
              strokeWidth={2}
              name="cases"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="deaths" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="deaths"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="recovered" 
              stroke="#22c55e" 
              strokeWidth={2}
              name="recovered"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
