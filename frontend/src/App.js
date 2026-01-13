import React, { useState, useEffect } from "react";

// 1. Define the API Base URL once here
// Note: In React, env variables MUST start with REACT_APP_
const API_BASE = process.env.REACT_APP_BACKEND_URI;

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (token) fetchFiles();
    // eslint-disable-next-line
  }, [token]);

  // --- AUTH ENTICATION ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? "/register" : "/login";

    try {
      // 2. Use Template Literal `${}` to insert the variable
      const res = await fetch(`${API_BASE}/api/auth${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        alert("Success!");
      } else {
        alert(data.message || "Authentication failed");
      }
    } catch (err) {
      console.error("Auth Error:", err);
      alert("Failed to connect to server");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setFiles([]);
    setEmail("");
    setPassword("");
  };

  // --- FILE OPERATIONS ---
  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/files`, {
        headers: { "x-auth-token": token },
      });
      const data = await res.json();
      if (res.ok) setFiles(data);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/files/upload`, {
        method: "POST",
        headers: { "x-auth-token": token },
        body: formData,
      });

      if (res.ok) {
        setFile(null);
        alert("File uploaded successfully!");
        fetchFiles();
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Error uploading file");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/files/${id}`, {
        method: "DELETE",
        headers: { "x-auth-token": token },
      });

      if (res.ok) {
        fetchFiles();
      } else {
        alert("Failed to delete");
      }
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!token) {
    return (
      <div style={styles.container}>
        <h1>🔐 Mini Drive Login</h1>
        <form onSubmit={handleAuth} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            {isRegistering ? "Sign Up" : "Login"}
          </button>
        </form>
        <p onClick={() => setIsRegistering(!isRegistering)} style={styles.link}>
          {isRegistering ? "Login instead" : "Create account"}
        </p>
      </div>
    );
  }

  // --- RENDER: MAIN DASHBOARD ---
  return (
    <div style={styles.dashboard}>
      <div style={styles.header}>
        <h1>📂 Mini Drive</h1>
        <button onClick={logout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <div style={styles.uploadBox}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button
          onClick={handleUpload}
          disabled={!file}
          style={styles.uploadBtn}
        >
          Upload
        </button>
      </div>

      <div style={styles.grid}>
        {files.map((file) => (
          <div key={file._id} style={styles.card}>
            {file.type.startsWith("image/") ? (
              <img src={file.url} alt="file" style={styles.image} />
            ) : (
              <div style={styles.fileIcon}>📄</div>
            )}
            <p style={styles.fileName}>{file.name}</p>
            <button
              onClick={() => handleDelete(file._id)}
              style={styles.deleteBtn}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple styles object to keep the JSX clean
const styles = {
  container: { padding: "50px", textAlign: "center", fontFamily: "Arial" },
  form: { maxWidth: "300px", margin: "auto" },
  input: {
    display: "block",
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "blue",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  link: { cursor: "pointer", color: "blue", marginTop: "10px" },
  dashboard: { padding: "40px", fontFamily: "Arial", textAlign: "center" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    alignItems: "center",
  },
  logoutBtn: {
    background: "red",
    color: "white",
    border: "none",
    padding: "8px 15px",
    cursor: "pointer",
    borderRadius: "5px",
  },
  uploadBox: {
    border: "2px dashed #ccc",
    padding: "20px",
    marginBottom: "30px",
    borderRadius: "10px",
  },
  uploadBtn: { marginLeft: "10px", padding: "5px 15px", cursor: "pointer" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "20px",
  },
  card: {
    border: "1px solid #ddd",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  image: {
    width: "100%",
    height: "100px",
    objectFit: "cover",
    borderRadius: "4px",
  },
  fileIcon: {
    height: "100px",
    background: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "40px",
    borderRadius: "4px",
  },
  fileName: {
    fontSize: "14px",
    margin: "10px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  deleteBtn: {
    color: "red",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "12px",
  },
};

export default App;
