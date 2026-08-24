"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PaginationControls } from "@/components/shared/pagination";
import {
  StatusBadge,
  useBffErrorMessage,
} from "@/components/shared/status-badge";
import { Link } from "@/i18n/navigation";
import {
  BffError,
  bffEnvelope,
  bffJson,
  type OffsetMeta,
  proxyPath,
} from "@/lib/api/bff-client";
import type { AdminMetrics, AdminUser } from "@/types/ham";

function useCanReadUsers() {
  return useQuery({
    queryKey: ["admin-perm-users-read"],
    queryFn: async () => {
      try {
        await bffJson(proxyPath("admin/permissions/check"));
        return true;
      } catch (e) {
        if (e instanceof BffError && e.status === 403) return false;
        throw e;
      }
    },
    retry: false,
  });
}

export function AdminDashboard() {
  const t = useTranslations("admin");
  const sessionQ = useQuery({
    queryKey: ["admin-session"],
    queryFn: () =>
      bffJson<{ ok: boolean; role: string }>(proxyPath("admin/session")),
  });
  const permQ = useCanReadUsers();

  if (sessionQ.isLoading) return <LoadingState />;
  if (sessionQ.error) {
    return <ErrorState code="FORBIDDEN" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("dashboardTitle")}</h1>
      <p className="text-sm">
        {t("sessionOk", { role: sessionQ.data?.role ?? "—" })}
      </p>
      <p className="text-sm text-muted-foreground">
        users.read: {permQ.data ? "yes" : permQ.isLoading ? "…" : "no"}
      </p>
      <ul className="flex flex-wrap gap-3 text-sm">
        {permQ.data ? (
          <li>
            <Link className="underline" href="/admin/users">
              {t("usersTitle")}
            </Link>
          </li>
        ) : null}
        <li>
          <Link className="underline" href="/admin/jobs">
            {t("jobsTitle")}
          </Link>
        </li>
        <li>
          <Link className="underline" href="/admin/legal">
            {t("legalTitle")}
          </Link>
        </li>
        <li>
          <Link className="underline" href="/admin/metrics">
            {t("metricsTitle")}
          </Link>
        </li>
        <li>
          <Link className="underline" href="/admin/audit">
            {t("auditTitle")}
          </Link>
        </li>
        <li>
          <Link className="underline" href="/admin/admins">
            {t("adminsTitle")}
          </Link>
        </li>
      </ul>
    </div>
  );
}

export function AdminUsersPage() {
  const t = useTranslations("admin");
  const errMsg = useBffErrorMessage();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const permQ = useCanReadUsers();

  const listQ = useQuery({
    queryKey: ["admin-users", page, q],
    enabled: permQ.data === true,
    queryFn: () =>
      bffEnvelope<AdminUser[], OffsetMeta>(
        proxyPath("admin/users", { page, limit: 20, q: q || undefined }),
      ),
  });

  if (permQ.isLoading) return <LoadingState />;
  if (permQ.data === false) {
    return <ErrorState code="FORBIDDEN" message={t("noPermission")} />;
  }
  if (listQ.isLoading) return <LoadingState />;
  if (listQ.error) {
    return (
      <ErrorState
        code={
          listQ.error instanceof BffError ? listQ.error.code : undefined
        }
        message={errMsg(listQ.error)}
        onRetry={() => void listQ.refetch()}
      />
    );
  }

  const items = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.limit))
    : 1;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("usersTitle")}</h1>
      <Input
        placeholder="Search phone/email"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
      />
      {items.length === 0 ? <EmptyState /> : null}
      <ul className="space-y-2">
        {items.map((u) => (
          <li key={u.id} className="flex justify-between gap-2 border-b pb-2 text-sm">
            <Link href={`/admin/users/${u.id}`} className="underline">
              {u.phone} · {u.role}
            </Link>
            <StatusBadge status={u.accountStatus} />
          </li>
        ))}
      </ul>
      {meta ? (
        <PaginationControls
          page={page}
          hasPrevious={page > 1}
          hasNext={page < totalPages}
          onPrevious={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}
    </div>
  );
}

export function AdminUserDetail({ userId }: { userId: string }) {
  const t = useTranslations("admin");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [status, setStatus] = useState("ACTIVE");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const userQ = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => bffJson<AdminUser & Record<string, unknown>>(proxyPath(`admin/users/${userId}`)),
  });

  const statusMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath(`admin/users/${userId}/status`), {
        method: "POST",
        body: JSON.stringify({
          accountStatus: status,
          reason: reason || undefined,
        }),
      }),
    onSuccess: async () => {
      setMsg(null);
      await qc.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  if (userQ.isLoading) return <LoadingState />;
  if (userQ.error || !userQ.data) {
    return <ErrorState onRetry={() => void userQ.refetch()} />;
  }
  const u = userQ.data;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("userDetail")}</h1>
      <p className="text-sm">
        {u.phone} · {u.role} · <StatusBadge status={u.accountStatus} />
      </p>
      <div className="flex flex-wrap gap-2">
        <select
          className="h-10 rounded-md border px-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {["ACTIVE", "SUSPENDED", "BLOCKED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Input
          placeholder={t("reason")}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button type="button" onClick={() => statusMut.mutate()}>
          {t("setStatus")}
        </Button>
      </div>
      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
    </div>
  );
}

export function AdminJobsPage() {
  const t = useTranslations("admin");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{
    id: string;
    action: "unpublish" | "close";
  } | null>(null);

  const listQ = useQuery({
    queryKey: ["admin-jobs", page],
    queryFn: () =>
      bffEnvelope<
        {
          id: string;
          title: string;
          status: string;
          organization: string;
        }[],
        OffsetMeta
      >(proxyPath("admin/jobs", { page, limit: 20 })),
  });

  const actMut = useMutation({
    mutationFn: () => {
      if (!confirm) throw new Error("none");
      return bffJson(
        proxyPath(`admin/jobs/${confirm.id}/${confirm.action}`),
        { method: "POST", body: "{}" },
      );
    },
    onSuccess: async () => {
      setConfirm(null);
      await qc.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
  });

  if (listQ.isLoading) return <LoadingState />;
  if (listQ.error) {
    return (
      <ErrorState
        code={listQ.error instanceof BffError ? listQ.error.code : undefined}
        message={errMsg(listQ.error)}
      />
    );
  }

  const items = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.limit))
    : 1;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("jobsTitle")}</h1>
      {items.length === 0 ? <EmptyState /> : null}
      <ul className="space-y-3">
        {items.map((j) => (
          <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm">
            <div>
              <p className="font-medium">{j.title}</p>
              <StatusBadge status={j.status} />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirm({ id: j.id, action: "unpublish" })}
              >
                {t("unpublish")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => setConfirm({ id: j.id, action: "close" })}
              >
                Close
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {meta ? (
        <PaginationControls
          page={page}
          hasPrevious={page > 1}
          hasNext={page < totalPages}
          onPrevious={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={
          confirm?.action === "close"
            ? t("confirmClose")
            : t("confirmUnpublish")
        }
        pending={actMut.isPending}
        onConfirm={() => actMut.mutate()}
      />
    </div>
  );
}

export function AdminLegalPage() {
  const t = useTranslations("admin");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const listQ = useQuery({
    queryKey: ["admin-legal", page],
    queryFn: () =>
      bffEnvelope<
        { id: string; name: string; approvalStatus: string }[],
        OffsetMeta
      >(proxyPath("admin/legal-support/providers", { page, limit: 20 })),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) =>
      bffJson(proxyPath(`admin/legal-support/providers/${id}/approve`), {
        method: "POST",
        body: "{}",
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-legal"] });
    },
  });

  if (listQ.isLoading) return <LoadingState />;
  if (listQ.error) {
    return (
      <ErrorState
        code={listQ.error instanceof BffError ? listQ.error.code : undefined}
        message={errMsg(listQ.error)}
      />
    );
  }

  const items = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.limit))
    : 1;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("legalTitle")}</h1>
      {items.length === 0 ? <EmptyState /> : null}
      <ul className="space-y-2">
        {items.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 border-b pb-2 text-sm">
            <span>
              {p.name} · <StatusBadge status={p.approvalStatus} />
            </span>
            {p.approvalStatus !== "APPROVED" ? (
              <Button
                type="button"
                size="sm"
                onClick={() => approveMut.mutate(p.id)}
              >
                {t("approve")}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {meta ? (
        <PaginationControls
          page={page}
          hasPrevious={page > 1}
          hasNext={page < totalPages}
          onPrevious={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}
    </div>
  );
}

export function AdminMetricsPage() {
  const t = useTranslations("admin");
  const metricsQ = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: () => bffJson<AdminMetrics>(proxyPath("admin/metrics")),
  });

  const rows = useMemo(() => {
    const m = metricsQ.data ?? {};
    return Object.entries(m).map(([k, v]) => ({
      k,
      v: typeof v === "object" ? JSON.stringify(v) : String(v),
    }));
  }, [metricsQ.data]);

  if (metricsQ.isLoading) return <LoadingState />;
  if (metricsQ.error) {
    return (
      <ErrorState
        code={
          metricsQ.error instanceof BffError ? metricsQ.error.code : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("metricsTitle")}</h1>
      <ul className="space-y-2 text-sm">
        {rows.map((r) => (
          <li key={r.k}>
            <span className="font-medium">{r.k}:</span> {r.v}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminAuditPage() {
  const t = useTranslations("admin");
  const [page, setPage] = useState(1);
  const listQ = useQuery({
    queryKey: ["admin-audit", page],
    queryFn: () =>
      bffEnvelope<Record<string, unknown>[], OffsetMeta>(
        proxyPath("admin/audit-logs", { page, limit: 20 }),
      ),
  });

  if (listQ.isLoading) return <LoadingState />;
  if (listQ.error) {
    return (
      <ErrorState
        code={listQ.error instanceof BffError ? listQ.error.code : undefined}
      />
    );
  }

  const items = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.limit))
    : 1;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("auditTitle")}</h1>
      {items.length === 0 ? <EmptyState /> : null}
      <ul className="space-y-2 text-xs font-mono">
        {items.map((row, i) => (
          <li key={i} className="border-b pb-2">
            {JSON.stringify(row)}
          </li>
        ))}
      </ul>
      {meta ? (
        <PaginationControls
          page={page}
          hasPrevious={page > 1}
          hasNext={page < totalPages}
          onPrevious={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}
    </div>
  );
}

export function AdminAdminsPage() {
  const t = useTranslations("admin");
  const errMsg = useBffErrorMessage();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath("admin/admins"), {
        method: "POST",
        body: JSON.stringify({
          phone,
          password,
          permissions: ["users.read", "metrics.read"],
        }),
      }),
    onSuccess: () => setMsg("Created"),
    onError: (e) => setMsg(errMsg(e)),
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">{t("adminsTitle")}</h1>
      <p className="text-sm text-muted-foreground">
        SUPER_ADMIN only. Nest enforces `admins.manage`.
      </p>
      <Input
        placeholder="+91…"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Input
        type="password"
        placeholder="password ≥10"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="button" onClick={() => createMut.mutate()}>
        {t("createAdmin")}
      </Button>
      {msg ? <p className="text-sm">{msg}</p> : null}
    </div>
  );
}
