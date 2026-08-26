import { Star } from 'lucide-react';
import type { Product } from '../../types';

interface Props {
  product: Product;
  onClick: (product: Product) => void;
}

export default function ProductCard({ product, onClick }: Props) {
  const rating = 5.0;
  const hasDiscount = (product.discount_percent || 0) > 0;
  const originalPrice = hasDiscount ? Math.round(product.price / (1 - (product.discount_percent / 100))) : product.price;

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
          background: '#111827',
          color: '#FFCC00',
          padding: '2px 6px',
          fontSize: '10px',
          fontWeight: 950,
          borderBottomRightRadius: '4px'
        }}>
          IKT
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
             <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563EB' }}>Rp</span>
             <span style={{ fontSize: '16px', fontWeight: 800, color: '#2563EB' }}>
               {product.price.toLocaleString('id-ID')}
             </span>
          </div>
          
          {hasDiscount && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', textDecoration: 'line-through' }}>
                Rp{originalPrice.toLocaleString('id-ID')}
              </span>
              <div style={{ fontSize: '9px', padding: '1px 4px', background: '#feeeea', color: '#2563EB', fontWeight: 900, borderRadius: '2px' }}>
                -{product.discount_percent}%
              </div>
            </div>
          )}
        </div>

        {/* Rating & Sold */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
            <Star size={10} fill="#ffce3d" color="#ffce3d" />
            <span style={{ fontSize: '11px', color: '#757575', fontWeight: 500 }}>{rating}</span>
          </div>
          <div style={{ width: '1px', height: '10px', background: '#e8e8e8' }} />
          <span style={{ fontSize: '10px', color: '#757575', fontWeight: 500 }}>{(product.sold_count || 0).toLocaleString('id-ID')} terjual</span>
        </div>

        {/* Stock Status (if low) */}
        {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
          <div style={{ fontSize: '9px', color: '#F59E0B', fontWeight: 800, marginTop: '2px' }}>
            Sisa {product.stock} stok lagi!
          </div>
        )}
        {product.stock === 0 && (
          <div style={{ fontSize: '9px', color: '#EF4444', fontWeight: 800, marginTop: '2px' }}>
            Stok Habis
          </div>
        )}
      </div>
    </div>
  );
}
