import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Search,
  ShoppingCart,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import api, { apiRequest } from '../api/http.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('search') ?? '');
  }, [location.search]);

  useEffect(() => {
    Promise.all([
      apiRequest(api.get('/categories')),
      apiRequest(api.get('/brands')),
      apiRequest(
        api.get('/products', {
          params: {
            limit: 50,
            sortBy: 'title',
            sortOrder: 'asc',
          },
        }),
      ),
    ])
      .then(([categoriesResponse, brandsResponse, productsResponse]) => {
        setCategories(categoriesResponse);
        setBrands(brandsResponse);
        setProducts(productsResponse.items);
        setActiveCategoryId(categoriesResponse[0]?.id || '');
      })
      .catch(() => {
        setCategories([]);
        setBrands([]);
        setProducts([]);
      });
  }, []);

  const brandsByCategory = useMemo(() => {
    const brandMap = new Map(brands.map((brand) => [brand.id, brand]));
    const categoryMap = new Map();

    for (const product of products) {
      const categoryId = product.category?.id;
      const brandId = product.brand?.id;

      if (!categoryId || !brandId || !brandMap.has(brandId)) {
        continue;
      }

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, new Map());
      }

      categoryMap.get(categoryId).set(brandId, brandMap.get(brandId));
    }

    return categoryMap;
  }, [brands, products]);

  const activeBrands = useMemo(() => {
    return Array.from(brandsByCategory.get(activeCategoryId)?.values() || []);
  }, [activeCategoryId, brandsByCategory]);

  const handleSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set('search', search.trim());
    }
    navigate(`/catalog?${params.toString()}`);
  };

  return (
    <>
      <div className="store-strip">
        <div className="topbar__inner">
          <div className="store-strip__items">
            <span>Интернет-магазин бытовой техники</span>
            <span>Доставка по всей России</span>
            <span>Поддержка без выходных</span>
          </div>
          <div className="store-strip__items store-strip__items--right">
            <a href="tel:+78005553535">8 800 555-35-35</a>
          </div>
        </div>
      </div>

      <header className="topbar">
        <div className="topbar__inner topbar__inner--main">
          <Link to="/" className="brand brand--candy">
            <img src="/favicon.svg" alt="" className="brand__logo" aria-hidden="true" />
            <div className="brand__text">
              <strong>Diplom Home</strong>
              <span>Техника для кухни и дома</span>
            </div>
          </Link>

          <nav className="main-nav">
            <NavLink to="/">Главная</NavLink>

            <div className="nav-catalog">
              <NavLink to="/catalog" className="nav-catalog__trigger">
                Каталог
                <ChevronDown size={14} />
              </NavLink>
              <div className="nav-catalog__dropdown">
                <div className="nav-catalog__layout">
                  <div className="nav-catalog__categories">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        className={`nav-catalog__category ${activeCategoryId === category.id ? 'is-active' : ''}`}
                        onMouseEnter={() => setActiveCategoryId(category.id)}
                        onFocus={() => setActiveCategoryId(category.id)}
                      >
                        <strong>{category.name}</strong>
                      </button>
                    ))}
                  </div>

                  <div className="nav-catalog__brands">
                    <div className="nav-catalog__brands-head">
                      <strong>
                        {categories.find((category) => category.id === activeCategoryId)?.name ||
                          'Бренды'}
                      </strong>
                      <span>Выберите бренд для быстрого перехода в каталог.</span>
                    </div>

                    {activeBrands.length ? (
                      <div className="nav-catalog__brands-grid">
                        {activeBrands.map((brand) => (
                          <Link
                            key={brand.id}
                            to={`/catalog?category=${activeCategoryId}&brand=${brand.id}`}
                            className="nav-catalog__brand"
                          >
                            {brand.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="nav-catalog__empty">
                        Для этой категории пока нет доступных брендов.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <NavLink to="/orders">Заказы</NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin">
                <LayoutDashboard size={16} />
                Админ-панель
              </NavLink>
            )}
          </nav>

          <form className="searchbar" onSubmit={handleSearch}>
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по названию или бренду"
            />
          </form>

          <div className="topbar__actions">
            <NavLink to="/cart" className="icon-link" aria-label="Корзина">
              <ShoppingCart size={20} />
              <span>Корзина</span>
              {itemCount > 0 && <span className="badge">{itemCount}</span>}
            </NavLink>

            {user ? (
              <>
                <NavLink to="/profile" className="icon-link icon-link--wide">
                  <UserRound size={18} />
                  <span>{user.name}</span>
                </NavLink>
                <button type="button" className="icon-link icon-link--wide" onClick={logout}>
                  <LogOut size={18} />
                  <span>Выйти</span>
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="button button--ghost">
                  Вход
                </NavLink>
                <NavLink to="/register" className="button">
                  Регистрация
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
