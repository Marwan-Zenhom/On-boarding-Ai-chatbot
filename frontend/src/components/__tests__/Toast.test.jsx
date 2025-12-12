import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Toast from '../Toast';

describe('Toast Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders toast with message', () => {
    render(<Toast message="Test message" type="success" onClose={mockOnClose} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('applies success class for success type', () => {
    const { container } = render(
      <Toast message="Success!" type="success" onClose={mockOnClose} />
    );
    
    expect(container.firstChild).toHaveClass('toast-success');
  });

  it('applies error class for error type', () => {
    const { container } = render(
      <Toast message="Error!" type="error" onClose={mockOnClose} />
    );
    
    expect(container.firstChild).toHaveClass('toast-error');
  });

  it('calls onClose when close button is clicked', () => {
    render(<Toast message="Test" type="success" onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders with info type', () => {
    const { container } = render(
      <Toast message="Info message" type="info" onClose={mockOnClose} />
    );
    
    expect(container.firstChild).toHaveClass('toast-info');
  });

  it('has accessible structure', () => {
    render(<Toast message="Accessible toast" type="success" onClose={mockOnClose} />);
    
    // Should have a close button
    expect(screen.getByRole('button')).toBeInTheDocument();
    // Message should be visible
    expect(screen.getByText('Accessible toast')).toBeVisible();
  });
});




