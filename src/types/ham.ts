/** Domain types mirrored from Nest API responses (fields Nest returns). */

export type MeResponse = {
  id: string;
  role: string;
  phone: string;
  email: string | null;
  preferredLanguage: "ta" | "en" | "hi";
  accountStatus: string;
  onboarding: {
    phoneVerified: boolean;
    profileComplete: boolean;
    identityVerified: boolean;
    hamMembershipStatus: string;
  };
  employeeProfile: {
    id: string;
    fullName: string | null;
    districtId: string | null;
    availabilityStatus: string | null;
    skillCount: number;
    image: { fileId: string; url: string } | null;
  } | null;
  employerProfile: {
    id: string;
    fullName: string | null;
    organizationId: string | null;
    organizationName: string | null;
  } | null;
};

export type EmployeeProfile = {
  id: string;
  fullName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  districtId: string | null;
  cityId: string | null;
  areaId: string | null;
  availabilityStatus: string | null;
  availableFrom: string | null;
  bio: string | null;
  image: { fileId: string; url: string } | null;
  skills: { skillId: string; code: string; name: string; yearsExperience: number | null }[];
};

export type CatalogItem = { id: string; code: string; name: string; categoryId?: string; districtId?: string; cityId?: string };

export type PublicJob = {
  id: string;
  title: string;
  description?: string;
  jobType: string;
  status: string;
  districtId: string;
  cityId: string | null;
  areaId: string | null;
  vacancies: number;
  wageMinPaise: number | null;
  wageMaxPaise: number | null;
  wagePeriod: string | null;
  publishedAt: string | null;
  organization: { id: string; name: string };
  skills: { skillId: string; code: string; name: string }[];
};

export type ApplicationItem = {
  id: string;
  jobId: string;
  status: string;
  coverNote: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    status: string;
    organization: { id: string; name: string };
  };
};

export type MembershipStatus = {
  status: string;
  canJoin: boolean;
  termsVersion: string;
  identityVerified: boolean;
};

export type VerificationMe = {
  verificationId: string;
  status: string;
  provider: string;
  maskedIdentity?: string | null;
  failureCode?: string | null;
} | null;

export type LegalProvider = {
  id: string;
  name: string;
  description: string | null;
  trustLevel: string;
  phone: string | null;
  email: string | null;
  addressText: string | null;
  category: { id: string; code: string; name: string };
};

export type EmployerOrg = {
  id: string;
  name: string;
  description: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  districtId: string | null;
  cityId: string | null;
  verificationState: string;
  activationStatus: string;
};

export type EmployerJob = Omit<PublicJob, "description"> & {
  description: string;
  createdByUserId: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApplicantItem = {
  id: string;
  status: string;
  coverNote: string | null;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    fullName: string | null;
    districtId: string | null;
    availabilityStatus: string | null;
    availableFrom: string | null;
    skills: { skillId: string; code: string; name: string; yearsExperience?: number | null }[];
  };
};

export type WorkerCard = {
  id: string;
  fullName: string | null;
  districtId: string | null;
  availabilityStatus: string | null;
  availableFrom: string | null;
  identityVerified: boolean;
  skills: { skillId: string; code: string; name: string }[];
};

export type AdminUser = {
  id: string;
  role: string;
  phone: string;
  email: string | null;
  accountStatus: string;
  preferredLanguage: string;
  createdAt: string;
};

export type AdminMetrics = {
  usersByRole?: Record<string, number>;
  usersByStatus?: Record<string, number>;
  jobsByStatus?: Record<string, number>;
  applicationsLast7Days?: number;
  applicationsLast30Days?: number;
  [key: string]: unknown;
};
