'use client'

import { useState } from 'react'
import { Crown, Star, Zap, Shield, Sparkles, Check } from 'lucide-react'

const features = [
  {
    icon: <Crown className="w-6 h-6" />,
    title: 'ميزات حصرية',
    description: 'وصول إلى ميزات خاصة بالمشتركين فقط'
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: 'بدون إعلانات',
    description: 'تصفح بدون إعلانات مزعجة'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'أولوية الدعم',
    description: 'دعم فني سريع ومميز'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'حساب مميز',
    description: 'شارة مميزة على ملفك الشخصي'
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'محتوى حصري',
    description: 'وصول إلى محتوى حصري ومراجعات متقدمة'
  }
]

const plans = [
  {
    name: 'شهري',
    price: '29',
    period: 'شهر',
    popular: false
  },
  {
    name: 'سنوي',
    price: '249',
    period: 'سنة',
    popular: true,
    savings: 'وفر 33%'
  }
]

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState('annual')

  const handleSubscribe = async (plan: string) => {
    // TODO: Integrate with payment gateway
    alert(`سيتم تفعيل الاشتراك ${plan} قريباً`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          اشترك في OtakuZone Premium
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          احصل على تجربة مميزة مع ميزات حصرية وبدون إعلانات
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
          >
            <div className="text-anime-purple mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Pricing Plans */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-xl shadow-md p-8 relative ${
                plan.popular ? 'border-2 border-anime-purple' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-anime-purple text-white px-4 py-1 rounded-full text-sm font-semibold">
                    الأكثر شعبية
                  </span>
                </div>
              )}
              {plan.savings && (
                <div className="absolute top-4 left-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {plan.savings}
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-800">{plan.price}</span>
                <span className="text-gray-600"> ريال / {plan.period}</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>بدون إعلانات</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>شارة مميزة</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>دعم فني مميز</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>محتوى حصري</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>ميزات متقدمة</span>
                </li>
              </ul>
              <button
                onClick={() => handleSubscribe(plan.name)}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  plan.popular
                    ? 'bg-anime-purple text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                اشترك الآن
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">أسئلة شائعة</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                كيف يمكنني إلغاء الاشتراك؟
              </h3>
              <p className="text-gray-600">
                يمكنك إلغاء الاشتراك في أي وقت من إعدادات حسابك. لن يتم خصم أي مبلغ بعد الإلغاء.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                هل يمكنني تجربة Premium مجاناً؟
              </h3>
              <p className="text-gray-600">
                نعم! نوفر فترة تجريبية مجانية لمدة 7 أيام لجميع المشتركين الجدد.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                ما هي طرق الدفع المتاحة؟
              </h3>
              <p className="text-gray-600">
                نقبل جميع البطاقات الائتمانية الرئيسية والدفع عبر PayPal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

