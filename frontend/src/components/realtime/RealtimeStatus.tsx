"use client";

import type { RealtimeStatus } from "../../hooks/useInventoryRealtime";
import { useLocale } from "../../lib/i18n/LocaleProvider";

type RealtimeStatusProps = {
  status: RealtimeStatus;
};

export default function RealtimeStatus({
  status,
}: RealtimeStatusProps) {
  const { t } = useLocale();

  const config = {
    connected: {
      message: t.realtime.connected,
      className:
        "border-green-200 bg-green-50 text-green-700",
      dotClassName: "bg-green-500",
    },
    disconnected: {
      message: t.realtime.disconnected,
      className:
        "border-red-200 bg-red-50 text-red-700",
      dotClassName: "bg-red-500",
    },
    reconnecting: {
      message: t.realtime.reconnecting,
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
      dotClassName: "bg-amber-500",
    },
  }[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${config.className}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${config.dotClassName}`}
        aria-hidden="true"
      />

      <span>{config.message}</span>
    </div>
  );
}