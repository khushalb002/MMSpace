import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import AttendanceDetailsModal from '../components/AttendanceDetailsModal'
import api from '../services/api'
import { Users, UserCheck, UserX, BarChart3, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'

const AttendancePage = () => {
    const { user } = useAuth()
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
        if (!user) return
        const fetchData = async () => {
            try {
                setLoading(true)
                setError('')

                const endpoint = user.role === 'mentor'
                    ? '/groups'
                    : user.role === 'admin'
                        ? '/admin/groups'
                        : null

                if (!endpoint) {
                    setGroups([])
                    setError('Attendance view is only available for mentors (and admins).')
                    return
                }

                const response = await api.get(endpoint)
                const fetchedGroups = Array.isArray(response.data) ? response.data : []

                // When groups lack mentees, generate mock mentees to exercise UI
                const groupsWithMockedMentees = fetchedGroups.map((group, index) => {
                    const mentees = group.menteeIds || group.mentees
                    if (Array.isArray(mentees) && mentees.length >= 10) {
                        return group
                    }

                    const randomCount = Math.floor(Math.random() * 11) + 10 // 10-20 mentees
                    const mockMentees = Array.from({ length: randomCount }).map((_, idx) => {
                        const totalDays = Math.floor(Math.random() * 20) + 20
                        const presentDays = Math.min(totalDays, Math.floor(totalDays * (0.6 + Math.random() * 0.4)))
                        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

                        const studentIndex = idx + 1
                        return {
                            _id: `${group._id || index}-mock-${studentIndex}`,
                            fullName: `Student ${studentIndex}`,
                            studentId: `MT-${String(studentIndex).padStart(3, '0')}`,
                            class: 'CSE',
                            section: ['A', 'B', 'C'][studentIndex % 3],
                            attendance: {
                                totalDays,
                                presentDays,
                                percentage
                            }
                        }
                    })

                    return {
                        ...group,
                        menteeIds: mockMentees
                    }
                })

                setGroups(groupsWithMockedMentees)
            } catch (err) {
                console.error('Error fetching attendance groups:', err)
                setError('Unable to load attendance information right now. Please try again later.')
                setGroups([])
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [user])

    const handleExportReport = () => {
        try {
            // Prepare CSV data
            const csvHeaders = ['Group Name', 'Total Students', 'Total Days', 'Present', 'Absent', 'Attendance %', 'Student Name', 'Student ID', 'Class', 'Section', 'Student Present', 'Student Total', 'Student %']
            const csvRows = []

            groups.forEach(group => {
                const mentees = group.menteeIds || group.mentees || []
                const groupName = group.name || 'Unnamed Group'

                mentees.forEach(mentee => {
                    const attendance = mentee.attendance || {}
                    const present = attendance.presentDays || 0
                    const total = attendance.totalDays || 0
                    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

                    csvRows.push([
                        `"${groupName}"`,
                        mentees.length,
                        total,
                        present,
                        total - present,
                        percentage + '%',
                        `"${mentee.fullName || 'N/A'}"`,
                        mentee.studentId || 'N/A',
                        mentee.class || 'N/A',
                        mentee.section || 'N/A',
                        present,
                        total,
                        percentage + '%'
                    ])
                })
            })

            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map(row => row.join(','))
            ].join('\n')

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success('Attendance report exported successfully!')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export report')
        }
    }

    const preparedGroups = useMemo(() => {
        return groups.map((group) => {
            const mentees = group.menteeIds || group.mentees || []
            const totals = mentees.reduce((acc, mentee) => {
                const attendance = mentee.attendance || {}
                const present = attendance.presentDays || 0
                const total = attendance.totalDays || 0
                const absent = Math.max(total - present, 0)

                acc.students += 1
                acc.present += present
                acc.totalDays += total
                acc.absent += absent
                return acc
            }, { students: 0, present: 0, absent: 0, totalDays: 0 })

            const averagePercentage = totals.students > 0
                ? Math.round(
                    mentees.reduce((sum, mentee) => sum + (mentee.attendance?.percentage || 0), 0) /
                    totals.students
                )
                : 0

            return {
                id: group._id,
                name: group.name,
                description: group.description,
                color: group.color || '#3B82F6',
                mentees,
                stats: {
                    totalStudents: totals.students,
                    presentDays: totals.present,
                    totalDays: totals.totalDays,
                    absentDays: totals.absent,
                    averagePercentage
                }
            }
        })
    }, [groups])

    const handleDetailsOpen = (group) => {
        setSelectedGroup({
            ...group,
            mentees: group.mentees
        })
        setShowDetails(true)
    }

    const renderContent = () => {
        if (!user) {
            return (
                <div className="flex h-64 items-center justify-center">
                    <LoadingSpinner />
                </div>
            )
        }

        if (loading) {
            return (
                <div className="flex h-64 items-center justify-center">
                    <LoadingSpinner />
                </div>
            )
        }

        if (error) {
            return (
                <div className="rounded-3xl border border-red-200/40 bg-red-50/70 px-6 py-16 text-center text-red-600 shadow-lg dark:border-red-900/30 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                </div>
            )
        }

        if (preparedGroups.length === 0) {
            return (
                <div className="rounded-3xl border border-white/20 bg-white/70 px-6 py-16 text-center shadow-xl dark:border-slate-700/50 dark:bg-slate-900/70">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg">
                        <Users className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Groups Found</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Once you create mentee groups, their attendance summaries will appear here.
                    </p>
                </div>
            )
        }

        return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {preparedGroups.map((group) => {
                    const attendanceLevel = group.stats.averagePercentage >= 90 ? 'excellent' :
                        group.stats.averagePercentage >= 75 ? 'good' :
                            group.stats.averagePercentage >= 60 ? 'fair' : 'poor'

                    return (
                        <div
                            key={group.id}
                            className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/70"
                        >
                            {/* Status Indicator Bar */}
                            <div
                                className={`absolute inset-x-0 top-0 h-2 ${attendanceLevel === 'excellent' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                        attendanceLevel === 'good' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                                            attendanceLevel === 'fair' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                                'bg-gradient-to-r from-red-500 to-rose-500'
                                    }`}
                            />

                            <div className="mb-6 flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        {group.name}
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${attendanceLevel === 'excellent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                attendanceLevel === 'good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    attendanceLevel === 'fair' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                            }`}>
                                            {attendanceLevel === 'excellent' ? '🌟 Excellent' :
                                                attendanceLevel === 'good' ? '👍 Good' :
                                                    attendanceLevel === 'fair' ? '⚠️ Fair' : '⚠️ Needs Attention'}
                                        </span>
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                        {group.description || 'No description'}
                                    </p>
                                </div>
                            </div>

                            {/* Main Stats */}
                            <div className="mb-5 grid grid-cols-2 gap-4">
                                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 border border-blue-200/50 dark:border-blue-800/50">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                                        <Users className="h-4 w-4" />
                                        <p className="text-xs font-semibold uppercase tracking-wide">Students</p>
                                    </div>
                                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                                        {group.stats.totalStudents}
                                    </p>
                                </div>
                                <div className={`rounded-2xl p-4 border ${attendanceLevel === 'excellent' ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-800/50' :
                                        attendanceLevel === 'good' ? 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/50 dark:border-blue-800/50' :
                                            attendanceLevel === 'fair' ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-800/50' :
                                                'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/50 dark:border-red-800/50'
                                    }`}>
                                    <div className={`flex items-center gap-2 mb-1 ${attendanceLevel === 'excellent' ? 'text-green-600 dark:text-green-400' :
                                            attendanceLevel === 'good' ? 'text-blue-600 dark:text-blue-400' :
                                                attendanceLevel === 'fair' ? 'text-amber-600 dark:text-amber-400' :
                                                    'text-red-600 dark:text-red-400'
                                        }`}>
                                        <BarChart3 className="h-4 w-4" />
                                        <p className="text-xs font-semibold uppercase tracking-wide">Attendance</p>
                                    </div>
                                    <p className={`text-3xl font-bold ${attendanceLevel === 'excellent' ? 'text-green-700 dark:text-green-300' :
                                            attendanceLevel === 'good' ? 'text-blue-700 dark:text-blue-300' :
                                                attendanceLevel === 'fair' ? 'text-amber-700 dark:text-amber-300' :
                                                    'text-red-700 dark:text-red-300'
                                        }`}>
                                        {group.stats.averagePercentage}%
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Stats */}
                            <div className="space-y-2 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/30 p-4 border border-slate-200/50 dark:border-slate-700/50">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        <UserCheck className="h-4 w-4 text-green-500" /> Present Days
                                    </span>
                                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                        {group.stats.presentDays}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        <UserX className="h-4 w-4 text-red-500" /> Absent Days
                                    </span>
                                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                        {group.stats.absentDays}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDetailsOpen(group)}
                                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:from-blue-600 hover:to-indigo-700"
                            >
                                View Student Details →
                            </button>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Layout>
            <div className="space-y-6">
                <header className="rounded-3xl border border-white/20 bg-white/80 p-8 shadow-xl dark:border-slate-700/50 dark:bg-slate-900/70">
                    <div className="flex justify-between items-start gap-6">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                                Attendance Overview
                            </h1>
                            <p className="mt-3 text-slate-600 dark:text-slate-400">
                                Monitor attendance across all your mentee groups. Click on any group to view detailed student-level attendance records.
                            </p>

                            {/* Quick Stats */}
                            {preparedGroups.length > 0 && (
                                <div className="mt-6 grid grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                                            <Users className="h-4 w-4" />
                                            <span className="text-xs font-semibold uppercase tracking-wide">Total Groups</span>
                                        </div>
                                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{preparedGroups.length}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-800/50">
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                                            <UserCheck className="h-4 w-4" />
                                            <span className="text-xs font-semibold uppercase tracking-wide">Total Students</span>
                                        </div>
                                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                            {preparedGroups.reduce((sum, g) => sum + g.stats.totalStudents, 0)}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/50">
                                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                                            <BarChart3 className="h-4 w-4" />
                                            <span className="text-xs font-semibold uppercase tracking-wide">Avg Attendance</span>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                            {Math.round(preparedGroups.reduce((sum, g) => sum + g.stats.averagePercentage, 0) / preparedGroups.length)}%
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {user?.role === 'mentor' && groups.length > 0 && (
                            <button
                                onClick={handleExportReport}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                                <Download className="h-5 w-5 mr-2" />
                                Export Report
                            </button>
                        )}
                    </div>
                </header>

                {renderContent()}
            </div>

            <AttendanceDetailsModal
                isOpen={showDetails}
                onClose={() => setShowDetails(false)}
                group={selectedGroup}
            />
        </Layout>
    )
}

export default AttendancePage
