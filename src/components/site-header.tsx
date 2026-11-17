"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Globe } from "lucide-react"

interface SiteHeaderProps {
  onDashboardClick?: (e?: React.MouseEvent) => void
  rhmSitesCount?: number
}

export function SiteHeader({ onDashboardClick, rhmSitesCount }: SiteHeaderProps) {
  const router = useRouter()

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onDashboardClick) {
      onDashboardClick()
    } else {
      router.push('/rh')
    }
  }

  return (
    <div className="w-full">
      {/* شريط لوحة التحكم */}
      <div
        className="bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-blue-500/5 border-b border-blue-500/10 py-1 px-4 backdrop-blur-sm cursor-pointer hover:bg-blue-500/10 transition-colors duration-200"
        onClick={handleDashboardClick}
        title="انقر للذهاب إلى لوحة التحكم"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* عنوان لوحة التحكم */}
            <div className="flex items-center gap-2">
              <div className="relative cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDashboardClick() }}>
                <img
                  src="/icon-square.png"
                  alt="أيقونة موقع RHM Digital"
                  className="h-5 w-5 rounded-lg"
                />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">المواقع وتطبيقات الويب</h2>
              </div>
            </div>

            {/* إحصائيات المواقع المنفذة */}
            <div className="flex items-center gap-1.5 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-400/30 shadow-[0_0_8px_rgba(56,189,248,0.06)]">
              <div className="w-5 h-5 bg-sky-500/12 rounded-full flex items-center justify-center">
                <Globe className="w-2.5 h-2.5 text-sky-400" />
              </div>
              <div className="text-[10px]">
                <div className="font-bold text-sm text-sky-400">{rhmSitesCount || 0} <span className="text-[10px] text-sky-200/75">موقع منفذ</span></div>
                <div className="text-[9px] text-sky-200/55">مشاريع RHM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
