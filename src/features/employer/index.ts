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
export { EmployerWelcome } from "./employer-welcome";
export { EmployerOnboarding } from "./employer-onboarding";
export { EmployerVerificationPage } from "./employer-verification-page";
export { EmployerMembershipPage } from "./employer-membership";
export { EmployerUnavailable } from "./employer-unavailable";

/** @deprecated Use EmployerJobForm */
export { EmployerJobForm as EmployerJobCreateForm } from "./employer-job-form";
