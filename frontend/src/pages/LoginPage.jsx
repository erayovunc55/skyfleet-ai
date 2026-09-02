import { useState } from "react";
import { login } from "../services/authService";

export default function LoginPage({ onLogin }) {
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login(loginValue, password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand">
          <div className="brand-icon">SF</div>
          <div>
            <h1>SKYFLEET <span>AI</span></h1>
            <p>Every Transfer, Under Control.</p>
          </div>
        </div>

        <div className="welcome">
          <span className="driver-badge">CONTROL CENTER</span>
          <h2>Welcome back</h2>
          <p>Sign in to the dispatcher and administration panel.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Phone or email</label>
          <div className="input-group">
            <input
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              placeholder="dispatcher@company.com or phone"
              autoComplete="username"
            />
          </div>

          <label>Password</label>
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-button" disabled={loading || !loginValue.trim() || !password}>
            {loading ? "Signing in..." : "SIGN IN"}
          </button>
        </form>
      </section>
    </main>
  );
}
