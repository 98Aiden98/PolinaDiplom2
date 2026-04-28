import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const notify = useNotification();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await register(form);
      notify.success('Регистрация завершена');
      navigate('/');
    } catch (error) {
      notify.error(error.response?.data?.message || 'Не удалось зарегистрироваться');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="form-card auth-card" onSubmit={handleSubmit}>
        <div className="section-title">
          <div>
            <h1>Регистрация</h1>
            <p>Создайте аккаунт для заказов, истории покупок и уведомлений.</p>
          </div>
        </div>

        <label className="field">
          <span>Имя</span>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </label>
        <label className="field">
          <span>Электронная почта</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
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
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
          />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            minLength="6"
            required
          />
        </label>

        <button type="submit" className="button button--full" disabled={saving}>
          {saving ? 'Создание...' : 'Создать аккаунт'}
        </button>

        <p className="auth-helper">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
}
