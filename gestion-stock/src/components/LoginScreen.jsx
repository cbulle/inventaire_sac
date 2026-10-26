import { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    signInWithEmailAndPassword(auth, email.trim(), password)
      .catch(() => setError("Email ou mot de passe incorrect"))
      .finally(() => setBusy(false));
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={handleLogin}>
        <img src="/sac.png" alt="" className="login-logo" />
        <h1>Stock Sac</h1>
        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Mot de passe</span>
          <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
