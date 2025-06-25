import React, { useState } from 'react';
import { useConversations } from '../hooks/useConversations';
import { supabase } from '../supabaseClient';

const DatabaseTest = () => {
  const [testUserId] = useState('550e8400-e29b-41d4-a716-446655440001'); // Test user ID
  const { 
    conversations, 
    loading, 
    error, 
    createConversation, 
    addMessages,
    updateConversation,
    deleteConversation 
  } = useConversations(testUserId);

  const [testTitle, setTestTitle] = useState('');
  const [testMessage, setTestMessage] = useState('');

  // Create test user if doesn't exist
  const ensureTestUser = async () => {
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', testUserId)
        .single();

      if (!existingUser) {
        // Create test user
        const { error: userError } = await supabase
          .from('users')
          .insert([{
            id: testUserId,
            name: 'Test User',
            email: 'test@example.com'
          }]);

        if (userError) {
          throw new Error(`Failed to create test user: ${userError.message}`);
        }
        console.log('✅ Test user created');
      } else {
        console.log('✅ Test user already exists');
      }
    } catch (err) {
      throw new Error(`User creation failed: ${err.message}`);
    }
  };

  const handleCreateTest = async () => {
    try {
      // First ensure the test user exists
      await ensureTestUser();
      
      const newConv = await createConversation(testTitle || 'Test Conversation');
      console.log('Created conversation:', newConv);
      
      // Add a test message
      await addMessages(newConv.id, [{
        role: 'user',
        content: testMessage || 'Hello, this is a test message!',
        timestamp: new Date().toISOString()
      }]);
      
      alert('✅ Test conversation created successfully!');
    } catch (err) {
      console.error('Test failed:', err);
      alert('❌ Test failed: ' + err.message);
    }
  };

  const handleUpdateTest = async (convId) => {
    try {
      await updateConversation(convId, { 
        title: 'Updated Test Conversation',
        is_favourite: true 
      });
      alert('✅ Conversation updated successfully!');
    } catch (err) {
      alert('❌ Update failed: ' + err.message);
    }
  };

  const handleDeleteTest = async (convId) => {
    if (window.confirm('Delete this test conversation?')) {
      try {
        await deleteConversation(convId);
        alert('✅ Conversation deleted successfully!');
      } catch (err) {
        alert('❌ Delete failed: ' + err.message);
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🧪 Supabase Database Test</h2>
      
      {/* Connection Status */}
      <div style={{ 
        padding: '10px', 
        marginBottom: '20px', 
        borderRadius: '5px',
        backgroundColor: error ? '#ffebee' : loading ? '#fff3e0' : '#e8f5e8'
      }}>
        <strong>Status: </strong>
        {error ? `❌ Error: ${error}` : loading ? '🔄 Loading...' : `✅ Connected (${conversations.length} conversations)`}
      </div>

      {/* Create Test */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Create Test Conversation</h3>
        <input
          type="text"
          placeholder="Conversation title (optional)"
          value={testTitle}
          onChange={(e) => setTestTitle(e.target.value)}
          style={{ margin: '5px', padding: '8px', width: '200px' }}
        />
        <input
          type="text"
          placeholder="Test message (optional)"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          style={{ margin: '5px', padding: '8px', width: '200px' }}
        />
        <button 
          onClick={handleCreateTest}
          style={{ 
            margin: '5px', 
            padding: '8px 15px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '3px' 
          }}
        >
          Create Test
        </button>
      </div>

      {/* Conversations List */}
      <div>
        <h3>Stored Conversations ({conversations.length})</h3>
        {conversations.length === 0 ? (
          <p style={{ color: '#666' }}>No conversations yet. Create a test conversation above.</p>
        ) : (
          conversations.map(conv => (
            <div key={conv.id} style={{ 
              margin: '10px 0', 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '5px',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{conv.title}</strong>
                  {conv.is_favourite && <span style={{ color: 'red' }}> ❤️</span>}
                  {conv.is_archived && <span style={{ color: '#666' }}> 📁</span>}
                  <br />
                  <small style={{ color: '#666' }}>
                    Created: {new Date(conv.created_at).toLocaleString()}
                  </small>
                  {conv.messages && (
                    <div style={{ marginTop: '5px' }}>
                      <em>{conv.messages.length} message(s)</em>
                      {conv.messages.slice(0, 1).map(msg => (
                        <div key={msg.id} style={{ 
                          marginTop: '5px', 
                          padding: '5px', 
                          backgroundColor: '#fff', 
                          borderRadius: '3px',
                          fontSize: '0.9em'
                        }}>
                          <strong>{msg.role}:</strong> {msg.content.substring(0, 100)}...
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <button 
                    onClick={() => handleUpdateTest(conv.id)}
                    style={{ 
                      margin: '2px', 
                      padding: '5px 10px', 
                      backgroundColor: '#2196F3', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '3px',
                      fontSize: '0.8em'
                    }}
                  >
                    Update
                  </button>
                  <button 
                    onClick={() => handleDeleteTest(conv.id)}
                    style={{ 
                      margin: '2px', 
                      padding: '5px 10px', 
                      backgroundColor: '#f44336', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '3px',
                      fontSize: '0.8em'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DatabaseTest; 