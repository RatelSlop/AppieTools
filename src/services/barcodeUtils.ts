import { BarcodeType } from '../types';

/**
 * Calculates the GS1 check digit for a 12-digit string to form an EAN-13.
 */
export function calculateEan13CheckDigit(first12Digits: string): number {
  if (!/^\d{12}$/.test(first12Digits)) {
    throw new Error('Invoer moet exact 12 cijfers bevatten voor EAN-13 check digit berekening.');
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(first12Digits[i], 10);
    // Even index (0, 2, 4...) -> weight 1, Odd index (1, 3, 5...) -> weight 3
    sum += i % 2 === 0 ? digit * 1 : digit * 3;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Calculates the GS1 check digit for a 7-digit string to form an EAN-8.
 */
export function calculateEan8CheckDigit(first7Digits: string): number {
  if (!/^\d{7}$/.test(first7Digits)) {
    throw new Error('Invoer moet exact 7 cijfers bevatten voor EAN-8 check digit berekening.');
  }

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(first7Digits[i], 10);
    // Even index (0, 2, 4, 6) -> weight 3, Odd index (1, 3, 5) -> weight 1
    sum += i % 2 === 0 ? digit * 3 : digit * 1;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

export interface BarcodeValidationResult {
  isValid: boolean;
  expectedCheckDigit?: number;
  actualCheckDigit?: number;
  cleanedCode: string;
  errorMessage?: string;
}

/**
 * Validates an EAN-13 barcode including digit count and check digit.
 */
export function validateEan13(code: string): BarcodeValidationResult {
  const cleaned = code.replace(/\D/g, '');

  if (cleaned.length !== 13) {
    return {
      isValid: false,
      cleanedCode: cleaned,
      errorMessage: `EAN-13 moet 13 cijfers bevatten (huidig aantal: ${cleaned.length})`,
    };
  }

  const first12 = cleaned.substring(0, 12);
  const actualCheck = parseInt(cleaned[12], 10);
  const expectedCheck = calculateEan13CheckDigit(first12);

  if (actualCheck !== expectedCheck) {
    return {
      isValid: false,
      cleanedCode: cleaned,
      expectedCheckDigit: expectedCheck,
      actualCheckDigit: actualCheck,
      errorMessage: `Ongeldig controlegetal (laatste cijfer is ${actualCheck}, maar hoort ${expectedCheck} te zijn)`,
    };
  }

  return {
    isValid: true,
    cleanedCode: cleaned,
    expectedCheckDigit: expectedCheck,
    actualCheckDigit: actualCheck,
  };
}

/**
 * Validates an EAN-8 barcode including digit count and check digit.
 */
export function validateEan8(code: string): BarcodeValidationResult {
  const cleaned = code.replace(/\D/g, '');

  if (cleaned.length !== 8) {
    return {
      isValid: false,
      cleanedCode: cleaned,
      errorMessage: `EAN-8 moet 8 cijfers bevatten (huidig aantal: ${cleaned.length})`,
    };
  }

  const first7 = cleaned.substring(0, 7);
  const actualCheck = parseInt(cleaned[7], 10);
  const expectedCheck = calculateEan8CheckDigit(first7);

  if (actualCheck !== expectedCheck) {
    return {
      isValid: false,
      cleanedCode: cleaned,
      expectedCheckDigit: expectedCheck,
      actualCheckDigit: actualCheck,
      errorMessage: `Ongeldig controlegetal (laatste cijfer is ${actualCheck}, maar hoort ${expectedCheck} te zijn)`,
    };
  }

  return {
    isValid: true,
    cleanedCode: cleaned,
    expectedCheckDigit: expectedCheck,
    actualCheckDigit: actualCheck,
  };
}

/**
 * Validates either EAN-13 or EAN-8 based on type.
 */
export function validateBarcode(code: string, type: BarcodeType): BarcodeValidationResult {
  return type === 'EAN13' ? validateEan13(code) : validateEan8(code);
}

/**
 * Formats EAN code for human readable display with standard spaces.
 */
export function formatEanDisplay(code: string): string {
  const cleaned = code.replace(/\D/g, '');
  if (cleaned.length === 13) {
    // 8 711200 431632
    return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 7)} ${cleaned.slice(7, 13)}`;
  }
  if (cleaned.length === 8) {
    // 9638 5074
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)}`;
  }
  return cleaned;
}
