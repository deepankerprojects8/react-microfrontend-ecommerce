import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useCart } from './useCart';
import { CartProvider } from '../context/CartContext';
import type { Product } from '../types';

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'A test product',
  price: 99.99,
  image: 'https://example.com/image.jpg',
  category: 'Electronics',
  stock: 10,
  rating: 4.5,
  reviews: 25,
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('useCart Hook', () => {
  it('returns initial empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.items).toEqual([]);
    expect(result.current.getTotalPrice()).toBe(0);
  });

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 2);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].productId).toBe('1');
    expect(result.current.items[0].quantity).toBe(2);
  });

  it('increases quantity when adding same product twice', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 1);
      result.current.addToCart(mockProduct, 2);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(3);
  });

  it('removes item from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 1);
      result.current.removeFromCart('1');
    });
    
    expect(result.current.items).toHaveLength(0);
  });

  it('updates item quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 1);
      result.current.updateQuantity('1', 5);
    });
    
    expect(result.current.items[0].quantity).toBe(5);
  });

  it('calculates total price correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const product2 = { ...mockProduct, id: '2', price: 50 };
    
    act(() => {
      result.current.addToCart(mockProduct, 2); // 99.99 * 2
      result.current.addToCart(product2, 1);    // 50 * 1
    });
    
    const total = result.current.getTotalPrice();
    expect(total).toBeCloseTo(249.98, 2);
  });

  it('clears cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct, 2);
      result.current.clearCart();
    });
    
    expect(result.current.items).toHaveLength(0);
    expect(result.current.getTotalPrice()).toBe(0);
  });
});
