import { Link } from "react-router-dom";

import type { NotificationItemData } from "./types";
import {
    formatDate,
    getNotificationAccent,
    getNotificationIcon,
    getNotificationLabel,
} from "./utils";

type NotificationBellItemProps = {
    notification: NotificationItemData;
    onClick: () => void;
};

export const NotificationBellItem = ({ notification, onClick }: NotificationBellItemProps) => {
    const accent = getNotificationAccent(notification.type);

    return (
        <Link
            to="/torcida"
            onClick={onClick}
            className={`notificationBellItem ${notification.read ? "notificationBellItemRead" : "notificationBellItemUnread"}`}
        >
            <div
                className="notificationBellItemIcon"
                style={{ background: accent }}
            >
                {getNotificationIcon(notification.type)}
            </div>

            <div className="notificationBellItemContent">
                <p className="notificationBellItemText">
                    <strong>{notification.actor_name}</strong>{" "}
                    {getNotificationLabel(notification.type)}
                </p>

                <span className="notificationBellItemDate">
                    {formatDate(notification.created_at)}
                </span>
            </div>

            {!notification.read && <div className="notificationBellItemDot" />}
        </Link>
    );
};
