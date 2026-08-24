import { AdminUserDetail } from "@/features/admin/admin-pages";

type Props = { params: Promise<{ userId: string }> };

export default async function Page({ params }: Props) {
  const { userId } = await params;
  return <AdminUserDetail userId={userId} />;
}
