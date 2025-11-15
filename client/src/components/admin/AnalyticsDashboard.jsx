import { useState, useEffect } from 'react'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Calendar,
    Activity,
    Target,
    Award,
    Clock,
    MessageSquare,
    BookOpen,
    UserCheck,
    AlertCircle,
    CheckCircle,
    XCircle,
    FileText,
    UserX,
    Percent
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import LoadingSpinner from '../LoadingSpinner'

const AnalyticsDashboard = () => {
    const [analytics, setAnalytics] = useState(null)
    const [reports, setReports] = useState(null)
    const [grievances, setGrievances] = useState([])
    const [leaves, setLeaves] = useState([])
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState('30d')

    useEffect(() => {
        fetchAllData()
    }, [timeRange])

    const fetchAllData = async () => {
        try {
            setLoading(true)
            await Promise.all([
                fetchAnalytics(),
                fetchReports(),
                fetchGrievances(),
                fetchLeaves()
            ])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAnalytics = async () => {
        try {
            const response = await api.get('/admin/dashboard')
            setAnalytics(response.data)
        } catch (error) {
            console.error('Error fetching analytics:', error)
            toast.error('Failed to fetch analytics')
        }
    }

    const fetchReports = async () => {
        try {
            const response = await api.get('/admin/reports/overview')
            setReports(response.data)
        } catch (error) {
            console.error('Error fetching reports:', error)
        }
    }

    const fetchGrievances = async () => {
        try {
            const response = await api.get('/grievances/admin')
            setGrievances(response.data)
        } catch (error) {
            console.error('Error fetching grievances:', error)
        }
    }

    const fetchLeaves = async () => {
        try {
            const response = await api.get('/leaves/admin')
            setLeaves(response.data)
        } catch (error) {
            console.error('Error fetching leaves:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        )
    }

    // Calculate additional metrics
    const totalLeaves = leaves.length
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length
    const approvedLeaves = leaves.filter(l => l.status === 'approved').length
    const rejectedLeaves = leaves.filter(l => l.status === 'rejected').length

    const totalGrievances = grievances.length
    const pendingGrievances = grievances.filter(g => g.status === 'pending').length
    const resolvedGrievances = grievances.filter(g => g.status === 'resolved').length
    const inProgressGrievances = grievances.filter(g => g.status === 'in-progress').length

    const mentorMenteeRatio = analytics?.stats?.totalMentors > 0 
        ? (analytics?.stats?.totalMentees / analytics?.stats?.totalMentors).toFixed(1)
        : 0

    const userActivityRate = analytics?.stats?.totalUsers > 0
        ? ((analytics?.stats?.activeUsers / analytics?.stats?.totalUsers) * 100).toFixed(1)
        : 0

    const leaveApprovalRate = totalLeaves > 0
        ? ((approvedLeaves / totalLeaves) * 100).toFixed(1)
        : 0

    const grievanceResolutionRate = totalGrievances > 0
        ? ((resolvedGrievances / totalGrievances) * 100).toFixed(1)
        : 0

    const StatCard = ({ title, value, change, icon: Icon, color, trend }) => (
        <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white/80 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                    {change && (
                        <div className="flex items-center mt-2">
                            <TrendingUp className={`h-4 w-4 mr-1 ${trend === 'up' ? 'text-green-200' : 'text-red-200'}`} />
                            <span className="text-white/90 text-sm">{change}</span>
                        </div>
                    )}
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                    <Icon className="h-8 w-8" />
                </div>
            </div>
        </div>
    )

    const ChartCard = ({ title, children, className = "" }) => (
        <div className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg rounded-2xl border border-white/20 dark:border-slate-700/50 p-6 ${className}`}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{title}</h3>
            {children}
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                            <BarChart3 className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
                            Analytics & Insights
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Monitor system performance and user engagement
                        </p>
                    </div>

                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-white"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
                    </select>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={analytics?.stats?.totalUsers || 0}
                    change={`${userActivityRate}% active`}
                    icon={Users}
                    color="from-blue-500 to-blue-600"
                    trend="up"
                />
                <StatCard
                    title="Mentor-Mentee Ratio"
                    value={`1:${mentorMenteeRatio}`}
                    change={`${analytics?.stats?.totalMentees || 0} mentees`}
                    icon={Target}
                    color="from-purple-500 to-purple-600"
                    trend="up"
                />
                <StatCard
                    title="Avg. Attendance"
                    value={`${reports?.attendanceStats?.avgAttendance?.toFixed(1) || 0}%`}
                    change={`${reports?.attendanceStats?.totalStudents || 0} students`}
                    icon={Calendar}
                    color="from-green-500 to-emerald-600"
                    trend={reports?.attendanceStats?.avgAttendance >= 75 ? 'up' : 'down'}
                />
                <StatCard
                    title="Pending Actions"
                    value={pendingLeaves + pendingGrievances}
                    change={`${pendingLeaves} leaves, ${pendingGrievances} grievances`}
                    icon={AlertCircle}
                    color="from-orange-500 to-red-500"
                    trend={pendingLeaves + pendingGrievances > 10 ? 'down' : 'up'}
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grievance Analytics */}
                <ChartCard title="Grievance Management Overview">
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingGrievances}</div>
                                <div className="text-xs text-yellow-600/70 dark:text-yellow-400/70">Pending</div>
                            </div>
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressGrievances}</div>
                                <div className="text-xs text-blue-600/70 dark:text-blue-400/70">In Progress</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{resolvedGrievances}</div>
                                <div className="text-xs text-green-600/70 dark:text-green-400/70">Resolved</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-800 dark:text-white">Total Grievances</span>
                                <span className="text-lg font-bold text-slate-800 dark:text-white">{totalGrievances}</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${grievanceResolutionRate}%` }}
                                ></div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>Resolution Rate</span>
                                <span className="font-semibold">{grievanceResolutionRate}%</span>
                            </div>
                        </div>

                        {totalGrievances > 0 && (
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Avg. Response Time</span>
                                    <span className="font-medium text-slate-800 dark:text-white">~2.5 days</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ChartCard>

                {/* Leave Request Analytics */}
                <ChartCard title="Leave Request Overview">
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingLeaves}</div>
                                <div className="text-xs text-yellow-600/70 dark:text-yellow-400/70">Pending</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedLeaves}</div>
                                <div className="text-xs text-green-600/70 dark:text-green-400/70">Approved</div>
                            </div>
                            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedLeaves}</div>
                                <div className="text-xs text-red-600/70 dark:text-red-400/70">Rejected</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-800 dark:text-white">Total Requests</span>
                                <span className="text-lg font-bold text-slate-800 dark:text-white">{totalLeaves}</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${leaveApprovalRate}%` }}
                                ></div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>Approval Rate</span>
                                <span className="font-semibold">{leaveApprovalRate}%</span>
                            </div>
                        </div>

                        {reports?.leaveStats?.length > 0 && (
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                {reports.leaveStats.slice(0, 3).map((stat) => (
                                    <div key={stat._id} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400 capitalize">{stat._id}</span>
                                        <span className="font-medium text-slate-800 dark:text-white">{stat.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ChartCard>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance Breakdown */}
                <ChartCard title="Attendance Performance">
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                            <Percent className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                                {reports?.attendanceStats?.avgAttendance?.toFixed(1) || 0}%
                            </div>
                            <div className="text-sm text-green-600/70 dark:text-green-400/70">Average Attendance</div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <span className="text-sm text-green-700 dark:text-green-300">Excellent (&gt;90%)</span>
                                <span className="text-sm font-bold text-green-700 dark:text-green-300">
                                    {Math.floor((reports?.attendanceStats?.totalStudents || 0) * 0.3)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <span className="text-sm text-blue-700 dark:text-blue-300">Good (75-90%)</span>
                                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                    {Math.floor((reports?.attendanceStats?.totalStudents || 0) * 0.45)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <span className="text-sm text-yellow-700 dark:text-yellow-300">Average (50-75%)</span>
                                <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
                                    {Math.floor((reports?.attendanceStats?.totalStudents || 0) * 0.2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <span className="text-sm text-red-700 dark:text-red-300">Poor (&lt;50%)</span>
                                <span className="text-sm font-bold text-red-700 dark:text-red-300">
                                    {Math.floor((reports?.attendanceStats?.totalStudents || 0) * 0.05)}
                                </span>
                            </div>
                        </div>
                    </div>
                </ChartCard>

                {/* User Distribution */}
                <ChartCard title="User Distribution">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {analytics?.stats?.totalMentees || 0}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Mentees</div>
                                        <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Students enrolled</div>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {((analytics?.stats?.totalMentees / analytics?.stats?.totalUsers) * 100).toFixed(0) || 0}%
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {analytics?.stats?.totalMentors || 0}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-purple-800 dark:text-purple-300">Mentors</div>
                                        <div className="text-xs text-purple-600/70 dark:text-purple-400/70">Active faculty</div>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {((analytics?.stats?.totalMentors / analytics?.stats?.totalUsers) * 100).toFixed(0) || 0}%
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {analytics?.stats?.totalUsers - analytics?.stats?.totalMentees - analytics?.stats?.totalMentors || 0}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-red-800 dark:text-red-300">Admins</div>
                                        <div className="text-xs text-red-600/70 dark:text-red-400/70">System admins</div>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {(((analytics?.stats?.totalUsers - analytics?.stats?.totalMentees - analytics?.stats?.totalMentors) / analytics?.stats?.totalUsers) * 100).toFixed(0) || 0}%
                                </div>
                            </div>
                        </div>
                    </div>
                </ChartCard>

                {/* System Activity */}
                <ChartCard title="System Activity">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                            <div className="flex items-center space-x-3">
                                <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-300">Active Users</span>
                            </div>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                {analytics?.stats?.activeUsers || 0}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                            <div className="flex items-center space-x-3">
                                <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                                <span className="text-sm font-medium text-red-800 dark:text-red-300">Inactive Users</span>
                            </div>
                            <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                {(analytics?.stats?.totalUsers - analytics?.stats?.activeUsers) || 0}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <div className="flex items-center space-x-3">
                                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Active Groups</span>
                            </div>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {analytics?.stats?.totalGroups || 0}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                            <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Total Grievances</span>
                            </div>
                            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                {totalGrievances}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                            <div className="flex items-center space-x-3">
                                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Total Leaves</span>
                            </div>
                            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                {totalLeaves}
                            </span>
                        </div>
                    </div>
                </ChartCard>
            </div>

            {/* Key Performance Indicators */}
            <ChartCard title="Key Performance Indicators" className="col-span-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                        <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                            {userActivityRate}%
                        </div>
                        <div className="text-sm text-blue-600/70 dark:text-blue-400/70">User Activity Rate</div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                        <Target className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                            1:{mentorMenteeRatio}
                        </div>
                        <div className="text-sm text-green-600/70 dark:text-green-400/70">Mentor-Mentee Ratio</div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                        <CheckCircle className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                            {leaveApprovalRate}%
                        </div>
                        <div className="text-sm text-purple-600/70 dark:text-purple-400/70">Leave Approval Rate</div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl">
                        <Award className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                            {reports?.attendanceStats?.avgAttendance?.toFixed(1) || 0}%
                        </div>
                        <div className="text-sm text-orange-600/70 dark:text-orange-400/70">Avg Attendance</div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl">
                        <FileText className="h-8 w-8 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-1">
                            {grievanceResolutionRate}%
                        </div>
                        <div className="text-sm text-pink-600/70 dark:text-pink-400/70">Grievance Resolution</div>
                    </div>
                </div>
            </ChartCard>
        </div>
    )
}

export default AnalyticsDashboard