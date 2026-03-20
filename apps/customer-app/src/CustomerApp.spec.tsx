import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerApp } from './CustomerApp';
import { useCart, useProducts } from '@react-microfrontend-workspace/shared';

jest.mock('@react-microfrontend-workspace/shared', () => {
  const React = require('react');
  return {
    useCart: jest.fn(),
    useProducts: jest.fn(),
    ProductCard: ({ product }: { product: { name: string } }) =>
      React.createElement(
        'div',
        { 'data-testid': 'product-card' },
        product.name,
      ),
    CartSummary: ({ onCheckout }: { onCheckout: () => void }) =>
      React.createElement(
        'div',
        { 'data-testid': 'cart-summary' },
        React.createElement('button', { onClick: onCheckout }, 'Proceed to Checkout'),
      ),
  };
});

const mockUseCart = useCart as jest.Mock;
const mockUseProducts = useProducts as jest.Mock;

const mockProducts = [
  {
    id: '1',
    name: 'Wireless Headphones',
    description: 'Premium quality wireless headphones',
    price: 199.99,
    category: 'Electronics',
    image: 'https://example.com/headphones.jpg',
    stock: 15,
    rating: 4.5,
    reviews: 128,
  },
];

const emptyCartState = {
  items: [],
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateQuantity: jest.fn(),
  clearCart: jest.fn(),
  getTotalPrice: jest.fn().mockReturnValue(0),
  getTotalItems: jest.fn().mockReturnValue(0),
};

const defaultProductsState = {
  products: mockProducts,
  loading: false,
  error: null,
  fetchProducts: jest.fn(),
  getProductById: jest
    .fn()
    .mockImplementation((id: string) => mockProducts.find((p) => p.id === id)),
  searchProducts: jest.fn().mockReturnValue(mockProducts),
  filterByCategory: jest.fn().mockReturnValue(mockProducts),
};

describe('CustomerApp', () => {
  beforeEach(() => {
    mockUseCart.mockReturnValue(emptyCartState);
    mockUseProducts.mockReturnValue(defaultProductsState);
  });

  it('renders the EcommerceMart brand name', () => {
    render(<CustomerApp />);
    expect(screen.getByText('EcommerceMart')).toBeInTheDocument();
  });

  it('shows the product search input on the shop page by default', () => {
    render(<CustomerApp />);
    expect(
      screen.getByPlaceholderText('Search products...'),
    ).toBeInTheDocument();
  });

  it('renders the cart button in the header', () => {
    render(<CustomerApp />);
    const cartButtons = screen.getAllByRole('button');
    expect(cartButtons.some(btn => btn.textContent?.includes('Cart'))).toBeTruthy();
  });

  it('renders product cards on the shop page', () => {
    render(<CustomerApp />);
    expect(screen.getByTestId('product-card')).toBeInTheDocument();
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
  });

  it('shows cart badge when items are in the cart', () => {
    mockUseCart.mockReturnValue({
      ...emptyCartState,
      items: [{ productId: '1', quantity: 3, price: 199.99 }],
    });
    render(<CustomerApp />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('navigates to the cart page when the cart button is clicked', () => {
    render(<CustomerApp />);
    const cartBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Cart'));
    if (cartBtn) fireEvent.click(cartBtn);
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('toggles back to shop page on second cart button click', () => {
    render(<CustomerApp />);
    const cartBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Cart'));
    if (cartBtn) {
      fireEvent.click(cartBtn);
      fireEvent.click(cartBtn);
    }
    expect(
      screen.getByPlaceholderText('Search products...'),
    ).toBeInTheDocument();
  });

  it('shows shopping cart heading when cart has items', () => {
    mockUseCart.mockReturnValue({
      ...emptyCartState,
      items: [{ productId: '1', quantity: 2, price: 199.99 }],
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
    });
    render(<CustomerApp />);
    const cartBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Cart'));
    if (cartBtn) fireEvent.click(cartBtn);
    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
  });

  it('shows cart summary component when cart has items', () => {
    mockUseCart.mockReturnValue({
      ...emptyCartState,
      items: [{ productId: '1', quantity: 1, price: 199.99 }],
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
    });
    render(<CustomerApp />);
    const cartBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Cart'));
    if (cartBtn) fireEvent.click(cartBtn);
    expect(screen.getByTestId('cart-summary')).toBeInTheDocument();
  });

  it('renders footer with About Us section', () => {
    render(<CustomerApp />);
    expect(screen.getByText('About Us')).toBeInTheDocument();
  });

  it('renders footer copyright text', () => {
    render(<CustomerApp />);
    expect(screen.getByText(/2026 Ecommerce Platform/)).toBeInTheDocument();
  });
});

