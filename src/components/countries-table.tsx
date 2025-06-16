
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { CovidCountryData } from "@/types/covid";

interface CountriesTableProps {
  countries: CovidCountryData[];
  selectedCountry: string;
  onCountrySelect: (country: string) => void;
}

type SortField = 'country' | 'cases' | 'deaths' | 'recovered' | 'active';
type SortDirection = 'asc' | 'desc';

export function CountriesTable({ 
  countries, 
  selectedCountry, 
  onCountrySelect 
}: CountriesTableProps) {
  const [sortField, setSortField] = useState<SortField>('cases');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const sortedCountries = [...countries].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCountries = sortedCountries.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(countries.length / itemsPerPage);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getCellColor = (type: 'cases' | 'deaths' | 'recovered') => {
    switch (type) {
      case 'cases': return 'text-orange-400';
      case 'deaths': return 'text-red-400';
      case 'recovered': return 'text-green-400';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Countries Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('country')}
                    className="h-auto p-0 font-semibold"
                  >
                    Country {getSortIcon('country')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('cases')}
                    className="h-auto p-0 font-semibold"
                  >
                    Total Cases {getSortIcon('cases')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('deaths')}
                    className="h-auto p-0 font-semibold"
                  >
                    Deaths {getSortIcon('deaths')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('recovered')}
                    className="h-auto p-0 font-semibold"
                  >
                    Recovered {getSortIcon('recovered')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('active')}
                    className="h-auto p-0 font-semibold"
                  >
                    Active {getSortIcon('active')}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCountries.map((country) => (
                <TableRow 
                  key={country.country}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    selectedCountry === country.country ? 'bg-muted' : ''
                  }`}
                  onClick={() => onCountrySelect(country.country)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <img
                        src={country.countryInfo.flag}
                        alt={`${country.country} flag`}
                        className="h-4 w-6 object-cover rounded-sm"
                      />
                      {country.country}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right ${getCellColor('cases')}`}>
                    {country.cases.toLocaleString()}
                  </TableCell>
                  <TableCell className={`text-right ${getCellColor('deaths')}`}>
                    {country.deaths.toLocaleString()}
                  </TableCell>
                  <TableCell className={`text-right ${getCellColor('recovered')}`}>
                    {country.recovered.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {country.active.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, countries.length)} of {countries.length} countries
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
