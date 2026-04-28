import { MapPin, Package, Pencil, Phone, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { apiRequest } from '../api/http.js';
import { OrderDetailsModal } from '../components/OrderDetailsModal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { ORDER_STATUS_LABELS } from '../utils/constants.js';
import { formatCurrency, formatDate } from '../utils/format.js';

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const notify = useNotification();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
  }, [user]);

  useEffect(() => {
    apiRequest(api.get('/orders/my'))
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const profile = await apiRequest(api.patch('/users/profile', form));
      setUser(profile);
      setEditing(false);
      notify.success('Профиль обновлен');
    } catch (error) {
      notify.error(error.response?.data?.message || 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  };

  const openOrder = async (orderId) => {
    try {
      const order = await apiRequest(api.get(`/orders/${orderId}`));
      setSelectedOrder(order);
    } catch (error) {
      notify.error(error.response?.data?.message || 'Не удалось открыть заказ');
    }
  };

  return (
    <div className="page-content">
      <section className="content-section profile-stack">
        <div className="section-title">
          <div>
            <h1>Профиль</h1>
            <p>Контактные данные, доставка и история ваших заказов.</p>
          </div>
        </div>

        <div className="profile-summary">
          <article className="profile-hero-card">
            <div className="profile-hero-card__avatar">
              <UserRound size={34} />
            </div>
            <div className="profile-hero-card__content">
              <strong>{user?.name || 'Пользователь'}</strong>
              <span>{user?.email}</span>
            </div>
            <button type="button" className="button button--ghost" onClick={() => setEditing((current) => !current)}>
              <Pencil size={16} />
              {editing ? 'Скрыть форму' : 'Изменить профиль'}
            </button>
          </article>

          <div className="profile-summary__grid">
            <article className="summary-card profile-info-card">
              <Phone size={18} />
              <div>
                <span>Телефон</span>
                <strong>{user?.phone || 'Не указан'}</strong>
              </div>
            </article>
            <article className="summary-card profile-info-card">
              <MapPin size={18} />
              <div>
                <span>Адрес</span>
                <strong>{user?.address || 'Не указан'}</strong>
              </div>
            </article>
            <article className="summary-card profile-info-card">
              <Package size={18} />
              <div>
                <span>Заказов</span>
                <strong>{orders.length}</strong>
              </div>
            </article>
          </div>
        </div>

        {editing ? (
          <form className="form-card profile-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input value={user?.email || ''} disabled />
            </label>
            <label className="field">
              <span>Имя</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Телефон</span>
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Адрес</span>
              <input
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="button" disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
              <button type="button" className="button button--ghost" onClick={() => setEditing(false)}>
                Отмена
              </button>
            </div>
          </form>
        ) : null}

        <section className="content-section content-section--flat">
          <div className="section-title">
            <div>
              <h2>Мои заказы</h2>
              <p>Откройте карточку, чтобы посмотреть полный состав и адрес доставки.</p>
            </div>
          </div>

          {orders.length ? (
            <div className="orders-grid orders-grid--profile">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className="order-card order-card--interactive"
                  onClick={() => openOrder(order.id)}
                >
                  <div className="order-card__head">
                    <div>
                      <strong>Заказ #{order.id.slice(-6)}</strong>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    <span className={`status-badge status-${order.status}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="order-card__brief">
                    <span>{order.items.length} поз.</span>
                    <strong>{formatCurrency(order.totalPrice)}</strong>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="state-card">У вас пока нет заказов.</div>
          )}
        </section>
      </section>

      <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
