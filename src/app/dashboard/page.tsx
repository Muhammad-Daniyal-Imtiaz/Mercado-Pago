import { UserProfile } from '@/components/dashboard/UserProfile'
import { AlertList } from '@/components/alerts/AlertList'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <UserProfile />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertList limit={5} />
        {/* Other widgets */}
      </div>
    </div>
  )
}