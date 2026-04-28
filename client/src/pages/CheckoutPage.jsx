import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiRequest } from '../api/http.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { formatCurrency } from '../utils/format.js';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { cart, reload } = useCart();
  const notify = useNotification();
  const [form, setForm] = useState({
    deliveryAddress: user?.address || '',
    phone: user?.phone || '',
    comment: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshProfile()
      .then((profile) =>
        setForm((current) => ({
          ...current,
          deliveryAddress: profile.address || '',
          phone: profile.phone || '',
        })),
      )
      .catch(() => undefined);
  }, [refreshProfile]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const order = await apiRequest(api.post('/orders', form));
      await reload();
      notify.success('Заказ оформлен');
      navigate(`/orders?created=${order.id}`);
    } catch (error) {
      notify.error(error.response?.data?.message || 'Не удалось оформить заказ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content">
      <section className="content-section">
        <div className="section-title">
          <div>
            <h1>Оформление заказа</h1>
            <p>Контактные данные и адрес доставки.</p>
          </div>
        </div>
        <div className="checkout-layout">
          <form className="form-card" onSubmit={handleSubmit}>
            <label className="field">
              <span>Адрес доставки</span>
              <input
                value={form.deliveryAddress}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    deliveryAddress: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="field">
              <span>Телефон</span>
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                required
              />
            </label>

            <label className="field">
              <span>Комментарий</span>
              <textarea
                rows="4"
                value={form.comment}
                onChange={(event) =>
                  setForm((current) => ({ ...current, comment: event.target.value }))
                }
              />
            </label>

            <button type="submit" className="button button--full" disabled={saving}>
              {saving ? 'Сохраняю...' : 'Подтвердить заказ'}
            </button>
          </form>

          <aside className="summary-card">
            <h3>Ваш заказ</h3>
            {cart.items.map((item) => (
              <div key={item.productId} className="summary-row">
                <span>
                  {item.product?.title} x {item.quantity}
                </span>
                <strong>{formatCurrency(item.price * item.quantity)}</strong>
              </div>
            ))}
            <div className="summary-row summary-row--total">
              <span>К оплате</span>
              <strong>{formatCurrency(cart.totalPrice)}</strong>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
