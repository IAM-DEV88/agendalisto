import { describe, it, expect } from 'vitest';
import uiReducer, { setActiveTab, setItemsPerPage } from '../uiSlice';
import type { UIState } from '../uiSlice';

const initialState: UIState = {
  activeTab: 'upcoming',
  itemsPerPage: 5,
};

describe('uiSlice', () => {
  it('should return the initial state', () => {
    expect(uiReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setActiveTab', () => {
    const state = uiReducer(initialState, setActiveTab('past'));
    expect(state.activeTab).toBe('past');
  });

  it('should handle setItemsPerPage', () => {
    const state = uiReducer(initialState, setItemsPerPage(25));
    expect(state.itemsPerPage).toBe(25);
  });

  it('should clamp itemsPerPage to minimum 1', () => {
    const state = uiReducer(initialState, setItemsPerPage(0));
    expect(state.itemsPerPage).toBe(1);
  });

  it('should clamp itemsPerPage to maximum 100', () => {
    const state = uiReducer(initialState, setItemsPerPage(200));
    expect(state.itemsPerPage).toBe(100);
  });
});
