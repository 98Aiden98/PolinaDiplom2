import { createContext, useContext, useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, X } from 'lucide-react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const push = (type, message) => {
    const id = crypto.randomUUID();
    setNotifications((current) => [...current, { id, type, message }]);
    window.setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== id));
    }, 3200);
  };

  const value = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
    }),
    [],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {notifications.map((notification) => (
          <div key={notification.id} className={`toast toast--${notification.type}`}>
            {notification.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <CircleAlert size={18} />
            )}
            <span>{notification.message}</span>
            <button
              type="button"
              className="icon-button"
              onClick={() =>
                setNotifications((current) =>
                  current.filter((item) => item.id !== notification.id),
                )
              }
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
