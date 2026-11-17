import type { AxiosRequestConfig } from "axios";
import { apiGet, apiPatch, apiPost, apiPut } from "./api";
import type {
  NotificationDto,
  NotificationPreferencesDto,
  NotificationPreferencesResponse,
  NotificationsListResponse,
} from "@/types/notifications";

function toArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export async function getNotificationsApi(
  config?: AxiosRequestConfig,
): Promise<NotificationDto[]> {
  try {
    const res = await apiGet<NotificationsListResponse | NotificationDto[]>("/notifications", config);
    if (Array.isArray(res)) return res;
    return toArray<NotificationDto>(res.notifications ?? res.items);
  } catch {
    const res = await apiGet<NotificationsListResponse | NotificationDto[]>(
      "/employee/notifications",
      config,
    );
    if (Array.isArray(res)) return res;
    return toArray<NotificationDto>(res.notifications ?? res.items);
  }
}

export async function markNotificationReadApi(id: string): Promise<void> {
  try {
    await apiPost(`/notifications/${encodeURIComponent(id)}/read`, {});
  } catch {
    await apiPost(`/employee/notifications/${encodeURIComponent(id)}/read`, {});
  }
}

export async function getNotificationPreferencesApi(): Promise<NotificationPreferencesDto> {
  try {
    const res = await apiGet<NotificationPreferencesResponse>("/notifications/preferences");
    return (res.preferences ?? res ?? {}) as NotificationPreferencesDto;
  } catch {
    const res = await apiGet<NotificationPreferencesResponse>("/employee/notifications/preferences");
    return (res.preferences ?? res ?? {}) as NotificationPreferencesDto;
  }
}

export async function updateNotificationPreferencesApi(
  body: NotificationPreferencesDto,
): Promise<NotificationPreferencesDto> {
  try {
    const res = await apiPut<NotificationPreferencesResponse>("/notifications/preferences", body);
    return (res.preferences ?? body) as NotificationPreferencesDto;
  } catch {
    const res = await apiPut<NotificationPreferencesResponse>("/employee/notifications/preferences", body);
    return (res.preferences ?? body) as NotificationPreferencesDto;
  }
}

export async function updateUserProfileApi(userId: string, body: { name?: string; phone?: string }): Promise<void> {
  try {
    await apiPatch(`/users/${encodeURIComponent(userId)}`, body);
  } catch {
    await apiPatch("/employee/profile", { name: body.name });
  }
}
