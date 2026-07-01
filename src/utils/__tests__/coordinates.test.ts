import { describe, it, expect } from 'vitest';
import { parseCoordinatesFromAddress } from '../coordinates';

describe('parseCoordinatesFromAddress', () => {
  it('should parse valid lat,lng from address', () => {
    const result = parseCoordinatesFromAddress('4.711, -74.072 Calle 123');
    expect(result.lat).toBeCloseTo(4.711);
    expect(result.lng).toBeCloseTo(-74.072);
  });

  it('should reject latitude out of range', () => {
    const result = parseCoordinatesFromAddress('100, -74.072');
    expect(result.lat).toBeNull();
    expect(result.lng).toBeNull();
  });

  it('should reject longitude out of range', () => {
    const result = parseCoordinatesFromAddress('4.711, 200');
    expect(result.lat).toBeNull();
    expect(result.lng).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = parseCoordinatesFromAddress('');
    expect(result.lat).toBeNull();
    expect(result.lng).toBeNull();
  });
});
