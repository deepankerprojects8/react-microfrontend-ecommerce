import React, { useState } from 'react';
import { useCart, useProducts, ProductCard, CartSummary } from '@react-microfrontend-workspace/shared';
import { Header } from './components/Header';
import { ProductGrid } from './components/ProductGrid';
import { CartPage } from './pages/CartPage';

export function CustomerApp() {
  const [currentPage, setCurrentPage] = useState<'shop' | 'cart'>('shop');
  const { items } = useCart();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        cartItemsCount={items.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setCurrentPage(currentPage === 'cart' ? 'shop' : 'cart')}
        currentPage={currentPage}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentPage === 'shop' ? <ProductGrid /> : <CartPage />}
      </main>

      <footer className="bg-gray-900 text-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">About Us</h3>
              <p className="text-gray-400 text-sm">
                Premium ecommerce platform for quality products
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>
                  <a href="#" className="hover:text-white">
                    Products
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Shipping Info
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Returns
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 Ecommerce Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
