import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { aiService } from "@/services/aiService";

export function APIStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [testing, setTesting] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkAPIStatus = async () => {
    setTesting(true);
    try {
      const status = await aiService.testConnection();
      setIsOnline(status);
      setLastChecked(new Date());
    } catch (error) {
      setIsOnline(false);
      setLastChecked(new Date());
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    // Check status on component mount
    checkAPIStatus();
  }, []);

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          AI Service Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Connection:</span>
          <Badge 
            variant={isOnline ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {isOnline ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Online
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3" />
                Offline
              </>
            )}
          </Badge>
        </div>

        {!isOnline && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              AI service is unavailable. Using fallback responses with pre-generated insights.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={checkAPIStatus}
            disabled={testing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-3 w-3 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Testing..." : "Test Connection"}
          </Button>
          
          {lastChecked && (
            <span className="text-xs text-muted-foreground">
              {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>API:</strong> WorqHat AI v4</p>
          <p><strong>Mode:</strong> {isOnline ? "Live Analysis" : "Fallback Responses"}</p>
        </div>
      </CardContent>
    </Card>
  );
}