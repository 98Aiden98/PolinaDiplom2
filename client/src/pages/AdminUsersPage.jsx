import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api, { apiRequest } from '../api/http.js';
import { AdminModal } from '../components/AdminModal.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { formatDate } from '../utils/format.js';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  role: 'user',
};

export function AdminUsersPage() {
  const notify = useNotification();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(initialForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadUsers = async () => {
    const response = await apiRequest(api.get('/users'));
    setUsers(response);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return users;
    }

    return users.filter((user) =>
      [user.name, user.email, user.phone, user.address]
        .filter(Boolean)
        .some((item) => item.toLowerCase().includes(value)),
    );
  }, [query, users]);

  const openCreateModal = () => {
    setEditingUserId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUserId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      password: '',
      role: user.role,
    });
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      };

      if (editingUserId) {
        await apiRequest(api.patch(`/users/${editingUserId}`, payload));
        notify.success('Пользователь обновлен');
      } else {
        await apiRequest(api.post('/users', payload));
        notify.success('Пользователь создан');
      }

      setShowModal(false);
      await loadUsers();
    } catch (error) {
      notify.error(error.response?.data?.message || 'Не удалось сохранить пользователя');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await apiRequest(api.delete(`/users/${userId}`));
      notify.success('Пользователь удален');
      await loadUsers();
    } catch (error) {
      notify.error(error.response?.data?.message || 'Не удалось удалить пользователя');
    }
  };

  return (
    <div className="page-content">
      <AdminNav />
      <section className="content-section">
        <div className="table-card">
          <div className="admin-toolbar">
            <div>
              <h1>Пользователи</h1>
              <p>Список аккаунтов, роли и контактные данные.</p>
            </div>
            <div className="admin-toolbar__actions">
              <label className="searchbar searchbar--admin">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Поиск по имени, email или телефону"
                />
              </label>
              <button type="button" className="button" onClick={openCreateModal}>
                <Plus size={16} />
                Создать пользователя
              </button>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Электронная почта</th>
                  <th>Телефон</th>
                  <th>Дата регистрации</th>
                  <th>Роль</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || '—'}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{user.role === 'admin' ? 'Администратор' : 'Пользователь'}</td>
                    <td className="table-actions">
                      <button type="button" className="icon-button" onClick={() => openEditModal(user)}>
                        <Pencil size={16} />
                      </button>
                      <button type="button" className="icon-button" onClick={() => handleDelete(user.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showModal ? (
        <AdminModal
          title={editingUserId ? 'Редактирование пользователя' : 'Новый пользователь'}
          description="Создание и редактирование аккаунтов магазина."
          onClose={() => setShowModal(false)}
          width="720px"
        >
          <form className="form-card form-card--compact" onSubmit={handleSubmit}>
            <div className="field-grid">
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
            </div>

            <div className="field-grid">
              <label className="field">
                <span>Телефон</span>
                <input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Роль</span>
                <select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>Адрес</span>
              <input
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>{editingUserId ? 'Новый пароль' : 'Пароль'}</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                minLength="6"
                required={!editingUserId}
                placeholder={editingUserId ? 'Оставьте пустым, если менять не нужно' : ''}
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="button">
                Сохранить
              </button>
              <button type="button" className="button button--ghost" onClick={() => setShowModal(false)}>
                Отмена
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </div>
  );
}
