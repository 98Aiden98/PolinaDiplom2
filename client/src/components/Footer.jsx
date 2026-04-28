import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__cta">
        <div className="site-footer__inner">
          <div>
            <strong>Подбор техники под планировку кухни и квартиры</strong>
            <span>
              Каталог с реальными брендами, фильтрами, историей заказов и
              админ-управлением в одном интерфейсе.
            </span>
          </div>
          <Link to="/catalog" className="button">
            Открыть каталог
          </Link>
        </div>
      </div>

      <div className="site-footer__main">
        <div className="site-footer__inner site-footer__grid">
          <div>
            <h4>Diplom Home</h4>
            <p>
              Интернет-магазин бытовой техники с акцентом на понятную навигацию,
              подбор по категориям и удобный checkout.
            </p>
          </div>
          <div>
            <h4>Каталог</h4>
            <Link to="/catalog">Все товары</Link>
            <Link to="/cart">Корзина</Link>
            <Link to="/orders">Мои заказы</Link>
          </div>
          <div>
            <h4>Профиль</h4>
            <Link to="/login">Вход</Link>
            <Link to="/register">Регистрация</Link>
            <Link to="/profile">Личный кабинет</Link>
          </div>
          <div>
            <h4>Поддержка</h4>
            <a href="tel:+78005553535">8 800 555-35-35</a>
            <a href="mailto:support@diplom-home.local">support@diplom-home.local</a>
            <span>Ежедневно с 09:00 до 21:00</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
