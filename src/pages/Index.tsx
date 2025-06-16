
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CountrySelector } from "@/components/country-selector";
import { StatsCard } from "@/components/stats-card";
import { CountryComparisonChart } from "@/components/country-comparison-chart";
import { CountriesTable } from "@/components/countries-table";
import { DateRangeSelector } from "@/components/date-range-selector";
import { HistoricalTrendChart } from "@/components/historical-trend-chart";
import { covidApi } from "@/services/covidApi";
import { Activity, Users, TrendingUp, AlertTriangle, Heart, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [selectedDays, setSelectedDays] = useState(30);
  const { toast } = useToast();

  const { 
    data: countries = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['countries'],
    queryFn: covidApi.getAllCountries,
  });

  const selectedCountryData = countries.find(
    country => country.country === selectedCountry
  );

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load COVID-19 data. Please check your internet connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      COVID-19 Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Global Statistics</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Country and Date Range Selectors */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Select Country</CardTitle>
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
                  <CardTitle>Historical Data Range</CardTitle>
                </CardHeader>
                <CardContent>
                  <DateRangeSelector
                    selectedDays={selectedDays}
                    onDaysChange={setSelectedDays}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Stats Overview */}
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
                  icon={<Shield className="h-4 w-4 text-purple-500" />}
                />
                <StatsCard
                  title="Population"
                  value={selectedCountryData.population}
                  icon={<Users className="h-4 w-4 text-cyan-500" />}
                />
              </div>
            ) : null}

            {/* Historical Trend Chart */}
            {!isLoading && selectedCountry && (
              <HistoricalTrendChart
                country={selectedCountry}
                days={selectedDays}
              />
            )}

            {/* Charts and Tables */}
            <div className="grid gap-4 lg:grid-cols-2">
              {!isLoading && countries.length > 0 && (
                <>
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
                </>
              )}
            </div>

            {/* Countries Table */}
            {!isLoading && countries.length > 0 && (
              <CountriesTable
                countries={countries}
                selectedCountry={selectedCountry}
                onCountrySelect={setSelectedCountry}
              />
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
