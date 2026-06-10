import { describe, it, expect } from 'vitest';
import { getDefaultServices } from '../defaultServices';

describe('getDefaultServices', () => {
  it('retorna servicios para Belleza', () => {
    const services = getDefaultServices('Belleza');
    expect(services.length).toBeGreaterThan(0);
    expect(services[0].name).toBe('Corte de cabello');
  });

  it('retorna servicios para Salud', () => {
    const services = getDefaultServices('Salud');
    expect(services.length).toBeGreaterThan(0);
    expect(services[0].name).toContain('Consulta');
  });

  it('retorna vacío para categoría desconocida', () => {
    expect(getDefaultServices('CategoríaInexistente')).toEqual([]);
  });

  it('retorna vacío para string vacío', () => {
    expect(getDefaultServices('')).toEqual([]);
  });

  it('es case-insensitive', () => {
    const lower = getDefaultServices('belleza');
    const upper = getDefaultServices('BELLEZA');
    expect(lower).toEqual(upper);
  });
});
