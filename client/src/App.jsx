import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { AdminCatalogPage } from './pages/AdminCatalogPage.jsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.jsx';
import { AdminOrdersPage } from './pages/AdminOrdersPage.jsx';
import { AdminProductsPage } from './pages/AdminProductsPage.jsx';
import { AdminUsersPage } from './pages/AdminUsersPage.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { CatalogPage } from './pages/CatalogPage.jsx';
import { CheckoutPage } from './pages/CheckoutPage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { OrdersPage } from './pages/OrdersPage.jsx';
import { ProductPage } from './pages/ProductPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';

function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="products/:id" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/products"
            element={
              <ProtectedRoute adminOnly>
                <AdminProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/categories"
            element={
              <ProtectedRoute adminOnly>
                <AdminCatalogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/orders"
            element={
              <ProtectedRoute adminOnly>
                <AdminOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute adminOnly>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
