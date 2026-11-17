export type SocialPlatform = "instagram" | "facebook" | "whatsapp" | "linkedin" | "twitter";

export interface ConnectedChannelDto {
  id: string;
  platform: SocialPlatform;
  account_id: string;
  token_expires_at?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface ListChannelsResponse {
  success: boolean;
  connectedChannels: ConnectedChannelDto[];
}

export interface SaveChannelPayload {
  platform: SocialPlatform;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  tenantId?: string;
}

