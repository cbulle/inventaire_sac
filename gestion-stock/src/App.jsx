import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db, DEFAULT_CATEGORIES, DEFAULT_SACS } from './firebase';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ALL_SACS } from './status';
import { notifEnabled, enableNotifications, disableNotifications, notifPermission, syncNotifications } from './notifications';

import LoginScreen from './components/LoginScreen';
import StockList from './components/StockList';
import ProductSheet from './components/ProductSheet';
import ThemeSheet from './components/ThemeSheet';
import Sheet from './components/Sheet';
import CategorySacManager from './components/CategorySacManager';

function App() {
  const [user, setUser] = useState(null);
  const [caserne, setCaserne] = useState(null);
  const [loading, setLoading] = useState(true);
  const [produits, setProduits] = useState([]);
  const [config, setConfig] = useState({ sacs: DEFAULT_SACS, categories: DEFAULT_CATEGORIES, emplacements: {} });

  const [currentSac, setCurrentSac] = useLocalStorage('currentSac', ALL_SACS);
  const [currentPlace, setCurrentPlace] = useState(null); // emplacement filtré (null = tous)
  const [statusFilter, setStatusFilter] = useState(
    () => new URLSearchParams(window.location.search).get('statut')
  );
  const [editing, setEditing] = useState(null); // produit en cours d'édition, {} = nouveau
  const [showTheme, setShowTheme] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [theme, setTheme] = useLocalStorage('theme', 'auto');
  const [notifOn, setNotifOn] = useState(notifEnabled);

  // Thème
  useEffect(() => {
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Connexion -> caserne de l'utilisateur
  useEffect(() => onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);
    if (!currentUser) {
      setCaserne(null);
      setProduits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setCaserne(userDoc.data().caserne);
      } else {
        alert("Votre compte n'est lié à aucune caserne. Contactez l'administrateur.");
        await signOut(auth);
      }
    } catch (error) {
      console.error("Erreur profil utilisateur:", error);
      setLoading(false);
    }
  }), []);

  // Produits + configuration de la caserne (temps réel)
  useEffect(() => {
    if (!caserne) return;
    const unsubProduits = onSnapshot(
      query(collection(db, "produits"), where("caserne", "==", caserne)),
      (snapshot) => {
        setProduits(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Erreur de lecture des produits:", error);
        setLoading(false);
      }
    );
    const unsubConfig = onSnapshot(doc(db, "config", caserne), (snap) => {
      const data = snap.data() || {};
      setConfig({
        sacs: data.sacs?.length ? data.sacs : DEFAULT_SACS,
        categories: data.categories?.length ? data.categories : DEFAULT_CATEGORIES,
        emplacements: data.emplacements || {}
      });
    }, error => console.error("Erreur config:", error));
    return () => { unsubProduits(); unsubConfig(); };
  }, [caserne]);

  // Notifications de péremption
  useEffect(() => {
    if (!loading) syncNotifications(produits);
  }, [produits, loading, notifOn]);

  // Clic sur une notification alors que l'app est déjà ouverte
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('statut')) setCurrentSac(ALL_SACS); // ouverture depuis une notification
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (e) => {
      if (e.data?.type === 'show-status') {
        setCurrentSac(ALL_SACS);
        setCurrentPlace(null);
        setStatusFilter(e.data.status);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [setCurrentSac]);

  const toggleNotifications = async () => {
    if (notifOn) {
      await disableNotifications();
      setNotifOn(false);
      return;
    }
    const ok = await enableNotifications();
    setNotifOn(ok);
    if (!ok) {
      alert(notifPermission() === 'denied'
        ? "Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages du navigateur."
        : "Notifications non disponibles sur cet appareil. Sur iPhone, ajoutez d'abord l'app à l'écran d'accueil.");
    }
  };

  if (loading) {
    return (
      <div className="splash">
        <span className="material-icons">medical_services</span>
        Chargement…
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-title">
          <strong>Stock Sac</strong>
          <span>{caserne}</span>
        </div>
        <button
          className={`icon-btn ${notifOn ? 'is-on' : ''}`}
          onClick={toggleNotifications}
          aria-label={notifOn ? "Désactiver les notifications" : "Activer les notifications"}
          title={notifOn ? "Notifications activées" : "Notifications désactivées"}
        >
          <span className="material-icons">{notifOn ? 'notifications_active' : 'notifications_off'}</span>
        </button>
        <button
          className="icon-btn"
          onClick={() => import('./utils/pdfGenerator').then(m => m.generatePDF(produits, config))}
          aria-label="Exporter en PDF" title="Exporter en PDF"
        >
          <span className="material-icons">picture_as_pdf</span>
        </button>
        <button className="icon-btn" onClick={() => setShowConfig(true)} aria-label="Sacs et emplacements" title="Sacs et emplacements">
          <span className="material-icons">inventory_2</span>
        </button>
        <button className="icon-btn" onClick={() => setShowTheme(true)} aria-label="Thème" title="Thème">
          <span className="material-icons">settings</span>
        </button>
      </header>

      <StockList
        produits={produits}
        config={config}
        sac={currentSac}
        setSac={setCurrentSac}
        place={currentPlace}
        setPlace={setCurrentPlace}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <button className="fab" onClick={() => setEditing({})}>
        <span className="material-icons">add</span>
        Ajouter
      </button>

      {editing && (
        <ProductSheet
          product={editing}
          caserne={caserne}
          config={config}
          defaultSac={currentSac === ALL_SACS ? config.sacs[0] : currentSac}
          defaultPlace={currentPlace}
          onClose={() => setEditing(null)}
        />
      )}

      {showConfig && (
        <Sheet title="Sacs et emplacements" onClose={() => setShowConfig(false)}>
          <CategorySacManager caserne={caserne} config={config} produits={produits} />
        </Sheet>
      )}

      {showTheme && <ThemeSheet theme={theme} setTheme={setTheme} onClose={() => setShowTheme(false)} />}
    </div>
  );
}

export default App;
