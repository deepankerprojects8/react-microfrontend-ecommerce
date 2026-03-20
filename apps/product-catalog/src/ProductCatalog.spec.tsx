import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCatalog } from './ProductCatalog';
import { useProducts } from '@react-microfrontend-workspace/shared';

jest.mock('@react-microfrontend-workspace/shared', () => ({
  useProducts: jest.fn(),
}));

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
  {
    id: '2',
    name: 'Running Shoes',
    description: 'Comfortable running shoes',
    price: 129.99,
    category: 'Fashion',
    image: 'https://example.com/shoes.jpg',
    stock: 25,
    rating: 4.3,
    reviews: 156,
  },
];

const defaultState = {
  products: mockProducts,
  loading: false,
  error: null,
  fetchProducts: jest.fn(),
  getProductById: jest.fn(),
  searchProducts: jest.fn().mockReturnValue(mockProducts),
  filterByCategory: jest
    .fn()
    .mockImplementation((cat: string) =>
      mockProducts.filter((p) => p.category === cat),
    ),
};

describe('ProductCatalog', () => {
  beforeEach(() => {
    mockUseProducts.mockReturnValue(defaultState);
  });

  it('renders header with title and subtitle', () => {
    render(<ProductCatalog />);
    expect(screen.getByText('Product Catalog')).toBeInTheDocument();
    expect(
      screen.getByText('Browse our complete product collection'),
    ).toBeInTheDocument();
  });

  it('shows loading spinner when data is loading', () => {
    mockUseProducts.mockReturnValue({
      ...defaultState,
      loading: true,
      products: [],
    });
    render(<ProductCatalog />);
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('renders product names when loaded', () => {
    render(<ProductCatalog />);
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Running Shoes')).toBeInTheDocument();
  });

  it('renders category filter buttons derived from products', () => {
    render(<ProductCatalog />);
    expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^electronics$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^fashion$/i }),
    ).toBeInTheDocument();
  });

  it('"All" category button is active by default', () => {
    render(<ProductCatalog />);
    const allBtn = screen.getByRole('button', { name: /^all$/i });
    expect(allBtn).toHaveClass('bg-blue-600');
  });

  it('filters products when a category is selected', () => {
    const electronicsOnly = [mockProducts[0]];
    mockUseProducts.mockReturnValue({
      ...defaultState,
      filterByCategory: jest.fn().mockReturnValue(electronicsOnly),
    });
    render(<ProductCatalog />);
    fireEvent.click(screen.getByRole('button', { name: /^electronics$/i }));
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.queryByText('Running Shoes')).not.toBeInTheDocument();
  });

  it('shows error message when an error occurs', () => {
    mockUseProducts.mockReturnValue({
      ...defaultState,
      error: 'Failed to load products',
      products: [],
    });
    render(<ProductCatalog />);
    expect(screen.getByText(/Failed to load products/)).toBeInTheDocument();
  });

  it('shows "No products found" when the list is empty', () => {
    mockUseProducts.mockReturnValue({
      ...defaultState,
      products: [],
      filterByCategory: jest.fn().mockReturnValue([]),
    });
    render(<ProductCatalog />);
    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('renders product price', () => {
    render(<ProductCatalog />);
    expect(screen.getByText('$199.99')).toBeInTheDocument();
    expect(screen.getByText('$129.99')).toBeInTheDocument();
  });

  it('renders product ratings', () => {
    render(<ProductCatalog />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('4.3')).toBeInTheDocument();
  });
});
