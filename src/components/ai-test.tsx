
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, TestTube } from "lucide-react";
import { aiService } from "@/services/aiService";

export function AITest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  const testAIConnection = async () => {
    setTesting(true);
    setError("");
    setResult("");

    try {
      // Test with a simple question
      const response = await fetch("https://api.worqhat.com/api/ai/content/v4", {
        method: "POST",
        headers: {
          "Authorization": "Bearer wh_mbj9nxce06hE0H6XNp1d5Vk2tO8bePsedcehAlCQbuow",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: "Hello, can you analyze COVID-19 data?",
          model: "aicon-v4-nano-160824",
          randomness: 0.5,
          stream_data: false,
          training_data: "You are a COVID-19 data analyst. Respond briefly.",
          response_type: "text",
          conversation_id: `test_${Date.now()}`,
          preserve_history: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log("AI API Response:", data);
      
      let content = "";
      if (data.content) {
        content = data.content;
      } else if (data.response) {
        content = data.response;
      } else if (data.data && data.data.content) {
        content = data.data.content;
      } else {
        content = JSON.stringify(data, null, 2);
      }

      setResult(content);
    } catch (err: any) {
      console.error("AI Test Error:", err);
      setError(err.message || "Failed to connect to AI service");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-500" />
          <Brain className="h-5 w-5 text-purple-500" />
          AI Service Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testAIConnection}
          disabled={testing}
          className="w-full"
        >
          {testing ? "Testing AI Connection..." : "Test AI Service"}
        </Button>

        {result && (
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              <strong>AI Response:</strong>
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                {result}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>API Endpoint:</strong> https://api.worqhat.com/api/ai/content/v4</p>
          <p><strong>Model:</strong> aicon-v4-nano-160824</p>
          <p><strong>Status:</strong> {testing ? "Testing..." : "Ready"}</p>
        </div>
      </CardContent>
    </Card>
  );
}