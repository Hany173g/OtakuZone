import { withDB } from '@/lib/db'
import '@/models'
import Group from '@/models/Group'
import GroupMember from '@/models/GroupMember'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Globe, Lock, Users } from 'lucide-react'
import mongoose from 'mongoose'
import GroupJoinButton from '@/components/GroupJoinButton'
import GroupPostsSection from '@/components/GroupPostsSection'
import GroupTopic from '@/models/GroupTopic'
import GroupComment from '@/models/GroupComment'
import Like from '@/models/Like'
import Dislike from '@/models/Dislike'

interface GroupPageProps {
  params: { slug: string }
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function generateMetadata({ params }: GroupPageProps): Promise<Metadata> {
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const group = await withDB(async () => {
    return Group.findOne({ slug: params.slug }).select('name description image coverImage isPublic updatedAt').lean()
  })

  if (!group) {
    return { title: 'المجتمع غير موجود | OtakuZone' }
  }

  const description = stripHtml(group.description || '').slice(0, 160)
  const url = `${siteUrl}/groups/${params.slug}`
  const image = group.coverImage || group.image

  return {
    title: `${group.name} | OtakuZone`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: group.name,
      description,
      url,
      type: 'website',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: group.name,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function GroupPage({ params }: GroupPageProps) {
  const session = await getSession()

  const group = await withDB(async () => {
    const found = await Group.findOne({ slug: params.slug })
      .populate('creatorId', 'name image')
      .lean()

    if (!found) return null

    let isMember = false
    let role: string | null = null
    let membershipStatus: 'active' | 'pending' | 'banned' | null = null

    if (session?.id) {
      const membership = await GroupMember.findOne({
        groupId: found._id,
        userId: new mongoose.Types.ObjectId(session.id),
      })
        .select('role status')
        .lean()

      membershipStatus = (membership?.status as any) || null
      isMember = membership?.status === 'active'
      role = membership?.status === 'active' ? membership?.role || null : null
    }

    return {
      ...found,
      id: found._id.toString(),
      creator: found.creatorId,
      isMember,
      role,
      membership: membershipStatus
        ? {
            status: membershipStatus,
            role: (role || membershipStatus === 'active') ? role : (undefined as any),
          }
        : null,
      canModerate: role === 'admin' || role === 'moderator',
    }
  })

  if (!group) {
    notFound()
  }

  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const groupJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: group.name,
    description: stripHtml(group.description || '').slice(0, 200) || undefined,
    url: `${siteUrl}/groups/${group.slug}`,
    logo: group.image
      ? {
          '@type': 'ImageObject',
          url: group.image,
        }
      : undefined,
    image: group.coverImage ? [group.coverImage] : group.image ? [group.image] : undefined,
  }

  const canViewPosts = group.isPublic || group.isMember

  const initialPosts = await withDB(async () => {
    if (!canViewPosts) return []
    const items = await GroupTopic.find({ groupId: new mongoose.Types.ObjectId(group.id), status: 'published' })
      .populate('authorId', 'name image')
      .populate('categoryId')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(10)
      .lean()

    const enriched = await Promise.all(
      items.map(async (t: any) => {
        const [commentCount, likeCount, dislikeCount] = await Promise.all([
          GroupComment.countDocuments({ groupTopicId: t._id }),
          Like.countDocuments({ groupTopicId: t._id }),
          Dislike.countDocuments({ groupTopicId: t._id }),
        ])
        const author = t.isAnonymous ? { name: t.anonymousName || 'مجهول', image: null } : (t.authorId || null)
        return {
          ...t,
          id: t._id.toString(),
          author,
          group: { name: group.name, slug: group.slug, image: group.image },
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : undefined,
          _count: { comments: commentCount, likes: likeCount, dislikes: dislikeCount },
        }
      })
    )

    return enriched
  })

  const safeInitialPosts = JSON.parse(JSON.stringify(initialPosts))

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(groupJsonLd) }}
      />
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {group.coverImage ? (
          <div
            className="h-40 md:h-56 bg-cover bg-center"
            style={{ backgroundImage: `url(${group.coverImage})` }}
          />
        ) : (
          <div className="h-40 md:h-56 bg-gradient-to-r from-anime-purple via-anime-pink to-anime-blue" />
        )}

        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {group.image ? (
                <img src={group.image} alt={group.name} className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-anime-purple flex items-center justify-center text-white font-bold text-2xl">
                  {group.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{group.name}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                  <span className="flex items-center gap-1">
                    {group.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {group.isPublic ? 'عام' : 'خاص'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {group.memberCount} عضو
                  </span>
                  {group.isMember && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">عضو</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <GroupJoinButton
                groupId={group.id}
                groupSlug={group.slug}
                isPublic={group.isPublic}
                isApprovalRequired={group.isApprovalRequired}
                initialMembership={group.membership ? { status: (group.membership as any).status, role: group.role || 'member' } : null}
                isLoggedIn={!!session?.id}
              />
              {group.canModerate && (
                <Link
                  href={`/groups/${group.slug}/dashboard`}
                  className="text-gray-700 hover:text-anime-purple font-semibold"
                >
                  لوحة الإدارة
                </Link>
              )}
              <Link
                href="/groups"
                className="text-gray-700 hover:text-anime-purple font-semibold"
              >
                رجوع للمجتمع
              </Link>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <p className="text-gray-800 font-bold mb-3">حول المجتمع</p>
                <p className="text-gray-700 leading-relaxed">
                  {group.description ? group.description : 'لا يوجد وصف بعد.'}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {group.tags && group.tags.length > 0 &&
                    group.tags.slice(0, 8).map((tag: string, idx: number) => (
                      <span key={idx} className="bg-white border border-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                </div>
              </div>

              <div className="mt-6">
                <GroupPostsSection
                  groupId={group.id}
                  canViewPosts={canViewPosts}
                  isLoggedIn={!!session?.id}
                  isMember={group.isMember}
                  allowAnonymousPosts={Boolean((group as any)?.settings?.allowAnonymousPosts)}
                  postApprovalRequired={Boolean((group as any)?.settings?.postApprovalRequired)}
                  initialItems={safeInitialPosts}
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <p className="text-gray-800 font-bold mb-4">معلومات</p>

                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">النوع</span>
                    <span className="font-semibold">{group.isPublic ? 'عام' : 'خاص'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">الانضمام</span>
                    <span className="font-semibold">{group.isApprovalRequired ? 'يتطلب موافقة' : 'مفتوح'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">الأعضاء</span>
                    <span className="font-semibold">{group.memberCount}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  <span className="text-gray-600">أنشأه</span>{' '}
                  {(group.creator as any)?._id ? (
                    <Link
                      href={`/profile/${String((group.creator as any)._id)}`}
                      className="inline-flex items-center gap-2 font-extrabold text-gray-900 hover:text-anime-purple transition"
                    >
                      <img
                        src={(group.creator as any)?.image || '/default-avatar.svg'}
                        alt={(group.creator as any)?.name || 'User'}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{(group.creator as any)?.name || 'مجهول'}</span>
                    </Link>
                  ) : (
                    <span className="font-extrabold text-gray-900">{(group.creator as any)?.name || 'مجهول'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
