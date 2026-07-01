import { describe, it, expect } from 'vitest';
import { detectCountry } from '../countryDetection';

describe('detectCountry', () => {
  it('should return a valid country code', () => {
    const country = detectCountry();
    expect(['co', 'us', 'other']).toContain(country);
  });
});
