import { api, ApiError } from "./api";
import type { ConnectedChannelDto, SaveChannelPayload } from "@/types/channel";

export async function getChannelsApi(tenantId?: string): Promise<ConnectedChannelDto[]> {
  try {
    const res = await api.get<ConnectedChannelDto[]>("/credentials", { tenantId });
    return res.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "Failed to load connected channels.");
  }
}

export async function connectChannelApi(payload: SaveChannelPayload): Promise<ConnectedChannelDto> {
  try {
    const res = await api.post<ConnectedChannelDto>("/credentials", payload);
    return res.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "Failed to connect channel.");
  }
}

export async function disconnectChannelApi(platform: string, tenantId?: string): Promise<void> {
  try {
    await api.delete(`/credentials/${platform}`, { tenantId });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "Failed to disconnect channel.");
  }
}
