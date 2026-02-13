import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import direct de la fonction

export const generatePDF = (data) => {
  try {
    if (!data || data.length === 0) {
      alert("Le stock est vide !");
      return;
    }

    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text("INVENTAIRE DU SAC DE SECOURS", 14, 15);
    
    const today = new Date().toLocaleDateString('fr-FR');
    doc.setFontSize(10);
    doc.text(`Généré le : ${today}`, 14, 22);

    const rows = data.map(p => [
      p.nom || 'Sans nom',
      p.categorie || '-',
      p.quantite ?? 0,
      p.datePeremption ? p.datePeremption.split('-').reverse().join('/') : '-',
      p.datedernièreCommande ? new Date(p.datedernièreCommande).toLocaleDateString('fr-FR') : '-',
      p.Remarques || '',
      p.dateModification ? new Date(p.dateModification).toLocaleDateString('fr-FR') : '-'
    ]);

    // ✅ Utilisation de la fonction importée directement au lieu de doc.autoTable
    autoTable(doc, {
      startY: 30,
      head: [['Produit', 'Emplacement', 'Qté', 'Péremption', 'Dern. Commande', 'Remarques', 'Dern. Modif']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 },
      columnStyles: {
        5: { cellWidth: 60 } // On laisse de la place pour les remarques
      }
    });

    doc.save(`Inventaire_${today.replace(/\//g, '-')}.pdf`);
    
  } catch (error) {
    console.error("Erreur PDF:", error);
    alert("Problème lors de la génération. Vérifiez la console.");
  }
};