import { EmployerApplicants } from "@/features/employer/employer-jobs";

type Props = { params: Promise<{ jobId: string }> };

export default async function Page({ params }: Props) {
  const { jobId } = await params;
  return <EmployerApplicants jobId={jobId} />;
}
