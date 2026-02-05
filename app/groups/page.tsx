import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import Group from '@/models/Group'
import GroupMember from '@/models/GroupMember'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Users, Plus, Search, Lock, Globe } from 'lucide-react'
import mongoose from 'mongoose'

export default async function GroupsPage() {
  const session = await getSession()

  const groups = await withDB(async () => {
    const foundGroups = await Group.find({ isPublic: true })
      .populate('creatorId', 'name image')
      .sort({ memberCount: -1, createdAt: -1 })
      .limit(50)
      .lean()

    // Check if user is member of each group
    const groupsWithMembership = await Promise.all(
      foundGroups.map(async (group: any) => {
        let userRole = null
        if (session?.id) {
          const membership = await GroupMember.findOne({
            groupId: group._id,
            userId: new mongoose.Types.ObjectId(session.id),
            status: 'active',
          }).lean()
          userRole = membership?.role || null
        }

        return {
          ...group,
          id: group._id.toString(),
          creator: group.creatorId,
          isMember: !!userRole,
          userRole,
        }
      })
    )

    return groupsWithMembership
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Users className="w-10 h-10 text-anime-purple" />
            المجتمع
          </h1>
          <p className="text-gray-600">انضم إلى مجتمعات لمناقشة الأنمي والمانجا</p>
        </div>
        {session && (
          <Link
            href="/groups/new"
            className="flex items-center gap-2 bg-anime-purple text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            إنشاء مجتمع جديد
          </Link>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">لا توجد مجتمعات عامة بعد</p>
          {session ? (
            <Link
              href="/groups/new"
              className="inline-block text-anime-purple hover:text-anime-pink font-semibold"
            >
              كن أول من ينشئ مجتمعًا
            </Link>
          ) : (
            <Link
              href="/login?redirect=/groups/new"
              className="inline-block text-anime-purple hover:text-anime-pink font-semibold"
            >
              سجل دخول لإنشاء مجتمع
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group: any) => (
            <Link
              key={group.id}
              href={`/groups/${group.slug}`}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden"
            >
              {group.coverImage && (
                <div
                  className="h-32 bg-cover bg-center"
                  style={{ backgroundImage: `url(${group.coverImage})` }}
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {group.image ? (
                      <img
                        src={group.image}
                        alt={group.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-anime-purple flex items-center justify-center text-white font-bold">
                        {group.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{group.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {group.isPublic ? (
                          <Globe className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                        <span>{group.memberCount} عضو</span>
                      </div>
                    </div>
                  </div>
                  {group.isMember && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      عضو
                    </span>
                  )}
                </div>
                {group.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{group.description}</p>
                )}
                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {group.tags.slice(0, 3).map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  أنشأه{' '}
                  {group.creator?._id ? (
                    <Link href={`/profile/${String(group.creator._id)}`} className="font-semibold hover:text-anime-purple transition">
                      {group.creator?.name || 'مجهول'}
                    </Link>
                  ) : (
                    <span className="font-semibold">{group.creator?.name || 'مجهول'}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

