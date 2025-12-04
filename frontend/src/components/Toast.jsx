import React from 'react';
import { X } from 'lucide-react';

const Toast = ({ message, type, onClose }) => (
  <div className={`toast toast-${type}`}>
    <span>{message}</span>
    <button onClick={onClose} className="toast-close">
      <X className="icon-sm" />
    </button>
  </div>
);

export default Toast;

