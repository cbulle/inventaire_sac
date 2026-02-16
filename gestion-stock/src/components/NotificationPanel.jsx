import React, { useState, useEffect } from 'react';
import { getTheme } from '../theme';

export default function NotificationPanel({ isDarkMode, produits, userEmail, caserne }) {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const colors = getTheme(isDarkMode);

  // Analyser les produits pour créer les alertes
  useEffect(() => {
    const alerts = [];
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    produits.forEach(p => {
      // 1. ALERTE PÉREMPTION IMMINENTE
      if (p.datePeremption) {
        const [year, month] = p.datePeremption.split('-');
        const expiryDate = new Date(year, month - 1);
        
        if (expiryDate <= nextMonth && expiryDate > today) {
          alerts.push({
            id: `exp-${p.id}`,
            type: 'expiry-soon',
            severity: 'warning',
            title: '⏰ Péremption imminente',
            message: `${p.nom} expire en ${month}/${year}`,
            product: p.nom,
            icon: '⏰'
          });
        }
        
        if (expiryDate <= today) {
          alerts.push({
            id: `exp-critical-${p.id}`,
            type: 'expiry-critical',
            severity: 'danger',
            title: '🚨 PRODUIT EXPIRÉ',
            message: `${p.nom} a expiré ! Action immédiate requise`,
            product: p.nom,
            icon: '🚨'
          });
        }
      }

      // 2. ALERTE STOCK CRITIQUE
      const isLowStock = (p.quantite || 0) < (p.quantiteDemandee || 1);
      if (isLowStock && p.commandeStatus !== 'recu') {
        const missing = (p.quantiteDemandee || 1) - (p.quantite || 0);
        
        if (p.commandeStatus === 'non-commande') {
          alerts.push({
            id: `low-stock-${p.id}`,
            type: 'low-stock',
            severity: 'danger',
            title: '📉 Stock critique',
            message: `${p.nom}: ${missing} unité(s) manquante(s)`,
            product: p.nom,
            icon: '📉'
          });
        }
      }

      // 3. ALERTE COMMANDE REÇUE (pour tracking)
      if (p.commandeStatus === 'recu' && !p.dateReceptionCommande) {
        alerts.push({
          id: `received-${p.id}`,
          type: 'order-received',
          severity: 'success',
          title: '✅ Commande reçue',
          message: `${p.nom} - Stock maintenant à jour`,
          product: p.nom,
          icon: '✅'
        });
      }
    });

    setNotifications(alerts);
  }, [produits]);

  // Envoyer email de notification
  const sendEmailNotification = async (alert) => {
    try {
      // Note: Vous devez créer une Cloud Function Firebase pour envoyer les emails
      console.log(`Email envoyé à ${userEmail} pour : ${alert.title}`);
      alert(`📧 Notification envoyée à ${userEmail}`);
    } catch (error) {
      console.error("Erreur envoi email:", error);
    }
  };

  // Compter par sévérité
  const criticalCount = notifications.filter(n => n.severity === 'danger').length;
  const warningCount = notifications.filter(n => n.severity === 'warning').length;

  const panelStyle = {
    position: 'fixed',
    top: '0',
    right: showPanel ? '0' : '-400px',
    width: '90vw',
    maxWidth: '400px',
    height: '100vh',
    backgroundColor: colors.bg.primary,
    borderLeft: `3px solid ${colors.brand.primary}`,
    boxShadow: `${colors.shadow} 0 0 20px`,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    transition: 'right 0.3s ease',
    '@media (max-width: 768px)': {
      maxWidth: '100vw'
    }
  };

  return (
    <>
      {/* Bouton d'ouverture du panneau */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: criticalCount > 0 ? colors.danger : colors.brand.primary,
          color: 'white',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: `0 4px 12px ${colors.shadow}`,
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: criticalCount > 0 ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.7 }
          }
        }}
      >
        🔔
        {(criticalCount + warningCount) > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: colors.danger,
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {criticalCount + warningCount}
          </span>
        )}
      </button>

      {/* Panel Notifications */}
      <div style={panelStyle}>
        {/* Header */}
        <div style={{
          backgroundColor: colors.bg.secondary,
          padding: '15px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '60px'
        }}>
          <h3 style={{ margin: 0, color: colors.text.primary }}>
            🔔 Notifications ({notifications.length})
          </h3>
          <button
            onClick={() => setShowPanel(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.text.secondary
            }}
          >
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: colors.text.secondary
            }}>
              <p style={{ fontSize: '32px', margin: '10px 0' }}>✅</p>
              <p>Tout est à jour !</p>
              <p style={{ fontSize: '12px' }}>Aucune alerte pour le moment</p>
            </div>
          ) : (
            notifications.map(alert => (
              <div
                key={alert.id}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 
                    alert.severity === 'danger' ? 'rgba(239, 68, 68, 0.1)' :
                    alert.severity === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                    'rgba(16, 185, 129, 0.1)',
                  borderLeft: `4px solid ${
                    alert.severity === 'danger' ? colors.danger :
                    alert.severity === 'warning' ? colors.warning :
                    colors.success
                  }`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    transform: 'translateX(5px)'
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: '20px',
                    marginRight: '10px'
                  }}>
                    {alert.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 'bold',
                      color: colors.text.primary,
                      fontSize: '13px'
                    }}>
                      {alert.title}
                    </div>
                    <div style={{
                      color: colors.text.secondary,
                      fontSize: '12px',
                      marginTop: '4px'
                    }}>
                      {alert.message}
                    </div>
                  </div>
                  <button
                    onClick={() => sendEmailNotification(alert)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: colors.brand.primary,
                      padding: '0',
                      marginLeft: '10px'
                    }}
                    title={`Envoyer à ${userEmail}`}
                  >
                    📧
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: `1px solid ${colors.border}`,
          padding: '15px',
          backgroundColor: colors.bg.secondary,
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => setNotifications([])}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: colors.bg.tertiary,
              color: colors.text.primary,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            Marquer comme lu
          </button>
        </div>
      </div>

      {/* Overlay */}
      {showPanel && (
        <div
          onClick={() => setShowPanel(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998
          }}
        />
      )}
    </>
  );
}
