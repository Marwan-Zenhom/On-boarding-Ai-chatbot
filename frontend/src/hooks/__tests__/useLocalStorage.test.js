import { renderHook, act } from '@testing-library/react';
import useLocalStorage from '../useLocalStorage';

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));
    
    expect(result.current[0]).toBe('defaultValue');
  });

  it('returns stored value from localStorage', () => {
    localStorage.setItem('testKey', JSON.stringify('storedValue'));
    
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));
    
    expect(result.current[0]).toBe('storedValue');
  });

  it('updates localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));
    
    act(() => {
      result.current[1]('newValue');
    });
    
    expect(result.current[0]).toBe('newValue');
    expect(JSON.parse(localStorage.getItem('testKey'))).toBe('newValue');
  });

  it('handles objects correctly', () => {
    const initialValue = { name: 'test', count: 0 };
    const { result } = renderHook(() => useLocalStorage('objectKey', initialValue));
    
    expect(result.current[0]).toEqual(initialValue);
    
    const newValue = { name: 'updated', count: 1 };
    act(() => {
      result.current[1](newValue);
    });
    
    expect(result.current[0]).toEqual(newValue);
  });

  it('handles arrays correctly', () => {
    const initialValue = [1, 2, 3];
    const { result } = renderHook(() => useLocalStorage('arrayKey', initialValue));
    
    expect(result.current[0]).toEqual(initialValue);
    
    act(() => {
      result.current[1]([4, 5, 6]);
    });
    
    expect(result.current[0]).toEqual([4, 5, 6]);
  });

  it('handles boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('boolKey', false));
    
    expect(result.current[0]).toBe(false);
    
    act(() => {
      result.current[1](true);
    });
    
    expect(result.current[0]).toBe(true);
  });

  it('handles number values', () => {
    const { result } = renderHook(() => useLocalStorage('numKey', 0));
    
    expect(result.current[0]).toBe(0);
    
    act(() => {
      result.current[1](42);
    });
    
    expect(result.current[0]).toBe(42);
  });

  it('handles function updates', () => {
    const { result } = renderHook(() => useLocalStorage('funcKey', 0));
    
    act(() => {
      result.current[1](prev => prev + 1);
    });
    
    expect(result.current[0]).toBe(1);
  });

  it('handles null values', () => {
    const { result } = renderHook(() => useLocalStorage('nullKey', null));
    
    expect(result.current[0]).toBe(null);
    
    act(() => {
      result.current[1]('notNull');
    });
    
    expect(result.current[0]).toBe('notNull');
  });

  it('uses different keys independently', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'));
    const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'));
    
    expect(result1.current[0]).toBe('value1');
    expect(result2.current[0]).toBe('value2');
    
    act(() => {
      result1.current[1]('updated1');
    });
    
    expect(result1.current[0]).toBe('updated1');
    expect(result2.current[0]).toBe('value2');
  });

  it('handles corrupted JSON in localStorage gracefully', () => {
    localStorage.setItem('corruptKey', 'not valid json{{{');
    
    const { result } = renderHook(() => useLocalStorage('corruptKey', 'fallback'));
    
    expect(result.current[0]).toBe('fallback');
  });
});











