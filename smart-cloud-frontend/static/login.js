// login.js
const API = 'http://localhost:5000'; // or your backend URL

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const msgEl = document.getElementById('msg');

  msgEl.textContent = '';

  if (!email || !password) {
    msgEl.textContent = 'Please enter email and password';
    return;
  }

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    // backend should send { success: true/false, message: "...", token: "..." }
    if (!res.ok || data.success === false) {
      // show popup + inline message
      alert(data.message || 'Login failed');
      msgEl.textContent = data.message || 'Login failed';
      return;
    }

    // success
    localStorage.setItem('token', data.token || '');
    alert('Login successful!');
    // redirect to a dashboard file (create dashboard.html separately)
    window.location.href = 'dashboard.html';
  } catch (err) {
    alert('Server error: ' + err.message);
    msgEl.textContent = 'Server error';
  }
}
