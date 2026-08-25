import { EmployerJobDetail } from "@/features/employer";

type Props = { params: Promise<{ jobId: string }> };

export default async function EmployerJobDetailPage({ params }: Props) {
  const { jobId } = await params;
  return <EmployerJobDetail jobId={jobId} />;
}
