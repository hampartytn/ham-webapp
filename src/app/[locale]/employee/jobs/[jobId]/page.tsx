import { EmployeeJobDetail } from "@/features/employee/employee-job-detail";

type Props = { params: Promise<{ jobId: string }> };

export default async function Page({ params }: Props) {
  const { jobId } = await params;
  return <EmployeeJobDetail jobId={jobId} />;
}
