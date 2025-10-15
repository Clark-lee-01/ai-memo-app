// components/ui/skeleton.tsx
// 로딩 스켈레톤 컴포넌트
// 로딩 상태를 시각적으로 표시하는 스켈레톤 UI
// 관련 파일: app/admin/token-monitoring/page.tsx

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }