'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Lock, Eye, Mail, User, Save, AlertCircle, Heart, Calendar, TrendingUp, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import TopicCard from '@/components/TopicCard'
import { SocialIcon, socialPlatforms } from '@/components/SocialLinks'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [settings, setSettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showActivity: true,
    allowMessages: true,
  })
  const [favorites, setFavorites] = useState<any[]>([])
  const [monthlyActivity, setMonthlyActivity] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'favorites' | 'activity'>('profile')

  const [profileName, setProfileName] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({})

  const handleUploadProfileImage = async (file: File) => {
    const fd = new FormData()
    fd.set('file', file)
    const res = await fetch('/api/uploads/image', { method: 'POST', body: fd })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error(data?.error || 'فشل رفع الصورة')
    }
    return String(data?.url || '')
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, image: profileImage, socialLinks }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || 'فشل حفظ بيانات البروفايل')
        return
      }
      setUser((prev: any) => ({ ...prev, ...data }))
      setSuccess('تم حفظ بيانات البروفايل بنجاح')
      setTimeout(() => setSuccess(''), 3000)
      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'حدث خطأ في الاتصال')
    } finally {
      setSavingProfile(false)
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setProfileName(userData.name || '')
          setProfileImage(userData.image || null)
          setSocialLinks(userData.socialLinks || {})
          setSettings({
            profileVisibility: userData.profileVisibility || 'public',
            showEmail: userData.showEmail || false,
            showActivity: userData.showActivity !== undefined ? userData.showActivity : true,
            allowMessages: userData.allowMessages !== undefined ? userData.allowMessages : true,
          })
        } else {
          router.push('/login?redirect=/settings')
        }
      } catch (error) {
        router.push('/login?redirect=/settings')
      } finally {
        setLoading(false)
      }
    }

    const fetchFavorites = async () => {
      try {
        const response = await fetch('/api/favorites')
        if (response.ok) {
          const data = await response.json()
          setFavorites(data.topics || [])
        }
      } catch (error) {
        console.error('Error fetching favorites:', error)
      }
    }

    const fetchMonthlyActivity = async () => {
      try {
        const response = await fetch('/api/users/activity/monthly')
        if (response.ok) {
          const data = await response.json()
          setMonthlyActivity(data)
        }
      } catch (error) {
        console.error('Error fetching activity:', error)
      }
    }

    fetchUser()
    fetchFavorites()
    fetchMonthlyActivity()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/users/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'فشل حفظ الإعدادات')
        setSaving(false)
        return
      }

      setSuccess('تم حفظ الإعدادات بنجاح')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('حدث خطأ في الاتصال')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-anime-purple" />
            <h1 className="text-4xl font-bold text-gray-800">إعدادات الحساب</h1>
          </div>
          <p className="text-gray-600">إدارة خصوصية حسابك وإعداداته</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'profile'
                ? 'border-b-2 border-anime-purple text-anime-purple'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <User className="w-5 h-5 inline-block ml-2" />
            البروفايل
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'privacy'
                ? 'border-b-2 border-anime-purple text-anime-purple'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Lock className="w-5 h-5 inline-block ml-2" />
            الخصوصية
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'favorites'
                ? 'border-b-2 border-anime-purple text-anime-purple'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Heart className="w-5 h-5 inline-block ml-2" />
            المفضلة ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'activity'
                ? 'border-b-2 border-anime-purple text-anime-purple'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <TrendingUp className="w-5 h-5 inline-block ml-2" />
            النشاط الشهري
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-anime-purple" />
              <h2 className="text-2xl font-bold text-gray-800">بيانات البروفايل</h2>
            </div>

            <div className="flex items-start gap-6 flex-wrap">
              <div className="flex flex-col items-center gap-3">
                <img src={profileImage || '/default-avatar.svg'} alt="" className="w-24 h-24 rounded-full border-4 border-anime-purple" />
                <label className="cursor-pointer text-anime-purple hover:text-anime-pink font-semibold">
                  تغيير الصورة
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        setSavingProfile(true)
                        const url = await handleUploadProfileImage(file)
                        setProfileImage(url)
                      } catch (err: any) {
                        setError(err?.message || 'فشل رفع الصورة')
                      } finally {
                        setSavingProfile(false)
                      }
                    }}
                  />
                </label>
              </div>

              <div className="flex-1 min-w-[260px]">
                <label className="block text-gray-700 mb-2 font-semibold">الاسم</label>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple bg-white"
                  placeholder="اكتب اسمك"
                />

                <div className="mt-6">
                  <p className="text-gray-700 mb-2 font-semibold">روابط المنصات</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {socialPlatforms.map((p) => (
                      <label key={p.key} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
                        <span className="text-gray-600">
                          <SocialIcon platform={p.key} className="w-5 h-5" />
                        </span>
                        <input
                          value={String((socialLinks as any)[p.key] || '')}
                          onChange={(e) =>
                            setSocialLinks((prev) => ({
                              ...prev,
                              [p.key]: e.target.value,
                            }))
                          }
                          className="flex-1 outline-none text-sm"
                          placeholder={`${p.label} link`}
                        />
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">يتم قبول روابط هذه المنصات فقط. أي رابط غير مطابق سيتم رفضه.</p>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="mt-4 flex items-center gap-2 bg-anime-purple text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition shadow-lg disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Settings */}
        {activeTab === 'privacy' && (
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-anime-purple" />
            <h2 className="text-2xl font-bold text-gray-800">إعدادات الخصوصية</h2>
          </div>

          <div className="space-y-6">
            {/* Profile Visibility */}
            <div>
              <label className="block text-gray-700 mb-2 font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5" />
                خصوصية الملف الشخصي
              </label>
              <select
                value={settings.profileVisibility}
                onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple bg-white"
              >
                <option value="public">عام - يمكن للجميع رؤية ملفك الشخصي</option>
                <option value="private">خاص - فقط المتابعين يمكنهم رؤية ملفك</option>
                <option value="friends">الأصدقاء - فقط المتابعين المتبادلين</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                اختر من يمكنه رؤية ملفك الشخصي ومحتواه
              </p>
            </div>

            {/* Show Email */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <label className="font-semibold text-gray-700">إظهار البريد الإلكتروني</label>
                  <p className="text-sm text-gray-500">السماح للآخرين برؤية بريدك الإلكتروني</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showEmail}
                  onChange={(e) => setSettings({ ...settings, showEmail: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-anime-purple/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-anime-purple"></div>
              </label>
            </div>

            {/* Show Activity */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <label className="font-semibold text-gray-700">إظهار النشاط</label>
                  <p className="text-sm text-gray-500">إظهار مواضيعك وتعليقاتك في الملف الشخصي</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showActivity}
                  onChange={(e) => setSettings({ ...settings, showActivity: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-anime-purple/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-anime-purple"></div>
              </label>
            </div>

            {/* Allow Messages */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <label className="font-semibold text-gray-700">السماح بالرسائل</label>
                  <p className="text-sm text-gray-500">السماح للآخرين بإرسال رسائل خاصة لك</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowMessages}
                  onChange={(e) => setSettings({ ...settings, allowMessages: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-anime-purple/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-anime-purple"></div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4 mt-8">
            <Link
              href={`/profile/${user.id}`}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              إلغاء
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-anime-purple text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <Save className="w-5 h-5" />
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-anime-pink" />
              <h2 className="text-2xl font-bold text-gray-800">المنشورات المفضلة</h2>
            </div>
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">لا توجد منشورات مفضلة بعد</p>
                <p className="text-gray-400 mt-2">اضغط على زر الإعجاب في أي منشور لإضافته للمفضلة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((topic: any) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Monthly Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-anime-blue" />
              <h2 className="text-2xl font-bold text-gray-800">نشاطك هذا الشهر</h2>
            </div>
            {monthlyActivity ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-anime-purple to-anime-pink rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <MessageSquare className="w-8 h-8" />
                    <span className="text-3xl font-bold">{monthlyActivity.topics || 0}</span>
                  </div>
                  <p className="text-sm opacity-90">مواضيع منشورة</p>
                </div>
                <div className="bg-gradient-to-br from-anime-blue to-anime-purple rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <User className="w-8 h-8" />
                    <span className="text-3xl font-bold">{monthlyActivity.comments || 0}</span>
                  </div>
                  <p className="text-sm opacity-90">تعليقات</p>
                </div>
                <div className="bg-gradient-to-br from-anime-orange to-anime-pink rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Heart className="w-8 h-8" />
                    <span className="text-3xl font-bold">{monthlyActivity.likesReceived || 0}</span>
                  </div>
                  <p className="text-sm opacity-90">إعجابات مستلمة</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا يوجد نشاط هذا الشهر</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

