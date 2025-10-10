import { useState, useEffect } from 'react'
import {
    Calendar,
    Users,
    Check,
    X,
    Save,
    Download,
    Upload,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    UserCheck,
    UserX,
    BarChart3
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import LoadingSpinner from '../LoadingSpinner'
import CustomCalendar from '../CustomCalendar'

const AttendanceManagement = () => {
    const [mentees, setMentees] = useState([])
    const [attendance, setAttendance] = useState({})
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [viewMode, setViewMode] = useState('daily') // 'daily' or 'monthly'
    const [searchTerm, setSearchTerm] = useState('')
    const [classFilter, setClassFilter] = useState('all')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchMentees()
        if (viewMode === 'daily') {
            fetchAttendance()
        } else {
            fetchMonthlyAttendance()
        }
    }, [selectedDate, selectedMonth, selectedYear, viewMode])

    const fetchMentees = async () => {
        try {
            const response = await api.get('/admin/mentees')
            setMentees(response.data)
        } catch (error) {
            console.error('Error fetching mentees:', error)
            toast.error('Failed to fetch mentees')
        }
    }

    const fetchAttendance = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/admin/attendance?date=${selectedDate}`)
            setAttendance(response.data)
        } catch (error) {
            console.error('Error fetching attendance:', error)
            toast.error('Failed to fetch attendance data')
        } finally {
            setLoading(false)
        }
    }

    const fetchMonthlyAttendance = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/admin/attendance?month=${selectedMonth}&year=${selectedYear}`)
            setAttendance(response.data)
        } catch (error) {
            console.error('Error fetching monthly attendance:', error)
            toast.error('Failed to fetch monthly attendance data')
        } finally {
            setLoading(false)
        }
    }

    const handleAttendanceChange = (menteeId, date, status) => {
        setAttendance(prev => ({
            ...prev,
            [menteeId]: {
                ...prev[menteeId],
                [date]: status
            }
        }))
    }

    const saveAttendance = async () => {
        try {
            setSaving(true)
            await api.post('/admin/attendance', {
                date: selectedDate,
                attendanceData: attendance
            })
            toast.success('Attendance saved successfully')
        } catch (error) {
            console.error('Error saving attendance:', error)
            toast.error('Failed to save attendance')
        } finally {
            setSaving(false)
        }
    }

    const markAllPresent = () => {
        const newAttendance = { ...attendance }
        filteredMentees.forEach(mentee => {
            if (!newAttendance[mentee._id]) {
                newAttendance[mentee._id] = {}
            }
            newAttendance[mentee._id][selectedDate] = 'present'
        })
        setAttendance(newAttendance)
    }

    const markAllAbsent = () => {
        const newAttendance = { ...attendance }
        filteredMentees.forEach(mentee => {
            if (!newAttendance[mentee._id]) {
                newAttendance[mentee._id] = {}
            }
            newAttendance[mentee._id][selectedDate] = 'absent'
        })
        setAttendance(newAttendance)
    }

    const getAttendanceStats = () => {
        let present = 0
        let absent = 0
        let total = filteredMentees.length

        filteredMentees.forEach(mentee => {
            const status = attendance[mentee._id]?.[selectedDate]
            if (status === 'present') present++
            else if (status === 'absent') absent++
        })

        return { present, absent, total, unmarked: total - present - absent }
    }

    const getMonthlyStats = (menteeId) => {
        const menteeAttendance = attendance[menteeId] || {}
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
        let present = 0
        let absent = 0

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const status = menteeAttendance[dateStr]
            if (status === 'present') present++
            else if (status === 'absent') absent++
        }

        return { present, absent, total: daysInMonth, percentage: present > 0 ? ((present / (present + absent)) * 100).toFixed(1) : 0 }
    }

    const filteredMentees = mentees.filter(mentee => {
        const matchesSearch = mentee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mentee.studentId.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesClass = classFilter === 'all' || mentee.class === classFilter
        return matchesSearch && matchesClass
    })

    const uniqueClasses = [...new Set(mentees.map(mentee => mentee.class))].sort()
    const stats = getAttendanceStats()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                            <Calendar className="h-6 w-6 mr-3 text-green-600 dark:text-green-400" />
                            Attendance Management
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Track and manage student attendance records
                        </p>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-100/50 dark:bg-slate-700/50 rounded-2xl p-1">
                        <button
                            onClick={() => setViewMode('daily')}
                            className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-300 ${viewMode === 'daily'
                                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-lg'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Daily View
                        </button>
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-300 ${viewMode === 'monthly'
                                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-lg'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Monthly View
                        </button>
                    </div>
                </div>

                {/* Controls */}
                {viewMode === 'daily' ? (
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calendar */}
                        <div className="lg:col-span-1">
                            <CustomCalendar
                                selectedDate={selectedDate}
                                onDateSelect={setSelectedDate}
                                className="w-full"
                            />
                        </div>

                        {/* Controls */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search students..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-slate-800 dark:text-white"
                                    />
                                </div>

                                <select
                                    value={classFilter}
                                    onChange={(e) => setClassFilter(e.target.value)}
                                    className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-slate-800 dark:text-white"
                                >
                                    <option value="all">All Classes</option>
                                    {uniqueClasses.map(cls => (
                                        <option key={cls} value={cls}>Class {cls}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    onClick={markAllPresent}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                                >
                                    <UserCheck className="h-5 w-5 mr-2" />
                                    Mark All Present
                                </button>
                                <button
                                    onClick={markAllAbsent}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                                >
                                    <UserX className="h-5 w-5 mr-2" />
                                    Mark All Absent
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex space-x-2">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="flex-1 px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-slate-800 dark:text-white"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="flex-1 px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-slate-800 dark:text-white"
                            >
                                {Array.from({ length: 5 }, (_, i) => (
                                    <option key={2020 + i} value={2020 + i}>
                                        {2020 + i}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-slate-800 dark:text-white"
                            />
                        </div>

                        <select
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-slate-800 dark:text-white"
                        >
                            <option value="all">All Classes</option>
                            {uniqueClasses.map(cls => (
                                <option key={cls} value={cls}>Class {cls}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            {viewMode === 'daily' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Total Students</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-200" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Present</p>
                                <p className="text-2xl font-bold">{stats.present}</p>
                            </div>
                            <UserCheck className="h-8 w-8 text-green-200" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm">Absent</p>
                                <p className="text-2xl font-bold">{stats.absent}</p>
                            </div>
                            <UserX className="h-8 w-8 text-red-200" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-100 text-sm">Unmarked</p>
                                <p className="text-2xl font-bold">{stats.unmarked}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-yellow-200" />
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Table */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg rounded-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                            {viewMode === 'daily'
                                ? `Attendance for ${new Date(selectedDate).toLocaleDateString()}`
                                : `Monthly Attendance - ${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`
                            }
                        </h3>
                        {viewMode === 'daily' && (
                            <button
                                onClick={saveAttendance}
                                disabled={saving}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                            >
                                {saving ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Save Attendance
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200/50 dark:border-slate-600/50">
                                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Student</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">ID</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Class</th>
                                    {viewMode === 'daily' ? (
                                        <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Attendance</th>
                                    ) : (
                                        <>
                                            <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Present</th>
                                            <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Absent</th>
                                            <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Percentage</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMentees.map((mentee, index) => {
                                    const monthlyStats = viewMode === 'monthly' ? getMonthlyStats(mentee._id) : null
                                    const attendanceStatus = attendance[mentee._id]?.[selectedDate]

                                    return (
                                        <tr
                                            key={mentee._id}
                                            className="border-b border-slate-100/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                                        {mentee.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-800 dark:text-white">
                                                            {mentee.fullName}
                                                        </div>
                                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                                            {mentee.userId?.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                                {mentee.studentId}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                                {mentee.class}-{mentee.section}
                                            </td>
                                            {viewMode === 'daily' ? (
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <button
                                                            onClick={() => handleAttendanceChange(mentee._id, selectedDate, 'present')}
                                                            className={`p-2 rounded-xl transition-all duration-300 ${attendanceStatus === 'present'
                                                                ? 'bg-green-500 text-white shadow-lg scale-110'
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600'
                                                                }`}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAttendanceChange(mentee._id, selectedDate, 'absent')}
                                                            className={`p-2 rounded-xl transition-all duration-300 ${attendanceStatus === 'absent'
                                                                ? 'bg-red-500 text-white shadow-lg scale-110'
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600'
                                                                }`}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                            {monthlyStats.present}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                            {monthlyStats.absent}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <div className="flex items-center justify-center">
                                                            <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2 mr-2">
                                                                <div
                                                                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                                                                    style={{ width: `${monthlyStats.percentage}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-800 dark:text-white">
                                                                {monthlyStats.percentage}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredMentees.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">No students found</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Try adjusting your search or filter criteria.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AttendanceManagement