"use client"

/**
 * Utility functions for handling fraction inputs and conversions
 */

/**
 * Converts a fraction string to a decimal number
 * Supports formats: "1/2", "3/4", "2-1/2", "3-3/4", "2", "3"
 * 
 * @param fractionStr The fraction string to convert
 * @returns The decimal value or null if invalid
 */
export function fractionToDecimal(fractionStr: string): number | null {
  // Remove any spaces
  const cleanStr = fractionStr.trim().replace(/\s+/g, '');
  
  if (cleanStr === '') return null;
  
  // Check if it's a whole number
  if (/^\d+$/.test(cleanStr)) {
    return parseInt(cleanStr, 10);
  }
  
  // Check if it's a simple fraction (e.g., "1/2")
  if (/^\d+\/\d+$/.test(cleanStr)) {
    const [numerator, denominator] = cleanStr.split('/').map(Number);
    if (denominator === 0) return null; // Avoid division by zero
    return numerator / denominator;
  }
  
  // Check if it's a mixed number (e.g., "2-1/2")
  if (/^\d+-\d+\/\d+$/.test(cleanStr)) {
    const [whole, fraction] = cleanStr.split('-');
    const [numerator, denominator] = fraction.split('/').map(Number);
    if (denominator === 0) return null; // Avoid division by zero
    return parseInt(whole, 10) + (numerator / denominator);
  }
  
  // Invalid format
  return null;
}

/**
 * Converts a decimal number to a fraction string
 * Returns the closest fraction representation
 * 
 * @param decimal The decimal number to convert
 * @param maxDenominator The maximum denominator to use (default: 16)
 * @returns The fraction string
 */
export function decimalToFraction(decimal: number, maxDenominator: number = 16): string {
  if (isNaN(decimal) || !isFinite(decimal)) return '';
  
  // Handle negative numbers
  const sign = decimal < 0 ? '-' : '';
  decimal = Math.abs(decimal);
  
  // Extract whole number part
  const wholePart = Math.floor(decimal);
  let fractionalPart = decimal - wholePart;
  
  // If it's a whole number, return it
  if (fractionalPart === 0) {
    return `${sign}${wholePart}`;
  }
  
  // Find the closest fraction
  let bestNumerator = 0;
  let bestDenominator = 1;
  let bestError = fractionalPart;
  
  for (let denominator = 1; denominator <= maxDenominator; denominator++) {
    const numerator = Math.round(fractionalPart * denominator);
    const error = Math.abs(fractionalPart - (numerator / denominator));
    
    if (error < bestError) {
      bestNumerator = numerator;
      bestDenominator = denominator;
      bestError = error;
      
      // If we found an exact match, break early
      if (error < 0.0000001) break;
    }
  }
  
  // Simplify the fraction
  const gcd = findGCD(bestNumerator, bestDenominator);
  bestNumerator = bestNumerator / gcd;
  bestDenominator = bestDenominator / gcd;
  
  // Format the result
  if (wholePart === 0) {
    return `${sign}${bestNumerator}/${bestDenominator}`;
  } else {
    return `${sign}${wholePart}-${bestNumerator}/${bestDenominator}`;
  }
}

/**
 * Finds the greatest common divisor of two numbers
 * 
 * @param a First number
 * @param b Second number
 * @returns The greatest common divisor
 */
function findGCD(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  
  return a;
}

/**
 * Validates a fraction string
 * 
 * @param fractionStr The fraction string to validate
 * @returns True if valid, false otherwise
 */
export function isValidFractionString(fractionStr: string): boolean {
  // Remove any spaces
  const cleanStr = fractionStr.trim().replace(/\s+/g, '');
  
  if (cleanStr === '') return false;
  
  // Check if it's a whole number
  if (/^\d+$/.test(cleanStr)) {
    return true;
  }
  
  // Check if it's a simple fraction (e.g., "1/2")
  if (/^\d+\/\d+$/.test(cleanStr)) {
    const [_, denominator] = cleanStr.split('/').map(Number);
    return denominator !== 0; // Denominator can't be zero
  }
  
  // Check if it's a mixed number (e.g., "2-1/2")
  if (/^\d+-\d+\/\d+$/.test(cleanStr)) {
    const [_, fraction] = cleanStr.split('-');
    const [__, denominator] = fraction.split('/').map(Number);
    return denominator !== 0; // Denominator can't be zero
  }
  
  // Invalid format
  return false;
}

/**
 * Formats a fraction string to a standardized format
 * 
 * @param fractionStr The fraction string to format
 * @returns The formatted fraction string or the original if invalid
 */
export function formatFractionString(fractionStr: string): string {
  const decimal = fractionToDecimal(fractionStr);
  if (decimal === null) return fractionStr;
  
  return decimalToFraction(decimal);
}
