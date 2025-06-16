
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CovidCountryData } from "@/types/covid";

interface CountrySelectorProps {
  countries: CovidCountryData[];
  selectedCountry: string;
  onCountrySelect: (country: string) => void;
  loading?: boolean;
}

export function CountrySelector({ 
  countries, 
  selectedCountry, 
  onCountrySelect, 
  loading = false 
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedCountryData = countries.find(
    (country) => country.country === selectedCountry
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          <div className="flex items-center gap-2">
            {selectedCountryData?.countryInfo?.flag && (
              <img
                src={selectedCountryData.countryInfo.flag}
                alt={`${selectedCountry} flag`}
                className="h-4 w-6 object-cover rounded-sm"
              />
            )}
            {selectedCountry || "Select country..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Search countries..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.country}
                  value={country.country}
                  onSelect={(currentValue) => {
                    onCountrySelect(currentValue === selectedCountry ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <img
                      src={country.countryInfo.flag}
                      alt={`${country.country} flag`}
                      className="h-4 w-6 object-cover rounded-sm"
                    />
                    <span>{country.country}</span>
                    <span className="text-muted-foreground text-sm">
                      ({country.countryInfo.iso2})
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedCountry === country.country ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
