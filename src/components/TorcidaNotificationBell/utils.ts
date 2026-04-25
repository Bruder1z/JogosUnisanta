import type { NotificationItemData, NotificationType } from "./types";

export const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return "agora mesmo";
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffHr < 24) return `há ${diffHr}h`;
    if (diffDay === 1) return "ontem";

    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

export const getNotificationLabel = (type: NotificationType) => {
    if (type === "like") return "curtiu uma publicação";
    if (type === "comment") return "comentou em uma publicação";

    return "criou uma nova publicação na torcida";
};

export const getNotificationIcon = (type: NotificationType) => {
    if (type === "like") return "❤️";
    if (type === "comment") return "💬";

    return "📢";
};

export const getNotificationAccent = (type: NotificationType) => {
    if (type === "like") return "rgba(227,6,19,0.15)";
    if (type === "comment") return "rgba(59,130,246,0.15)";

    return "rgba(34,197,94,0.15)";
};

export const isUnread = (notification: NotificationItemData) => !notification.read;
