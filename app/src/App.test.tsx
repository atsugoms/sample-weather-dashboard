import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders weather dashboard navbar', () => {
  render(<App />);
  const navbarBrand = screen.getByText(/気象ダッシュボード/i);
  expect(navbarBrand).toBeInTheDocument();
});
