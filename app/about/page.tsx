import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'عن OtakuZone | منتدى عشاق الأنمي',
  description:
    'منصة عربية لعشاق الأنمي والمانجا: نقاشات، مقالات، ترشيحات، تقييمات، ومجتمعات مهتمة بكل ما يخص عالم الأنمي.',
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 p-8 md:p-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">عن OtakuZone</h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-6">
            OtakuZone هو مجتمع عربي لعشّاق الأنمي والمانجا. هدفنا نجمع المهتمين في مكان واحد
            يقدروا يتبادلوا النقاشات، يكتبوا مقالات، يشاركوا ترشيحاتهم وتجاربهم، ويوصلوا لناس
            مهتمة بنفس الاهتمامات.
          </p>

          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">ماذا يميّزنا؟</h2>
              <ul className="text-slate-600 dark:text-slate-300 space-y-2">
                <li>• مقالات ونقاشات منظّمة حسب التصنيفات.</li>
                <li>• مجتمعات (Groups) للفرق والاهتمامات الخاصة.</li>
                <li>• نظام تقييم ومراجعات للأنمي.</li>
                <li>• ملفات شخصية وروابط اجتماعية للمتابعين.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">قيمنا</h2>
              <ul className="text-slate-600 dark:text-slate-300 space-y-2">
                <li>• احترام الآراء وتقبّل الاختلاف.</li>
                <li>• صناعة محتوى مفيد ومختصر.</li>
                <li>• تشجيع المشاركة والكتابة باستمرار.</li>
                <li>• توفير تجربة ممتعة وسلسة للجميع.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 p-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">ابدأ الآن</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              سجّل حسابك وابدأ كتابة أول مقال أو انضم لمجتمعك المفضل. وجودك يفرق ويخلّي النقاشات أغنى.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg bg-anime-purple text-white hover:bg-anime-purple/90 transition"
              >
                إنشاء حساب
              </Link>
              <Link
                href="/forum"
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                استكشف المقالات
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
