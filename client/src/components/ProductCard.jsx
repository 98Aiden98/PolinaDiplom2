import { ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { formatCurrency } from '../utils/format.js';
import { ProductImageCarousel } from './ProductImageCarousel.jsx';

export function ProductCard({ product }) {
  const { addItem } = useCart();
  const notify = useNotification();

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const handleAdd = async () => {
    try {
      await addItem(product, 1);
      notify.success('Товар добавлен в корзину');
    } catch (error) {
      notify.error(error.response?.data?.message || 'Не удалось добавить товар');
    }
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card__image">
        <ProductImageCarousel images={product.images} alt={product.title} className="product-card__carousel" />
        <div className="product-card__badges">
          {product.isPopular && <span className="chip chip--dark">Хит</span>}
          {discount > 0 && <span className="chip chip--sale">-{discount}%</span>}
        </div>
      </Link>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span>Бренд: {product.brand?.name}</span>
          <span>Тип: {product.category?.name}</span>
        </div>

        <Link to={`/products/${product.id}`} className="product-card__title">
          {product.title}
        </Link>

        <div className="product-card__rating">
          <Star size={14} />
          <span>
            {product.reviewCount ? `${product.rating} (${product.reviewCount})` : 'Пока нет отзывов'}
          </span>
        </div>

        <div className="product-card__stock">
          {product.stock > 0 ? `В наличии: ${product.stock}` : 'Нет в наличии'}
        </div>

        <div className="product-card__footer">
          <div className="product-card__price">
            <strong>{formatCurrency(product.price)}</strong>
            {product.oldPrice ? <span>{formatCurrency(product.oldPrice)}</span> : null}
          </div>
          <button
            type="button"
            className="button button--compact button--card"
            onClick={handleAdd}
            disabled={!product.stock}
          >
            <ShoppingCart size={15} />
            <span>В корзину</span>
          </button>
        </div>
      </div>
    </article>
  );
}
