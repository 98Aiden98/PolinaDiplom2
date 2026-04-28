import { Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { apiRequest } from '../api/http.js';
import { AdminModal } from '../components/AdminModal.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { formatCurrency } from '../utils/format.js';
import { resolveMediaUrl } from '../utils/media.js';

const initialForm = {
  title: '',
  description: '',
  price: '',
  oldPrice: '',
  brandId: '',
  categoryId: '',
  stock: '',
  specificationsText: '',
  isPopular: false,
};

const PRODUCTS_PER_PAGE = 24;

const parseSpecifications = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(':');
      return { label: label.trim(), value: rest.join(':').trim() };
    })
    .filter((item) => item.label && item.value);

export function AdminProductsPage() {
  const notify = useNotification();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [query, setQuery] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async (page = meta.page, search = query) => {
    setLoading(true);
    try {
      const response = await apiRequest(
        api.get('/products', {
          params: {
            page,
            limit: PRODUCTS_PER_PAGE,
            search: search || undefined,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
        }),
      );

      setProducts(response.items);
      setMeta(response.meta);
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    const [categoriesResponse, brandsResponse] = await Promise.all([
      apiRequest(api.get('/categories')),
      apiRequest(api.get('/brands')),
    ]);
    setCategories(categoriesResponse);
    setBrands(brandsResponse);
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadProducts(1, query);
  }, [query]);

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setImages([]);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : '',
      brandId: product.brand?.id || '',
      categoryId: product.category?.id || '',
      stock: String(product.stock || 0),
      specificationsText: (product.specifications || [])
        .map((item) => `${item.label}: ${item.value}`)
        .join('\n'),
      isPopular: Boolean(product.isPopular),
    });
    setImages(
      (product.images || []).map((url) => ({
        id: crypto.randomUUID(),
        url,
        isUploaded: true,
      })),
    );
    setShowModal(true);
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 8);
    if (!files.length) {
      return;
    }

    setImages((current) => [
      ...current,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
        isUploaded: false,
      })),
    ]);

    event.target.value = '';
  };

  const removeImage = (id) => {
    setImages((current) => current.filter((item) => item.id !== id));
  };

  const uploadImagesIfNeeded = async () => {
    const pendingFiles = images.filter((item) => item.file).map((item) => item.file);
    const existingUrls = images.filter((item) => !item.file).map((item) => item.url);

    if (!pendingFiles.length) {
      return existingUrls;
    }

    const payload = new FormData();
    pendingFiles.forEach((file) => payload.append('files', file));

    const response = await apiRequest(
      api.post('/products/upload', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );

    return [...existingUrls, ...response.files.map((file) => file.url)];
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const uploadedImages = await uploadImagesIfNeeded();
      const payload = {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
        brandId: form.brandId,
        categoryId: form.categoryId,
        stock: Number(form.stock || 0),
        specifications: parseSpecifications(form.specificationsText),
        images: uploadedImages,
        isPopular: form.isPopular,
      };

      if (editingId) {
        await apiRequest(api.patch(`/products/${editingId}`, payload));
        notify.success('Товар обновлен');
      } else {
        await apiRequest(api.post('/products', payload));
        notify.success('Товар создан');
      }

      setShowModal(false);
      resetForm();
      await loadProducts(meta.page, query);
    } catch (error) {
      notify.error(error.response?.data?.message || 'Не удалось сохранить товар');
    }
  };

  const removeProduct = async (productId) => {
    try {
      await apiRequest(api.delete(`/products/${productId}`));
      notify.success('Товар удален');

      const nextPage =
        products.length === 1 && meta.page > 1 ? meta.page - 1 : meta.page;
      await loadProducts(nextPage, query);
    } catch (error) {
      notify.error(error.response?.data?.message || 'Не удалось удалить товар');
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setQuery(searchValue.trim());
  };

  return (
    <div className="page-content">
      <AdminNav />
      <section className="content-section">
        <div className="table-card">
          <div className="admin-toolbar">
            <div>
              <h1>Товары</h1>
              <p>Каталог товаров, поиск и управление карточками.</p>
            </div>
            <div className="admin-toolbar__actions">
              <form className="searchbar searchbar--admin" onSubmit={handleSearchSubmit}>
                <Search size={16} />
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Поиск по названию"
                />
              </form>
              <button type="button" className="button" onClick={openCreateModal}>
                <Plus size={16} />
                Создать товар
              </button>
            </div>
          </div>

          {loading ? (
            <div className="state-card">Загрузка товаров...</div>
          ) : (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Товар</th>
                      <th>Категория</th>
                      <th>Бренд</th>
                      <th>Цена</th>
                      <th>Остаток</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="admin-product-cell">
                            <img
                              src={resolveMediaUrl(
                                product.images?.[0] || '/products/fridge-kitchen-bright.jpg',
                              )}
                              alt={product.title}
                            />
                            <div>
                              <strong>{product.title}</strong>
                              <span>
                                {product.images?.length || 0} изображ.
                                {product.isPopular ? ' • Хит продаж' : ''}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{product.category?.name}</td>
                        <td>{product.brand?.name}</td>
                        <td>{formatCurrency(product.price)}</td>
                        <td>{product.stock}</td>
                        <td className="table-actions">
                          <button type="button" className="icon-button" onClick={() => openEditModal(product)}>
                            <Pencil size={16} />
                          </button>
                          <button type="button" className="icon-button" onClick={() => removeProduct(product.id)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <span>
                  Всего: {meta.total}. Страница {meta.page} из {meta.totalPages}
                </span>
                <div className="form-actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    disabled={meta.page <= 1}
                    onClick={() => loadProducts(meta.page - 1, query)}
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => loadProducts(meta.page + 1, query)}
                  >
                    Вперед
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {showModal ? (
        <AdminModal
          title={editingId ? 'Редактирование товара' : 'Новый товар'}
          description="Основные данные, изображения и характеристики товара."
          onClose={() => setShowModal(false)}
          width="960px"
        >
          <form className="form-card form-card--compact" onSubmit={handleSubmit}>
            <div className="admin-product-form">
              <div className="admin-upload-card">
                <label className="admin-upload-label">
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} />
                  <div className="admin-upload-box">
                    <Upload size={18} />
                    <span>Загрузить изображения</span>
                  </div>
                </label>

                {images.length ? (
                  <div className="admin-upload-grid">
                    {images.map((image) => (
                      <div key={image.id} className="admin-upload-item">
                        <img src={resolveMediaUrl(image.url)} alt="Предпросмотр" />
                        <button
                          type="button"
                          className="icon-button admin-upload-remove"
                          onClick={() => removeImage(image.id)}
                          aria-label="Удалить изображение"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-upload-preview">
                    <div className="admin-upload-placeholder">Предпросмотр изображений</div>
                  </div>
                )}
              </div>

              <div className="admin-product-form__fields">
                <label className="field">
                  <span>Название</span>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    required
                  />
                </label>

                <label className="field">
                  <span>Описание</span>
                  <textarea
                    rows="5"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    required
                  />
                </label>

                <div className="field-grid">
                  <label className="field">
                    <span>Цена</span>
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, price: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Старая цена</span>
                    <input
                      type="number"
                      min="0"
                      value={form.oldPrice}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, oldPrice: event.target.value }))
                      }
                    />
                  </label>
                </div>

                <div className="field-grid">
                  <label className="field">
                    <span>Бренд</span>
                    <select
                      value={form.brandId}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, brandId: event.target.value }))
                      }
                      required
                    >
                      <option value="">Выберите бренд</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Категория</span>
                    <select
                      value={form.categoryId}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, categoryId: event.target.value }))
                      }
                      required
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="field">
                  <span>Остаток</span>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, stock: event.target.value }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Характеристики, формат "Ключ: Значение"</span>
                  <textarea
                    rows="7"
                    value={form.specificationsText}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        specificationsText: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.isPopular}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, isPopular: event.target.checked }))
                    }
                  />
                  <span>Пометить как популярный товар</span>
                </label>
              </div>
            </div>

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
