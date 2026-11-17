import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import leadsReducer from "./slices/leadsSlice";
import inboxReducer from "./slices/inboxSlice";
import channelsReducer from "./slices/channelsSlice";
import copilotReducer from "./slices/copilotSlice";
import { authApi } from "./api/authApi";
import { leadsApi } from "./api/leadsApi";
import { inboxApi } from "./api/inboxApi";
import { creditsApi } from "./api/creditsApi";
import { agentsApi } from "./api/agentsApi";
import { approvalsApi } from "./api/approvalsApi";
import { connectorsApi } from "./api/connectorsApi";
import { competitorsApi } from "./api/competitorsApi";
import { socialApi } from "./api/socialApi";
import { campaignsApi } from "./api/campaignsApi";
import { teamApi } from "./api/teamApi";
import { knowledgeApi } from "./api/knowledgeApi";
import { dashboardApi } from "./api/dashboardApi";
import { adminApi } from "./api/adminApi";
import { auditApi } from "./api/auditApi";
import { contentApi } from "./api/contentApi";
import { workflowsApi } from "./api/workflowsApi";
import { companyApi } from "./api/companyApi";
import { notificationsApi } from "./api/notificationsApi";
import { mediaApi } from "./api/mediaApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leads: leadsReducer,
    inbox: inboxReducer,
    channels: channelsReducer,
    copilot: copilotReducer,
    [authApi.reducerPath]: authApi.reducer,
    [leadsApi.reducerPath]: leadsApi.reducer,
    [inboxApi.reducerPath]: inboxApi.reducer,
    [creditsApi.reducerPath]: creditsApi.reducer,
    [agentsApi.reducerPath]: agentsApi.reducer,
    [approvalsApi.reducerPath]: approvalsApi.reducer,
    [connectorsApi.reducerPath]: connectorsApi.reducer,
    [competitorsApi.reducerPath]: competitorsApi.reducer,
    [socialApi.reducerPath]: socialApi.reducer,
    [campaignsApi.reducerPath]: campaignsApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
    [knowledgeApi.reducerPath]: knowledgeApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [auditApi.reducerPath]: auditApi.reducer,
    [contentApi.reducerPath]: contentApi.reducer,
    [workflowsApi.reducerPath]: workflowsApi.reducer,
    [companyApi.reducerPath]: companyApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [mediaApi.reducerPath]: mediaApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      leadsApi.middleware,
      inboxApi.middleware,
      creditsApi.middleware,
      agentsApi.middleware,
      approvalsApi.middleware,
      connectorsApi.middleware,
      competitorsApi.middleware,
      socialApi.middleware,
      campaignsApi.middleware,
      teamApi.middleware,
      knowledgeApi.middleware,
      dashboardApi.middleware,
      adminApi.middleware,
      auditApi.middleware,
      contentApi.middleware,
      workflowsApi.middleware,
      companyApi.middleware,
      notificationsApi.middleware,
      mediaApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
