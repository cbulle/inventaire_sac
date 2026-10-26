import { signOut } from "firebase/auth";
import { auth } from '../firebase';
import Sheet from './Sheet';

const THEMES = [
  ['auto', 'Auto', 'brightness_auto'],
  ['light', 'Clair', 'light_mode'],
  ['dark', 'Sombre', 'dark_mode'],
];

export default function ThemeSheet({ theme, setTheme, onClose }) {
  return (
    <Sheet title="Thème" onClose={onClose}>
      <section className="settings-section">
        <div className="segmented">
          {THEMES.map(([value, label, icon]) => (
            <button key={value} className={theme === value ? 'is-active' : ''} onClick={() => setTheme(value)}>
              <span className="material-icons">{icon}</span> {label}
            </button>
          ))}
        </div>
        <p className="hint">« Auto » suit le réglage clair/sombre du téléphone.</p>
      </section>

      <section className="settings-section">
        <button className="btn btn-ghost btn-block" onClick={() => signOut(auth)}>
          <span className="material-icons">logout</span> Se déconnecter
        </button>
      </section>
    </Sheet>
  );
}
