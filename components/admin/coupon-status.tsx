"use client";

import { useEffect, useState } from "react";

export type CouponStatusValue = "Active" | "Scheduled" | "Expired" | "Limit reached" | "Inactive";

type CouponStatusProps = {
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  usageCount: number;
  usageLimit: number | null;
  initialStatus: CouponStatusValue;
};

function getCouponStatus({
  isActive,
  startsAt,
  endsAt,
  usageCount,
  usageLimit,
}: Omit<CouponStatusProps, "initialStatus">): CouponStatusValue {
  if (!isActive) return "Inactive";
  const now = Date.now();
  if (endsAt && new Date(endsAt).getTime() < now) return "Expired";
  if (startsAt && new Date(startsAt).getTime() > now) return "Scheduled";
  if (usageLimit != null && usageCount >= usageLimit) return "Limit reached";
  return "Active";
}

const statusClasses: Record<CouponStatusValue, string> = {
  Active: "bg-green-50 text-green-700",
  Scheduled: "bg-blue-50 text-blue-700",
  Expired: "bg-gray-100 text-gray-600",
  "Limit reached": "bg-amber-50 text-amber-700",
  Inactive: "bg-gray-100 text-gray-600",
};

export function CouponStatus({
  isActive,
  startsAt,
  endsAt,
  usageCount,
  usageLimit,
  initialStatus,
}: CouponStatusProps) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(getCouponStatus({ isActive, startsAt, endsAt, usageCount, usageLimit }));
    };
    updateStatus();
    const intervalId = window.setInterval(updateStatus, 30_000);
    return () => window.clearInterval(intervalId);
  }, [isActive, startsAt, endsAt, usageCount, usageLimit]);

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[status]}`}>
      {status}
    </span>
  );
}
