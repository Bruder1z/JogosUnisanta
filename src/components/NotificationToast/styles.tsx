import type { CSSProperties, ReactNode } from "react";

import {
    ErrorIcon,
    InfoIcon,
    SuccessIcon,
    WarningIcon,
} from "../../assets/icons/NotificationIcons";

import type { NotificationType } from "./types";

type NotificationStyleConfig = {
    icon: ReactNode;
    bg: string;
    border: string;
    color: string;
};

const notificationTypeStyles: Record<NotificationType, NotificationStyleConfig> = {
    success: {
        icon: (
            <span className="notificationToastIconWrap">
                <SuccessIcon />
            </span>
        ),
        bg: "#bbf7d0",
        border: "#bbf7d0",
        color: "#166534",
    },
    error: {
        icon: (
            <span className="notificationToastIconWrap">
                <ErrorIcon />
            </span>
        ),
        bg: "#fecaca",
        border: "#fecaca",
        color: "#991b1b",
    },
    warning: {
        icon: (
            <span className="notificationToastIconWrap">
                <WarningIcon />
            </span>
        ),
        bg: "#bae6fd",
        border: "#bae6fd",
        color: "#2563eb",
    },
    info: {
        icon: (
            <span className="notificationToastIconWrap">
                <InfoIcon />
            </span>
        ),
        bg: "#bae6fd",
        border: "#bae6fd",
        color: "#2563eb",
    },
};

export const getNotificationTypeDetails = (type: NotificationType) =>
    notificationTypeStyles[type];

export const getNotificationToastStyle = (
    type: NotificationType,
    visible: boolean,
): CSSProperties => ({
    ["--notification-toast-border" as string]: notificationTypeStyles[type].border,
    ["--notification-toast-color" as string]: notificationTypeStyles[type].color,
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(10px)",
    pointerEvents: visible ? "auto" : "none",
});