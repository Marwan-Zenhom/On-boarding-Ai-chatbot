/**
 * Action Approval Modal
 * Shows pending AI agent actions that require user approval
 * Dark theme version matching app design
 */

import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Mail, Calendar, Search } from 'lucide-react';
import './ActionApprovalModal.css';

const ActionApprovalModal = ({ actions, onApprove, onReject, isOpen, onClose }) => {
  const [approving, setApproving] = useState(false);

  if (!isOpen || !actions || actions.length === 0) return null;

  const getActionIcon = (actionType) => {
    const icons = {
      send_email: <Mail size={24} />,
      book_calendar_event: <Calendar size={24} />,
      check_calendar: <Search size={24} />,
    };
    return icons[actionType] || '🔧';
  };

  const getActionDescription = (action) => {
    switch (action.tool) {
      case 'send_email':
        return {
          title: 'Send Email',
          description: `To: ${action.parameters.to}`,
          details: [
            `Subject: ${action.parameters.subject}`,
            action.parameters.cc?.length > 0 && `CC: ${action.parameters.cc.join(', ')}`,
          ].filter(Boolean)
        };
      
      case 'book_calendar_event':
        const startDateTime = new Date(action.parameters.start_date);
        const endDateTime = new Date(action.parameters.end_date);
        const startDateStr = startDateTime.toLocaleDateString();
        const startTimeStr = startDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = endDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Calculate duration
        const durationMs = endDateTime - startDateTime;
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        const durationHours = Math.floor(durationMinutes / 60);
        const durationMins = durationMinutes % 60;
        const durationStr = durationHours > 0 
          ? `${durationHours}h ${durationMins > 0 ? `${durationMins}m` : ''}`.trim()
          : `${durationMins}m`;
        
        return {
          title: 'Book Calendar Event',
          description: action.parameters.title,
          details: [
            `Date: ${startDateStr}`,
            `Time: ${startTimeStr} - ${endTimeStr}`,
            `Duration: ${durationStr}`,
            action.parameters.attendees?.length > 0 && `Attendees: ${action.parameters.attendees.join(', ')}`,
            action.parameters.description && `Description: ${action.parameters.description}`
          ].filter(Boolean)
        };
      
      case 'check_calendar':
        return {
          title: 'Check Calendar',
          description: `From ${action.parameters.start_date} to ${action.parameters.end_date}`,
          details: []
        };
      
      default:
        return {
          title: action.tool.replace(/_/g, ' ').toUpperCase(),
          description: action.description || 'Perform action',
          details: []
        };
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onApprove(actions.map(a => a.actionId));
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="approval-modal-overlay" onClick={onClose}>
      <div 
        className="approval-modal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="approval-modal-header">
          <div className="approval-header-content">
            <div className="warning-icon">
              <AlertTriangle size={24} />
            </div>
            <h2>Approval Required</h2>
          </div>
          <button className="approval-close-btn" onClick={onClose}>
            <XCircle size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="approval-modal-body">
          <p className="approval-description">
            The AI assistant needs your permission to perform the following actions:
          </p>

          {/* Actions List */}
          <div className="approval-actions-list">
            {actions.map((action, index) => {
              const actionInfo = getActionDescription(action);
              return (
                <div key={index} className="approval-action-card">
                  <div className="approval-action-content">
                    <div className="approval-action-icon">
                      {getActionIcon(action.tool)}
                    </div>
                    
                    <div className="approval-action-details">
                      <h4 className="approval-action-title">
                        {actionInfo.title}
                      </h4>
                      <p className="approval-action-description">
                        {actionInfo.description}
                      </p>
                      
                      {actionInfo.details.length > 0 && (
                        <div className="approval-action-meta">
                          {actionInfo.details.map((detail, idx) => (
                            <div key={idx}>{detail}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warning Note */}
          <div className="approval-warning-note">
            <strong>⚠️ Note:</strong> These actions will be performed on your behalf using your Google account.
            You can review the action history in your settings.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="approval-modal-footer">
          <button 
            className="approval-btn approval-btn-cancel" 
            onClick={onReject}
            disabled={approving}
          >
            <XCircle size={18} />
            Cancel
          </button>
          
          <button 
            className="approval-btn approval-btn-approve" 
            onClick={handleApprove}
            disabled={approving}
          >
            {approving ? (
              <>
                <div className="approval-spinner"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Approve & Execute
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionApprovalModal;
