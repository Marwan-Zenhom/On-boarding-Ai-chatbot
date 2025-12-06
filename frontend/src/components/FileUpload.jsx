import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

const FileUpload = ({ onFileSelect, acceptedTypes = ".pdf,.docx,.txt,.csv,.json,.png,.jpg,.jpeg" }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    onFileSelect(files);
  };

  return (
    <div
      className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <Upload className="icon" />
      <div className="upload-text">
        <span className="upload-primary">Drop files here or click to upload</span>
        <span className="upload-secondary">Supports PDF, DOCX, TXT, CSV, JSON, Images</span>
      </div>
    </div>
  );
};

export default FileUpload;

