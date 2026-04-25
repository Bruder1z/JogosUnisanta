export type NotificationType = "like" | "comment" | "new_post";

export interface NotificationItemData {
    id: string;
    user_id: string;
    actor_name: string;
    post_id: string;
    type: NotificationType;
    read: boolean;
    created_at: string;
}
