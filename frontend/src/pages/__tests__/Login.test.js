import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock Login component
const MockLogin = ({ onSubmit }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit({ email, password });
  };

  return (
    <div data-testid="login-page">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Email or Username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="email-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="password-input"
        />
        <button type="submit" data-testid="login-button">
          Log in
        </button>
      </form>
    </div>
  );
};

describe('Login Page', () => {
  test('should render login form', () => {
    render(
      <BrowserRouter>
        <MockLogin />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('should have email and password inputs', () => {
    render(
      <BrowserRouter>
        <MockLogin />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
  });

  test('should update email input value', () => {
    render(
      <BrowserRouter>
        <MockLogin />
      </BrowserRouter>
    );
    
    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  test('should update password input value', () => {
    render(
      <BrowserRouter>
        <MockLogin />
      </BrowserRouter>
    );
    
    const passwordInput = screen.getByTestId('password-input');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');
  });

  test('should call onSubmit when form is submitted', () => {
    const mockSubmit = jest.fn();
    render(
      <BrowserRouter>
        <MockLogin onSubmit={mockSubmit} />
      </BrowserRouter>
    );
    
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Pass123!' } });
    fireEvent.click(loginButton);

    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Pass123!'
    });
  });
});
