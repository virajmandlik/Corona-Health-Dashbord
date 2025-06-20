import { CovidCountryData } from "@/types/covid";

const AI_API_URL = "https://api.worqhat.com/api/ai/content/v4";
const AI_API_KEY = "wh_mbj9nxce06hE0H6XNp1d5Vk2tO8bePsedcehAlCQbuow";

// Fallback AI responses for when the API is unavailable
const FALLBACK_RESPONSES = {
  countryAnalysis: {
    critical: "This country shows critical COVID-19 activity with high transmission rates and concerning health metrics. Immediate attention to public health measures and healthcare capacity is essential.",
    high: "This country shows elevated COVID-19 activity with concerning metrics that require continued monitoring and enhanced public health measures.",
    medium: "The country demonstrates moderate COVID-19 activity with mixed indicators requiring ongoing attention to health protocols and monitoring systems.",
    low: "This country shows relatively controlled COVID-19 metrics with positive trends in key health indicators and effective management strategies.",
  },
  globalInsights: "Global COVID-19 data reveals diverse patterns across regions, with varying vaccination rates, healthcare capacities, and public health responses. Countries with robust healthcare systems and high vaccination coverage generally demonstrate better pandemic outcomes. Continued vigilance and adaptive strategies remain crucial for global health security.",
  keyMetrics: [
    "Population density affects transmission dynamics",
    "Healthcare capacity influences patient outcomes", 
    "Testing rates correlate with case detection accuracy",
    "Vaccination coverage impacts severity reduction",
    "Economic factors influence health response capacity"
  ],
  recommendations: [
    "Maintain comprehensive vaccination programs",
    "Continue robust health monitoring systems",
    "Follow evidence-based public health guidelines",
    "Strengthen healthcare infrastructure capacity",
    "Implement targeted interventions for high-risk populations"
  ]
};

export interface AIAnalysisResponse {
  content: string;
  success: boolean;
  timestamp: number;
}

export interface AIInsight {
  country: string;
  analysis: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  keyMetrics: string[];
  recommendations: string[];
  timestamp: number;
}

class AIService {
  private conversationId: string;
  private conversationHistory: string[];
  private apiAvailable: boolean = true;

  constructor() {
    this.conversationId = `conv_${Date.now()}`;
    this.conversationHistory = [];
  }

  private async callAI(question: string, trainingData?: string): Promise<AIAnalysisResponse> {
    // If API was previously unavailable, use fallback immediately
    if (!this.apiAvailable) {
      return {
        content: this.getFallbackResponse(question),
        success: false,
        timestamp: Date.now(),
      };
    }

    try {
      const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          model: "aicon-v4-nano-160824",
          randomness: 0.5,
          stream_data: false,
          training_data: trainingData || "You are a COVID-19 data analyst expert. Provide concise, accurate analysis of pandemic data with actionable insights.",
          response_type: "text",
          conversation_id: this.conversationId,
          preserve_history: true,
          conversation_history: this.conversationHistory,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          console.warn("AI API: 403 Forbidden - API key may be invalid or expired. Using fallback responses.");
          this.apiAvailable = false;
          return {
            content: this.getFallbackResponse(question),
            success: false,
            timestamp: Date.now(),
          };
        }
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats from the API
      let content = "";
      if (data.content) {
        content = data.content;
      } else if (data.response) {
        content = data.response;
      } else if (data.data && data.data.content) {
        content = data.data.content;
      } else if (data.choices && data.choices[0] && data.choices[0].message) {
        content = data.choices[0].message.content;
      } else if (typeof data === 'string') {
        content = data;
      } else {
        content = this.getFallbackResponse(question);
      }
      
      // Update conversation history only if API is working
      this.conversationHistory.push(`${question}: ${content}`);
      
      // Keep only last 10 conversations to avoid token limits
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      return {
        content,
        success: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("AI Service Error:", error);
      this.apiAvailable = false;
      
      return {
        content: this.getFallbackResponse(question),
        success: false,
        timestamp: Date.now(),
      };
    }
  }

  private getFallbackResponse(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes("global")) {
      return FALLBACK_RESPONSES.globalInsights;
    }
    
    if (lowerQuestion.includes("kpi") || lowerQuestion.includes("performance")) {
      return "This country's COVID-19 metrics show varying performance compared to global averages. Key indicators suggest the need for continued monitoring and adaptive public health strategies based on local conditions and healthcare capacity.";
    }
    
    // Determine risk level from question context
    if (lowerQuestion.includes("critical") || lowerQuestion.includes("high risk")) {
      return FALLBACK_RESPONSES.countryAnalysis.critical;
    } else if (lowerQuestion.includes("high")) {
      return FALLBACK_RESPONSES.countryAnalysis.high;
    } else if (lowerQuestion.includes("low")) {
      return FALLBACK_RESPONSES.countryAnalysis.low;
    }
    
    // Default country analysis fallback
    return FALLBACK_RESPONSES.countryAnalysis.medium;
  }

  private formatCountryDataForAI(countryData: CovidCountryData): string {
    return `
Country: ${countryData.country}
Population: ${countryData.population?.toLocaleString() || "N/A"}
Total Cases: ${countryData.cases?.toLocaleString() || 0}
Total Deaths: ${countryData.deaths?.toLocaleString() || 0}
Total Recovered: ${countryData.recovered?.toLocaleString() || 0}
Active Cases: ${countryData.active?.toLocaleString() || 0}
Critical Cases: ${countryData.critical?.toLocaleString() || 0}
Today's Cases: ${countryData.todayCases?.toLocaleString() || 0}
Today's Deaths: ${countryData.todayDeaths?.toLocaleString() || 0}
Today's Recovered: ${countryData.todayRecovered?.toLocaleString() || 0}
Cases per Million: ${countryData.casesPerOneMillion?.toLocaleString() || 0}
Deaths per Million: ${countryData.deathsPerOneMillion?.toLocaleString() || 0}
Tests per Million: ${countryData.testsPerOneMillion?.toLocaleString() || 0}
Continent: ${countryData.continent || "N/A"}
    `.trim();
  }

  private determineRiskLevel(countryData: CovidCountryData): "Low" | "Medium" | "High" | "Critical" {
    const activeCasesPerMillion = countryData.activePerOneMillion || 0;
    const deathsPerMillion = countryData.deathsPerOneMillion || 0;
    const todayCases = countryData.todayCases || 0;
    const criticalCases = countryData.critical || 0;

    if (activeCasesPerMillion > 5000 || deathsPerMillion > 2000 || todayCases > 10000 || criticalCases > 1000) {
      return "Critical";
    } else if (activeCasesPerMillion > 2000 || deathsPerMillion > 1000 || todayCases > 5000 || criticalCases > 500) {
      return "High";
    } else if (activeCasesPerMillion > 500 || deathsPerMillion > 500 || todayCases > 1000 || criticalCases > 100) {
      return "Medium";
    }
    return "Low";
  }

  private generateFallbackInsight(countryData: CovidCountryData, riskLevel: "Low" | "Medium" | "High" | "Critical"): AIInsight {
    const analysis = FALLBACK_RESPONSES.countryAnalysis[riskLevel.toLowerCase() as keyof typeof FALLBACK_RESPONSES.countryAnalysis];
    
    const keyMetrics = [
      `${countryData.cases?.toLocaleString() || 0} total cases recorded`,
      `${countryData.deathsPerOneMillion?.toLocaleString() || 0} deaths per million population`,
      `${countryData.testsPerOneMillion?.toLocaleString() || 0} tests per million conducted`
    ];

    const recommendations = FALLBACK_RESPONSES.recommendations.slice(0, 3);

    return {
      country: countryData.country,
      analysis,
      riskLevel,
      keyMetrics,
      recommendations,
      timestamp: Date.now(),
    };
  }

  async analyzeCountryData(countryData: CovidCountryData): Promise<AIInsight> {
    const riskLevel = this.determineRiskLevel(countryData);
    
    // If API is not available, return fallback immediately
    if (!this.apiAvailable) {
      return this.generateFallbackInsight(countryData, riskLevel);
    }

    const formattedData = this.formatCountryDataForAI(countryData);
    
    const question = `Analyze the following COVID-19 data for ${countryData.country} and provide:
1. A brief 2-3 sentence analysis of the current situation
2. 3 key metrics that stand out (positive or concerning)
3. 2-3 actionable recommendations for public health

Data:
${formattedData}

Please format your response as:
ANALYSIS: [your analysis]
KEY_METRICS: [metric 1] | [metric 2] | [metric 3]
RECOMMENDATIONS: [rec 1] | [rec 2] | [rec 3]`;

    const trainingData = `You are a COVID-19 epidemiologist and data analyst. Provide concise, evidence-based analysis of pandemic data. Focus on trends, risk assessment, and practical recommendations. Keep responses under 200 words total.`;

    const aiResponse = await this.callAI(question, trainingData);
    
    // If AI call failed, return fallback
    if (!aiResponse.success) {
      return this.generateFallbackInsight(countryData, riskLevel);
    }

    // Parse AI response
    const content = aiResponse.content;
    let analysis = "";
    let keyMetrics: string[] = [];
    let recommendations: string[] = [];

    try {
      const analysisMatch = content.match(/ANALYSIS:\s*(.+?)(?=KEY_METRICS:|$)/s);
      const metricsMatch = content.match(/KEY_METRICS:\s*(.+?)(?=RECOMMENDATIONS:|$)/s);
      const recommendationsMatch = content.match(/RECOMMENDATIONS:\s*(.+?)$/s);

      analysis = analysisMatch?.[1]?.trim() || content.substring(0, 150) + "...";
      keyMetrics = metricsMatch?.[1]?.split("|").map(m => m.trim()).filter(Boolean) || [
        `${countryData.cases?.toLocaleString()} total cases`,
        `${countryData.deaths?.toLocaleString()} total deaths`,
        `${countryData.active?.toLocaleString()} active cases`
      ];
      recommendations = recommendationsMatch?.[1]?.split("|").map(r => r.trim()).filter(Boolean) || [
        "Continue monitoring health guidelines",
        "Maintain vaccination programs",
        "Monitor vulnerable populations"
      ];
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return this.generateFallbackInsight(countryData, riskLevel);
    }

    return {
      country: countryData.country,
      analysis,
      riskLevel,
      keyMetrics: keyMetrics.slice(0, 3),
      recommendations: recommendations.slice(0, 3),
      timestamp: Date.now(),
    };
  }

  async generateGlobalInsights(countries: CovidCountryData[]): Promise<string> {
    // If API is not available, return fallback immediately
    if (!this.apiAvailable) {
      return FALLBACK_RESPONSES.globalInsights;
    }

    const topCountries = countries
      .sort((a, b) => (b.cases || 0) - (a.cases || 0))
      .slice(0, 5);

    const globalStats = {
      totalCases: countries.reduce((sum, c) => sum + (c.cases || 0), 0),
      totalDeaths: countries.reduce((sum, c) => sum + (c.deaths || 0), 0),
      totalRecovered: countries.reduce((sum, c) => sum + (c.recovered || 0), 0),
      countriesCount: countries.length,
    };

    const question = `Provide a brief global COVID-19 situation summary based on:
- Total Cases: ${globalStats.totalCases.toLocaleString()}
- Total Deaths: ${globalStats.totalDeaths.toLocaleString()}
- Total Recovered: ${globalStats.totalRecovered.toLocaleString()}
- Countries Reporting: ${globalStats.countriesCount}
- Top 5 Affected Countries: ${topCountries.map(c => `${c.country} (${c.cases?.toLocaleString()})`).join(", ")}

Provide a 3-4 sentence global overview focusing on current trends and key observations.`;

    const response = await this.callAI(question);
    return response.content;
  }

  // Method to check if API is available and reset if needed
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: "Test connection",
          model: "aicon-v4-nano-160824",
          randomness: 0.5,
          stream_data: false,
          response_type: "text",
          conversation_id: `test_${Date.now()}`,
          preserve_history: false,
        }),
      });

      this.apiAvailable = response.ok;
      return this.apiAvailable;
    } catch (error) {
      this.apiAvailable = false;
      return false;
    }
  }

  getApiStatus(): boolean {
    return this.apiAvailable;
  }
}

export const aiService = new AIService();
