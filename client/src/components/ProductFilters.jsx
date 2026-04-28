import { RotateCcw } from 'lucide-react';

export function ProductFilters({ categories, brands, filters, onChange, onReset }) {
  return (
    <aside className="filters-panel">
      <div className="filters-panel__head">
        <div>
          <h3>Фильтры</h3>
          <p>Категория, бренд, цена и наличие</p>
        </div>
        <button type="button" className="icon-button" onClick={onReset} aria-label="Сбросить">
          <RotateCcw size={16} />
        </button>
      </div>

      <label className="field">
        <span>Категория</span>
        <select value={filters.category} onChange={(event) => onChange('category', event.target.value)}>
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Бренд</span>
        <select value={filters.brand} onChange={(event) => onChange('brand', event.target.value)}>
          <option value="">Все бренды</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </label>

      <div className="field-grid field-grid--filters">
        <label className="field">
          <span>Цена от</span>
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(event) => onChange('minPrice', event.target.value)}
            placeholder="0"
          />
        </label>
        <label className="field">
          <span>Цена до</span>
          <input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(event) => onChange('maxPrice', event.target.value)}
            placeholder="300000"
          />
        </label>
      </div>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(event) => onChange('inStock', event.target.checked)}
        />
        <span>Только в наличии</span>
      </label>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={filters.isPopular}
          onChange={(event) => onChange('isPopular', event.target.checked)}
        />
        <span>Только хиты продаж</span>
      </label>
    </aside>
  );
}
