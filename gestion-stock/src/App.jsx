import React from 'react';
import ProductForm from './components/ProductForm'; 
import StockTable from './components/StockTable';   
import { generatePDF } from './utils/pdfGenerator';
import { db } from './db'; 
import { useLiveQuery } from 'dexie-react-hooks';

function App() {
  const allProduits = useLiveQuery(() => db.produits.toArray());

  return (
    <div style={{ padding: '20px' }}>
      <h1>Gestion de Stock</h1>
      <button onClick={() => generatePDF(allProduits)}>Exporter PDF</button>
      <ProductForm />
      <StockTable />
    </div>
  );
}

export default App;