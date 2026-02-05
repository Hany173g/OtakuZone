'use client'

import { useEffect, useMemo, useState } from 'react'
import GroupTopicComposer from './GroupTopicComposer'
import GroupTopicFeed from './GroupTopicFeed'

type TopicItem = any

export default function GroupPostsSection(props: {
  groupId: string
  canViewPosts: boolean
  isLoggedIn: boolean
  isMember: boolean
  allowAnonymousPosts: boolean
  postApprovalRequired: boolean
  initialItems: TopicItem[]
}) {
  const initialKey = useMemo(() => {
    return (props.initialItems || []).map((it: any) => String(it?.id || it?._id)).join(',')
  }, [props.initialItems])

  const [showComposer, setShowComposer] = useState(false)
  const [showFeed, setShowFeed] = useState((props.initialItems || []).length > 0)
  const [createdStatus, setCreatedStatus] = useState<'published' | 'pending' | null>(null)

  useEffect(() => {
    if ((props.initialItems || []).length > 0) {
      setShowFeed(true)
      setShowComposer(false)
      setCreatedStatus(null)
    }
  }, [initialKey])

  const canPost = props.isLoggedIn && props.isMember

  if (!props.canViewPosts) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <p className="text-gray-800 font-bold mb-2">منشورات المجتمع</p>
        <p className="text-gray-600">هذا المجتمع خاص. انضم لعرض المنشورات.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-gray-800 font-bold mb-1">منشورات المجتمع</p>
            <p className="text-gray-600">
              {(props.initialItems || []).length === 0
                ? 'ابدأ أول منشور لفتح النقاش داخل المجتمع.'
                : 'شارك منشورًا أو تابع آخر المستجدات داخل المجتمع.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!canPost) return
              setShowComposer((v) => !v)
            }}
            disabled={!canPost}
            className={
              !canPost
                ? 'px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold cursor-not-allowed'
                : 'px-4 py-2 rounded-lg bg-gradient-to-r from-anime-purple to-anime-pink text-white font-semibold hover:opacity-95 transition'
            }
          >
            {showComposer ? 'إغلاق' : 'إنشاء منشور'}
          </button>
        </div>

        {!props.isLoggedIn ? (
          <p className="mt-3 text-sm text-slate-600">سجّل الدخول ثم انضم للمجتمع لتتمكن من النشر.</p>
        ) : !props.isMember ? (
          <p className="mt-3 text-sm text-slate-600">يلزم الانضمام للمجتمع أولاً لتتمكن من النشر.</p>
        ) : null}
      </div>

      {createdStatus === 'pending' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          تم إرسال منشورك للمراجعة وسيظهر بعد موافقة المشرف.
        </div>
      ) : createdStatus === 'published' ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-900">
          تم نشر المنشور بنجاح.
        </div>
      ) : null}

      {showComposer && (
        <GroupTopicComposer
          groupId={props.groupId}
          allowAnonymousPosts={props.allowAnonymousPosts}
          postApprovalRequired={props.postApprovalRequired}
          isLoggedIn={props.isLoggedIn}
          isMember={props.isMember}
          onCreated={(status) => {
            setCreatedStatus(status)
            if (status === 'published') {
              setShowFeed(true)
              setShowComposer(false)
            } else {
              setShowComposer(false)
            }
          }}
        />
      )}

      {showFeed ? (
        <GroupTopicFeed groupId={props.groupId} initialItems={props.initialItems} status="published" />
      ) : (
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <p className="text-slate-600 dark:text-slate-300 text-lg">لا توجد منشورات بعد</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">اضغط &quot;إنشاء منشور&quot; لبدء أول نقاش.</p>
        </div>
      )}
    </div>
  )
}
