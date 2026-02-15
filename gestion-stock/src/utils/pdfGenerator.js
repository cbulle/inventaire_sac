import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Import des catégories pour respecter l'ordre d'affichage
import { CATEGORIES } from '../firebase'; 

export const generatePDF = (data) => {
  try {
    if (!data || data.length === 0) {
      alert("Le stock est vide !");
      return;
    }

    const doc = new jsPDF('landscape');
    const today = new Date().toLocaleDateString('fr-FR');

    // En-tête global
    doc.setFontSize(18);
    doc.text("INVENTAIRE DU SAC DE SECOURS", 14, 15);
    doc.setFontSize(10);
    doc.text(`Généré le : ${today}`, 14, 22);

    let finalY = 30; // Position de départ

    // BOUCLE SUR CHAQUE CATÉGORIE
    CATEGORIES.forEach((cat) => {
      // Filtrer les produits de cette catégorie
      const productsInCat = data.filter(p => p.categorie === cat);

      // Si la catégorie contient des produits, on crée un tableau
      if (productsInCat.length > 0) {
        
        // Titre de la catégorie
        if (finalY > 180) { // Si on est trop bas dans la page, on ajoute une page
             doc.addPage();
             finalY = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(37, 99, 235); // Bleu
        doc.text(cat.toUpperCase(), 14, finalY);
        doc.setTextColor(0, 0, 0); // Reset noir

        // Préparation des lignes
        const rows = productsInCat.map(p => [
          p.nom || 'Sans nom',
          `${p.quantite ?? 0} / ${p.quantiteDemandee ?? 1}`, // Format Qté / Attendu
          p.datePeremption ? p.datePeremption.split('-').reverse().join('/') : '-',
          p.Remarques || ''
        ]);

        // Génération du tableau pour cette catégorie
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Produit', 'Qté (Réel/Théo)', 'Péremption', 'Remarques']],
          body: rows,
          theme: 'grid',
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 10 },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { cellWidth: 80, fontStyle: 'bold' }, // Nom plus large
            1: { cellWidth: 30, halign: 'center' }, // Qté
            2: { cellWidth: 30, halign: 'center' }, // Date
            3: { cellWidth: 'auto' } // Remarques prennent le reste
          }
        });

        // Mise à jour de la position pour le prochain tableau
        finalY = doc.lastAutoTable.finalY + 15;
      }
    });

    doc.save(`Inventaire_Complet_${today.replace(/\//g, '-')}.pdf`);
    
  } catch (error) {
    console.error("Erreur PDF:", error);
    alert("Erreur lors de la génération du PDF.");
  }
};