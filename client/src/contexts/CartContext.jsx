import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { apiRequest } from '../api/http.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'guest_cart';

const readGuestCart = () => {
  const stored = localStorage.getItem(GUEST_CART_KEY);
  return stored ? JSON.parse(stored) : { items: [], totalPrice: 0 };
};

const computeGuestTotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(() => readGuestCart());
  const [loading, setLoading] = useState(false);
  const syncDoneRef = useRef(false);

  const loadServerCart = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(api.get('/cart'));
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadServerCart();
      return;
    }

    syncDoneRef.current = false;
    setCart(readGuestCart());
  }, [user]);

  useEffect(() => {
    if (!user || syncDoneRef.current) {
      return;
    }

    const guestCart = readGuestCart();
    if (!guestCart.items.length) {
      syncDoneRef.current = true;
      return;
    }

    const syncCart = async () => {
      for (const item of guestCart.items) {
        await apiRequest(
          api.post('/cart/items', {
            productId: item.productId,
            quantity: item.quantity,
          }),
        );
      }
      localStorage.removeItem(GUEST_CART_KEY);
      syncDoneRef.current = true;
      await loadServerCart();
    };

    syncCart().catch(() => {
      syncDoneRef.current = true;
    });
  }, [user]);

  const persistGuestCart = (items) => {
    const nextCart = {
      items,
      totalPrice: computeGuestTotal(items),
    };
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(nextCart));
    setCart(nextCart);
  };

  const value = useMemo(
    () => ({
      cart,
      loading,
      itemCount: cart.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
      async reload() {
        if (user) {
          await loadServerCart();
          return;
        }
        setCart(readGuestCart());
      },
      async addItem(product, quantity = 1) {
        if (user) {
          const data = await apiRequest(
            api.post('/cart/items', { productId: product.id, quantity }),
          );
          setCart(data);
          return data;
        }

        const current = readGuestCart();
        const existing = current.items.find((item) => item.productId === product.id);
        if (existing) {
          existing.quantity += quantity;
        } else {
          current.items.push({
            productId: product.id,
            product,
            quantity,
            price: product.price,
          });
        }
        persistGuestCart(current.items);
      },
      async updateItem(productId, quantity) {
        if (user) {
          const data = await apiRequest(api.patch(`/cart/items/${productId}`, { quantity }));
          setCart(data);
          return;
        }

        const current = readGuestCart();
        persistGuestCart(
          current.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item,
          ),
        );
      },
      async removeItem(productId) {
        if (user) {
          const data = await apiRequest(api.delete(`/cart/items/${productId}`));
          setCart(data);
          return;
        }

        const current = readGuestCart();
        persistGuestCart(current.items.filter((item) => item.productId !== productId));
      },
      async clearCart() {
        if (user) {
          const data = await apiRequest(api.delete('/cart'));
          setCart(data);
          return;
        }
        localStorage.removeItem(GUEST_CART_KEY);
        setCart({ items: [], totalPrice: 0 });
      },
    }),
    [cart, loading, user],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
