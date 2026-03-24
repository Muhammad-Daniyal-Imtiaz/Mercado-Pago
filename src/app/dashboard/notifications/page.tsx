import { NotificationBell } from '@/components/alerts/NotificationBell'

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <NotificationBell showFull />
    </div>
  )
}