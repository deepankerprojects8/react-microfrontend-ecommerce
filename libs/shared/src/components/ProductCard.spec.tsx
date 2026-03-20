import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';

// Mock product data
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

describe('ProductCard Component', () => {
  it('renders product information correctly', () => {
    const mockCallback = jest.fn();

    render(<ProductCard product={mockProduct} onAddToCart={mockCallback} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('A test product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('10 in stock')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    const mockCallback = jest.fn();

    render(<ProductCard product={mockProduct} onAddToCart={mockCallback} />);

    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('renders rating information', () => {
    const mockCallback = jest.fn();

    render(<ProductCard product={mockProduct} onAddToCart={mockCallback} />);

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(25)')).toBeInTheDocument();
  });

  it('calls onAddToCart with correct parameters', () => {
    const mockCallback = jest.fn();

    render(<ProductCard product={mockProduct} onAddToCart={mockCallback} />);

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);

    expect(mockCallback).toHaveBeenCalledWith(mockProduct, 1);
  });

  it('disables add to cart when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    const mockCallback = jest.fn();

    render(
      <ProductCard product={outOfStockProduct} onAddToCart={mockCallback} />,
    );

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addButton).toBeDisabled();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('updates quantity based on input', () => {
    const mockCallback = jest.fn();

    render(<ProductCard product={mockProduct} onAddToCart={mockCallback} />);

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '5' } });

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);

    expect(mockCallback).toHaveBeenCalledWith(mockProduct, 5);
  });

  it('resets quantity to 1 after add to cart', () => {
    const mockCallback = jest.fn();

    render(<ProductCard product={mockProduct} onAddToCart={mockCallback} />);

    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '5' } });

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);

    expect(input.value).toBe('1');
  });
});

