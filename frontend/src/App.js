import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1 className="main-title">Email Verification Signup</h1>
          <Routes>
            <Route path="/" element={<Signup />} />
            <Route path="/verify/:token" element={<Verify />} />
            <Route path="/resend" element={<Resend />} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', form);
      setMessage(res.data.message);
      navigate('/resend'); // Redirect to resend page after signup
    } catch (err) {
      setMessage(err.response.data.message);
    }
  };

  return (
    <div className="card">
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="input-group">
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="input-group">
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <button type="submit">Sign Up</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

function Verify() {
  const [message, setMessage] = useState('Verifying...');
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = window.location.pathname.split('/verify/')[1];
    if (token) {
      axios.get(`http://localhost:5000/api/auth/verify/${token}`)
        .then(res => setMessage(res.data.message))
        .catch(err => {
          setMessage(err.response.data.message);
          if (err.response.data.message.includes('expired') || err.response.data.message.includes('Invalid')) {
            navigate('/resend');
          }
        });
    }
  }, [navigate]);

  return (
    <div className="card">
      <h1>Verification</h1>
      <p>{message}</p>
    </div>
  );
}

function Resend() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/resend', { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response.data.message);
    }
  };

  return (
    <div className="card">
      <h1>Resend Verification</h1>
      <p>Please check your email and click the verification link. If you didn't receive it, resend below.</p>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button type="submit">Resend Verification</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default App;