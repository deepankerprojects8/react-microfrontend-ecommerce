import React from 'react';
import { ProductProvider } from '@react-microfrontend-workspace/shared';
import { AdminDashboard } from './AdminDashboard';
import './styles/globals.css';

export function Root() {
  return (
    <ProductProvider>
      <AdminDashboard />
    </ProductProvider>
  );
}

export default Root;
