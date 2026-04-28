import { Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { apiRequest } from '../api/http.js';
import { ProductImageCarousel } from '../components/ProductImageCarousel.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';

const initialReviewForm = {
  rating: 5,
  title: '',
  comment: '',
};

export function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const notify = useNotification();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ averageRating: 0, reviewCount: 0 });
  const [reviewState, setReviewState] = useState({
    hasPurchased: false,
    hasReview: false,
    canReview: false,
    review: null,
  });
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviewSaving, setReviewSaving] = useState(false);

  const loadProduct = async () => {
    const data = await apiRequest(api.get(`/products/${id}`));
    setProduct(data);
  };

  const loadReviews = async () => {
    const data = await apiRequest(api.get(`/reviews/product/${id}`));
    setReviews(data.items);
    setReviewMeta({
      averageRating: data.averageRating,
      reviewCount: data.reviewCount,
    });
  };

  const loadMyReviewState = async () => {
    if (!user) {
      setReviewState({
        hasPurchased: false,
        hasReview: false,
        canReview: false,
        review: null,
      });
      setReviewForm(initialReviewForm);
      return;
    }

    try {
      const data = await apiRequest(api.get(`/reviews/product/${id}/me`));
      setReviewState(data);
      if (data.review) {
        setReviewForm({
          rating: data.review.rating,
          title: data.review.title,
          comment: data.review.comment,
        });
      } else {
        setReviewForm(initialReviewForm);
      }
    } catch {
      setReviewState({
        hasPurchased: false,
        hasReview: false,
        canReview: false,
        review: null,
      });
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadProduct(), loadReviews()])
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadMyReviewState();
  }, [id, user]);

  const handleAdd = async () => {
    try {
      await addItem(product, quantity);
      notify.success('Товар добавлен в корзину');
    } catch (error) {
      notify.error(error.response?.data?.message || 'Не удалось добавить товар');
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewSaving(true);

    try {
      if (reviewState.review) {
        await apiRequest(api.patch(`/reviews/${reviewState.review.id}`, reviewForm));
        notify.success('Отзыв обновлен');
      } else {
        await apiRequest(
          api.post('/reviews', {
            ...reviewForm,
            productId: id,
          }),
        );
        notify.success('Спасибо за отзыв');
      }

      await Promise.all([loadProduct(), loadReviews(), loadMyReviewState()]);
    } catch (error) {
      notify.error(error.response?.data?.message || 'Не удалось сохранить отзыв');
    } finally {
      setReviewSaving(false);
    }
  };

  const averageLabel = useMemo(() => {
    if (!reviewMeta.reviewCount) {
      return 'Пока нет отзывов';
    }

    return `${reviewMeta.averageRating} из 5 (${reviewMeta.reviewCount})`;
  }, [reviewMeta]);

  if (loading) {
    return <div className="state-card">Загрузка товара...</div>;
  }

  if (!product) {
    return <div className="state-card">Товар не найден.</div>;
  }

  return (
    <div className="page-content">
      <section className="product-detail">
        <div className="product-detail__media">
          <ProductImageCarousel
            images={product.images}
            alt={product.title}
            className="product-detail__carousel"
          />
        </div>
        <div className="product-detail__info">
          <div className="product-detail__meta">
            <span className="meta-pill">Бренд: {product.brand?.name}</span>
            <span className="meta-pill">Тип: {product.category?.name}</span>
          </div>
          <h1>{product.title}</h1>
          <div className="rating-row">
            <Star size={16} />
            <span>{averageLabel}</span>
          </div>
          <p>{product.description}</p>

          <div className="price-panel">
            <strong>{formatCurrency(product.price)}</strong>
            {product.oldPrice ? <span>{formatCurrency(product.oldPrice)}</span> : null}
          </div>

          <div className="purchase-row">
            <div className="quantity-picker">
              <button
                type="button"
                className="icon-button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              >
                <Minus size={16} />
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                className="icon-button"
                onClick={() => setQuantity((current) => Math.min(product.stock || 1, current + 1))}
              >
                <Plus size={16} />
              </button>
            </div>
            <button type="button" className="button" onClick={handleAdd} disabled={!product.stock}>
              <ShoppingCart size={18} />
              Добавить в корзину
            </button>
          </div>

          <div className="availability">
            {product.stock > 0 ? `В наличии: ${product.stock}` : 'Товар отсутствует'}
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-title">
          <div>
            <h2>Характеристики</h2>
            <p>Ключевые параметры модели.</p>
          </div>
        </div>
        <div className="spec-grid">
          {product.specifications?.length ? (
            product.specifications.map((specification) => (
              <div className="spec-card" key={`${specification.label}-${specification.value}`}>
                <span>{specification.label}</span>
                <strong>{specification.value}</strong>
              </div>
            ))
          ) : (
            <div className="state-card">Характеристики пока не добавлены.</div>
          )}
        </div>
      </section>

      <section className="content-section">
        <div className="section-title">
          <div>
            <h2>Отзывы</h2>
            <p>Оценка товара формируется по отзывам покупателей.</p>
          </div>
        </div>

        <div className="reviews-layout">
          <div className="summary-card">
            <div className="review-summary">
              <strong>{reviewMeta.reviewCount ? reviewMeta.averageRating : '—'}</strong>
              <span>{averageLabel}</span>
            </div>

            {user ? (
              reviewState.canReview || reviewState.hasReview ? (
                <form className="review-form" onSubmit={handleReviewSubmit}>
                  <label className="field">
                    <span>Оценка</span>
                    <select
                      value={reviewForm.rating}
                      onChange={(event) =>
                        setReviewForm((current) => ({
                          ...current,
                          rating: Number(event.target.value),
                        }))
                      }
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} из 5
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Заголовок</span>
                    <input
                      value={reviewForm.title}
                      onChange={(event) =>
                        setReviewForm((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="Что вам понравилось?"
                      required
                    />
                  </label>

                  <label className="field">
                    <span>Текст отзыва</span>
                    <textarea
                      rows="5"
                      value={reviewForm.comment}
                      onChange={(event) =>
                        setReviewForm((current) => ({ ...current, comment: event.target.value }))
                      }
                      placeholder="Поделитесь опытом использования товара"
                      required
                    />
                  </label>

                  <button type="submit" className="button" disabled={reviewSaving}>
                    {reviewSaving
                      ? 'Сохранение...'
                      : reviewState.hasReview
                        ? 'Обновить отзыв'
                        : 'Оставить отзыв'}
                  </button>
                </form>
              ) : (
                <div className="review-note">
                  Оставить отзыв можно после покупки товара. Сейчас у вас нет подходящего заказа
                  по этой модели.
                </div>
              )
            ) : (
              <div className="review-note">Авторизуйтесь, чтобы видеть статус своего отзыва.</div>
            )}
          </div>

          <div className="reviews-list">
            {reviews.length ? (
              reviews.map((review) => (
                <article key={review.id} className="review-card">
                  <div className="review-card__head">
                    <div>
                      <strong>{review.title}</strong>
                      <span>{review.userId?.name || 'Покупатель'}</span>
                    </div>
                    <div className="review-card__rating">
                      <Star size={14} />
                      <span>{review.rating}/5</span>
                    </div>
                  </div>
                  <p>{review.comment}</p>
                  <time>{formatDate(review.createdAt)}</time>
                </article>
              ))
            ) : (
              <div className="state-card">У этого товара пока нет отзывов.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
