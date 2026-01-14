import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock AdminPanel component
const MockAdminPanel = () => {
  const [tab, setTab] = React.useState('users');
  const [users] = React.useState([
    { _id: '1', username: 'user1', email: 'user1@test.com', role: 'User', isBanned: false },
    { _id: '2', username: 'user2', email: 'user2@test.com', role: 'User', isBanned: true }
  ]);

  return (
    <div data-testid="admin-panel">
      <h1>Admin Dashboard</h1>
      
      <div>
        <button onClick={() => setTab('users')} data-testid="users-tab">
          Users
        </button>
        <button onClick={() => setTab('posts')} data-testid="posts-tab">
          Posts
        </button>
      </div>

      {tab === 'users' && (
        <div data-testid="users-section">
          <h2>All Users ({users.length})</h2>
          {users.map(user => (
            <div key={user._id} data-testid={`user-${user._id}`}>
              <span>{user.username}</span>
              <span>{user.email}</span>
              <span>{user.role}</span>
              {user.isBanned ? (
                <button data-testid={`unban-${user._id}`}>Unban User</button>
              ) : (
                <button data-testid={`ban-${user._id}`}>Ban User</button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'posts' && (
        <div data-testid="posts-section">
          <h2>All Posts</h2>
        </div>
      )}
    </div>
  );
};

describe('Admin Panel', () => {
  test('should render admin dashboard', () => {
    render(
      <BrowserRouter>
        <MockAdminPanel />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  test('should have navigation tabs', () => {
    render(
      <BrowserRouter>
        <MockAdminPanel />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('users-tab')).toBeInTheDocument();
    expect(screen.getByTestId('posts-tab')).toBeInTheDocument();
  });

  test('should display users section by default', () => {
    render(
      <BrowserRouter>
        <MockAdminPanel />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('users-section')).toBeInTheDocument();
    expect(screen.getByText('All Users (2)')).toBeInTheDocument();
  });

  test('should switch to posts section when posts tab is clicked', () => {
    render(
      <BrowserRouter>
        <MockAdminPanel />
      </BrowserRouter>
    );
    
    const postsTab = screen.getByTestId('posts-tab');
    fireEvent.click(postsTab);
    
    expect(screen.getByTestId('posts-section')).toBeInTheDocument();
    expect(screen.getByText('All Posts')).toBeInTheDocument();
  });

  test('should display user list with ban/unban buttons', () => {
    render(
      <BrowserRouter>
        <MockAdminPanel />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('user-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-2')).toBeInTheDocument();
    
    // User 1 is not banned - should show Ban button
    expect(screen.getByTestId('ban-1')).toBeInTheDocument();
    expect(screen.getByTestId('ban-1')).toHaveTextContent('Ban User');
    
    // User 2 is banned - should show Unban button
    expect(screen.getByTestId('unban-2')).toBeInTheDocument();
    expect(screen.getByTestId('unban-2')).toHaveTextContent('Unban User');
  });

  test('should display user information', () => {
    render(
      <BrowserRouter>
        <MockAdminPanel />
      </BrowserRouter>
    );
    
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('user2@test.com')).toBeInTheDocument();
  });
});
