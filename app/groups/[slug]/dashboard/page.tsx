import { withDB } from '@/lib/db'
import '@/models'
import Group from '@/models/Group'
import GroupMember from '@/models/GroupMember'
import { getSession } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import mongoose from 'mongoose'
import Link from 'next/link'
import GroupMemberRequestsPanel from '@/components/GroupMemberRequestsPanel'
import GroupPendingTopicsPanel from '@/components/GroupPendingTopicsPanel'
import GroupDashboardTabs from '@/components/GroupDashboardTabs'
import GroupMembersPanel from '@/components/GroupMembersPanel'
import GroupSettingsPanel from '@/components/GroupSettingsPanel'
import GroupLogsPanel from '@/components/GroupLogsPanel'

interface PageProps {
  params: { slug: string }
}

export default async function GroupDashboardPage({ params }: PageProps) {
  const session = await getSession()
  if (!session?.id) {
    redirect(`/login?redirect=${encodeURIComponent(`/groups/${params.slug}/dashboard`)}`)
  }

  const data = await withDB(async () => {
    const group = await Group.findOne({ slug: params.slug }).select('_id name slug isPublic isApprovalRequired').lean()
    if (!group) return null

    const membership = await GroupMember.findOne({
      groupId: group._id,
      userId: new mongoose.Types.ObjectId(session.id),
      status: 'active',
    })
      .select('role')
      .lean()

    return {
      group: {
        id: (group as any)._id.toString(),
        name: (group as any).name,
        slug: (group as any).slug,
        isPublic: (group as any).isPublic,
        isApprovalRequired: (group as any).isApprovalRequired,
      },
      role: membership?.role || null,
    }
  })

  if (!data) notFound()

  if (data.role !== 'admin' && data.role !== 'moderator') {
    redirect(`/groups/${params.slug}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <GroupDashboardTabs
        slug={data.group.slug}
        groupName={data.group.name}
        panels={{
          overview: (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-6">
                  <p className="text-slate-900 dark:text-slate-100 font-bold">نظرة عامة</p>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">إدارة سريعة لأهم عناصر المجتمع.</p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-gradient-to-b from-white to-purple-50/40 dark:from-slate-900 dark:to-slate-900">
                      <div className="text-slate-500 dark:text-slate-400">النوع</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">{data.group.isPublic ? 'عام' : 'خاص'}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-gradient-to-b from-white to-purple-50/40 dark:from-slate-900 dark:to-slate-900">
                      <div className="text-slate-500 dark:text-slate-400">الانضمام</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">{data.group.isApprovalRequired ? 'يتطلب موافقة' : 'مفتوح'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-6">
                  <p className="text-slate-900 dark:text-slate-100 font-bold">روابط سريعة</p>
                  <div className="mt-3 space-y-2">
                    <Link href={`/groups/${data.group.slug}`} className="block text-anime-purple hover:text-anime-pink font-semibold">
                      فتح صفحة المجتمع
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ),
          posts: <GroupPendingTopicsPanel groupId={data.group.id} />,
          requests: <GroupMemberRequestsPanel groupId={data.group.id} />,
          members: <GroupMembersPanel groupId={data.group.id} />,
          settings: <GroupSettingsPanel groupId={data.group.id} />,
          logs: <GroupLogsPanel groupId={data.group.id} />,
        }}
      />
    </div>
  )
}
