'use client'

import { useState, useEffect } from 'react'
import { Shield, Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { withDB } from '@/lib/db'
import Ad from '@/models/Ad'

interface AdData {
  _id: string
  title: string
  description: string
  image?: string
  link: string
  position: 'top' | 'bottom' | 'sidebar'
  isActive: boolean
  impressions: number
  clicks: number
}

export default function AdsManagementPage() {
  const [ads, setAds] = useState<AdData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAds()
  }, [])

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/ads/all')
      if (response.ok) {
        const data = await response.json()
        setAds(data)
      }
    } catch (error) {
      console.error('Error fetching ads:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">جاري التحميل...</div>
      </div>
    )
  }

  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0)
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-anime-purple" />
          <h1 className="text-4xl font-bold text-gray-800">إدارة الإعلانات</h1>
        </div>
        <Link
          href="/admin/ads/new"
          className="flex items-center gap-2 bg-anime-purple text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5" />
          إعلان جديد
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 mb-1">إجمالي الإعلانات</p>
          <p className="text-3xl font-bold text-gray-800">{ads.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 mb-1">إجمالي المشاهدات</p>
          <p className="text-3xl font-bold text-gray-800">
            {totalImpressions.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 mb-1">إجمالي النقرات</p>
          <p className="text-3xl font-bold text-gray-800">
            {totalClicks.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Ads Table */}
      {ads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-600 mb-4">لا توجد إعلانات حالياً</p>
          <Link
            href="/admin/ads/new"
            className="inline-flex items-center gap-2 bg-anime-purple text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            إضافة إعلان جديد
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right p-4">العنوان</th>
                <th className="text-right p-4">الموضع</th>
                <th className="text-right p-4">الحالة</th>
                <th className="text-right p-4">المشاهدات</th>
                <th className="text-right p-4">النقرات</th>
                <th className="text-right p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ads.map((ad) => (
                <tr key={ad._id} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold">{ad.title}</td>
                  <td className="p-4">
                    <span className="bg-anime-blue/10 text-anime-blue px-3 py-1 rounded-full text-sm">
                      {ad.position === 'top' ? 'علوي' : ad.position === 'bottom' ? 'سفلي' : 'جانبي'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      ad.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {ad.isActive ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td className="p-4">{ad.impressions.toLocaleString()}</td>
                  <td className="p-4">{ad.clicks.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="text-anime-blue hover:text-blue-700">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
