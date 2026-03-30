import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import {
  SuccessIcon,
  ErrorIcon,
  WarningIcon,
  InfoIcon,
} from "../assets/icons/NotificationIcons";

type NotificationType = "success" | "error" | "warning" | "info";
interface NotificationContextType {
  showNotification: (msg: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  return ctx;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<NotificationType>("info");

  const showNotification = useCallback((msg: string, type: NotificationType = 'info') => {
  setMessage(msg);
  setType(type);
  setVisible(false);

  setTimeout(() => {
    setVisible(true);
  }, 50);

  setTimeout(() => setVisible(false), 3000);
}, []);

  const typeStyles: Record<
    NotificationType,
    { icon: React.ReactNode; bg: string; border: string; color: string }
  > = {
    success: {
      icon: (
        <span
          style={{ display: "flex", alignItems: "center", marginRight: 16 }}
        >
          <SuccessIcon />
        </span>
      ),
      bg: "#bbf7d0", // verde clarinho
      border: "#bbf7d0",
      color: "#166534",
    },
    error: {
      icon: (
        <span
          style={{ display: "flex", alignItems: "center", marginRight: 16 }}
        >
          <ErrorIcon />
        </span>
      ),
      bg: "#fecaca", // vermelho clarinho
      border: "#fecaca",
      color: "#991b1b",
    },
    warning: {
      icon: (
        <span
          style={{ display: "flex", alignItems: "center", marginRight: 16 }}
        >
          <WarningIcon />
        </span>
      ),
      bg: "#bae6fd", // azul clarinho
      border: "#bae6fd",
      color: "#2563eb",
    },
    info: {
      icon: (
        <span
          style={{ display: "flex", alignItems: "center", marginRight: 16 }}
        >
          <InfoIcon />
        </span>
      ),
      bg: "#bae6fd", // azul clarinho
      border: "#bae6fd",
      color: "#2563eb",
    },
  };

  const style: React.CSSProperties = {
  position: 'fixed',
  bottom: 24,
  right: 24,

  background: 'rgba(20,20,20,0.85)',
  backdropFilter: 'blur(10px)',

  color: '#e5e7eb',
  border: `1px solid ${typeStyles[type].border}`,

  padding: '12px 14px',
  borderRadius: 12,

  fontWeight: 500,
  fontSize: 13.5,

  minWidth: 260,
  maxWidth: 340,

  boxShadow: '0 10px 25px rgba(0,0,0,0.35)',

  display: 'flex',
  alignItems: 'center',
  gap: 10,

  zIndex: 9999,

  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(10px)',
  transition: 'all 0.25s ease',

  pointerEvents: visible ? 'auto' : 'none',
};

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div style={style}>
  {visible && (
    <>
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {typeStyles[type].icon}
      </span>

      <span style={{ flex: 1, lineHeight: 1.4 }}>
        {message}
      </span>
    </>
  )}
</div>
    </NotificationContext.Provider>
  );
};
