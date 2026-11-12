# Proposed Design System

## Status and intent

The backend and product documents do not define a brand identity, existing frontend theme, or design tokens. This is a **provisional UI direction for review**, not an existing project decision or generated design. Keep the system easy to revise after the user provides brand assets or preferences.

## Visual direction

- Calm, professional SaaS operations console for agency teams.
- Prioritize readable operational data, quick scanning, and clear states over decorative illustrations.
- Use a light neutral canvas, white surfaces, restrained blue accents, and semantic colors for state.
- Avoid heavy gradients, excessive shadows, neon colors, and dense dashboard decoration.
- Use charts only for backend-provided aggregate values.

## Provisional colors

| Token | Value | Use |
|---|---|---|
| `canvas` | `#F5F7FA` | Main app background |
| `surface` | `#FFFFFF` | Cards, forms, menus |
| `surface-muted` | `#EEF2F6` | Secondary sections and table headers |
| `text-primary` | `#172033` | Headings and primary text |
| `text-secondary` | `#586579` | Labels and supporting copy |
| `border` | `#DCE3EC` | Dividers, inputs, card edges |
| `primary` | `#3157D5` | Main actions, active navigation, links |
| `primary-hover` | `#2446B8` | Hover/pressed primary actions |
| `success` | `#18845B` | Connected, published, saved |
| `warning` | `#A86108` | Expiring token, pending, attention |
| `danger` | `#B42332` | Failed, disconnected, destructive confirmation |
| `info` | `#2769A6` | Informational callouts |

Use text/icon labels as well as color for statuses. Check contrast for all text and interactive controls before implementation.

## Typography

- Provisional family: **Inter**, with a system sans-serif fallback (for example `Segoe UI`, Arial).
- Body: 14–16 px; dense table text should remain readable at 14 px or larger.
- Page title: 24–28 px, semibold.
- Section heading: 16–18 px, semibold.
- Labels and metadata: 12–14 px; avoid low-contrast or tiny metadata.
- Use tabular numerals for scores/counts where available.
- Load an external font only if the approved frontend approach permits it; otherwise use system fonts.

## Application shell

### Sidebar

- Desktop: fixed-width navigation rail around 240–256 px with product name/logo area, role-appropriate navigation, and account/tenant context near the bottom.
- Suggested navigation: Overview, Agent workspace, Inbox, Leads, Publishing, Channels, Organization; show Team for permitted roles and Tenant directory for SUPERADMIN only.
- Active item: subtle primary-tinted background, primary icon/text, and a clear active indicator.
- Collapse to an icon rail only if tooltips, accessible names, and a reliable expand action are provided.
- Mobile: replace persistent sidebar with an accessible menu/drawer; it is an overlay, not a separate page.

### Navbar

- Top bar contains current page title or breadcrumb, tenant context/selector where applicable, and profile/session menu.
- SUPERADMIN tenant selector must make selected tenant context explicit and avoid implying all tenant views are available from every endpoint.
- Keep notifications out of scope until there is an actual notification API.

## Layout and spacing

- Use a 4 px base spacing scale: 4, 8, 12, 16, 24, 32, 40, 48.
- Main content max width: roughly 1440 px; use fluid width below that.
- Desktop content padding: 24–32 px; tablet: 20–24 px; mobile: 16 px.
- Card padding: 20–24 px desktop, 16 px mobile.
- Use a 12-column grid for dashboard data; cards stack naturally at narrow widths.
- Keep forms to a comfortable reading width (about 640–760 px); long table views may use the full content width.
- Maintain consistent vertical rhythm and align table, card, and form edges.

## Reusable component styles

- **Cards:** white surface, 1 px border, 8–12 px radius, minimal or no shadow.
- **Buttons:** 40–44 px minimum height; primary, secondary/outline, quiet, and destructive variants. Include disabled and loading states.
- **Inputs:** visible label, helper/error text, clear focus ring, consistent 40–44 px control height.
- **Tables:** clear column headers, aligned numeric values, row hover/focus, responsive overflow or card transformation. Avoid unbacked row actions.
- **Status badges:** compact pill with icon/text and semantic color; use labels such as Connected, Pending, Published, Failed, Escalated only when the API supports the state.
- **Charts:** restrained palette, visible axes/legend, text summary, and no fabricated time-series data.
- **Dialogs/drawers:** labeled title, predictable close behavior, keyboard focus management, explicit primary/cancel actions.
- **Empty/error/loading states:** shared components with clear heading, short explanatory copy, and retry/action only when supported.
- **Conversation UI:** distinguish incoming content from agent replies with labels and timestamps; do not imply a full transcript if only the latest row is available.

## Responsive behavior

- Desktop: sidebar plus content area; dashboard cards and tables use available width.
- Tablet: narrower/collapsible navigation; multi-column cards reduce to two columns; preserve comfortable form widths.
- Mobile: navigation becomes a menu; dashboard cards stack; forms become full-width; tables become horizontally scrollable or concise cards; inbox list/detail may use a drawer or one-at-a-time view.
- Keep all keyboard and screen-reader access available at every breakpoint. Do not hide critical error, tenant, escalation, or token-expiration information on small screens.

## Design consistency rules

- Reuse the same color, type, spacing, border, radius, focus, and status tokens across all modules.
- Keep a stable shell and page title placement.
- Use the same interaction pattern for save, retry, confirmation, and error feedback.
- Use platform names/icons consistently but never rely on icons alone.
- The prompts in [04-stitch-prompts.md](./04-stitch-prompts.md) repeat these tokens so visual exploration remains coherent.
