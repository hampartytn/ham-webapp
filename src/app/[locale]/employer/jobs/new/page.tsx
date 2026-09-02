import { EmployerJobCreatePageGate } from "@/features/employer/employer-job-create-gate";
import { EmployerJobForm } from "@/features/employer";

export default function EmployerNewJobPage() {
  return (
    <EmployerJobCreatePageGate>
      <EmployerJobForm mode="create" />
    </EmployerJobCreatePageGate>
  );
}
