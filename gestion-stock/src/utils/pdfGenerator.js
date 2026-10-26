import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { STATUS, getStatus } from '../status';
import { getEmplacements } from '../emplacements';

const STATUS_RGB = {
  perime: [220, 38, 38],
  manquant: [234, 88, 12],
  bientot: [161, 98, 7],
  commande: [37, 99, 235],
  ok: [22, 163, 74],
};

// Un tableau par sac et par emplacement, dans l'ordre de la configuration
export const generatePDF = (data, config) => {
  try {
    if (!data || data.length === 0) {
      alert("Le stock est vide !");
      return;
    }

    const doc = new jsPDF('landscape');
    const today = new Date().toLocaleDateString('fr-FR');

    doc.setFontSize(18);
    doc.text("INVENTAIRE DU SAC DE SECOURS", 14, 15);
    doc.setFontSize(10);
    doc.text(`Généré le : ${today}`, 14, 22);

    let finalY = 30;
    const order = (list, value) => (list.includes(value) ? list.indexOf(value) : list.length);
    const sacs = [...new Set(data.map(p => p.sac || 'Sans sac'))]
      .sort((a, b) => order(config.sacs, a) - order(config.sacs, b));

    sacs.forEach((sac) => {
      const inSac = data.filter(p => (p.sac || 'Sans sac') === sac);
      const cats = [...new Set(inSac.map(p => p.categorie || 'Autres'))]
        .sort((a, b) => order(getEmplacements(config, sac), a) - order(getEmplacements(config, sac), b));

      if (finalY > 170) {
        doc.addPage();
        finalY = 20;
      }
      doc.setFontSize(16);
      doc.setTextColor(185, 28, 28);
      doc.text(sac.toUpperCase(), 14, finalY);
      finalY += 8;

      cats.forEach((cat) => {
        const products = inSac
          .filter(p => (p.categorie || 'Autres') === cat)
          .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));

        if (finalY > 180) {
          doc.addPage();
          finalY = 20;
        }
        doc.setFontSize(12);
        doc.setTextColor(37, 99, 235);
        doc.text(cat, 14, finalY);
        doc.setTextColor(0, 0, 0);

        const statuses = products.map(getStatus);
        autoTable(doc, {
          startY: finalY + 3,
          head: [['Produit', 'Qté (Réel/Théo)', 'Péremption', 'Statut', 'Remarques']],
          body: products.map((p, i) => [
            p.nom || 'Sans nom',
            `${p.quantite ?? 0} / ${p.quantiteDemandee ?? 1}`,
            p.datePeremption ? p.datePeremption.split('-').reverse().join('/') : '-',
            STATUS[statuses[i]].label,
            p.Remarques || ''
          ]),
          theme: 'grid',
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 10 },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { cellWidth: 75, fontStyle: 'bold' },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 28, halign: 'center' },
            3: { cellWidth: 32, fontStyle: 'bold' },
            4: { cellWidth: 'auto' }
          },
          didParseCell: (cell) => {
            if (cell.section === 'body' && cell.column.index === 3) {
              cell.cell.styles.textColor = STATUS_RGB[statuses[cell.row.index]];
            }
          }
        });

        finalY = doc.lastAutoTable.finalY + 10;
      });

      finalY += 5;
    });

    doc.save(`Inventaire_${today.replace(/\//g, '-')}.pdf`);
  } catch (error) {
    console.error("Erreur PDF:", error);
    alert("Erreur lors de la génération du PDF.");
  }
};
