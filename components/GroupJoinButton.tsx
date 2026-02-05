'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type MembershipStatus = 'active' | 'pending' | 'banned'

export default function GroupJoinButton(props: {
  groupId: string
  groupSlug: string
  isPublic: boolean
  isApprovalRequired: boolean
  initialMembership?: { status: MembershipStatus; role: string } | null
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [membership, setMembership] = useState(props.initialMembership || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const label = useMemo(() => {
    if (!props.isLoggedIn) return 'سجّل الدخول للانضمام'
    if (membership?.status === 'active') return 'أنت عضو'
    if (membership?.status === 'pending') return 'طلب قيد المراجعة'
    if (membership?.status === 'banned') return 'غير متاح'

    const needsApproval = !props.isPublic || props.isApprovalRequired
    return needsApproval ? 'طلب انضمام' : 'انضم'
  }, [membership, props.isLoggedIn, props.isPublic, props.isApprovalRequired])

  const disabled = !props.isLoggedIn || isSubmitting || membership?.status === 'active' || membership?.status === 'pending' || membership?.status === 'banned'

  const onJoin = async () => {
    if (disabled) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/groups/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: props.groupId }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'تعذر إرسال الطلب')
      }

      if (data?.membership) {
        setMembership(data.membership)
      }

      router.refresh()
    } catch (e: any) {
      alert(e?.message || 'حدث خطأ')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!props.isLoggedIn) {
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent(`/groups/${props.groupSlug}`)}`}
        className="inline-flex items-center justify-center rounded-lg bg-anime-purple text-white px-4 py-2 font-semibold hover:bg-purple-700 transition"
      >
        {label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onJoin}
      className={
        disabled
          ? 'inline-flex items-center justify-center rounded-lg bg-gray-200 text-gray-700 px-4 py-2 font-semibold cursor-not-allowed'
          : 'inline-flex items-center justify-center rounded-lg bg-anime-purple text-white px-4 py-2 font-semibold hover:bg-purple-700 transition'
      }
    >
      {isSubmitting ? 'جارٍ الإرسال...' : label}
    </button>
  )
}
