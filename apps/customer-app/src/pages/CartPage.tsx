import React from 'react';
import { useCart, useProducts, CartSummary } from '@react-microfrontend-workspace/shared';

export function CartPage() {
  const { items, removeFromCart, updateQuantity } = useCart();
  const { products } = useProducts();

  const handleCheckout = () => {
    alert('Proceeding to checkout! (This is a demo)');
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Add some products to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>
        <div className="space-y-4">
          {items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) return null;

            return (
              <div
                key={item.productId}
                className="bg-white rounded-lg shadow-md p-4 flex gap-4"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.productId, Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-800 font-semibold mt-2">
                    Subtotal: ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="lg:col-span-1">
        <CartSummary items={items} products={products} onCheckout={handleCheckout} />
      </div>
    </div>
  );
}
