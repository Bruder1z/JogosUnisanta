import type { ReactNode } from "react";

import type { NotificationType } from "../NotificationToast/types";

export interface NotificationContextType {
    showNotification: (msg: string, type?: NotificationType) => void;
}

export type NotificationProviderProps = {
    children: ReactNode;
};