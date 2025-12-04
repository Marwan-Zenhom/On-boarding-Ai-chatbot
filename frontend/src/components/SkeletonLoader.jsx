import React from 'react';

const SkeletonLoader = () => (
  <div className="skeleton-container">
    <div className="skeleton skeleton-avatar"></div>
    <div className="skeleton-content">
      <div className="skeleton skeleton-line long"></div>
      <div className="skeleton skeleton-line medium"></div>
      <div className="skeleton skeleton-line short"></div>
    </div>
  </div>
);

export default SkeletonLoader;

