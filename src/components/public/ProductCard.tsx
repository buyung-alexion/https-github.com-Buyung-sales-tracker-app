import { Star } from 'lucide-react';
import type { Product } from '../../types';

interface Props {
  product: Product;
  onClick: (product: Product) => void;
}

export default function ProductCard({ product, onClick }: Props) {
  // Simulating Shopee-style data
  const rating = 4.9;
  const soldCount = "203";

  return (
    <div 
      onClick={() => onClick(product)}
      style={{ 
        background: '#fff', 
        borderRadius: '8px', 
        overflow: 'hidden', 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}
      className="tap-active"
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
        {/* Mall Tag */}
        <div style={{ 
          position: 'absolute', 
          top: 0, left: 0,
          background: '#ee4d2d',
          color: '#fff',
          padding: '2px 4px',
          fontSize: '10px',
          fontWeight: 900,
          borderBottomRightRadius: '4px'
        }}>
          MALL
        </div>
      </div>

      {/* Product Details */}
      <div style={{ padding: '8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Title - 2 Lines max */}
        <h3 style={{ 
          fontSize: '12px', 
          fontWeight: 500, 
          color: '#111827', 
          margin: 0, 
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '31px'
        }}>
          {product.name}
        </h3>

        {/* Price Section */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
             <span style={{ fontSize: '10px', fontWeight: 700, color: '#ee4d2d' }}>Rp</span>
             <span style={{ fontSize: '16px', fontWeight: 800, color: '#ee4d2d' }}>
               {product.price.toLocaleString('id-ID')}
             </span>
          </div>
          
          {/* Discount simulation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <div style={{ fontSize: '9px', padding: '1px 3px', background: '#feeeea', color: '#ee4d2d', fontWeight: 800, borderRadius: '2px' }}>-10%</div>
          </div>
        </div>

        {/* Rating & Sold */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
            <Star size={10} fill="#ffce3d" color="#ffce3d" />
            <span style={{ fontSize: '11px', color: '#757575', fontWeight: 500 }}>{rating}</span>
          </div>
          <div style={{ width: '1px', height: '10px', background: '#e8e8e8' }} />
          <span style={{ fontSize: '11px', color: '#757575', fontWeight: 500 }}>{soldCount} terjual</span>
        </div>
      </div>
    </div>
  );
}
