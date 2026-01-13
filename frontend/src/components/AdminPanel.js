import React, { useEffect, useState } from 'react';

const AdminPanel = () => {
  const [files, setFiles] = useState([]);
  const API_BASE = process.env.REACT_APP_BACKEND_URI || "http://localhost:5000";

  useEffect(() => {
    const fetchAllFiles = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/files/admin/all`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        const data = await res.json();
        if (Array.isArray(data)) setFiles(data);
      } catch (err) {
        console.error("Admin fetch error:", err);
      }
    };
    fetchAllFiles();
  }, [API_BASE]);

  return (
    <div className="file-grid">
      {files.map((file) => (
        <div key={file._id} className="file-card" style={{ border: '2px dashed #a6c1ee' }}>
          {file.url ? (
            <img src={file.url} alt="upload" className="file-img" />
          ) : (
            <div className="file-placeholder">📄</div>
          )}
          <p className="file-name">{file.name}</p>
          <p style={{ fontSize: '0.7rem', color: '#845ec2', marginTop: '5px' }}>
            Owner: {file.user?.email || 'Unknown'}
          </p>
        </div>
      ))}
    </div>
  );
};

export default AdminPanel;