import { useState, useEffect } from "react";

export type Currency = "USD" | "EUR";

interface ExchangeRateResponse {
  rates: {
    EUR: number;
  };
  base: string;
  date: string;
}

/**
 * Hook to fetch and manage currency exchange rates
 */
export function useExchangeRate() {
  const [rate, setRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          "https://api.exchangerate-api.com/v4/latest/USD"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch exchange rate");
        }

        const data: ExchangeRateResponse = await response.json();

        // Check if rates exist and has EUR
        if (data?.rates?.EUR) {
          setRate(data.rates.EUR);
        } else {
          console.warn(
            "Exchange rate API returned unexpected format, using fallback"
          );
          setRate(0.85); // Fallback rate
        }
      } catch (err) {
        console.error("Error fetching exchange rate:", err);
        setError("Failed to load exchange rate");
        setRate(0.85); // Fallback rate
      } finally {
        setIsLoading(false);
      }
    };

    fetchRate();
  }, []);

  return { rate, isLoading, error };
}

/**
 * Convert USD to EUR or vice versa
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rate: number
): number {
  if (from === to) return amount;
  if (from === "USD" && to === "EUR") return amount * rate;
  if (from === "EUR" && to === "USD") return amount / rate;
  return amount;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = currency === "USD" ? "$" : "€";
  return `${symbol}${amount.toFixed(2)}`;
}
