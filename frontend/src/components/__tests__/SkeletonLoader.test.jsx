import React from 'react';
import { render } from '@testing-library/react';
import SkeletonLoader from '../SkeletonLoader';

describe('SkeletonLoader Component', () => {
  it('renders skeleton container', () => {
    const { container } = render(<SkeletonLoader />);
    
    expect(container.querySelector('.skeleton-container')).toBeInTheDocument();
  });

  it('renders skeleton avatar', () => {
    const { container } = render(<SkeletonLoader />);
    
    expect(container.querySelector('.skeleton-avatar')).toBeInTheDocument();
  });

  it('renders skeleton content section', () => {
    const { container } = render(<SkeletonLoader />);
    
    expect(container.querySelector('.skeleton-content')).toBeInTheDocument();
  });

  it('renders multiple skeleton lines', () => {
    const { container } = render(<SkeletonLoader />);
    
    const skeletonLines = container.querySelectorAll('.skeleton-line');
    expect(skeletonLines.length).toBe(3);
  });

  it('renders lines with different lengths', () => {
    const { container } = render(<SkeletonLoader />);
    
    expect(container.querySelector('.skeleton-line.long')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-line.medium')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-line.short')).toBeInTheDocument();
  });

  it('has correct structure', () => {
    const { container } = render(<SkeletonLoader />);
    
    const containerDiv = container.firstChild;
    expect(containerDiv).toHaveClass('skeleton-container');
    expect(containerDiv.children.length).toBe(2); // avatar + content
  });
});
