import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/login", { email, password });

      if (!res?.data?.success) {
        setError(
          res?.data?.message || "Login failed. Try again."
        );
        setShowError(true);
        setFadeOut(false);

        setTimeout(() => {
          setFadeOut(true);

          setTimeout(() => {
            setShowError(false);
          }, 300);
        }, 2000);
        return;
      }

      localStorage.setItem("token", res.data.token);

      navigate("/home");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>VTU Student Portal</h2>
      <p className="subtitle">Course Management</p>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {showError && (
        <div className={`error-overlay ${fadeOut ? "fade-out" : "fade-in"}`}>
          <div className="error-modal">
            <p>{error}</p>
            <button
              className="error-btn"
              onClick={() => {
                setFadeOut(true);
                setTimeout(() => setShowError(false), 300);
              }}
            >
              <X />
            </button>
          </div>
        </div>
      )}

      <p className="login-note">
        Note: Use the same credentials as the VTU Online Portal.
      </p>
    </div>
  );
}