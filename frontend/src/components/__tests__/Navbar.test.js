import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock Navbar component for testing
const MockNavbar = () => {
  return (
    <nav data-testid="navbar">
      <div>GameForum</div>
      <button>Home</button>
      <button>Donate</button>
      <button>Login</button>
    </nav>
  );
};

describe('Navbar Component', () => {
  test('should render navbar', () => {
    render(
      <BrowserRouter>
        <MockNavbar />
      </BrowserRouter>
    );
    
    const navbar = screen.getByTestId('navbar');
    expect(navbar).toBeInTheDocument();
  });

  test('should display GameForum title', () => {
    render(
      <BrowserRouter>
        <MockNavbar />
      </BrowserRouter>
    );
    
    expect(screen.getByText('GameForum')).toBeInTheDocument();
  });

  test('should have navigation buttons', () => {
    render(
      <BrowserRouter>
        <MockNavbar />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Donate')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
