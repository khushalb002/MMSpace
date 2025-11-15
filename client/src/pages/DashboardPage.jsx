import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import StudentDetailsModal from '../components/StudentDetailsModal'
import AnnouncementFeed from '../components/AnnouncementFeed'
import api from '../services/api'
import { Users, MessageSquare, Calendar, TrendingUp, Phone, Mail, User, Eye, FileText, Megaphone, RefreshCcw, Shield } from 'lucide-react'
import AdminDashboard from './AdminDashboard'

const DashboardPage = () => {
    const { user, profile } = useAuth()
    const navigate = useNavigate()
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [showStudentModal, setShowStudentModal] = useState(false)
    const [showExpandedMentees, setShowExpandedMentees] = useState(false)
    const [announcementRefreshKey, setAnnouncementRefreshKey] = useState(0)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            let endpoint = null

            if (user.role === 'mentor') {
                endpoint = '/mentors/dashboard'
            } else if (user.role === 'mentee') {
                endpoint = '/mentees/dashboard'
            } else if (user.role === 'guardian') {
                endpoint = '/guardians/dashboard'
            }

            if (endpoint) {
                const response = await api.get(endpoint)
                setDashboardData(response.data)
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAnnouncementRefresh = () => {
        setAnnouncementRefreshKey(prev => prev + 1)
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                </div>
            </Layout>
        )
    }

    const MentorDashboard = () => (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mentor Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Welcome back! Here's what's happening with your mentees.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Mentees Card */}
                <div
                    onClick={() => setShowExpandedMentees(true)}
                    className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Mentees</p>
                                <p className="text-white text-3xl font-bold mt-1">
                                    {dashboardData?.stats?.totalMentees || 0}
                                </p>
                                <p className="text-blue-100 text-xs mt-1">Active students</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <Users className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Groups Card */}
                <div
                    onClick={() => navigate('/groups')}
                    className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Active Groups</p>
                                <p className="text-white text-3xl font-bold mt-1">
                                    {dashboardData?.stats?.totalGroups || 0}
                                </p>
                                <p className="text-green-100 text-xs mt-1">Discussion groups</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <MessageSquare className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Leaves Card */}
                <div
                    onClick={() => navigate('/leaves')}
                    className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-100 text-sm font-medium">Pending Leaves</p>
                                <p className="text-white text-3xl font-bold mt-1">
                                    {dashboardData?.stats?.pendingLeaves || 0}
                                </p>
                                <p className="text-amber-100 text-xs mt-1">Awaiting approval</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <Calendar className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grievances Card */}
                <div
                    onClick={() => navigate('/grievances')}
                    className="relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm font-medium">Grievances</p>
                                <p className="text-white text-3xl font-bold mt-1">
                                    {dashboardData?.stats?.totalGrievances || 0}
                                </p>
                                <p className="text-red-100 text-xs mt-1">To review</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <FileText className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Leave Requests */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50">
                <div className="px-6 py-6 sm:p-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                        Recent Leave Requests
                    </h3>
                    <div className="space-y-4">
                        {dashboardData?.recentLeaves?.length > 0 ? (
                            dashboardData.recentLeaves.map((leave, index) => (
                                <div
                                    key={leave._id}
                                    className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-slate-600/30 hover:shadow-lg transition-all duration-300 message-bubble"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg">
                                                {leave.menteeId?.fullName?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                                    {leave.menteeId?.fullName}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {leave.leaveType} - {leave.daysCount} days
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${leave.status === 'pending'
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                            : leave.status === 'approved'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                            {leave.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    No recent leave requests
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* My Mentees Section */}
            {dashboardData?.mentees?.length > 0 && (
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50">
                    <div className="px-6 py-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                <Users className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                                My Mentees ({dashboardData.mentees.length})
                            </h3>
                            <button
                                onClick={() => navigate('/profile')}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium bg-blue-50/50 dark:bg-blue-900/20 px-3 py-2 rounded-xl hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-all duration-300"
                            >
                                View All Details
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {dashboardData.mentees.map((mentee, index) => (
                                <div
                                    key={mentee._id}
                                    className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-slate-600/30 hover:shadow-lg transition-all duration-300 message-bubble hover:scale-[1.01]"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4 flex-1">
                                            {/* Student Avatar */}
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg">
                                                {mentee.fullName?.charAt(0)}
                                            </div>

                                            {/* Student Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                                            {mentee.fullName}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            ID: {mentee.studentId} • Class {mentee.class}-{mentee.section}
                                                        </p>
                                                    </div>

                                                    {/* Attendance Badge */}
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${(mentee.attendance?.percentage || 0) >= 90
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                            : (mentee.attendance?.percentage || 0) >= 75
                                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                            }`}>
                                                            {mentee.attendance?.percentage || 0}% Attendance
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contact Info */}
                                                <div className="mt-2 flex items-center space-x-4 text-xs text-slate-600 dark:text-slate-400">
                                                    <div className="flex items-center">
                                                        <Mail className="h-3 w-3 mr-1" />
                                                        <span className="truncate max-w-[150px]">{mentee.userId?.email}</span>
                                                    </div>
                                                    {mentee.phone && (
                                                        <div className="flex items-center">
                                                            <Phone className="h-3 w-3 mr-1" />
                                                            <span>{mentee.phone}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center">
                                                        <User className="h-3 w-3 mr-1" />
                                                        <span>
                                                            {mentee.userId?.lastLogin
                                                                ? new Date(mentee.userId.lastLogin).toLocaleDateString()
                                                                : 'Never logged in'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Attendance Progress Bar */}
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                                                        <span>Attendance Progress</span>
                                                        <span>{mentee.attendance?.presentDays || 0}/{mentee.attendance?.totalDays || 0} days</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-500 ${(mentee.attendance?.percentage || 0) >= 90
                                                                ? 'bg-gradient-to-r from-green-500 to-green-400'
                                                                : (mentee.attendance?.percentage || 0) >= 75
                                                                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                                                                    : 'bg-gradient-to-r from-red-500 to-red-400'
                                                                }`}
                                                            style={{ width: `${mentee.attendance?.percentage || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex space-x-2 ml-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedStudent(mentee)
                                                    setShowStudentModal(true)
                                                }}
                                                className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-300 hover:scale-110"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => window.location.href = `/chat/individual_${mentee._id}`}
                                                className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-300 hover:scale-110"
                                                title="Start Chat"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    const ExpandedMenteesView = () => (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-7xl max-h-[95vh] overflow-hidden animate-scaleIn">
                {/* Header */}
                <div className="p-6 border-b border-white/20 dark:border-slate-700/50 bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Users className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
                                    My Mentees
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Manage and monitor your {dashboardData?.mentees?.length || 0} students
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowExpandedMentees(false)}
                            className="p-3 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200 group"
                        >
                            <svg className="h-6 w-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
                    {dashboardData?.mentees?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {dashboardData.mentees.map((mentee, index) => (
                                <div
                                    key={mentee._id}
                                    className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-600/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] message-bubble"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    {/* Student Header */}
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                            {mentee.fullName?.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                                {mentee.fullName}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                ID: {mentee.studentId}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                Class {mentee.class}-{mentee.section}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-white/50 dark:bg-slate-600/50 rounded-xl p-3">
                                            <div className="flex items-center space-x-2">
                                                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Attendance</p>
                                                    <p className="text-lg font-bold text-slate-800 dark:text-white">
                                                        {mentee.attendance?.percentage || 0}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white/50 dark:bg-slate-600/50 rounded-xl p-3">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Present Days</p>
                                                    <p className="text-lg font-bold text-slate-800 dark:text-white">
                                                        {mentee.attendance?.presentDays || 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                                            <Mail className="h-4 w-4" />
                                            <span className="truncate">{mentee.userId?.email}</span>
                                        </div>
                                        {mentee.phone && (
                                            <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Phone className="h-4 w-4" />
                                                <span>{mentee.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                                            <User className="h-4 w-4" />
                                            <span>
                                                Last login: {mentee.userId?.lastLogin
                                                    ? new Date(mentee.userId.lastLogin).toLocaleDateString()
                                                    : 'Never'
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    {/* Attendance Progress */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                                            <span>Attendance Progress</span>
                                            <span>{mentee.attendance?.presentDays || 0}/{mentee.attendance?.totalDays || 0}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full transition-all duration-1000 ${(mentee.attendance?.percentage || 0) >= 90
                                                    ? 'bg-gradient-to-r from-green-500 to-green-400'
                                                    : (mentee.attendance?.percentage || 0) >= 75
                                                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                                                        : 'bg-gradient-to-r from-red-500 to-red-400'
                                                    }`}
                                                style={{
                                                    width: `${mentee.attendance?.percentage || 0}%`,
                                                    animationDelay: `${index * 0.2}s`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => {
                                                setSelectedStudent(mentee)
                                                setShowStudentModal(true)
                                            }}
                                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => window.location.href = `/chat/individual_${mentee._id}`}
                                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Chat
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="h-24 w-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <Users className="h-12 w-12 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                No Mentees Yet
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                You haven't been assigned any mentees yet. Contact your administrator to get started with mentoring.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    const MenteeDashboard = () => (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Track your academic progress and stay connected with your mentor.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Attendance Card */}
                <div
                    onClick={() => navigate('/profile')}
                    className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-emerald-100 text-sm font-medium">Attendance</p>
                                <p className="text-white text-3xl font-bold mt-1">
                                    {dashboardData?.stats?.attendancePercentage || 0}%
                                </p>
                                <p className="text-emerald-100 text-xs mt-1">This semester</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <TrendingUp className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grievances Card */}
                <div
                    onClick={() => navigate('/grievances')}
                    className="relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm font-medium">Grievances</p>
                                <p className="text-white text-3xl font-bold mt-1">
                                    {dashboardData?.stats?.totalGrievances || 0}
                                </p>
                                <p className="text-red-100 text-xs mt-1">Submitted</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <FileText className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leaves Status Card (Combined Pending & Approved) */}
                <div
                    onClick={() => navigate('/leaves')}
                    className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Leaves Status</p>
                                <div className="flex items-baseline space-x-2 mt-1">
                                    <p className="text-white text-2xl font-bold">
                                        {dashboardData?.stats?.pendingLeaves || 0}
                                    </p>
                                    <span className="text-purple-200 text-sm">pending</span>
                                    <span className="text-purple-200 text-sm">•</span>
                                    <p className="text-white text-2xl font-bold">
                                        {dashboardData?.stats?.approvedLeaves || 0}
                                    </p>
                                    <span className="text-purple-200 text-sm">approved</span>
                                </div>
                                <p className="text-purple-100 text-xs mt-1">Leave requests</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <Calendar className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Leave Requests */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50">
                <div className="px-6 py-6 sm:p-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                        Recent Leave Requests
                    </h3>
                    <div className="space-y-4">
                        {dashboardData?.recentLeaves?.length > 0 ? (
                            dashboardData.recentLeaves.map((leave, index) => (
                                <div
                                    key={leave._id}
                                    className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-slate-600/30 hover:shadow-lg transition-all duration-300 message-bubble"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                                    {leave.leaveType} Leave
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(leave.startDate).toLocaleDateString()} - {leave.daysCount} days
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${leave.status === 'pending'
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                            : leave.status === 'approved'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                            {leave.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    No recent leave requests
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Announcements Section */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50">
                <div className="px-6 py-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                <Megaphone className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                                Announcements
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Stay on top of updates from your mentors and administrators.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleAnnouncementRefresh}
                            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100/60 dark:bg-slate-700/60 hover:bg-slate-200/60 dark:hover:bg-slate-600/60 transition-all duration-200 text-sm font-medium text-slate-600 dark:text-slate-300"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            <span>Refresh Feed</span>
                        </button>
                    </div>

                    <AnnouncementFeed key={announcementRefreshKey} showHeader={false} />
                </div>
            </div>
        </div>
    )

    const GuardianDashboard = () => {
        const guardianMentees = profile?.menteeIds || []
        const stats = dashboardData?.stats || {}
        const recentGrievances = dashboardData?.recentGrievances || []

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guardian Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        Stay informed about your student's progress and communications.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                        <div className="relative p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-sm font-medium">Linked Students</p>
                                    <p className="text-white text-3xl font-bold mt-1">
                                        {guardianMentees.length}
                                    </p>
                                    <p className="text-emerald-100 text-xs mt-1">Active connections</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-full">
                                    <Users className="h-8 w-8 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                        <div className="relative p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm font-medium">Open Complaints</p>
                                    <p className="text-white text-3xl font-bold mt-1">
                                        {stats.pendingGrievances || 0}
                                    </p>
                                    <p className="text-orange-100 text-xs mt-1">Pending or in review</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-full">
                                    <FileText className="h-8 w-8 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                        <div className="relative p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Resolved Complaints</p>
                                    <p className="text-white text-3xl font-bold mt-1">
                                        {stats.resolvedGrievances || 0}
                                    </p>
                                    <p className="text-blue-100 text-xs mt-1">Successfully addressed</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-full">
                                    <Shield className="h-8 w-8 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50">
                    <div className="px-6 py-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                <Users className="h-6 w-6 mr-3 text-emerald-500 dark:text-emerald-300" />
                                Your Students ({guardianMentees.length})
                            </h3>
                            <button
                                onClick={() => navigate('/chat')}
                                className="text-sm text-emerald-600 dark:text-emerald-300 hover:text-emerald-500 dark:hover:text-emerald-200 font-medium bg-emerald-50/50 dark:bg-emerald-900/20 px-3 py-2 rounded-xl transition-all duration-300"
                            >
                                Open Chat
                            </button>
                        </div>

                        <div className="space-y-4">
                            {guardianMentees.length > 0 ? guardianMentees.map((mentee, index) => (
                                <div
                                    key={mentee._id || index}
                                    className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-slate-600/30 hover:shadow-lg transition-all duration-300 message-bubble"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg">
                                                {mentee.fullName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                                    {mentee.fullName}
                                                </h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    ID: {mentee.studentId} • Class {mentee.class}-{mentee.section}
                                                </p>
                                                {mentee.mentorId && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                        Mentor: {mentee.mentorId.fullName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 ml-4">
                                            {mentee.mentorId && (
                                                <button
                                                    onClick={() => navigate(`/chat/individual_${mentee._id}`)}
                                                    className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all duration-300 hover:scale-110"
                                                    title="Chat with mentor"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate('/grievances')}
                                                className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-300 hover:scale-110"
                                                title="View grievances"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8">
                                    <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        No linked students yet. Contact the administrator for assistance.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50">
                    <div className="px-6 py-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                <FileText className="h-6 w-6 mr-3 text-orange-500 dark:text-orange-300" />
                                Recent Complaints
                            </h3>
                            <button
                                onClick={() => navigate('/grievances')}
                                className="text-sm text-orange-600 dark:text-orange-300 hover:text-orange-500 dark:hover:text-orange-200 font-medium bg-orange-50/50 dark:bg-orange-900/20 px-3 py-2 rounded-xl transition-all duration-300"
                            >
                                View All
                            </button>
                        </div>

                        {recentGrievances.length > 0 ? (
                            <div className="space-y-4">
                                {recentGrievances.map((grievance, index) => (
                                    <div
                                        key={grievance._id}
                                        className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-slate-600/30 hover:shadow-lg transition-all duration-300 message-bubble"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                                    {grievance.subject}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    {grievance.menteeId?.fullName} • {new Date(grievance.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${grievance.status === 'resolved'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : grievance.status === 'rejected'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                                }`}>
                                                {grievance.status === 'in-review' ? 'In Review' : grievance.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                                            {grievance.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    No complaints submitted yet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50">
                    <div className="px-6 py-6 sm:p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                <Megaphone className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                                Announcements
                            </h3>
                            <button
                                type="button"
                                onClick={handleAnnouncementRefresh}
                                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100/60 dark:bg-slate-700/60 hover:bg-slate-200/60 dark:hover:bg-slate-600/60 transition-all duration-200 text-sm font-medium text-slate-600 dark:text-slate-300"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                <span>Refresh Feed</span>
                            </button>
                        </div>

                        <AnnouncementFeed key={`guardian-${announcementRefreshKey}`} showHeader={false} />
                    </div>
                </div>
            </div>
        )
    }

    if (user.role === 'admin') {
        return <AdminDashboard />
    }

    return (
        <Layout>
            {user.role === 'mentor' ? (
                showExpandedMentees ? <ExpandedMenteesView /> : <MentorDashboard />
            ) : user.role === 'guardian' ? (
                <GuardianDashboard />
            ) : (
                <MenteeDashboard />
            )}

            {user.role === 'mentor' && (
                <StudentDetailsModal
                    student={selectedStudent}
                    isOpen={showStudentModal}
                    onClose={() => {
                        setShowStudentModal(false)
                        setSelectedStudent(null)
                    }}
                />
            )}
        </Layout>
    )
}

export default DashboardPage