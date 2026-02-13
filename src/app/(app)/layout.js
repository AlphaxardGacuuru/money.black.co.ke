'use client'

import { useAuth } from '@/hooks/auth'
import Navigation from '@/app/(app)/Navigation'
import BottomNavigation from '@/app/(app)/BottomNavigation'
import Loading from "@/app/(app)/Loading"

const AppLayout = ({ children }) => {
    const { user } = useAuth({ middleware: 'auth' })

    if (!user) {
        return <Loading />
    }

    return (
			<div className="min-h-screen">
				<Navigation user={user} />

				<main className="py-20">{children}</main>

				<BottomNavigation />
			</div>
		)
}

export default AppLayout
