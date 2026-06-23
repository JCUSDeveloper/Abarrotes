import type { SVGProps } from "react";

export type IconName =
  | "arrow-down"
  | "arrow-left"
  | "arrow-right"
  | "arrow-up"
  | "bell"
  | "box"
  | "cart"
  | "chart"
  | "check"
  | "chevron-down"
  | "clipboard"
  | "clock"
  | "close"
  | "copy"
  | "dashboard"
  | "dollar"
  | "download"
  | "edit"
  | "eye"
  | "eye-off"
  | "filter"
  | "folder"
  | "bolt"
  | "list"
  | "link"
  | "lock"
  | "logout"
  | "mail"
  | "menu"
  | "minus"
  | "more"
  | "package"
  | "plus"
  | "refresh"
  | "search"
  | "send"
  | "settings"
  | "shield"
  | "sort"
  | "store"
  | "swap"
  | "tag"
  | "truck"
  | "trash"
  | "trend"
  | "upload"
  | "users"
  | "warning";

type IconProps = SVGProps<SVGSVGElement> & { name: IconName };

export function Icon({ name, ...props }: IconProps) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<IconName, React.ReactNode> = {
    "arrow-down": <><path d="M12 5v14"/><path d="m17 14-5 5-5-5"/></>,
    "arrow-left": <><path d="m15 18-6-6 6-6"/></>,
    "arrow-right": <><path d="m9 18 6-6-6-6"/></>,
    "arrow-up": <><path d="M12 19V5"/><path d="m7 10 5-5 5 5"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    box: <><path d="m21 8-9 5-9-5"/><path d="m3 8 9-5 9 5v8l-9 5-9-5Z"/><path d="M12 13v8"/></>,
    cart: <><path d="M4 5h16l-1.5 9h-13Z"/><path d="M8 5V3h8v2"/><path d="M8 18a1 1 0 1 0 0 2 1 1 0 0 0 0-2M16 18a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/></>,
    chart: <><path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    "chevron-down": <path d="m6 9 6 6 6-6"/>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
    dashboard: <><path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    dollar: <><circle cx="12" cy="12" r="9"/><path d="M16 8.5c-.8-.9-2.2-1.5-4-1.5-2.2 0-3.5 1-3.5 2.5 0 4 7.5 1.5 7.5 5.5 0 1.4-1.4 2.5-3.8 2.5-1.7 0-3.3-.6-4.2-1.7M12 5v14"/></>,
    download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    "eye-off": <><path d="m3 3 18 18"/><path d="M10.6 6.2A10.4 10.4 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.1 2.7M6.5 6.5C4 8.2 2.5 12 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 3.1-.5M10 10a2.8 2.8 0 0 0 4 4"/></>,
    filter: <><path d="M4 5h16l-6 7v5l-4 2v-7Z"/><path d="m16 16 4 4M20 16l-4 4"/></>,
    folder: <path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>,
    bolt: <path d="m13 2-9 12h8l-1 8 9-12h-8Z"/>,
    list: <><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    minus: <path d="M5 12h14"/>,
    more: <><circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></>,
    package: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    refresh: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8a7 7 0 0 1 11.5-2.5L20 8M4 16l2.4 2.5A7 7 0 0 0 17.9 16"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    sort: <><path d="m8 9 4-4 4 4M16 15l-4 4-4-4"/></>,
    store: <><path d="M4 10v10h16V10M3 10l1.5-6h15L21 10"/><path d="M3 10a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2M9 20v-5h6v5"/></>,
    swap: <><path d="M4 7h15l-3-3M20 17H5l3 3"/></>,
    tag: <><path d="M20 13 13 20l-9-9V4h7Z"/><circle cx="8.5" cy="8.5" r="1.2"/></>,
    truck: <><path d="M3 6h11v11H3ZM14 10h4l3 3v4h-7Z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
    trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
    upload: <><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 21h14"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>,
    warning: <><path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...common} {...props}>
      {paths[name]}
    </svg>
  );
}
