import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export default async function Home() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  } else {
    redirect('/dashboard')
  }
}
