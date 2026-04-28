import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const notify = useNotification();
  const [form, setForm] = useState({ email: '', password: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const user = await login(form);
      notify.success('Вход выполнен');
      navigate(location.state?.from || (user.role === 'admin' ? '/admin' : '/'), {
        replace: true,
      });
    } catch (error) {
      notify.error(error.response?.data?.message || 'Ошибка авторизации');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="form-card auth-card" onSubmit={handleSubmit}>
        <div className="section-title">
          <div>
            <h1>Вход</h1>
            <p>Используйте адрес электронной почты и пароль, указанные при регистрации.</p>
          </div>
        </div>

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
          <span>Пароль</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            required
          />
        </label>

        <button type="submit" className="button button--full" disabled={saving}>
          {saving ? 'Вход...' : 'Войти'}
        </button>

        <p className="auth-helper">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </form>
    </div>
  );
}
