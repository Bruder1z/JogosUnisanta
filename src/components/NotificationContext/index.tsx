import { createContext, useCallback, useContext, useState } from "react";

import { NotificationToast } from "../NotificationToast";
import { getNotificationToastStyle } from "../NotificationToast/styles";
import type { NotificationType } from "../NotificationToast/types";

import type {
    NotificationContextType,
    NotificationProviderProps,
} from "./types";

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

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
    const [message, setMessage] = useState("");
    const [visible, setVisible] = useState(false);
    const [type, setType] = useState<NotificationType>("info");

    const showNotification = useCallback(
        (msg: string, notificationType: NotificationType = "info") => {
            setMessage(msg);
            setType(notificationType);
            setVisible(false);

            setTimeout(() => {
                setVisible(true);
            }, 50);

            setTimeout(() => setVisible(false), 3000);
        },
        [],
    );

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <NotificationToast
                message={message}
                type={type}
                visible={visible}
                style={getNotificationToastStyle(type, visible)}
            />
        </NotificationContext.Provider>
    );
};