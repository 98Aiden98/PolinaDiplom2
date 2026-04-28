import { ArrowRight, ShieldCheck, Truck, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiRequest } from '../api/http.js';
import { ProductCard } from '../components/ProductCard.jsx';

export function HomePage() {
  const [popularProducts, setPopularProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      apiRequest(
        api.get('/products', {
          params: {
            isPopular: true,
            sortBy: 'popularity',
            sortOrder: 'desc',
            limit: 8,
          },
        }),
      ),
      apiRequest(
        api.get('/products', {
          params: {
            sortBy: 'createdAt',
            sortOrder: 'desc',
            limit: 4,
          },
        }),
      ),
    ]).then(([popularResponse, latestResponse]) => {
      setPopularProducts(popularResponse.items);
      setLatestProducts(latestResponse.items);
    });
  }, []);

  return (
    <div className="page-content page-content--home">
      <section className="hero-banner hero-banner--overlay">
        <div className="hero-banner__backdrop" />
        <div className="hero-banner__content hero-banner__content--overlay">
          <span className="chip chip--hero">Интернет-магазин бытовой техники</span>
          <h1>Крупная техника и умные бытовые решения для современной кухни и дома.</h1>
          <p>
            Холодильники, стиральные машины, встраиваемая техника, посудомоечные
            машины, пылесосы и малая кухонная техника в одной витрине.
          </p>

          <div className="hero-banner__actions">
            <Link to="/catalog" className="button">
              Перейти в каталог
              <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="button button--ghost button--light">
              Создать аккаунт
            </Link>
          </div>
        </div>
      </section>

      <section className="metrics-grid metrics-grid--candy">
        <article className="metric-card">
          <ShieldCheck size={20} />
          <div>
            <strong>Проверенные бренды</strong>
            <span>Candy, Hoover, Bosch, Samsung, LG, Haier, Philips и другие.</span>
          </div>
        </article>
        <article className="metric-card">
          <Truck size={20} />
          <div>
            <strong>Удобное оформление заказа</strong>
            <span>Корзина, доставка, история заказов и статусы в личном кабинете.</span>
          </div>
        </article>
        <article className="metric-card">
          <Wallet size={20} />
          <div>
            <strong>Акции и честные цены</strong>
            <span>Хиты продаж со скидками прямо в каталоге.</span>
          </div>
        </article>
      </section>

      <section className="content-section content-section--flat">
        <div className="section-title">
          <div>
            <h2>Популярные товары</h2>
            <p>Самые востребованные позиции каталога.</p>
          </div>
          <Link to="/catalog" className="button button--ghost">
            Смотреть все
          </Link>
        </div>

        <div className="product-grid">
          {popularProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="showcase-band">
        <div className="showcase-band__copy">
          <span className="chip chip--band">Новинки каталога</span>
          <h2>Недавно добавленные модели для кухни и дома.</h2>
          <p>
            Подборка свежих товаров: от встраиваемой техники и холодильников до
            кофемашин и пылесосов.
          </p>
        </div>
        <div className="showcase-band__products">
          {latestProducts.map((product) => (
            <Link key={product.id} to={`/products/${product.id}`} className="mini-product">
              <img src={product.images?.[0]} alt={product.title} loading="lazy" />
              <div>
                <strong>{product.title}</strong>
                <span>{product.brand?.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
