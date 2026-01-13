import React, { useState, useEffect } from 'react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (token) fetchFiles();
  }, [token]);

  // --- AUTH ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/register' : '/login';
    const res = await fetch(`http://localhost:5000/api/auth${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      alert("Success!");
    } else {
      alert(data.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setFiles([]);
  };

  // --- FILES ---
  const fetchFiles = async () => {
    const res = await fetch('http://localhost:5000/api/files', {
      headers: { 'x-auth-token': token } // <--- SEND TOKEN
    });
    const data = await res.json();
    if (res.ok) setFiles(data);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('http://localhost:5000/api/files/upload', {
      method: 'POST',
      headers: { 'x-auth-token': token }, // <--- SEND TOKEN
      body: formData,
    });
    if (res.ok) {
      setFile(null);
      fetchFiles();
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete?")) return;
    const res = await fetch(`http://localhost:5000/api/files/${id}`, { 
      method: 'DELETE',
      headers: { 'x-auth-token': token } // <--- SEND TOKEN
    });
    if (res.ok) fetchFiles();
  };

  if (!token) {
    return (
      <div style={{ padding: "50px", textAlign: "center", fontFamily: "Arial" }}>
        <h1>🔐 Mini Drive Login</h1>
        <form onSubmit={handleAuth} style={{ maxWidth: "300px", margin: "auto" }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ display: "block", width: "100%", padding: "10px", margin: "10px 0" }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ display: "block", width: "100%", padding: "10px", margin: "10px 0" }} />
          <button type="submit" style={{ width: "100%", padding: "10px", background: "blue", color: "white", border: "none" }}>{isRegistering ? "Sign Up" : "Login"}</button>
        </form>
        <p onClick={() => setIsRegistering(!isRegistering)} style={{ cursor: "pointer", color: "blue", marginTop: "10px" }}>
          {isRegistering ? "Login instead" : "Create account"}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h1>📂 Mini Drive</h1>
        <button onClick={logout} style={{ background: "red", color: "white", border: "none", padding: "5px 10px", cursor: "pointer" }}>Logout</button>
      </div>
      
      <div style={{ border: "2px dashed #ccc", padding: "20px", marginBottom: "20px" }}>
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <button onClick={handleUpload} style={{ marginLeft: "10px" }}>Upload</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "20px" }}>
        {files.map((file) => (
          <div key={file._id} style={{ border: "1px solid #ddd", padding: "10px" }}>
            {file.type.startsWith('image/') ? (
             <img src={file.url} alt="file" style={{ width: "100%", height: "100px", objectFit: "cover" }} />): (
              <div style={{ height: "100px", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>📄</div>
            )}
            <p>{file.name}</p>
            <button onClick={() => handleDelete(file._id)} style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;