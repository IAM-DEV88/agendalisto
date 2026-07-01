import { describe, it, expect } from 'vitest';
import { getErrorMessage, handleApiError, isNotFoundError } from '../api-helpers';

describe('api-helpers', () => {
  describe('getErrorMessage', () => {
    it('should return message from Error instance', () => {
      expect(getErrorMessage(new Error('test error'))).toBe('test error');
    });

    it('should return string representation for non-Error', () => {
      expect(getErrorMessage('string error')).toBe('string error');
    });

    it('should handle null', () => {
      expect(getErrorMessage(null)).toBe('Error desconocido');
    });

    it('should handle objects without message', () => {
      expect(getErrorMessage({ code: 500 })).toBe('Error desconocido');
    });
  });

  describe('handleApiError', () => {
    it('should return error from Error instance', () => {
      expect(handleApiError(new Error('api error'))).toEqual({
        success: false,
        error: 'api error',
      });
    });

    it('should return error from Supabase error', () => {
      expect(handleApiError({ message: 'supabase error' })).toEqual({
        success: false,
        error: 'supabase error',
      });
    });

    it('should return a default message for unknown errors', () => {
      expect(handleApiError(undefined)).toEqual({
        success: false,
        error: 'Error desconocido',
      });
    });
  });

  describe('isNotFoundError', () => {
    it('should detect PGRST116 as not found', () => {
      expect(isNotFoundError({ code: 'PGRST116', details: '', hint: '', message: '' } as any)).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isNotFoundError({ code: 'PGRST100' } as any)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isNotFoundError(null)).toBe(false);
    });
  });
});
