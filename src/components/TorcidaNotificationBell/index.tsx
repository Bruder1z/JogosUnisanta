import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabaseClient";

import "./NotificationBell.css";

import { NotificationBellItem } from "./NotificationBellItem";
import type { NotificationItemData } from "./types";

const TorcidaNotificationBell: FC = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItemData[]>([]);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((notification) => !notification.read).length;

    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;

        const { data } = await supabase
            .from("torcida_notifications")
            .select("*")
            .eq("user_id", String(user.id))
            .order("created_at", { ascending: false })
            .limit(30);

        if (data) setNotifications(data as NotificationItemData[]);
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;

        fetchNotifications();

        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, [fetchNotifications, user?.id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        if (open) document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const handleOpen = async () => {
        setOpen((previous) => !previous);

        if (!open && unreadCount > 0) {
            await supabase
                .from("torcida_notifications")
                .update({ read: true })
                .eq("user_id", String(user?.id))
                .eq("read", false);

            setNotifications((previous) => previous.map((notification) => ({ ...notification, read: true })));
        }
    };

    if (!user) return null;

    return (
        <div ref={dropdownRef} className="torcidaNotificationBellRoot">
            <button
                onClick={handleOpen}
                title="Notificações"
                className="torcidaNotificationBellButton"
            >
                <Bell size={22} color={unreadCount > 0 ? "var(--accent-color)" : "#ccc"} />

                {unreadCount > 0 && (
                    <span className="torcidaNotificationBellBadge">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="torcidaNotificationBellDropdown">
                    <div className="torcidaNotificationBellHeader">
                        <span className="torcidaNotificationBellTitle">Notificações</span>

                        {notifications.length > 0 && (
                            <button
                                onClick={async () => {
                                    await supabase
                                        .from("torcida_notifications")
                                        .delete()
                                        .eq("user_id", String(user.id));
                                    setNotifications([]);
                                }}
                                className="torcidaNotificationBellClear"
                            >
                                Limpar tudo
                            </button>
                        )}
                    </div>

                    <div className="torcidaNotificationBellList">
                        {notifications.length === 0 ? (
                            <div className="torcidaNotificationBellEmpty">
                                <div className="torcidaNotificationBellEmptyIcon">🔔</div>
                                Nenhuma notificação ainda
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <NotificationBellItem
                                    key={notification.id}
                                    notification={notification}
                                    onClick={() => setOpen(false)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TorcidaNotificationBell;