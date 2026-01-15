
import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URI || "http://localhost:5000";

const AdminPanel = () => {
  const [files, setFiles] = useState([]);
  const token = localStorage.getItem('token');

  // Fetch All Files on Load
  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/files/admin/all`, {
        headers: { 'x-auth-token': token }
      });
      const result = await res.json();
      if (res.ok) setFiles(result);
    } catch (err) { console.error("Error loading files", err); }
  };

  // Delete File
  const handleDeleteFile = async (id) => {
    if (!window.confirm("Permanently delete this screenshot?")) return;
    try {
      await fetch(`${API_BASE}/api/files/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      fetchFiles(); // Refresh list immediately
    } catch (err) { alert("Delete failed"); }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ color: '#845ec2', marginBottom: '30px' }}>🫐Archives</h2>

      <div style={{ display: 'grid', gap: '15px' }}>
        {files.length === 0 ? (
          <p style={{ fontSize: '1.2rem', color: '#888', marginTop: '30px' }}>
            Squeaky Clean!🌚
          </p>
        ) : (
          files.map((file) => (
            <div key={file._id} style={{ 
              background: 'white', padding: '15px', borderRadius: '12px', 
              display: 'flex', alignItems: 'center', gap: '15px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'left'
            }}>
              
              {/* 1. VISIBLE THUMBNAIL (The Fix) */}
              <div style={{ 
                width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', 
                backgroundColor: '#f3e5f5', flexShrink: 0, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #e0e0e0'
              }}>
                {file.type && file.type.startsWith('image/') ? (
                   <a href={file.url} target="_blank" rel="noopener noreferrer" title="Click to view full size">
                    <img 
                      src={file.url} 
                      alt="preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} 
                    />
                   </a>
                ) : (
                  <span style={{ fontSize: '2rem' }}>📄</span>
                )}
              </div>

              {/* 2. FILE DETAILS */}
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#4b4b4b', display: 'block', fontSize: '1rem' }}>
                  {file.name}
                </strong>
                <small style={{ color: '#888' }}>
                  Uploaded by: <span style={{ color: '#845ec2', fontWeight: 'bold' }}>{file.user?.email || "Unknown User"}</span>
                </small>
              </div>

              {/* 3. DELETE BUTTON */}
              <button 
                onClick={() => handleDeleteFile(file._id)}
                style={{ 
                  background: '#e9aff0', color: 'white', border: 'none', 
                  padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: 'bold', transition: '0.2s'
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPanel;