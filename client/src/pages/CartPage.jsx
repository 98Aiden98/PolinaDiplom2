import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { formatCurrency } from '../utils/format.js';

export function CartPage() {
  const { user } = useAuth();
  const { cart, updateItem, removeItem, clearCart } = useCart();

  if (!cart.items?.length) {
    return (
      <div className="state-card">
        <h2>Корзина пуста</h2>
        <p>Добавьте товары из каталога, чтобы перейти к оформлению заказа.</p>
        <Link to="/catalog" className="button">
          Открыть каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="page-content">
      <section className="content-section">
        <div className="section-title">
          <div>
            <h1>Корзина</h1>
            <p>Проверьте состав заказа перед оформлением.</p>
          </div>
          <button type="button" className="button button--ghost" onClick={clearCart}>
            Очистить корзину
          </button>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => (
              <article key={item.productId} className="cart-item">
                <img
                  src={
                    item.product?.images?.[0] || 'https://placehold.co/320x220?text=Appliance'
                  }
                  alt={item.product?.title || 'Product'}
                />
                <div className="cart-item__content">
                  <div>
                    <h3>{item.product?.title}</h3>
                    <p>{item.product?.brand?.name}</p>
                  </div>
                  <div className="cart-item__controls">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(item.productId, Number(event.target.value) || 1)
                      }
                    />
                    <strong>{formatCurrency(item.price * item.quantity)}</strong>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="summary-card">
            <h3>Итого</h3>
            <div className="summary-row">
              <span>Товаров</span>
              <strong>{cart.items.length}</strong>
            </div>
            <div className="summary-row">
              <span>Сумма</span>
              <strong>{formatCurrency(cart.totalPrice)}</strong>
            </div>
            <Link to={user ? '/checkout' : '/login'} className="button button--full">
              {user ? 'Оформить заказ' : 'Войти для оформления'}
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
