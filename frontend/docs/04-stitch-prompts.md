# Google Stitch Prompts

These are prompts for visual exploration only. They are not generated designs or frontend code. Use the same provisional design language in every prompt. Do not ask Stitch to add product capabilities that the backend does not expose.

## Shared design language

Use a professional, calm SaaS operations-console style. Light `#F5F7FA` canvas, white `#FFFFFF` surfaces, `#172033` primary text, `#586579` secondary text, `#DCE3EC` borders, `#3157D5` primary actions, `#18845B` success, `#A86108` warning, and `#B42332` danger. Use Inter or a system sans-serif, 4 px spacing scale, subtle 8–12 px card radii, restrained shadows, accessible contrast, visible focus, and clear responsive behavior. Keep the desktop sidebar/navbar consistent: 240–256 px sidebar, selected navigation item in a subtle primary tint, tenant context and account menu in the top bar. Do not use fabricated analytics, add features not listed below, or create production code.

## 1. Authentication and tenant registration

> Create a visual direction for two related public screens in the same design system: a sign-in screen with email/password and a tenant registration form with company name, contact email, brand voice, optional Google Sheet ID, and optional booking URL. Keep forms focused and accessible with inline validation, loading, and error states. Clearly distinguish tenant record creation from account creation: registration does not create a login. Do not invent password reset, SSO, MFA, or a completed self-service onboarding flow. Use the shared SMMA console design language.

## 2. Overview and analytics

> Create the Overview page inside the shared SMMA console shell. Include summary cards for total leads, hot leads, total conversations, total scheduled posts, and published posts, plus a restrained platform-breakdown chart with legend and accessible text summary. Include an explicit tenant selector only for the SUPERADMIN view. Design loading skeleton, successful zero-data empty state, and API error/retry state. Do not add date filters, revenue, reach, engagement, conversion rates, time series, or other unsupported metrics.

## 3. Agent workspace

> Create the Agent workspace inside the shared SMMA console shell. Include a task/message composer, channel selector, optional supported direct-agent selector, run action, and a results area showing response, assigned agent if returned, lead score/stage if returned, human-review indicator, and execution trace. Include idle, running, result, and error states. Do not imply saved chat history, autonomous approval controls, or external side effects that are not confirmed by the API. Make trace details collapsible without creating another page.

## 4. Conversations and leads

> Create two operational data pages in the shared SMMA console style: an Inbox with a conversation list, platform filter, selected row, reply composer, and escalation indicator; and a read-only Leads table with contact, channel, inquiry, score, stage, and created date. Include empty, loading, and error states. Inbox actions are manual reply and escalation toggle only. Leads have no edit/delete, search, pagination, or assignment. Use a responsive conversation detail drawer on smaller screens and a read-only lead detail drawer if needed. Do not fabricate conversation history or lead fields.

## 5. Compose and schedule

> Create a single-post compose-and-schedule screen in the shared SMMA console shell. Include one selected platform (Instagram, Facebook, LinkedIn, or X/Twitter), draft content, optional image URL, an optimal-time toggle, and exact date/time when optimal scheduling is disabled. The API creates a scheduled post and returns an ID/formatted content; it does not provide a post calendar, queue/history, edit/cancel action, or immediate publish control. Include submission confirmation, loading, validation, and error states; do not render a fake calendar.

## 6. Channels and organization settings

> Create a Channels page and an Organization settings page in the shared SMMA console shell. Channels shows connection status, account ID, known token expiration, and a manual connect form with platform/account ID/access token plus optional refresh token and expiry; include a disconnect confirmation. Never reveal saved token values or imply OAuth/account discovery. Organization settings includes company name, brand voice, Google Sheet ID, booking URL, notification email, and active state when returned. Use tabs or sections within the same page, with save/loading/error feedback. Do not add CRM webhook credentials or integration controls without API support.

## 7. Team and tenant administration

> Create a Team user-creation page and a SUPERADMIN tenant-directory view using the shared SMMA console shell. Team contains a create-user form (full name, email, password, role, and tenant selection where permitted); there is no user list or invite/reset workflow. Tenant directory contains company, plan, contact email, active state, creation date, and an edit/detail drawer using available tenant fields; no delete action. Show tenant context clearly and make the tenant directory navigation available only to SUPERADMIN as a UI convention, while not implying that the UI restriction replaces server authorization. Include loading, empty, save, and error states.
