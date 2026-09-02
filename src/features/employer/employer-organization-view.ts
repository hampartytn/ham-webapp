export type CompanyProfileFields = {
  fullName: string;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  districtId: string;
  cityId: string;
};

export type CompanyProfileChecklistItem = {
  key: "name" | "location" | "contact";
  ok: boolean;
};

function filled(value: string): boolean {
  return value.trim().length > 0;
}

export function companyProfileCompletionPercent(
  fields: CompanyProfileFields,
): number {
  const values = [
    fields.fullName,
    fields.name,
    fields.description,
    fields.contactEmail,
    fields.contactPhone,
    fields.districtId,
    fields.cityId,
  ];
  const count = values.filter(filled).length;
  return Math.round((count / values.length) * 100);
}

export function companyProfileChecklist(
  fields: Pick<
    CompanyProfileFields,
    "name" | "districtId" | "contactEmail" | "contactPhone"
  >,
): CompanyProfileChecklistItem[] {
  return [
    { key: "name", ok: filled(fields.name) },
    { key: "location", ok: filled(fields.districtId) },
    {
      key: "contact",
      ok: filled(fields.contactPhone) || filled(fields.contactEmail),
    },
  ];
}

export function isOrganizationVerified(state: string | undefined): boolean {
  return state === "VERIFIED";
}

export function isPremiumMembership(status: string | undefined): boolean {
  return status === "ACTIVE";
}

export function organizationVerificationBadgeKey(
  state: string | undefined,
):
  | "orgVerifiedOrganization"
  | "orgPendingOrganization"
  | "orgRejectedOrganization"
  | "orgUnverifiedOrganization" {
  if (state === "VERIFIED") return "orgVerifiedOrganization";
  if (state === "PENDING") return "orgPendingOrganization";
  if (state === "REJECTED") return "orgRejectedOrganization";
  return "orgUnverifiedOrganization";
}
