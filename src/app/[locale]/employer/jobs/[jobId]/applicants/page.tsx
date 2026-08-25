import { EmployerApplicants } from "@/features/employer";

type Props = { params: Promise<{ jobId: string }> };

export default async function EmployerJobApplicantsPage({ params }: Props) {
  const { jobId } = await params;
  return <EmployerApplicants jobId={jobId} />;
}
