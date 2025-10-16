/**
 * @fileoverview Currency conversion utilities and exchange rate management.
 * Provides hooks and functions for handling USD/EUR conversions and formatting.
 */

import { useState, useEffect } from "react";

/**
 * Supported currency types in the application.
 * @typedef {"USD" | "EUR"} Currency
 */
export type Currency = "USD" | "EUR";

/**
 * Response structure from the exchange rate API.
 * 
 * @interface ExchangeRateResponse
 * @property {Object} rates - Exchange rates object
 * @property {number} rates.EUR - EUR to USD exchange rate
 * @property {string} base - Base currency (always "USD")
 * @property {string} date - Date of the exchange rate
 */
interface ExchangeRateResponse {
  rates: {
    EUR: number;
  };
  base: string;
  date: string;
}

/**
 * React hook to fetch and manage USD to EUR exchange rates.
 * Fetches rate on mount from exchangerate-api.com with fallback to 0.85.
 * 
 * @returns {Object} Exchange rate state
 * @returns {number} return.rate - Current USD to EUR exchange rate
 * @returns {boolean} return.isLoading - True while fetching rate
 * @returns {string | null} return.error - Error message if fetch failed
 * 
 * @example
 * ```tsx
 * function CurrencyDisplay() {
 *   const { rate, isLoading, error } = useExchangeRate();
 *   
 *   if (isLoading) return <div>Loading rate...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   
 *   return <div>1 USD = {rate} EUR</div>;
 * }
 * ```
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
 * Converts an amount between USD and EUR using the provided exchange rate.
 * Returns the original amount if from and to currencies are the same.
 * 
 * @param {number} amount - Amount to convert
 * @param {Currency} from - Source currency
 * @param {Currency} to - Target currency
 * @param {number} rate - USD to EUR exchange rate
 * @returns {number} Converted amount
 * 
 * @example
 * ```typescript
 * // Convert $100 USD to EUR with rate 0.85
 * convertCurrency(100, "USD", "EUR", 0.85) // => 85
 * 
 * // Convert €85 EUR to USD with rate 0.85
 * convertCurrency(85, "EUR", "USD", 0.85) // => 100
 * 
 * // Same currency returns original amount
 * convertCurrency(100, "USD", "USD", 0.85) // => 100
 * ```
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
 * Formats a numeric amount as a currency string with symbol.
 * Always displays 2 decimal places.
 * 
 * @param {number} amount - Amount to format
 * @param {Currency} currency - Currency type for symbol selection
 * @returns {string} Formatted currency string (e.g., "$100.00" or "€85.00")
 * 
 * @example
 * ```typescript
 * formatCurrency(100, "USD")    // => "$100.00"
 * formatCurrency(85.5, "EUR")   // => "€85.50"
 * formatCurrency(0.99, "USD")   // => "$0.99"
 * ```
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = currency === "USD" ? "$" : "€";
  return `${symbol}${amount.toFixed(2)}`;
}
