// app/page.tsx
// AI 메모장 메인 페이지
// 사용자 인증 상태를 확인하고 적절한 UI를 표시
// 관련 파일: components/auth/signin-form.tsx, app/actions/auth.ts, lib/supabase/server.ts

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOutAction } from '@/app/actions/auth'
import { getNotes } from '@/app/actions/notes'
import { NoteCard } from '@/components/notes/note-card'
import Link from 'next/link'
import { Plus, FileText, List, Clock } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // 최근 노트 6개 가져오기
  let recentNotes = []
  try {
    const { notes } = await getNotes({ 
      page: 1, 
      limit: 6, 
      sortBy: 'createdAt', 
      sortOrder: 'desc' 
    })
    recentNotes = notes
  } catch (error) {
    console.error('최근 노트 조회 실패:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">AI 메모장</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/reset-password"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                비밀번호 변경
              </Link>
              <form action={signOutAction}>
                <Button type="submit" variant="outline">
                  로그아웃
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 환영 메시지 */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              안녕하세요, {user.email}님!
            </h2>
            <p className="text-gray-600">
              AI 메모장에 오신 것을 환영합니다. 새로운 노트를 작성하거나 기존 노트를 관리해보세요.
            </p>
          </div>

          {/* 액션 버튼들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/notes/new">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 mx-auto">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">새 노트 작성</h3>
                <p className="text-gray-600 text-center text-sm">
                  새로운 아이디어나 정보를 기록해보세요
                </p>
              </div>
            </Link>

            <Link href="/notes">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 mx-auto">
                  <List className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">노트 목록</h3>
                <p className="text-gray-600 text-center text-sm">
                  작성한 노트들을 확인하고 관리하세요
                </p>
              </div>
            </Link>

            <div className="bg-white p-6 rounded-lg shadow-md border-2 border-transparent">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4 mx-auto">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">AI 요약</h3>
              <p className="text-gray-600 text-center text-sm">
                곧 출시될 기능입니다
              </p>
            </div>
          </div>

          {/* 최근 노트 섹션 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-600" />
                최근 노트
              </h3>
              <Link 
                href="/notes" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                전체 보기
              </Link>
            </div>
            
            {recentNotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">아직 작성된 노트가 없습니다.</p>
                <p className="text-gray-400 text-sm mt-2">
                  <Link href="/notes/new" className="text-blue-600 hover:text-blue-800">
                    첫 번째 노트를 작성해보세요
                  </Link>
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
