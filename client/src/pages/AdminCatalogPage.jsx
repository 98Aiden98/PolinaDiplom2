import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { apiRequest } from '../api/http.js';
import { AdminModal } from '../components/AdminModal.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';

const initialCategoryForm = { name: '', description: '' };
const initialBrandForm = { name: '' };

export function AdminCatalogPage() {
  const notify = useNotification();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [brandForm, setBrandForm] = useState(initialBrandForm);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);

  const loadData = async () => {
    const [categoriesResponse, brandsResponse] = await Promise.all([
      apiRequest(api.get('/categories')),
      apiRequest(api.get('/brands')),
    ]);
    setCategories(categoriesResponse);
    setBrands(brandsResponse);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCategoryModal = (category = null) => {
    setEditingCategoryId(category?.id || null);
    setCategoryForm(
      category
        ? { name: category.name, description: category.description || '' }
        : initialCategoryForm,
    );
    setShowCategoryModal(true);
  };

  const openBrandModal = (brand = null) => {
    setEditingBrandId(brand?.id || null);
    setBrandForm(brand ? { name: brand.name } : initialBrandForm);
    setShowBrandModal(true);
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    try {
      if (editingCategoryId) {
        await apiRequest(api.patch(`/categories/${editingCategoryId}`, categoryForm));
      } else {
        await apiRequest(api.post('/categories', categoryForm));
      }
      notify.success('Категория сохранена');
      setShowCategoryModal(false);
      await loadData();
    } catch (error) {
      notify.error(error.response?.data?.message || 'Ошибка сохранения категории');
    }
  };

  const saveBrand = async (event) => {
    event.preventDefault();
    try {
      if (editingBrandId) {
        await apiRequest(api.patch(`/brands/${editingBrandId}`, brandForm));
      } else {
        await apiRequest(api.post('/brands', brandForm));
      }
      notify.success('Бренд сохранен');
      setShowBrandModal(false);
      await loadData();
    } catch (error) {
      notify.error(error.response?.data?.message || 'Ошибка сохранения бренда');
    }
  };

  return (
    <div className="page-content">
      <AdminNav />
      <section className="content-section split-grid">
        <div className="table-card">
          <div className="admin-toolbar">
            <div>
              <h2>Категории</h2>
              <p>Управление разделами каталога.</p>
            </div>
            <button type="button" className="button" onClick={() => openCategoryModal()}>
              <Plus size={16} />
              Создать категорию
            </button>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Тег для поиска</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.slug}</td>
                    <td className="table-actions">
                      <button type="button" className="icon-button" onClick={() => openCategoryModal(category)}>
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={async () => {
                          await apiRequest(api.delete(`/categories/${category.id}`));
                          notify.success('Категория удалена');
                          await loadData();
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-card">
          <div className="admin-toolbar">
            <div>
              <h2>Бренды</h2>
              <p>Справочник производителей.</p>
            </div>
            <button type="button" className="button" onClick={() => openBrandModal()}>
              <Plus size={16} />
              Создать бренд
            </button>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Тег для поиска</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <td>{brand.name}</td>
                    <td>{brand.slug}</td>
                    <td className="table-actions">
                      <button type="button" className="icon-button" onClick={() => openBrandModal(brand)}>
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={async () => {
                          await apiRequest(api.delete(`/brands/${brand.id}`));
                          notify.success('Бренд удален');
                          await loadData();
                        }}
                      >
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

      {showCategoryModal ? (
        <AdminModal
          title={editingCategoryId ? 'Редактирование категории' : 'Новая категория'}
          description="Название и описание раздела каталога."
          onClose={() => setShowCategoryModal(false)}
        >
          <form className="form-card form-card--compact" onSubmit={saveCategory}>
            <label className="field">
              <span>Название</span>
              <input
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Описание</span>
              <textarea
                rows="4"
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="button">
                Сохранить
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setShowCategoryModal(false)}
              >
                Отмена
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      {showBrandModal ? (
        <AdminModal
          title={editingBrandId ? 'Редактирование бренда' : 'Новый бренд'}
          description="Название производителя для каталога."
          onClose={() => setShowBrandModal(false)}
          width="520px"
        >
          <form className="form-card form-card--compact" onSubmit={saveBrand}>
            <label className="field">
              <span>Название</span>
              <input
                value={brandForm.name}
                onChange={(event) =>
                  setBrandForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="button">
                Сохранить
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setShowBrandModal(false)}
              >
                Отмена
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </div>
  );
}
