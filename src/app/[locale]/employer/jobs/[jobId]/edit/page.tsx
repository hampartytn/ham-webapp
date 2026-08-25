import { EmployerJobForm } from "@/features/employer";

type Props = { params: Promise<{ jobId: string }> };

export default async function EmployerJobEditPage({ params }: Props) {
  const { jobId } = await params;
  return <EmployerJobForm mode="edit" jobId={jobId} />;
}
