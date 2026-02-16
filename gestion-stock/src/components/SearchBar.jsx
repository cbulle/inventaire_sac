import React, { useState } from 'react';
import { getTheme } from '../theme';

export default function SearchBar({ onSearch, isDarkMode, placeholder = "🔍 Rechercher un produit..." }) {
  const [searchTerm, setSearchTerm] = useState('');
  const colors = getTheme(isDarkMode);

  const handleChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div style={{
      position: 'relative',
      marginBottom: '15px',
      width: '100%'
    }}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: '12px 40px 12px 15px',
          borderRadius: '8px',
          border: `2px solid ${colors.border}`,
          fontSize: '14px',
          backgroundColor: colors.bg.primary,
          color: colors.text.primary,
          transition: 'all 0.2s ease',
          boxSizing: 'border-box'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = colors.brand.primary;
          e.target.style.boxShadow = `0 0 0 3px ${colors.brand.light}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = colors.border;
          e.target.style.boxShadow = 'none';
        }}
      />
      
      {searchTerm && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            color: colors.text.secondary,
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Effacer la recherche"
        >
          ✕
        </button>
      )}
    </div>
  );
}
