import React from 'react';
import { CartProvider, ProductProvider } from '@react-microfrontend-workspace/shared';
import { CustomerApp } from './CustomerApp';
import './styles/globals.css';

export function Root() {
  return (
    <ProductProvider>
      <CartProvider>
        <CustomerApp />
      </CartProvider>
    </ProductProvider>
  );
}

export default Root;
