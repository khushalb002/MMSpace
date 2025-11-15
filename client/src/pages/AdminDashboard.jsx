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
            {/* Primary Stats - Key Metrics */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div
                    onClick={() => navigate('/admin/users')}
                    className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-blue-200/50 dark:border-blue-500/30"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                                Total
                            </span>
                        </div>
                        <div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">System Users</p>
                            <p className="text-slate-900 dark:text-white text-4xl font-bold mb-2">
                                {dashboardData?.stats?.totalUsers ?? '...'}
                            </p>
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                                <span>All registered users</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/mentorship')}
                    className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-indigo-200/50 dark:border-indigo-500/30"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full">
                                Active
                            </span>
                        </div>
                        <div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Mentors</p>
                            <p className="text-slate-900 dark:text-white text-4xl font-bold mb-2">
                                {dashboardData?.stats?.totalMentors ?? '...'}
                            </p>
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                <Award className="h-3 w-3 mr-1 text-indigo-500" />
                                <span>Teaching faculty</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/mentorship?tab=mentees')}
                    className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-emerald-200/50 dark:border-emerald-500/30"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full">
                                Active
                            </span>
                        </div>
                        <div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Students</p>
                            <p className="text-slate-900 dark:text-white text-4xl font-bold mb-2">
                                {dashboardData?.stats?.totalMentees ?? '...'}
                            </p>
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                <Target className="h-3 w-3 mr-1 text-emerald-500" />
                                <span>Enrolled students</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-500/20 to-slate-600/10 rounded-full blur-2xl"></div>
                    <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl shadow-lg">
                                <BarChart3 className="h-6 w-6 text-white" />
                            </div>
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full">
                                Ratio
                            </span>
                        </div>
                        <div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Student/Mentor</p>
                            <p className="text-slate-900 dark:text-white text-4xl font-bold mb-2">
                                {dashboardData?.stats?.totalMentors > 0 
                                    ? Math.round((dashboardData?.stats?.totalMentees / dashboardData?.stats?.totalMentors) * 10) / 10
                                    : '0'}
                            </p>
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                <Users className="h-3 w-3 mr-1 text-slate-500" />
                                <span>Per mentor average</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Items - Pending Tasks */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div
                    onClick={() => navigate('/admin/grievances')}
                    className="group relative overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <FileText className="h-8 w-8 text-white" />
                            </div>
                            <div className="text-right">
                                <p className="text-white/90 text-sm font-medium">Requires</p>
                                <p className="text-white text-xs font-semibold">Attention</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-white/80 text-sm font-medium mb-2">Pending Grievances</p>
                            <p className="text-white text-5xl font-bold mb-3">
                                {dashboardData?.stats?.pendingGrievances ?? '...'}
                            </p>
                            <div className="flex items-center justify-between pt-3 border-t border-white/20">
                                <span className="text-white/70 text-xs">Awaiting resolution</span>
                                <div className="flex items-center text-white text-sm font-medium">
                                    View All
                                    <MessageSquare className="h-4 w-4 ml-2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/leaves')}
                    className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <Calendar className="h-8 w-8 text-white" />
                            </div>
                            <div className="text-right">
                                <p className="text-white/90 text-sm font-medium">Needs</p>
                                <p className="text-white text-xs font-semibold">Approval</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-white/80 text-sm font-medium mb-2">Pending Leaves</p>
                            <p className="text-white text-5xl font-bold mb-3">
                                {dashboardData?.stats?.pendingLeaves ?? '...'}
                            </p>
                            <div className="flex items-center justify-between pt-3 border-t border-white/20">
                                <span className="text-white/70 text-xs">Awaiting approval</span>
                                <div className="flex items-center text-white text-sm font-medium">
                                    View All
                                    <Calendar className="h-4 w-4 ml-2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/analytics')}
                    className="group relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <BarChart3 className="h-8 w-8 text-white" />
                            </div>
                            <div className="text-right">
                                <p className="text-white/90 text-sm font-medium">View</p>
                                <p className="text-white text-xs font-semibold">Insights</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-white/80 text-sm font-medium mb-2">Analytics Dashboard</p>
                            <p className="text-white text-3xl font-bold mb-3">
                                Detailed Stats
                            </p>
                            <div className="flex items-center justify-between pt-3 border-t border-white/20">
                                <span className="text-white/70 text-xs">System performance</span>
                                <div className="flex items-center text-white text-sm font-medium">
                                    View All
                                    <TrendingUp className="h-4 w-4 ml-2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Users */}
                <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Recent Users</h3>
                                    <p className="text-blue-100 text-xs">Latest registrations</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                                <span className="text-white text-sm font-semibold">{dashboardData?.recentUsers?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="space-y-3">
                            {dashboardData?.recentUsers?.length > 0 ? (
                                dashboardData.recentUsers.map((user, index) => (
                                    <div
                                        key={user._id}
                                        className="group/item flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-700/20 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 border border-slate-200/50 dark:border-slate-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                                    >
                                        <div className="flex-shrink-0">
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover/item:scale-110 ${
                                                user.role === 'admin' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                                                user.role === 'mentor' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 
                                                'bg-gradient-to-br from-emerald-500 to-emerald-600'
                                            }`}>
                                                {user.role === 'admin' ? <Shield className="h-5 w-5 text-white" /> :
                                                    user.role === 'mentor' ? <Shield className="h-5 w-5 text-white" /> :
                                                        <GraduationCap className="h-5 w-5 text-white" />}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                                {user.email}
                                            </p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${
                                                    user.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                                    user.role === 'mentor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                }`}>
                                                    {user.role}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 mb-3">
                                        <Users className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No recent users</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Leaves */}
                <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="relative bg-gradient-to-r from-amber-500 to-orange-600 p-5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Recent Leaves</h3>
                                    <p className="text-amber-100 text-xs">Latest requests</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                                <span className="text-white text-sm font-semibold">{dashboardData?.recentLeaves?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="space-y-3">
                            {dashboardData?.recentLeaves?.length > 0 ? (
                                dashboardData.recentLeaves.map((leave, index) => (
                                    <div
                                        key={leave._id}
                                        className="group/item flex items-start space-x-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-700/20 hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-900/20 dark:hover:to-orange-900/20 border border-slate-200/50 dark:border-slate-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                                    >
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg transition-transform group-hover/item:scale-110">
                                                <Calendar className="h-5 w-5 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                                {leave.menteeId?.fullName || 'Unknown Student'}
                                            </p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 capitalize">
                                                {leave.leaveType} leave • {leave.daysCount} {leave.daysCount === 1 ? 'day' : 'days'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${
                                                    leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                                    leave.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                                }`}>
                                                    {leave.status}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(leave.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 mb-3">
                                        <Calendar className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No recent leaves</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Grievances */}
                <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="relative bg-gradient-to-r from-rose-500 to-pink-600 p-5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <MessageSquare className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Recent Grievances</h3>
                                    <p className="text-rose-100 text-xs">Latest submissions</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                                <span className="text-white text-sm font-semibold">{dashboardData?.recentGrievances?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="space-y-3">
                            {dashboardData?.recentGrievances?.length > 0 ? (
                                dashboardData.recentGrievances.map((grievance, index) => (
                                    <div
                                        key={grievance._id}
                                        className="group/item flex items-start space-x-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-700/20 hover:from-rose-50 hover:to-pink-50 dark:hover:from-rose-900/20 dark:hover:to-pink-900/20 border border-slate-200/50 dark:border-slate-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                                    >
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg transition-transform group-hover/item:scale-110">
                                                <FileText className="h-5 w-5 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                                {grievance.menteeId?.fullName || 'Anonymous'}
                                            </p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                                                {grievance.subject || 'No subject'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${
                                                    grievance.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                                    grievance.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                                        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                }`}>
                                                    {grievance.status}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(grievance.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 mb-3">
                                        <MessageSquare className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No recent grievances</p>
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

                        <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-green-800 dark:text-green-300">System Online</span>
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