import "./NotificationToast.css";

import { getNotificationTypeDetails } from "./styles";
import type { NotificationToastProps } from "./types";

export const NotificationToast = ({
    message,
    visible,
    style,
    type,
}: NotificationToastProps) => {
    const typeDetails = getNotificationTypeDetails(type);

    return (
        <div className="notificationToast" style={style}>
            {visible && (
                <>
                    {typeDetails.icon}

                    <span className="notificationToastMessage">{message}</span>
                </>
            )}
        </div>
    );
};