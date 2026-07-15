import { Badge } from "@/components/ui/badge";
import type { TransactionStatus } from "@/types/database";

const VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary" | "default"> = {
  completed: "success",
  approved: "success",
  active: "success",
  paid: "success",
  pending: "warning",
  rejected: "destructive",
  suspended: "destructive",
  cancelled: "secondary",
  waived: "secondary",
  none: "secondary",
  admin: "default",
  user: "secondary",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANT[status] ?? "default"} className="capitalize">
      {status}
    </Badge>
  );
}

export function isPending(status: TransactionStatus | string) {
  return status === "pending";
}
