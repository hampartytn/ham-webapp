/** Employer feature barrel — keep page imports stable. */

export { EmployerDashboard } from "./employer-dashboard";
export { EmployerOrganizationForm } from "./employer-organization";
export { EmployerJobsList } from "./employer-jobs-list";
export { EmployerJobForm } from "./employer-job-form";
export { EmployerJobDetail } from "./employer-job-detail";
export {
  EmployerApplicants,
  EmployerApplicantsHub,
} from "./employer-applicants";
export { EmployerWorkers } from "./employer-workers";
export { EmployerSettingsPanel } from "./employer-settings";

/** @deprecated Use EmployerJobForm */
export { EmployerJobForm as EmployerJobCreateForm } from "./employer-job-form";
