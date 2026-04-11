import { useEffect, useState } from 'react'

import { getAdminUsers } from '@/api/admin'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import type { AdminUserRow } from '@/types/admin'
import { getApiErrorMessage } from '@/utils/api'
import { formatDateTime } from '@/utils/formatDateTime'

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadUsers() {
      try {
        const response = await getAdminUsers()

        if (!isMounted) {
          return
        }

        setUsers(response.items)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          getApiErrorMessage(error, 'Unable to load platform users right now.'),
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadUsers()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return <LoadingScreen message="Loading platform users..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Review role distribution and activity across all NearCart users."
        eyebrow="Admin users"
        title="Platform users"
      />

      <DashboardCard title="User directory">
        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Merchant</th>
                <th className="pb-3 font-medium">Stats</th>
                <th className="pb-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-4">
                    <p className="font-semibold text-ink-900">{user.fullName}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </td>
                  <td className="py-4">
                    <StatusPill label={user.role.replaceAll('_', ' ')} tone="neutral" />
                  </td>
                  <td className="py-4">
                    {user.businessName ? (
                      <div className="space-y-1">
                        <p className="font-medium text-ink-900">{user.businessName}</p>
                        <StatusPill
                          label={user.shopOwnerApproved ? 'Approved' : 'Pending'}
                          tone={user.shopOwnerApproved ? 'success' : 'warning'}
                        />
                      </div>
                    ) : (
                      <span className="text-slate-500">Not applicable</span>
                    )}
                  </td>
                  <td className="py-4">
                    <p>Orders: {user.orderCount}</p>
                    <p>Addresses: {user.addressCount}</p>
                  </td>
                  <td className="py-4">{formatDateTime(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  )
}
