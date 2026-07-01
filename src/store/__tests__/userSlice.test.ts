import { describe, it, expect } from 'vitest';
import userReducer, { setUser, setUserProfile, setBusinesses, setLoading, setAuthInitialized, setActiveBusinessId, updateBusinessInStore, setError } from '../userSlice';

const initialState = {
  user: null,
  userProfile: null,
  businesses: [],
  loading: true,
  authInitialized: false,
  error: null,
};

describe('userSlice', () => {
  it('should return the initial state', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setUser', () => {
    const user = { id: '123', email: 'test@test.com' } as any;
    const state = userReducer(initialState, setUser(user));
    expect(state.user).toEqual(user);
  });

  it('should handle setUserProfile', () => {
    const profile = { id: '123', full_name: 'Test User', role: 'client', plan: 'starter' } as any;
    const state = userReducer(initialState, setUserProfile(profile));
    expect(state.userProfile).toEqual(profile);
  });

  it('should handle setBusinesses', () => {
    const businesses = [{ id: 'b1', name: 'Test Biz' }] as any;
    const state = userReducer(initialState, setBusinesses(businesses));
    expect(state.businesses).toEqual(businesses);
  });

  it('should handle setLoading', () => {
    const state = userReducer(initialState, setLoading(true));
    expect(state.loading).toBe(true);
  });

  it('should handle setAuthInitialized', () => {
    const state = userReducer(initialState, setAuthInitialized(true));
    expect(state.authInitialized).toBe(true);
  });

  it('should handle setActiveBusinessId', () => {
    const profile = { id: '123', full_name: 'Test', role: 'client', plan: 'starter' } as any;
    const stateWithProfile = userReducer(initialState, setUserProfile(profile));
    const state = userReducer(stateWithProfile, setActiveBusinessId('b1'));
    expect(state.userProfile?.business_id).toBe('b1');
  });

  it('should handle setActiveBusinessId when no profile', () => {
    const state = userReducer(initialState, setActiveBusinessId('b1'));
    expect(state.userProfile).toBeNull();
  });

  it('should handle updateBusinessInStore', () => {
    const businesses = [{ id: 'b1', name: 'Old Name' }, { id: 'b2', name: 'Biz 2' }] as any;
    const stateWithBiz = userReducer(initialState, setBusinesses(businesses));
    const state = userReducer(stateWithBiz, updateBusinessInStore({ id: 'b1', name: 'New Name' } as any));
    expect(state.businesses[0].name).toBe('New Name');
    expect(state.businesses[1].name).toBe('Biz 2');
  });

  it('should handle setError', () => {
    const state = userReducer(initialState, setError('Something went wrong'));
    expect(state.error).toBe('Something went wrong');
  });

  it('should clear error', () => {
    const stateWithError = userReducer(initialState, setError('Something went wrong'));
    const state = userReducer(stateWithError, setError(null));
    expect(state.error).toBeNull();
  });

  it('should handle updateBusinessInStore for non-existent business', () => {
    const businesses = [{ id: 'b1', name: 'Biz 1' }] as any;
    const stateWithBiz = userReducer(initialState, setBusinesses(businesses));
    const state = userReducer(stateWithBiz, updateBusinessInStore({ id: 'b3', name: 'Biz 3' } as any));
    expect(state.businesses).toHaveLength(1);
  });
});
