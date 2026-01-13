import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URI || "http://localhost:5000";

function AdminPanel() {
  const [view, setView] = useState('files'); // 'files' or 'users'
  const [data, setData] = useState([]); // Stores the list of files or users
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  // Fetch Data whenever 'view' changes
  useEffect(() => {
    setData([]); // <--- CLEAR DATA IMMEDIATELY (Fixes the ghost bug)
    fetchData();
    // eslint-disable-next-line
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    const endpoint = view === 'files' ? '/api/files/admin/all' : '/api/auth/all-users';
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'x-auth-token': token }
      });
      const result = await res.json();
      
      if (res.ok) {
        setData(result);
      } else {
        console.error("Failed to fetch:", result);
        // If the route is missing (404), it means Backend wasn't restarted
        if (res.status === 404) alert("Error: Backend not updated. Please restart node server.js!");
      }
    } catch (err) { 
      console.error("Admin fetch error", err); 
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to banish "${name || 'this item'}" forever?`)) return;
    
    const endpoint = view === 'files' 
      ? `/api/files/${id}` 
      : `/api/auth/delete-user/${id}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      if (res.ok) {
        alert("Deleted successfully! 🗑️");
        fetchData(); // Refresh the list
      } else {
        alert("Failed to delete. Check console.");
      }
    } catch (err) { alert("Server connection failed"); }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Quicksand', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;700&display=swap');`}</style>
      
      <h2 style={{ color: '#845ec2', textAlign: 'center', fontSize: '2rem' }}>🫟Command Center</h2>

      {/* TABS */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
        <button 
          onClick={() => setView('files')}
          style={{ 
            padding: '10px 30px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white',
            background: view === 'files' ? '#845ec2' : '#d0bdf4', transition: '0.2s'
          }}
        >
          All Files
        </button>
        <button 
          onClick={() => setView('users')}
          style={{ 
            padding: '10px 30px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white',
            background: view === 'users' ? '#845ec2' : '#d0bdf4', transition: '0.2s'
          }}
        >
          All Users
        </button>
      </div>

      {loading && <p style={{textAlign: 'center', color: '#888'}}>Loading data...</p>}

      {/* --- FILES VIEW (GRID) --- */}
      {view === 'files' && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {data.map((file) => (
            <div key={file._id} style={{ background: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textAlign: 'center' }}>
              
              {/* Image Thumbnail */}
              <div style={{ width: '100%', height: '120px', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px', backgroundColor: '#f3f3f3' }}>
                {file.type && file.type.startsWith('image/') ? (
                  <img src={file.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{lineHeight: '120px', fontSize: '3rem'}}>📄</div>
                )}
              </div>

              <p style={{ fontWeight: 'bold', color: '#4b4b4b', margin: '5px 0', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
              
              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '10px' }}>
                <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#d0bdf4', color: 'white', padding: '5px 10px', borderRadius: '5px', fontSize: '0.8rem' }}>View</a>
                <button onClick={() => handleDelete(file._id, file.name)} style={{ background: '#f4b0e5', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- USERS VIEW (LIST) --- */}
      {view === 'users' && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {data.map((user) => (
            <div key={user._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {/* User Avatar */}
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: user.role === 'admin' ? '#845ec2' : '#ff9a9e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {user.name ? user.name[0].toUpperCase() : "?"}
                </div>
                
                {/* User Info */}
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#4b4b4b', fontSize: '1.1rem' }}>
                    {user.name || "Unnamed User"} 
                    {user.role === 'admin' && <span style={{fontSize: '0.8rem', marginLeft: '8px', background: '#845ec2', color: 'white', padding: '2px 8px', borderRadius: '10px'}}>ADMIN</span>}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>{user.email}</p>
                </div>
              </div>

              {/* Ban Button */}
              <button 
                onClick={() => handleDelete(user._id, user.name)} 
                style={{ background: '#ff5e57', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(255, 94, 87, 0.3)' }}
              >
                Ban User 🚫
              </button>
            </div>
          ))}
        </div>
      )}
      
      {!loading && data.length === 0 && <p style={{ textAlign: 'center', marginTop: '50px', color: '#888', fontSize: '1.2rem' }}>Squeaky Clean🌚</p>}
    </div>
  );
}

export default AdminPanel;