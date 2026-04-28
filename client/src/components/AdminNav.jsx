import { Boxes, ClipboardList, LayoutDashboard, Shapes, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function AdminNav() {
  return (
    <div className="admin-nav">
      <NavLink to="/admin" end>
        <LayoutDashboard size={16} />
        <span>Обзор</span>
      </NavLink>
      <NavLink to="/admin/products">
        <Boxes size={16} />
        <span>Товары</span>
      </NavLink>
      <NavLink to="/admin/categories">
        <Shapes size={16} />
        <span>Категории и бренды</span>
      </NavLink>
      <NavLink to="/admin/orders">
        <ClipboardList size={16} />
        <span>Заказы</span>
      </NavLink>
      <NavLink to="/admin/users">
        <Users size={16} />
        <span>Пользователи</span>
      </NavLink>
    </div>
  );
}
