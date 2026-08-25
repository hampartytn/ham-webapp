"use client";

import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";

const COLORS: Record<string, string> = {
  PUBLISHED: "#be1b0f",
  DRAFT: "#d1d5db",
  UNPUBLISHED: "#9ca3af",
  CLOSED: "#fca5a5",
};

type Counts = {
  PUBLISHED: number;
  DRAFT: number;
  UNPUBLISHED: number;
  CLOSED: number;
};

export function EmployerJobDonut({ counts }: { counts: Counts }) {
  const t = useTranslations("employer");
  const total =
    counts.PUBLISHED + counts.DRAFT + counts.UNPUBLISHED + counts.CLOSED;
  const activePct =
    total > 0 ? Math.round((counts.PUBLISHED / total) * 100) : 0;

  const data = (
    [
      ["PUBLISHED", counts.PUBLISHED],
      ["DRAFT", counts.DRAFT],
      ["UNPUBLISHED", counts.UNPUBLISHED],
      ["CLOSED", counts.CLOSED],
    ] as const
  )
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      key,
      name: t(`status.${key}` as "status.DRAFT"),
      value,
    }));

  const chartData =
    data.length > 0
      ? data
      : [{ key: "EMPTY", name: t("noJobsYet"), value: 1 }];

  return (
    <div className="ham-employer__card ham-employer__donut-wrap h-full">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--emp-ink)]">
          {t("jobStatusMix")}
        </h2>
      </div>

      <div className="relative mx-auto h-[9.5rem] w-full max-w-[11rem]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={data.length > 1 ? 3 : 0}
              stroke="none"
              isAnimationActive
              animationDuration={700}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={
                    entry.key === "EMPTY"
                      ? "#e5e7eb"
                      : (COLORS[entry.key] ?? "#d1d5db")
                  }
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <motion.p
            className="text-lg font-extrabold tracking-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            {total === 0 ? "—" : `${activePct}%`}
          </motion.p>
          <p className="text-[0.62rem] font-semibold tracking-[0.12em] text-[var(--emp-muted)] uppercase">
            {t("donutActiveLabel")}
          </p>
        </div>
      </div>

      <ul className="mt-auto flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1 text-[0.72rem] text-[var(--emp-muted)]">
        <li className="inline-flex items-center gap-1.5">
          <span
            className="size-2 rounded-full bg-[var(--emp-primary)]"
            aria-hidden
          />
          {t("status.PUBLISHED")} ({counts.PUBLISHED})
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-gray-300" aria-hidden />
          {t("status.DRAFT")} ({counts.DRAFT})
        </li>
      </ul>
    </div>
  );
}
