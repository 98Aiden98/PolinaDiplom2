import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { apiRequest } from '../api/http.js';
import { ProductFilters } from '../components/ProductFilters.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { PRODUCT_SORT_OPTIONS } from '../utils/constants.js';

const buildFiltersFromParams = (params) => ({
  search: params.get('search') ?? '',
  category: params.get('category') ?? '',
  brand: params.get('brand') ?? '',
  minPrice: params.get('minPrice') ?? '',
  maxPrice: params.get('maxPrice') ?? '',
  inStock: params.get('inStock') === 'true',
  isPopular: params.get('isPopular') === 'true',
  sort: params.get('sort') ?? 'createdAt-desc',
  page: Number(params.get('page') ?? '1'),
});

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1, page: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const filters = useMemo(() => buildFiltersFromParams(searchParams), [searchParams]);

  useEffect(() => {
    Promise.all([apiRequest(api.get('/categories')), apiRequest(api.get('/brands'))]).then(
      ([categoriesResponse, brandsResponse]) => {
        setCategories(categoriesResponse);
        setBrands(brandsResponse);
      },
    );
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const [sortBy, sortOrder] = filters.sort.split('-');
        const response = await apiRequest(
          api.get('/products', {
            params: {
              page: filters.page,
              search: filters.search || undefined,
              category: filters.category || undefined,
              brand: filters.brand || undefined,
              minPrice: filters.minPrice || undefined,
              maxPrice: filters.maxPrice || undefined,
              inStock: filters.inStock || undefined,
              isPopular: filters.isPopular || undefined,
              sortBy,
              sortOrder,
            },
          }),
        );
        setProducts(response.items);
        setMeta(response.meta);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [filters]);

  const updateParams = (patch) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === '' || value === false || value === null || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    if (!('page' in patch)) {
      params.set('page', '1');
    }
    setSearchParams(params);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="page-content">
      <section className="content-section">
        <div className="section-title">
          <div>
            <h1>Каталог</h1>
            <p>Поиск, фильтрация и сортировка по характеристикам и наличию.</p>
          </div>
          <div className="catalog-toolbar">
            <span>{meta.total} товаров</span>
            <select value={filters.sort} onChange={(event) => updateParams({ sort: event.target.value })}>
              {PRODUCT_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="catalog-layout">
          <ProductFilters
            categories={categories}
            brands={brands}
            filters={filters}
            onChange={(key, value) => updateParams({ [key]: value })}
            onReset={resetFilters}
          />

          <div className="catalog-results">
            {loading ? (
              <div className="state-card">Загрузка каталога...</div>
            ) : products.length ? (
              <>
                <div className="product-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <div className="pagination">
                  <button
                    type="button"
                    className="button button--ghost"
                    disabled={meta.page <= 1}
                    onClick={() => updateParams({ page: meta.page - 1 })}
                  >
                    Назад
                  </button>
                  <span>
                    Страница {meta.page} из {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    className="button button--ghost"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => updateParams({ page: meta.page + 1 })}
                  >
                    Вперед
                  </button>
                </div>
              </>
            ) : (
              <div className="state-card">По выбранным параметрам товары не найдены.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
