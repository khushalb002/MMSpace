import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DarkModeToggle from './DarkModeToggle'
import {
    Home,
    Users,
    MessageCircle,
    Calendar,
    FileText,
    User,
    LogOut,
    Menu,
    X,
    Shield,
    Settings,
    Moon,
    Sun,
    BarChart3,
    Target
} from 'lucide-react'
import LogoIcon from './icons/LogoIcon'

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, profile, logout } = useAuth()
    const { isDarkMode, toggleDarkMode } = useTheme()
    const location = useLocation()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'User Management', href: '/admin/users', icon: Users, roles: ['admin'] },
        { name: 'Mentorship', href: '/admin/mentorship', icon: Target, roles: ['admin'] },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, roles: ['admin'] },
        { name: 'Attendance', href: '/admin/attendance', icon: Calendar, roles: ['admin'] },
    { name: 'Attendance', href: '/attendance', icon: Calendar, roles: ['mentor'] },
        { name: 'Leaves', href: '/admin/leaves', icon: Calendar, roles: ['admin'] },
        { name: 'Grievances', href: '/admin/grievances', icon: FileText, roles: ['admin'] },
        { name: 'Groups', href: '/groups', icon: Users, roles: ['mentor'] },
    { name: 'Chat', href: '/chat', icon: MessageCircle, roles: ['mentor', 'mentee', 'guardian'] },
        { name: 'Leaves', href: '/leaves', icon: Calendar, roles: ['mentor', 'mentee'] },
    { name: 'Grievances', href: '/grievances', icon: FileText, roles: ['mentor', 'mentee', 'guardian'] },
        { name: 'Profile', href: '/profile', icon: User },
    ]

    const filteredNavigation = navigation.filter(item =>
        !item.roles || item.roles.includes(user?.role)
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Mobile sidebar */}
            <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800">
                    <div className="flex h-16 items-center justify-between px-4">
                        <LogoIcon className="w-10 h-8" showText={false} />
                        <button onClick={() => setSidebarOpen(false)}>
                            <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                    <nav className="flex-1 space-y-1 px-2 py-4">
                        {filteredNavigation.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname.startsWith(item.href)
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">
                                        {profile?.fullName?.charAt(0) || user?.email?.charAt(0)}
                                    </span>
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-700">{profile?.fullName}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <div className="mt-3">
                            <DarkModeToggle className="w-full justify-start" />
                        </div>
                        <button
                            onClick={handleLogout}
                            className="mt-3 flex w-full items-center px-2 py-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                            <LogOut className="mr-3 h-4 w-4" />
                            Sign out
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex flex-col flex-grow bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50 shadow-2xl">
                    <div className="flex h-16 items-center px-6 bg-gradient-to-r from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50">
                        <LogoIcon className="w-12 h-9" />
                    </div>
                    <nav className="flex-1 space-y-2 px-3 py-6">
                        {filteredNavigation.map((item, index) => {
                            const Icon = item.icon
                            const isActive = location.pathname.startsWith(item.href)
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 hover:scale-[1.02] ${isActive
                                        ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 dark:from-blue-400/20 dark:to-indigo-400/20 text-blue-700 dark:text-blue-300 shadow-lg border border-blue-200/50 dark:border-blue-400/30'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-white backdrop-blur-sm'
                                        }`}
                                    style={{
                                        animationDelay: `${index * 0.1}s`,
                                    }}
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="border-t border-white/20 dark:border-slate-700/50 p-6 bg-gradient-to-r from-white/50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-700/50 backdrop-blur-xl">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <span className="text-sm font-bold text-white">
                                        {profile?.fullName?.charAt(0) || user?.email?.charAt(0)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                    {profile?.fullName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <DarkModeToggle className="w-full justify-start bg-white/50 dark:bg-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-600/50 backdrop-blur-sm rounded-xl px-3 py-2" />
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300"
                            >
                                <LogOut className="mr-3 h-4 w-4" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Mobile header */}
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/20 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl px-4 shadow-lg lg:hidden">
                    <button
                        type="button"
                        className="p-2 rounded-xl bg-white/50 dark:bg-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-600/50 transition-all duration-300"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    </button>
                    <div className="flex-1 flex justify-center">
                        <LogoIcon className="w-10 h-8" showText={false} />
                    </div>
                </div>

                {/* Page content */}
                <main className="py-8 min-h-screen">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="animate-fadeIn">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Layout
