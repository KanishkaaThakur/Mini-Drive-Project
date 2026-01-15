import React, { useState, useEffect, useRef } from 'react';
import AdminPanel from './components/AdminPanel';

const API_BASE = process.env.REACT_APP_BACKEND_URI || "http://localhost:5000";

function App() {
  // --- STATE ---
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  
  // Auth State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // View State
  const [isAdminView, setIsAdminView] = useState(false);
  
  // Share State
  const [sharedFile, setSharedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [sharingFile, setSharingFile] = useState(null); 
  const [inviteEmail, setInviteEmail] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('shared');
    if (sharedId) {
      fetchPublicFile(sharedId);
    } else if (token) {
      fetchFiles();
    }
    // eslint-disable-next-line
  }, [token]);

  // --- API FUNCTIONS ---
  const fetchPublicFile = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/files/shared/${id}`);
      const data = await res.json();
      if (res.ok) setSharedFile(data);
      else setErrorMsg(data.message);
    } catch (err) { setErrorMsg("Error loading shared file."); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/register' : '/login';
    const payload = isRegistering ? { name, email, password } : { email, password }; 

    try {
      const res = await fetch(`${API_BASE}/api/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        // We now correctly read user info from 'data.user'
        localStorage.setItem('role', data.user.role); 
        localStorage.setItem('name', data.user.name); 
        localStorage.setItem('email', data.user.email);    
        setToken(data.token);
        window.location.reload(); 
      } else { alert(data.message); }
      
    } catch (err) { alert("Server error"); }
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setFiles([]);
    setIsAdminView(false);
    window.history.pushState({}, document.title, "/");
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/files`, { headers: { 'x-auth-token': token } });
      const data = await res.json();
      if (res.status === 401 || res.status === 403) { logout(); return; }
      if (res.ok) setFiles(data);
    } catch (err) { console.error(err); }
  };

  const handleUpload = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!file) { alert("Please select a file first!🌚"); return; }
    
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/api/files/upload`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: formData,
      });
      if (res.ok) {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = ""; 
        fetchFiles();
        alert("Upload Successful!🌚");
      }
    } catch (err) { alert("Server error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this memory?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/files/${id}`, { 
        method: 'DELETE',
        headers: { 'x-auth-token': token } 
      });
      if (res.ok) fetchFiles();
    } catch (err) { console.error(err); }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      const res = await fetch(`${API_BASE}/api/files/share-email/${sharingFile._id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-auth-token': token 
        },
        body: JSON.stringify({ email: inviteEmail })
      });
      const data = await res.json();
      alert(data.message); 
      if (res.ok) setInviteEmail(''); 
    } catch (err) { alert("Invite failed"); }
  };

  const toggleAccess = async (newStatus) => {
    const isCurrentlyPublic = sharingFile.isPublic;
    if ((newStatus === 'public' && isCurrentlyPublic) || (newStatus === 'private' && !isCurrentlyPublic)) return;

    try {
      const res = await fetch(`${API_BASE}/api/files/toggle-share/${sharingFile._id}`, {
        method: 'PUT',
        headers: { 'x-auth-token': token }
      });
      const data = await res.json();
      if (res.ok) {
        setSharingFile({ ...sharingFile, isPublic: data.isPublic });
        fetchFiles();
      }
    } catch (err) { alert("Error updating access"); }
  };

  const copyLink = () => {
    const link = `${window.location.origin}?shared=${sharingFile._id}`;
    navigator.clipboard.writeText(link);
    alert("Link copied! 📋");
  };

  // --- HELPER FOR NAME DISPLAY ---
  const getDisplayName = () => {
    const storedName = localStorage.getItem('name');
    if (!storedName || storedName === 'undefined' || storedName === 'null') {
      return 'User';
    }
    return storedName;
  };

  // --- VIEWS ---
  if (sharedFile) {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '50px', fontFamily: "'Quicksand', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;700&display=swap');`}</style>
        <h1 className="title">☁️ Shared Memory</h1>
        <div className="auth-card" style={{ maxWidth: '600px', margin: '0 auto', fontFamily: "'Quicksand', sans-serif" }}>
          {sharedFile.type && sharedFile.type.startsWith('image/') ? (
            <img src={sharedFile.url} alt="Shared" style={{ width: '100%', borderRadius: '10px' }} />
          ) : (
            <div className="file-placeholder" style={{fontSize: '3rem'}}>📄</div>
          )}
          <h3 style={{ marginTop: '20px' }}> Share🫐</h3>
          <a href={sharedFile.url} className="btn-primary" style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}>Download 🌚</a>
          <br/>
          <button onClick={() => { setSharedFile(null); window.history.pushState({}, document.title, "/"); }} className="btn-logout" style={{marginTop: '20px'}}>Go Home</button>
        </div>
      </div>
    );
  }

  if (errorMsg) return <div className="app-container"><h1 className="title">🌚 {errorMsg}</h1></div>;

  if (!token) {
    return (
      <div className="app-container" style={{fontFamily: "'Quicksand', sans-serif"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;700&display=swap');`}</style>
        <div className="auth-card">
          <h1 className="title" style={{fontFamily: "'Quicksand', sans-serif"}}>🫐 Cloudberry</h1>
          <p style={{marginBottom: '20px', color: '#888'}}>Your digital Archive</p>
          <form onSubmit={handleAuth}>
            {isRegistering && (
              <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={{fontFamily: "'Quicksand', sans-serif"}}/>
            )}
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required style={{fontFamily: "'Quicksand', sans-serif"}}/>
            <input type="password" placeholder="Secret password" value={password} onChange={e => setPassword(e.target.value)} required style={{fontFamily: "'Quicksand', sans-serif"}}/>
            <button type="submit" className="btn-primary" style={{width: '100%', fontFamily: "'Quicksand', sans-serif"}}>
              {isRegistering ? "Join the Club" : "Enter"}
            </button>
          </form>
          <p onClick={() => setIsRegistering(!isRegistering)} className="link-text">{isRegistering ? "Already have an Archive? Login" : "New here? Create account"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{fontFamily: "'Quicksand', sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;700&display=swap');`}</style>

      <div className="dashboard-header">
        <h1 className="title" style={{fontFamily: "'Quicksand', sans-serif"}}>{isAdminView ? "🫐 Cloudblock" : "🫐 Cloudstore"}</h1>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          {/* --- FIX: Display "User" if name is undefined --- */}
          <span style={{color: '#666', fontWeight: 'bold'}}>Hi, {getDisplayName()}!</span>
          
          {localStorage.getItem('role') === 'admin' && (
            <button onClick={() => setIsAdminView(!isAdminView)} className="btn-primary">
              {isAdminView ? "My Files" : "Admin Panel"}
            </button>
          )}
          <button onClick={logout} className="btn-logout" style={{fontFamily: "'Quicksand', sans-serif"}}>Log out</button>
        </div>
      </div>
      
      {isAdminView ? <AdminPanel /> : (
        <>
          <div className="upload-box" style={{ cursor: 'pointer', flexDirection: 'column' }} onClick={() => fileInputRef.current.click()}>
            <input type="file" ref={fileInputRef} onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
            <p style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#845ec2' }}>{file ? `🌚Selected: ${file.name}` : "🫧 Tap to choose a File"}</p>
            <button type="button" onClick={(e) => { e.stopPropagation(); handleUpload(e); }} disabled={!file} className="btn-primary" style={{fontFamily: "'Quicksand', sans-serif"}}>Upload </button>
          </div>

          <div className="file-grid">
            {files.map((f) => (
              <div key={f._id} className="file-card" style={{fontFamily: "'Quicksand', sans-serif"}}>
                {f.type && f.type.startsWith('image/') ? (
                  <img src={f.url} alt="memory" className="file-img" />
                ) : (
                  <div className="file-placeholder">📄</div>
                )}
                <p className="file-name">{f.name}</p>
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                  <button onClick={() => handleDelete(f._id)} className="btn-danger" style={{fontFamily: "'Quicksand', sans-serif"}}>Delete</button>
                  <button onClick={() => setSharingFile(f)} className="btn-primary" style={{ fontSize: '0.8rem', padding: '5px 10px', fontFamily: "'Quicksand', sans-serif" }}>Share </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* --- CLOUDBERRY THEMED SHARE MODAL --- */}
      { sharingFile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '25px', borderRadius: '20px', width: '500px',
            boxShadow: '0 10px 40px rgba(132, 94, 194, 0.2)', textAlign: 'left', 
            fontFamily: "'Quicksand', sans-serif" 
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#845ec2', fontWeight: '700', fontSize: '1.5rem' }}>
              Share🫐
            </h3>
            
            {/* 1. INPUT BOX */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <input 
                type="email" placeholder="Add people and groups" value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid #f3e5f5', 
                  fontSize: '1rem', outline: 'none', fontFamily: "'Quicksand', sans-serif",
                  color: '#4b4b4b'
                }}
              />
              <button onClick={handleInvite} className="btn-primary" style={{ borderRadius: '12px', padding: '0 25px', fontFamily: "'Quicksand', sans-serif" }}>Invite</button>
            </div>

            {/* 2. PEOPLE LIST SECTION */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#b0a8b9', marginBottom: '10px' }}>PEOPLE WITH ACCESS</p>
              
              {/* --- OWNER ROW --- */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  
                  {/* Round Avatar */}
                  <div style={{ 
                    width: '45px', height: '45px', borderRadius: '50%', 
                    backgroundColor: '#fbeaff', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', 
                    border: '2px solid #ad5cbe' 
                  }}>
                    🫐
                  </div>
                  
                  {/* Text Stack */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '700', color: '#4b4b4b', fontSize: '1rem' }}>
                      {getDisplayName()} <span style={{color: '#8a898a', fontWeight: '400'}}>(you)</span>
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#845ec2' }}>
                      {localStorage.getItem('email')}
                    </span>
                  </div>
                </div>
                
                {/* Right Side Label */}
                <span style={{ color: '#b0a8b9', fontSize: '0.85rem', fontWeight: '600' }}>Owner</span>
              </div>
            </div>

            {/* 3. GENERAL ACCESS SECTION */}
            <div style={{ marginBottom: '25px' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#b0a8b9', marginBottom: '10px' }}>GENERAL ACCESS</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fcf6ff', padding: '15px', borderRadius: '15px' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', background: 'white', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                  {sharingFile.isPublic ? "❤️" : "💔"}
                </div>
                <div style={{ flex: 1 }}>
                  <select 
                    value={sharingFile.isPublic ? "public" : "private"} 
                    onChange={(e) => toggleAccess(e.target.value)}
                    style={{ 
                      width: '100%', border: 'none', background: 'transparent', 
                      fontSize: '1rem', fontWeight: '700', color: '#4b4b4b', 
                      cursor: 'pointer', outline: 'none', padding: '0', fontFamily: "'Quicksand', sans-serif"
                    }}
                  >
                    <option value="private">Restricted Access</option>
                    <option value="public">Anyone with the link</option>
                  </select>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#888' }}>
                    {sharingFile.isPublic ? "Share this memory with the world" : "Only invited people can see this"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px' }}>
              <button 
                onClick={copyLink} 
                style={{ 
                  background: 'white', border: '2px solid #f3e5f5', borderRadius: '20px', 
                  padding: '10px 20px', color: '#845ec2', fontWeight: '700', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Quicksand', sans-serif",
                  transition: '0.2s'
                }}
              >
                🔗 Copy link
              </button>
              <button 
                onClick={() => { setSharingFile(null); setInviteEmail(''); }} 
                className="btn-primary" 
                style={{ borderRadius: '20px', padding: '10px 30px', fontFamily: "'Quicksand', sans-serif" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;