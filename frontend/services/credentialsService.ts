import { apiGet, apiPost, apiDelete } from "@/services/api";

export interface ChannelCredentialDto {
  id?: string;
  platform: "linkedin" | "instagram" | "twitter" | "facebook" | "whatsapp";
  platform_name?: string;
  account_id: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  status?: "connected" | "expiring_soon" | "disconnected";
  profiles_count?: string;
}

export interface ListCredentialsResponse {
  success: boolean;
  connectedChannels: ChannelCredentialDto[];
}

export async function listCredentialsApi(): Promise<ChannelCredentialDto[]> {
  const res = await apiGet<ListCredentialsResponse>("/credentials");
  return res.connectedChannels || [];
}

export async function saveCredentialApi(payload: {
  platform: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}): Promise<any> {
  return await apiPost("/credentials", payload);
}

export async function deleteCredentialApi(platform: string): Promise<any> {
  return await apiDelete(`/credentials/${platform}`);
}

