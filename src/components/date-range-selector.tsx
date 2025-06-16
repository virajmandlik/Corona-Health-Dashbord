
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateRangeSelectorProps {
  selectedDays: number;
  onDaysChange: (days: number) => void;
}

export function DateRangeSelector({ selectedDays, onDaysChange }: DateRangeSelectorProps) {
  const dateRangeOptions = [
    { value: 7, label: "Last 7 days" },
    { value: 14, label: "Last 14 days" },
    { value: 30, label: "Last 30 days" },
    { value: 60, label: "Last 60 days" },
    { value: 90, label: "Last 90 days" },
  ];

  return (
    <Select value={selectedDays.toString()} onValueChange={(value) => onDaysChange(Number(value))}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select time range" />
      </SelectTrigger>
      <SelectContent>
        {dateRangeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value.toString()}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
