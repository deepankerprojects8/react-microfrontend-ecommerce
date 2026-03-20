import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { Product } from '../types';

export interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  searchProducts: (query: string) => Product[];
  filterByCategory: (category: string) => Product[];
}

export const ProductContext = createContext<ProductContextType | undefined>(undefined);

interface ProductProviderProps {
  children: ReactNode;
}

// Mock products data
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones',
    description: 'Premium quality wireless headphones with noise cancellation',
    price: 199.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    stock: 15,
    rating: 4.5,
    reviews: 128,
  },
  {
    id: '2',
    name: 'Smart Watch',
    description: 'Feature-rich smart watch with health tracking',
    price: 299.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    stock: 8,
    rating: 4.7,
    reviews: 95,
  },
  {
    id: '3',
    name: 'Running Shoes',
    description: 'Comfortable and durable running shoes for all terrains',
    price: 129.99,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    stock: 25,
    rating: 4.3,
    reviews: 156,
  },
  {
    id: '4',
    name: 'Yoga Mat',
    description: 'Premium non-slip yoga mat for comfortable practice',
    price: 49.99,
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500',
    stock: 30,
    rating: 4.6,
    reviews: 203,
  },
  {
    id: '5',
    name: 'Camera',
    description: 'Professional DSLR camera with 24MP sensor',
    price: 899.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
    stock: 5,
    rating: 4.8,
    reviews: 87,
  },
];

export function ProductProvider({ children }: ProductProviderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProducts(MOCK_PRODUCTS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const searchProducts = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return products.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery)
      );
    },
    [products]
  );

  const filterByCategory = useCallback(
    (category: string) => products.filter((p) => p.category === category),
    [products]
  );

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        fetchProducts,
        getProductById,
        searchProducts,
        filterByCategory,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}
