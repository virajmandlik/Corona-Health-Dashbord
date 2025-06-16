
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  todayValue?: number;
  icon?: React.ReactNode;
  color?: "default" | "destructive" | "success" | "warning";
  format?: "number" | "per-million";
}

export function StatsCard({ 
  title, 
  value, 
  todayValue, 
  icon, 
  color = "default",
  format = "number" 
}: StatsCardProps) {
  const formatNumber = (num: number) => {
    if (format === "per-million") {
      return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    return num.toLocaleString();
  };

  const getTrendIcon = () => {
    if (todayValue === undefined || todayValue === 0) return <Minus className="h-3 w-3" />;
    return todayValue > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (todayValue === undefined || todayValue === 0) return "secondary";
    if (color === "destructive") return "destructive";
    if (color === "success") return "default";
    return todayValue > 0 ? "destructive" : "default";
  };

  const getValueColor = () => {
    if (title.toLowerCase().includes('cases')) return 'text-orange-500';
    if (title.toLowerCase().includes('death')) return 'text-red-500';
    if (title.toLowerCase().includes('recover')) return 'text-green-500';
    return '';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${getValueColor()}`}>
          {formatNumber(value)}
        </div>
        {todayValue !== undefined && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
            <Badge variant={getTrendColor()} className="flex items-center gap-1 px-1 py-0">
              {getTrendIcon()}
              {todayValue > 0 ? '+' : ''}{formatNumber(todayValue)}
            </Badge>
            <span>today</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
