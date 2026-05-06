import React, { useState } from 'react';
import { ShoppingCart, MessageCircle, Info } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency, generateWALink } from '../../utils/wa_utils';

interface Props {
  product: Product;
  onNegotiate: (product: Product, qty: number) => void;
}

export default function ProductCard({ product, onNegotiate }: Props) {
  const [qty, setQty] = useState(1);

  const handlePesanLangsung = () => {
    const msg = `Halo, saya ingin memesan ${product.name} sebanyak ${qty} unit. Mohon info ketersediaannya.`;
    window.open(generateWALink('6281234567890', msg), '_blank'); // Replace with real admin number or dynamic
  };

  const isBulk = qty >= product.min_bulk_qty;

  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: '20px', 
      overflow: 'hidden', 
      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'transform 0.2s ease',
      border: '1px solid rgba(0,0,0,0.03)'
    }}
    className="product-card-hover"
    >
      {/* Product Image */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#f8fafc' }}>
        <img 
          src={product.image_url || 'https://via.placeholder.com/400x400?text=No+Image'} 
          alt={product.name}
          style={{ 
            position: 'absolute', 
            top: 0, left: 0, 
            width: '100%', height: '100%', 
            objectFit: 'cover' 
          }}
        />
        <div style={{ 
          position: 'absolute', 
          top: '12px', right: '12px',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(4px)',
          padding: '4px 10px',
          borderRadius: '10px',
          fontSize: '11px',
          fontWeight: 800,
          color: '#111827'
        }}>
          {product.category}
        </div>
      </div>

      {/* Product Details */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: '0 0 4px 0', lineHeight: 1.3 }}>
          {product.name}
        </h3>
        <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--brand-yellow)', marginBottom: '12px' }}>
          {formatCurrency(product.price)}
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}> / unit</span>
        </div>

        {/* Qty Input */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Jumlah Pesanan</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#111827' }}>{qty} unit</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={qty} 
            onChange={(e) => setQty(parseInt(e.target.value))}
            style={{ 
              width: '100%',
              accentColor: 'var(--brand-yellow)',
              cursor: 'pointer'
            }}
          />
          {product.min_bulk_qty > 0 && (
            <div style={{ 
              marginTop: '6px', 
              fontSize: '10px', 
              color: isBulk ? '#059669' : '#64748b',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Info size={12} />
              Min. {product.min_bulk_qty} unit untuk fitur Nego Harga
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ marginTop: 'auto' }}>
          {isBulk ? (
            <button 
              onClick={() => onNegotiate(product, qty)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '12px', 
                background: '#111827', 
                color: '#FFCC00', 
                border: 'none', 
                fontWeight: 900,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
            >
              <MessageCircle size={18} /> Ajukan Harga Nego
            </button>
          ) : (
            <button 
              onClick={handlePesanLangsung}
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '12px', 
                background: 'var(--brand-yellow)', 
                color: '#111827', 
                border: 'none', 
                fontWeight: 900,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255, 204, 0, 0.2)'
              }}
            >
              <ShoppingCart size={18} /> Pesan Langsung (WA)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
