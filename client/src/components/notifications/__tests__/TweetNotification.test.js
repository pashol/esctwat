import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TweetNotification from '../TweetNotification';

describe('TweetNotification', () => {
  const mockTweet = {
    id: '123',
    text: 'Test tweet content',
    author: {
      name: 'John Doe',
      username: 'johndoe',
      profileImageUrl: 'https://example.com/avatar.jpg'
    },
    createdAt: new Date().toISOString(),
    url: 'https://twitter.com/johndoe/status/123'
  };

  test('renders tweet content', () => {
    render(<TweetNotification tweet={mockTweet} onDismiss={() => {}} index={0} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
    expect(screen.getByText('Test tweet content')).toBeInTheDocument();
  });

  test('calls onDismiss when clicked', () => {
    const onDismiss = jest.fn();
    render(<TweetNotification tweet={mockTweet} onDismiss={onDismiss} index={0} />);
    fireEvent.click(screen.getByRole('article'));
    expect(onDismiss).toHaveBeenCalledWith('123');
  });

  test('displays author avatar', () => {
    render(<TweetNotification tweet={mockTweet} onDismiss={() => {}} index={0} />);
    const img = screen.getByAltText('John Doe');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  test('shows formatted timestamp', () => {
    render(<TweetNotification tweet={mockTweet} onDismiss={() => {}} index={0} />);
    expect(screen.getByText(/\d+m ago|just now/)).toBeInTheDocument();
  });
});
