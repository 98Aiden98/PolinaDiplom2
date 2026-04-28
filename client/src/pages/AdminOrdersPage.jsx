import { useEffect, useState } from 'react';
import api, { apiRequest } from '../api/http.js';
import { AdminNav } from '../components/AdminNav.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '../utils/constants.js';
import { formatCurrency, formatDate } from '../utils/format.js';

export function AdminOrdersPage() {
  const notify = useNotification();
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    const response = await apiRequest(api.get('/orders'));
    setOrders(response);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await apiRequest(api.patch(`/orders/${orderId}/status`, { status }));
      notify.success('Статус заказа обновлен');
      await loadOrders();
    } catch (error) {
      notify.error(error.response?.data?.message || 'Не удалось обновить статус');
    }
  };

  return (
    <div className="page-content">
      <AdminNav />
      <section className="content-section">
        <div className="table-card">
          <div className="section-title">
            <div>
              <h1>Заказы</h1>
              <p>Обработка заказов и изменение статусов.</p>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Номер</th>
                  <th>Клиент</th>
                  <th>Дата</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id.slice(-6)}</td>
                    <td>
                      <div className="table-user">
                        <strong>{order.userId?.name || 'Пользователь'}</strong>
                        <span>{order.userId?.email}</span>
                      </div>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{formatCurrency(order.totalPrice)}</td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(event) => updateStatus(order.id, event.target.value)}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {ORDER_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
