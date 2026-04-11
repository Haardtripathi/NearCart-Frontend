import { useEffect, useState } from 'react'

import { getPendingApprovals, updateShopApproval } from '@/api/admin'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import type { AdminApprovalItem } from '@/types/admin'
import { getApiErrorMessage } from '@/utils/api'

export function AdminApprovalsPage() {
  const [approvals, setApprovals] = useState<AdminApprovalItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionLoadingByShop, setActionLoadingByShop] = useState<
    Record<string, boolean>
  >({})

  async function loadApprovals() {
    const response = await getPendingApprovals()
    setApprovals(response.items)
  }

  useEffect(() => {
    let isMounted = true

    async function loadPage() {
      try {
        const response = await getPendingApprovals()

        if (!isMounted) {
          return
        }

        setApprovals(response.items)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          getApiErrorMessage(error, 'Unable to load pending approvals right now.'),
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPage()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleDecision(
    shopId: string,
    approvalStatus: 'APPROVED' | 'REJECTED',
  ) {
    setActionLoadingByShop((currentState) => ({
      ...currentState,
      [shopId]: true,
    }))
    setErrorMessage(null)

    try {
      await updateShopApproval(shopId, approvalStatus)
      await loadApprovals()
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, 'Unable to update shop approval right now.'),
      )
    } finally {
      setActionLoadingByShop((currentState) => ({
        ...currentState,
        [shopId]: false,
      }))
    }
  }

  if (isLoading) {
    return <LoadingScreen message="Loading pending approvals..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Approve or reject new merchant shop submissions so the platform can safely expand."
        eyebrow="Admin approvals"
        title="Pending shop approvals"
      />

      <DashboardCard title="Approval queue">
        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {approvals.length > 0 ? (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <article
                key={approval.shop.id}
                className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 px-5 py-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="font-display text-2xl text-ink-900">
                        {approval.shop.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {approval.shop.category} •{' '}
                        {[approval.shop.area, approval.shop.city]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill label="PENDING" tone="warning" />
                      <StatusPill
                        label={approval.shop.isActive ? 'ACTIVE' : 'INACTIVE'}
                        tone={approval.shop.isActive ? 'success' : 'neutral'}
                      />
                    </div>
                    <div className="text-sm leading-7 text-slate-600">
                      <p>
                        <span className="font-semibold text-ink-900">Owner:</span>{' '}
                        {approval.owner.user.fullName}
                      </p>
                      <p>
                        <span className="font-semibold text-ink-900">Business:</span>{' '}
                        {approval.owner.profile.businessName}
                      </p>
                      <p>
                        <span className="font-semibold text-ink-900">Email:</span>{' '}
                        {approval.owner.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex items-center justify-center rounded-full bg-nearcart-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-nearcart-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={actionLoadingByShop[approval.shop.id]}
                      onClick={() => handleDecision(approval.shop.id, 'APPROVED')}
                      type="button"
                    >
                      Approve
                    </button>
                    <button
                      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={actionLoadingByShop[approval.shop.id]}
                      onClick={() => handleDecision(approval.shop.id, 'REJECTED')}
                      type="button"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.35rem] bg-slate-50 px-4 py-5 text-sm text-slate-600">
            No pending approvals right now. New merchant shops will appear here for review.
          </div>
        )}
      </DashboardCard>
    </div>
  )
}
