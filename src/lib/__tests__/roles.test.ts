import { describe, it, expect } from 'vitest';
import { ROLES, canAccessDashboard, canManageBusiness, canBook, getMaxBusinesses } from '../roles';

describe('ROLES', () => {
  it('tiene 5 roles en orden jerárquico', () => {
    expect(ROLES).toEqual(['visitor', 'client', 'business_owner', 'moderator', 'admin']);
  });

  it('visitor tiene índice 0', () => expect(ROLES.indexOf('visitor')).toBe(0));
  it('admin tiene índice 4', () => expect(ROLES.indexOf('admin')).toBe(4));
});

describe('canAccessDashboard', () => {
  it('permite a business_owner', () => expect(canAccessDashboard('business_owner')).toBe(true));
  it('permite a admin', () => expect(canAccessDashboard('admin')).toBe(true));
  it('permite a moderator', () => expect(canAccessDashboard('moderator')).toBe(true));
  it('deniega a visitor', () => expect(canAccessDashboard('visitor')).toBe(false));
  it('deniega a client', () => expect(canAccessDashboard('client')).toBe(false));
});

describe('canManageBusiness', () => {
  it('permite a business_owner', () => expect(canManageBusiness('business_owner')).toBe(true));
  it('permite a admin', () => expect(canManageBusiness('admin')).toBe(true));
  it('deniega a client', () => expect(canManageBusiness('client')).toBe(false));
  it('deniega a moderator', () => expect(canManageBusiness('moderator')).toBe(false));
});

describe('canBook', () => {
  it('permite a client', () => expect(canBook('client')).toBe(true));
  it('permite a business_owner', () => expect(canBook('business_owner')).toBe(true));
  it('permite a admin', () => expect(canBook('admin')).toBe(true));
  it('deniega a visitor', () => expect(canBook('visitor')).toBe(false));
});

describe('getMaxBusinesses', () => {
  it('starter permite 1', () => expect(getMaxBusinesses('starter')).toBe(1));
  it('pro permite 5', () => expect(getMaxBusinesses('pro')).toBe(5));
  it('premium permite ilimitado', () => expect(getMaxBusinesses('premium')).toBe(Infinity));
});
