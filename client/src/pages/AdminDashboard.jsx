import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBoundary from '../components/ErrorBoundary'
import api from '../services/api'
import {
    Users,
    UserCheck,
    GraduationCap,
    Shield,
    Calendar,
    MessageSquare,
    BarChart3,
    Settings,
    Home,
    Target,
    Award,
    TrendingUp,
    FileText
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const AdminDashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [dashboardData, setDashboardData] = useState(null)

    const [loading, setLoading] = useState(true)
    useEffect(() => {
        console.log('AdminDashboard useEffect - user:', user)
        if (user && user.role === 'admin') {
            console.log('User is admin, fetching dashboard data...')
            fetchDashboardData()
        } else if (user && user.role !== 'admin') {
            console.log('User is not admin, redirecting...')
            toast.error('Access denied. Admin privileges required.')
            navigate('/')
        } else if (user === null) {
            console.log('User is null, waiting for authentication...')
        }
    }, [user, navigate])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            console.log('Fetching dashboard data...')
            console.log('Current user:', user)
            console.log('Token exists:', !!localStorage.getItem('token'))

            const response = await api.get('/admin/dashboard')
            console.log('Dashboard data received:', response.data)
            setDashboardData(response.data)
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            console.error('Error response:', error.response?.data)
            console.error('Error status:', error.response?.status)

            if (error.response?.status === 403) {
                toast.error('Access denied. Admin privileges required.')
            } else if (error.response?.status === 401) {
                toast.error('Authentication required. Please login again.')
            } else {
                toast.error('Failed to load dashboard data')
            }
        } finally {
            setLoading(false)
        }
    }



    // Check if user is still loading from AuthContext
    const { loading: authLoading } = useAuth()

    if (authLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                    <span className="ml-2 text-slate-600">Loading user data...</span>
                </div>
            </Layout>
        )
    }

    // Check if user is admin
    if (user && user.role !== 'admin') {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600">You need admin privileges to access this page.</p>
                        <p className="text-sm text-gray-500 mt-2">Current role: {user.role}</p>
                    </div>
                </div>
            </Layout>
        )
    }

    // Check if user is null (not authenticated)
    if (!user) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Shield className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
                        <p className="text-gray-600">Please log in to access the admin dashboard.</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                    <span className="ml-2 text-slate-600">Loading dashboard data...</span>
                </div>
            </Layout>
        )
    }



    const OverviewContent = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <div
                    onClick={() => navigate('/admin/users')}
                    className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                                <p className="text-white text-3xl font-bold mt-1">
                                    {dashboardData?.stats?.totalUsers ?? '...'}
                                </p>
                                <p className="text-blue-100 text-xs mt-1">All system users</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <Users className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-300 to-blue-400"></div>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/mentorship')}
                    className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-indigo-100 text-sm font-medium">Mentors</p>
                                <p className="text-white text-3xl font-bold mt-1">
                                    {dashboardData?.stats?.totalMentors ?? '...'}
                                </p>
                                <p className="text-indigo-100 text-xs mt-1">Active teachers</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-300 to-purple-400"></div>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/mentorship?tab=mentees')}
                    className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Mentees</p>
                                <p className="text-white text-3xl font-bold mt-1">
                                    {dashboardData?.stats?.totalMentees ?? '...'}
                                </p>
                                <p className="text-green-100 text-xs mt-1">Active students</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <GraduationCap className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-300 to-emerald-400"></div>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/grievances')}
                    className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Pending Grievances</p>
                                <p className="text-white text-3xl font-bold mt-1">
                                    {dashboardData?.stats?.pendingGrievances ?? '...'}
                                </p>
                                <p className="text-purple-100 text-xs mt-1">Awaiting resolution</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <FileText className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-300 to-purple-400"></div>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/analytics')}
                    className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-teal-100 text-sm font-medium">Active Users</p>
                                <p className="text-white text-3xl font-bold mt-1">
                                    {dashboardData?.stats?.activeUsers ?? '...'}
                                </p>
                                <p className="text-teal-100 text-xs mt-1">Currently online</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <UserCheck className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-300 to-cyan-400"></div>
                    </div>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg rounded-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-400/10 dark:to-indigo-400/10 px-6 py-4 border-b border-blue-200/20 dark:border-blue-400/20">
                        <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <Users className="h-4 w-4 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                Recent Users
                            </h3>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {dashboardData?.recentUsers?.length > 0 ? (
                                dashboardData.recentUsers.map((user, index) => (
                                    <div
                                        key={user._id}
                                        className="flex items-center space-x-4 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/50 dark:hover:bg-slate-600/30 transition-all duration-300 hover:scale-[1.02]"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div className="flex-shrink-0">
                                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg ${user.role === 'admin' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                                                user.role === 'mentor' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                }`}>
                                                {user.role === 'admin' ? <Shield className="h-6 w-6 text-white" /> :
                                                    user.role === 'mentor' ? <Shield className="h-6 w-6 text-white" /> :
                                                        <GraduationCap className="h-6 w-6 text-white" />}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                                {user.email}
                                            </p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                    user.role === 'mentor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">No recent users</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg rounded-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-400/10 dark:to-orange-400/10 px-6 py-4 border-b border-amber-200/20 dark:border-amber-400/20">
                        <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                Recent Leave Requests
                            </h3>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {dashboardData?.recentLeaves?.length > 0 ? (
                                dashboardData.recentLeaves.map((leave, index) => (
                                    <div
                                        key={leave._id}
                                        className="flex items-center space-x-4 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/50 dark:hover:bg-slate-600/30 transition-all duration-300 hover:scale-[1.02]"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div className="flex-shrink-0">
                                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                                <GraduationCap className="h-6 w-6 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                                {leave.menteeId?.fullName || 'Unknown Student'}
                                            </p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                                    {leave.leaveType} • {leave.daysCount} days
                                                </span>
                                            </div>
                                            <div className="mt-2">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                    leave.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                    }`}>
                                                    {leave.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">No recent leave requests</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )





    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                {/* Header */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                                Admin Dashboard
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">
                                Comprehensive system management and analytics
                            </p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-green-800 dark:text-green-300">System Online</span>
                            </div>
                            <Link
                                to="/admin/signup"
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                                <Shield className="h-4 w-4 mr-2" />
                                Add Admin
                            </Link>
                        </div>
                    </div>


                </div>

                {/* Dashboard Content */}
                <div className="px-1">
                    <ErrorBoundary>
                        <OverviewContent />
                    </ErrorBoundary>
                </div>
            </div>
        </Layout>
    )
}

export default AdminDashboard