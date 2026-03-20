import React from 'react';
import type { CartItem, Product } from '../types';

interface CartSummaryProps {
  items: CartItem[];
  products: Product[];
  onCheckout: () => void;
}

export function CartSummary({ items, products, onCheckout }: CartSummaryProps) {
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Order Summary</h2>

      <div className="space-y-3 mb-4 pb-4 border-b">
        {items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return (
            <div key={item.productId} className="flex justify-between text-sm">
              <span>
                {product?.name} x {item.quantity}
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2 text-sm text-gray-600">
          <span>Shipping:</span>
          <span>${(totalPrice > 100 ? 0 : 10).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>Total:</span>
          <span>${(totalPrice + (totalPrice > 100 ? 0 : 10)).toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={items.length === 0}
        className="w-full bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
