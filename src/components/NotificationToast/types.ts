import type { CSSProperties } from "react";

export type NotificationType = "success" | "error" | "warning" | "info";

export type NotificationToastProps = {
    message: string;
    visible: boolean;
    style: CSSProperties;
    type: NotificationType;
};