import { useEffect, useState } from 'react';
import api, { apiRequest } from '../api/http.js';
import { AdminNav } from '../components/AdminNav.jsx';
import { formatCurrency } from '../utils/format.js';

export function AdminDashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiRequest(api.get('/admin/dashboard')).then(setStats);
  }, []);

  return (
    <div className="page-content">
      <AdminNav />
      <section className="content-section">
        <div className="section-title">
          <div>
            <h1>Админ-панель</h1>
            <p>Сводка по пользователям, товарам и заказам.</p>
          </div>
        </div>

        {stats ? (
          <div className="stats-grid">
            <article className="stat-card">
              <span>Пользователи</span>
              <strong>{stats.users}</strong>
            </article>
            <article className="stat-card">
              <span>Товары</span>
              <strong>{stats.products}</strong>
            </article>
            <article className="stat-card">
              <span>Заказы</span>
              <strong>{stats.orders}</strong>
            </article>
            <article className="stat-card">
              <span>Ожидают обработки</span>
              <strong>{stats.pendingOrders}</strong>
            </article>
            <article className="stat-card stat-card--wide">
              <span>Выручка по активным заказам</span>
              <strong>{formatCurrency(stats.totalRevenue)}</strong>
            </article>
          </div>
        ) : (
          <div className="state-card">Загрузка данных...</div>
        )}
      </section>
    </div>
  );
}
