import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="state-card">
      <h1>Страница не найдена</h1>
      <p>Проверьте адрес или вернитесь в каталог.</p>
      <Link to="/" className="button">
        На главную
      </Link>
    </div>
  );
}
