import React from 'react';

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  currentPage: 'shop' | 'cart';
}

export function Header({ cartItemsCount, onCartClick, currentPage }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">🛒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">EcommerceMart</h1>
        </div>

        <nav className="flex items-center gap-6">
          <a
            href="#"
            className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
          >
            New Arrivals
          </a>
          <a
            href="#"
            className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
          >
            Categories
          </a>
          <a
            href="#"
            className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
          >
            Deals
          </a>

          <button
            onClick={onCartClick}
            className={`relative px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === 'cart'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            🛍️ Cart
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
