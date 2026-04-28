import { useEffect, useState } from 'react';
import api, { apiRequest } from '../api/http.js';
import { OrderDetailsModal } from '../components/OrderDetailsModal.jsx';
import { ORDER_STATUS_LABELS } from '../utils/constants.js';
import { formatCurrency, formatDate } from '../utils/format.js';

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest(api.get('/orders/my'))
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const openOrder = async (orderId) => {
    const order = await apiRequest(api.get(`/orders/${orderId}`));
    setSelectedOrder(order);
  };

  if (loading) {
    return <div className="state-card">Загрузка заказов...</div>;
  }

  return (
    <div className="page-content">
      <section className="content-section">
        <div className="section-title">
          <div>
            <h1>История заказов</h1>
            <p>Список оформленных заказов и текущие статусы.</p>
          </div>
        </div>

        {orders.length ? (
          <div className="orders-grid">
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
                <div className="order-items">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={`${order.id}-${item.productId}`} className="order-items__row">
                      <span>
                        {item.title} x {item.quantity}
                      </span>
                      <strong>{formatCurrency(item.price * item.quantity)}</strong>
                    </div>
                  ))}
                </div>
                <div className="summary-row summary-row--total">
                  <span>Итого</span>
                  <strong>{formatCurrency(order.totalPrice)}</strong>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="state-card">У вас пока нет заказов.</div>
        )}
      </section>

      <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
