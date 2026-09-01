import { EmployerUnavailable } from "@/features/employer";

export default function EmployerNotificationsPage() {
  return (
    <EmployerUnavailable
      titleKey="notifications"
      bodyKey="notificationsUnavailable"
    />
  );
}
