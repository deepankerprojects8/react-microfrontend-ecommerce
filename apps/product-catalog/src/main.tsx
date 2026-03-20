import React from 'react';
import { ProductProvider } from '@react-microfrontend-workspace/shared';
import { ProductCatalog } from './ProductCatalog';
import './styles/globals.css';

export function Root() {
  return (
    <ProductProvider>
      <ProductCatalog />
    </ProductProvider>
  );
}

export default Root;
