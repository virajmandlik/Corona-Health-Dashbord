
import { CovidCountryData, HistoricalData } from "@/types/covid";

const BASE_URL = "https://disease.sh/v3/covid-19";

export const covidApi = {
  // Fetch all countries data
  getAllCountries: async (): Promise<CovidCountryData[]> => {
    try {
      const response = await fetch(`${BASE_URL}/countries`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching countries data:", error);
      throw error;
    }
  },

  // Fetch specific country data
  getCountryData: async (country: string): Promise<CovidCountryData> => {
    try {
      const response = await fetch(`${BASE_URL}/countries/${country}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching data for ${country}:`, error);
      throw error;
    }
  },

  // Fetch historical data for a country
  getHistoricalData: async (country: string, days: number = 30): Promise<HistoricalData> => {
    try {
      const response = await fetch(`${BASE_URL}/historical/${country}?lastdays=${days}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching historical data for ${country}:`, error);
      throw error;
    }
  },

  // Fetch global statistics
  getGlobalStats: async () => {
    try {
      const response = await fetch(`${BASE_URL}/all`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching global stats:", error);
      throw error;
    }
  }
};
