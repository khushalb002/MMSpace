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
    BarChart3,
    Minus,
    AlertTriangle,
    TrendingUp,
    Award,
    Bell,
    Activity,
    Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import LoadingSpinner from '../LoadingSpinner'
import CustomCalendar from '../CustomCalendar'

const AttendanceManagement = () => {
    const [mentees, setMentees] = useState([])
    const [attendance, setAttendance] = useState({})
    const [trendAttendance, setTrendAttendance] = useState({})
    const [currentMonthAttendance, setCurrentMonthAttendance] = useState({})
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [viewMode, setViewMode] = useState('daily') // 'daily' or 'monthly'
    const [searchTerm, setSearchTerm] = useState('')
    const [sectionFilter, setSectionFilter] = useState('all')
    const [saving, setSaving] = useState(false)
    const [showAttendanceModal, setShowAttendanceModal] = useState(false)
    const [modalType, setModalType] = useState('') // 'low', 'good', 'high'

    useEffect(() => {
        fetchMentees()
        fetchTrendAttendance()
        fetchCurrentMonthAttendance()
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

    const fetchCurrentMonthAttendance = async () => {
        try {
            const date = new Date(selectedDate)
            const month = date.getMonth() + 1
            const year = date.getFullYear()
            console.log('Fetching attendance for month:', month, 'year:', year)
            const response = await api.get(`/admin/attendance?month=${month}&year=${year}`)
            setCurrentMonthAttendance(response.data)
            console.log('Current month attendance updated:', response.data)
        } catch (error) {
            console.error('Error fetching current month attendance:', error)
        }
    }

    const fetchTrendAttendance = async () => {
        try {
            const today = new Date()
            const startDate = new Date(today)
            startDate.setDate(today.getDate() - 6)
            
            const startMonth = startDate.getMonth() + 1
            const startYear = startDate.getFullYear()
            const endMonth = today.getMonth() + 1
            const endYear = today.getFullYear()
            
            let allAttendanceData = {}
            
            if (startMonth === endMonth && startYear === endYear) {
                const response = await api.get(`/admin/attendance?month=${startMonth}&year=${startYear}`)
                allAttendanceData = response.data
            } else {
                const [response1, response2] = await Promise.all([
                    api.get(`/admin/attendance?month=${startMonth}&year=${startYear}`),
                    api.get(`/admin/attendance?month=${endMonth}&year=${endYear}`)
                ])
                allAttendanceData = { ...response1.data, ...response2.data }
            }
            
            setTrendAttendance(allAttendanceData)
        } catch (error) {
            console.error('Error fetching trend attendance:', error)
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

    const getCurrentMonthStats = (menteeId) => {
        const menteeAttendance = currentMonthAttendance[menteeId] || {}
        const date = new Date(selectedDate)
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        const daysInMonth = new Date(year, month, 0).getDate()
        let present = 0
        let absent = 0

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const status = menteeAttendance[dateStr]
            if (status === 'present') present++
            else if (status === 'absent') absent++
        }

        const percentage = present > 0 ? ((present / (present + absent)) * 100).toFixed(1) : 0
        console.log(`Stats for mentee ${menteeId} - Month: ${month}/${year}, Present: ${present}, Absent: ${absent}, %: ${percentage}`)
        return { present, absent, total: daysInMonth, percentage }
    }

    const getAttendanceInsights = () => {
        const lowAttendance = []
        const goodAttendance = []
        const highAttendance = []

        mentees.forEach(mentee => {
            const stats = getCurrentMonthStats(mentee._id)
            const percentage = parseFloat(stats.percentage)

            if (percentage > 0) {
                if (percentage < 50) {
                    lowAttendance.push({ ...mentee, percentage })
                } else if (percentage >= 70 && percentage <= 90) {
                    goodAttendance.push({ ...mentee, percentage })
                } else if (percentage > 90) {
                    highAttendance.push({ ...mentee, percentage })
                }
            }
        })

        return { lowAttendance, goodAttendance, highAttendance }
    }

    const openAttendanceModal = (type) => {
        setModalType(type)
        setShowAttendanceModal(true)
    }

    const getAttendanceTrends = () => {
        const trends = []
        const today = new Date()

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

            let present = 0
            let absent = 0

            mentees.forEach(mentee => {
                const status = trendAttendance[mentee._id]?.[dateStr]
                if (status === 'present') present++
                else if (status === 'absent') absent++
            })

            trends.push({
                date: dateStr,
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                present,
                absent,
                total: present + absent
            })
        }

        return trends
    }

    const getAlerts = () => {
        const alerts = []
        const today = new Date()

        // Check for consecutive absences
        mentees.forEach(mentee => {
            let consecutiveAbsences = 0

            for (let i = 0; i < 7; i++) {
                const date = new Date(today)
                date.setDate(date.getDate() - i)
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

                if (trendAttendance[mentee._id]?.[dateStr] === 'absent') {
                    consecutiveAbsences++
                } else if (trendAttendance[mentee._id]?.[dateStr] === 'present') {
                    break
                }
            }

            if (consecutiveAbsences >= 3) {
                alerts.push({
                    type: 'consecutive',
                    student: mentee,
                    days: consecutiveAbsences,
                    message: `${mentee.fullName} has been absent for ${consecutiveAbsences} consecutive days`
                })
            }
        })

        // Check for low monthly attendance
        const insights = getAttendanceInsights()
        insights.lowAttendance.forEach(student => {
            alerts.push({
                type: 'low',
                student,
                percentage: student.percentage,
                message: `${student.fullName} has low attendance (${student.percentage}%)`
            })
        })

        return alerts.slice(0, 5) // Return top 5 alerts
    }

    const filteredMentees = mentees.filter(mentee => {
        const matchesSearch = mentee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mentee.studentId.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesSection = sectionFilter === 'all' || mentee.section === sectionFilter
        return matchesSearch && matchesSection
    })

    const uniqueSections = [...new Set(mentees.map(mentee => mentee.section))].sort()
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
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                            Attendance Management
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-3">
                            {viewMode === 'daily'
                                ? 'Mark daily attendance for all students. Select a date and mark students as present or absent.'
                                : 'View monthly attendance patterns and statistics across all students.'}
                        </p>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-100/50 dark:bg-slate-700/50 rounded-2xl p-1 shadow-inner">
                        <button
                            onClick={() => setViewMode('daily')}
                            className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${viewMode === 'daily'
                                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-lg scale-105'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                        >
                            <Calendar className="h-5 w-5 mr-2" />
                            Daily View
                        </button>
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${viewMode === 'monthly'
                                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-lg scale-105'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                        >
                            <BarChart3 className="h-5 w-5 mr-2" />
                            Monthly View
                        </button>
                    </div>
                </div>

                {/* Controls */}
                {viewMode === 'daily' ? (
                    <div className="mt-6 space-y-6">
                        {/* Attendance Insights Cards - Full Width */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                onClick={() => openAttendanceModal('low')}
                                className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg p-3 border border-red-200/50 dark:border-red-800/50 hover:shadow-lg transition-all duration-300 hover:scale-105 text-left"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg mb-1">
                                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Low Attendance</p>
                                    <p className="text-xs text-red-600/70 dark:text-red-400/70 mb-1">Below 50%</p>
                                    <p className="text-xl font-bold text-red-700 dark:text-red-300">
                                        {getAttendanceInsights().lowAttendance.length}
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => openAttendanceModal('good')}
                                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-all duration-300 hover:scale-105 text-left"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-1">
                                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Good Attendance</p>
                                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mb-1">70% - 90%</p>
                                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                        {getAttendanceInsights().goodAttendance.length}
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => openAttendanceModal('high')}
                                className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200/50 dark:border-green-800/50 hover:shadow-lg transition-all duration-300 hover:scale-105 text-left"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg mb-1">
                                        <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">High Attendance</p>
                                    <p className="text-xs text-green-600/70 dark:text-green-400/70 mb-1">Above 90%</p>
                                    <p className="text-xl font-bold text-green-700 dark:text-green-300">
                                        {getAttendanceInsights().highAttendance.length}
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Calendar, Controls and Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Calendar */}
                            <div className="lg:col-span-1">
                                <CustomCalendar
                                    selectedDate={selectedDate}
                                    onDateSelect={setSelectedDate}
                                    className="w-full"
                                />
                            </div>

                            {/* Controls and Analytics */}
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
                                        value={sectionFilter}
                                        onChange={(e) => setSectionFilter(e.target.value)}
                                        className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-slate-800 dark:text-white"
                                    >
                                        <option value="all">All Sections</option>
                                        {uniqueSections.map(section => (
                                            <option key={section} value={section}>Section {section}</option>
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

                                {/* Attendance Trends Chart */}
                                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-purple-200/50 dark:border-purple-800/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white">7-Day Trend</h4>
                                    </div>
                                    <div className="flex items-end justify-between gap-4 h-24">
                                        {getAttendanceTrends().map((trend, index) => {
                                            const maxValue = Math.max(
                                                ...getAttendanceTrends().map(t => Math.max(t.present, t.absent))
                                            )
                                            const presentHeight = maxValue > 0 ? (trend.present / maxValue) * 100 : 0
                                            const absentHeight = maxValue > 0 ? (trend.absent / maxValue) * 100 : 0

                                            return (
                                                <div key={index} className="flex-1 flex flex-col items-center gap-1.5">
                                                    <div className="w-full flex items-end justify-center gap-1.5" style={{ height: '80px' }}>
                                                        {/* Present Bar */}
                                                        <div className="flex-1 flex flex-col items-center justify-end relative group">
                                                            <div
                                                                className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t transition-all duration-300 hover:shadow-lg hover:scale-105"
                                                                style={{ height: `${presentHeight * 0.8}px`, minHeight: trend.present > 0 ? '4px' : '0' }}
                                                                title={`Present: ${trend.present}`}
                                                            />
                                                        </div>
                                                        {/* Absent Bar */}
                                                        <div className="flex-1 flex flex-col items-center justify-end relative group">
                                                            <div
                                                                className="w-full bg-gradient-to-t from-red-500 to-rose-400 rounded-t transition-all duration-300 hover:shadow-lg hover:scale-105"
                                                                style={{ height: `${absentHeight * 0.8}px`, minHeight: trend.absent > 0 ? '4px' : '0' }}
                                                                title={`Absent: ${trend.absent}`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{trend.day}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-purple-200/50 dark:border-purple-800/50">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 bg-gradient-to-br from-green-500 to-emerald-400 rounded"></div>
                                            <span className="text-[10px] text-slate-600 dark:text-slate-400">Present</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 bg-gradient-to-br from-red-500 to-rose-400 rounded"></div>
                                            <span className="text-[10px] text-slate-600 dark:text-slate-400">Absent</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Alerts Panel */}
                                <div className="mt-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3 border border-amber-200/50 dark:border-amber-800/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Alerts</h4>
                                    </div>
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                        {getAlerts().length > 0 ? (
                                            getAlerts().slice(0, 3).map((alert, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg hover:shadow-md transition-all"
                                                >
                                                    <div className={`p-1 rounded ${alert.type === 'consecutive'
                                                        ? 'bg-red-100 dark:bg-red-900/30'
                                                        : 'bg-amber-100 dark:bg-amber-900/30'
                                                        }`}>
                                                        {alert.type === 'consecutive' ? (
                                                            <Clock className="h-3 w-3 text-red-600 dark:text-red-400" />
                                                        ) : (
                                                            <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-slate-800 dark:text-white font-medium truncate">
                                                            {alert.student.fullName}
                                                        </p>
                                                        <p className="text-[10px] text-slate-600 dark:text-slate-400">
                                                            {alert.type === 'consecutive'
                                                                ? `${alert.days} days absent`
                                                                : `${alert.percentage}% attendance`
                                                            }
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                        {alert.student.class}-{alert.student.section}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4">
                                                <Check className="h-6 w-6 text-green-500 mx-auto mb-1" />
                                                <p className="text-xs text-slate-600 dark:text-slate-400">No alerts</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                {Array.from({ length: 6 }, (_, i) => (
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
                            value={sectionFilter}
                            onChange={(e) => setSectionFilter(e.target.value)}
                            className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-slate-800 dark:text-white"
                        >
                            <option value="all">All Sections</option>
                            {uniqueSections.map(section => (
                                <option key={section} value={section}>Section {section}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Quick Summary Stats */}
            {viewMode === 'daily' && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                            <Users className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-800/50">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                            <UserCheck className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Present</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.present}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-4 border border-red-200/50 dark:border-red-800/50">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                            <UserX className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Absent</span>
                        </div>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.absent}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/50">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Unmarked</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.unmarked}</p>
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
                                        <>
                                            <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Attendance</th>
                                            <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Month %</th>
                                        </>
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
                                    const currentMonthStats = viewMode === 'daily' ? getCurrentMonthStats(mentee._id) : null
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
                                                <>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <button
                                                                onClick={() => handleAttendanceChange(mentee._id, selectedDate, 'present')}
                                                                className={`p-2 rounded-xl transition-all duration-300 ${attendanceStatus === 'present'
                                                                    ? 'bg-green-500 text-white shadow-lg scale-110'
                                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600'
                                                                    }`}
                                                                title="Mark Present"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAttendanceChange(mentee._id, selectedDate, 'absent')}
                                                                className={`p-2 rounded-xl transition-all duration-300 ${attendanceStatus === 'absent'
                                                                    ? 'bg-red-500 text-white shadow-lg scale-110'
                                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600'
                                                                    }`}
                                                                title="Mark Absent"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAttendanceChange(mentee._id, selectedDate, null)}
                                                                className={`p-2 rounded-xl transition-all duration-300 ${!attendanceStatus
                                                                    ? 'bg-amber-500 text-white shadow-lg scale-110'
                                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600'
                                                                    }`}
                                                                title="Unmark"
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center">
                                                            <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2 mr-2">
                                                                <div
                                                                    className={`h-2 rounded-full transition-all duration-500 ${
                                                                        currentMonthStats.percentage < 50 
                                                                            ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                                                            : currentMonthStats.percentage >= 70 && currentMonthStats.percentage <= 90
                                                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                                                            : currentMonthStats.percentage > 90
                                                                            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                                            : 'bg-gradient-to-r from-amber-500 to-orange-600'
                                                                    }`}
                                                                    style={{ width: `${currentMonthStats.percentage}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-800 dark:text-white">
                                                                {currentMonthStats.percentage}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </>
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

            {/* Attendance Insights Modal */}
            {
                showAttendanceModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {modalType === 'low' && (
                                            <>
                                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Low Attendance</h3>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Students with less than 50% attendance</p>
                                                </div>
                                            </>
                                        )}
                                        {modalType === 'good' && (
                                            <>
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                                    <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Good Attendance</h3>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Students with 70-90% attendance</p>
                                                </div>
                                            </>
                                        )}
                                        {modalType === 'high' && (
                                            <>
                                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                                    <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">High Attendance</h3>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Students with more than 90% attendance</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowAttendanceModal(false)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                    >
                                        <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                                {(() => {
                                    const insights = getAttendanceInsights()
                                    const students = modalType === 'low' ? insights.lowAttendance :
                                        modalType === 'good' ? insights.goodAttendance :
                                            insights.highAttendance

                                    if (students.length === 0) {
                                        return (
                                            <div className="text-center py-8">
                                                <p className="text-slate-600 dark:text-slate-400">No students found in this category</p>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div className="space-y-3">
                                            {students.map((student) => (
                                                <div
                                                    key={student._id}
                                                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:shadow-md transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                            {student.fullName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800 dark:text-white">{student.fullName}</p>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                {student.studentId} • Class {student.class}-{student.section}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-2xl font-bold ${modalType === 'low' ? 'text-red-600 dark:text-red-400' :
                                                            modalType === 'good' ? 'text-blue-600 dark:text-blue-400' :
                                                                'text-green-600 dark:text-green-400'
                                                            }`}>
                                                            {student.percentage}%
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Attendance</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}

export default AttendanceManagement