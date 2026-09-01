import { EmployerUnavailable } from "@/features/employer";

export default function EmployerMessagesPage() {
  return (
    <EmployerUnavailable titleKey="navMessages" bodyKey="messagesUnavailable" />
  );
}
