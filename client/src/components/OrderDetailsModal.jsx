import { X } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '../utils/constants.js';
import { formatCurrency, formatDate } from '../utils/format.js';

export function OrderDetailsModal({ order, onClose }) {
  if (!order) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card--order" onClick={(event) => event.stopPropagation()}>
        <div className="modal-card__head">
          <div>
            <h3>Заказ #{order.id.slice(-6)}</h3>
            <p>{formatDate(order.createdAt)}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>

        <div className="modal-order-grid">
          <div className="summary-card">
            <div className="summary-row">
              <span>Статус</span>
              <strong>{ORDER_STATUS_LABELS[order.status]}</strong>
            </div>
            <div className="summary-row">
              <span>Телефон</span>
              <strong>{order.phone}</strong>
            </div>
            <div className="summary-row">
              <span>Адрес доставки</span>
              <strong>{order.deliveryAddress}</strong>
            </div>
            {order.comment ? (
              <div className="summary-row">
                <span>Комментарий</span>
                <strong>{order.comment}</strong>
              </div>
            ) : null}
            <div className="summary-row summary-row--total">
              <span>Итого</span>
              <strong>{formatCurrency(order.totalPrice)}</strong>
            </div>
          </div>

          <div className="summary-card">
            <h4>Состав заказа</h4>
            <div className="order-items">
              {order.items.map((item) => (
                <div key={`${order.id}-${item.productId}`} className="order-items__row">
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      {item.quantity} шт. x {formatCurrency(item.price)}
                    </span>
                  </div>
                  <strong>{formatCurrency(item.quantity * item.price)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
