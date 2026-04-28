import { X } from 'lucide-react';

export function AdminModal({ title, description, children, onClose, width = '760px' }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card admin-modal"
        style={{ width: `min(${width}, 100%)` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-card__head">
          <div>
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
