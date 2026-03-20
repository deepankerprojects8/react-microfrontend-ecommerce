import { render, screen, fireEvent } from '@testing-library/react';
import { AdminDashboard } from './AdminDashboard';
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
    name: 'Smart Watch',
    description: 'Feature-rich smart watch with health tracking',
    price: 299.99,
    category: 'Electronics',
    image: 'https://example.com/watch.jpg',
    stock: 8,
    rating: 4.7,
    reviews: 95,
  },
];

const defaultState = {
  products: mockProducts,
  loading: false,
  error: null,
  fetchProducts: jest.fn(),
  getProductById: jest.fn(),
  searchProducts: jest.fn(),
  filterByCategory: jest.fn(),
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    mockUseProducts.mockReturnValue(defaultState);
  });

  it('renders the Admin Dashboard heading', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('renders the Sign Out button', () => {
    render(<AdminDashboard />);
    expect(
      screen.getByRole('button', { name: /sign out/i }),
    ).toBeInTheDocument();
  });

  it('shows total products count from the products list', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Total Products')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows hardcoded revenue and order stats', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$12,450')).toBeInTheDocument();
    expect(screen.getAllByText('Orders').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('328')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('1,245')).toBeInTheDocument();
  });

  it('renders all four tab navigation buttons', () => {
    render(<AdminDashboard />);
    expect(
      screen.getByRole('button', { name: /overview/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /products/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /orders/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /settings/i }),
    ).toBeInTheDocument();
  });

  it('shows overview tab content by default', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  });

  it('switches to products tab and shows Manage Products heading', () => {
    render(<AdminDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /^products$/i }));
    expect(screen.getByText('Manage Products')).toBeInTheDocument();
  });

  it('shows product rows in the products tab table', () => {
    render(<AdminDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /^products$/i }));
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Smart Watch')).toBeInTheDocument();
  });

  it('shows loading message in products tab when loading', () => {
    mockUseProducts.mockReturnValue({
      ...defaultState,
      loading: true,
      products: [],
    });
    render(<AdminDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /^products$/i }));
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('shows Add Product button in products tab', () => {
    render(<AdminDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /^products$/i }));
    expect(
      screen.getByRole('button', { name: /add product/i }),
    ).toBeInTheDocument();
  });

  it('switches to orders tab and shows Order Management heading', () => {
    render(<AdminDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /^orders$/i }));
    expect(screen.getByText('Order Management')).toBeInTheDocument();
  });

  it('switches to settings tab and shows Store Settings heading', () => {
    render(<AdminDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /^settings$/i }));
    expect(screen.getByText('Store Settings')).toBeInTheDocument();
  });

  it('shows Store Name input pre-filled in settings tab', () => {
    render(<AdminDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /^settings$/i }));
    const storeNameInput = screen.getByDisplayValue('EcommerceMart');
    expect(storeNameInput).toBeInTheDocument();
  });

  it('shows Save Settings button in settings tab', () => {
    render(<AdminDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /^settings$/i }));
    expect(
      screen.getByRole('button', { name: /save settings/i }),
    ).toBeInTheDocument();
  });
});
