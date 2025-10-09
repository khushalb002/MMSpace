import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

const CustomCalendar = ({ selectedDate, onDateSelect, className = '' }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate))
    const [showMonthPicker, setShowMonthPicker] = useState(false)
    const [showYearPicker, setShowYearPicker] = useState(false)
    const [yearPage, setYearPage] = useState(0)
    const calendarRef = useRef(null)

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setShowMonthPicker(false)
                setShowYearPicker(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const days = []

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null)
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day))
        }

        return days
    }

    const navigateMonth = (direction) => {
        const newMonth = new Date(currentMonth)
        newMonth.setMonth(currentMonth.getMonth() + direction)
        setCurrentMonth(newMonth)
    }

    const isToday = (date) => {
        const today = new Date()
        return date &&
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
    }

    const isSelected = (date) => {
        if (!date || !selectedDate) return false
        const selected = new Date(selectedDate)
        return date.getDate() === selected.getDate() &&
            date.getMonth() === selected.getMonth() &&
            date.getFullYear() === selected.getFullYear()
    }

    const formatDateForInput = (date) => {
        return date.toISOString().split('T')[0]
    }

    // Generate years from 2000 to 2050 with pagination
    const generateYears = () => {
        const startYear = 2000
        const endYear = 2050
        const yearsPerPage = 20
        const totalYears = endYear - startYear + 1
        const totalPages = Math.ceil(totalYears / yearsPerPage)

        const currentPageStart = startYear + (yearPage * yearsPerPage)
        const currentPageEnd = Math.min(currentPageStart + yearsPerPage - 1, endYear)

        const years = []
        for (let year = currentPageStart; year <= currentPageEnd; year++) {
            years.push(year)
        }

        return { years, totalPages, currentPage: yearPage }
    }

    const days = getDaysInMonth(currentMonth)
    const { years, totalPages, currentPage } = generateYears()

    return (
        <div ref={calendarRef} className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg rounded-2xl border border-white/20 dark:border-slate-700/50 p-4 ${className}`}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                    <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </button>

                <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div className="flex items-center space-x-1">
                        {/* Month Selector */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowMonthPicker(!showMonthPicker)
                                    setShowYearPicker(false)
                                }}
                                className="flex items-center space-x-1 px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <span className="text-lg font-semibold text-slate-800 dark:text-white">
                                    {monthNames[currentMonth.getMonth()]}
                                </span>
                                <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </button>

                            {showMonthPicker && (
                                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl z-20 p-2 grid grid-cols-3 gap-1 w-48">
                                    {monthNames.map((month, index) => (
                                        <button
                                            key={month}
                                            onClick={() => {
                                                const newDate = new Date(currentMonth)
                                                newDate.setMonth(index)
                                                setCurrentMonth(newDate)
                                                setShowMonthPicker(false)
                                            }}
                                            className={`px-2 py-1 text-sm rounded-lg transition-colors ${index === currentMonth.getMonth()
                                                ? 'bg-blue-500 text-white'
                                                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            {month.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Year Selector */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowYearPicker(!showYearPicker)
                                    setShowMonthPicker(false)
                                    // Set year page to show current year
                                    const currentYear = currentMonth.getFullYear()
                                    const pageForCurrentYear = Math.floor((currentYear - 2000) / 20)
                                    setYearPage(pageForCurrentYear)
                                }}
                                className="flex items-center space-x-1 px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <span className="text-lg font-semibold text-slate-800 dark:text-white">
                                    {currentMonth.getFullYear()}
                                </span>
                                <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </button>

                            {showYearPicker && (
                                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl z-20 p-3 w-64">
                                    {/* Year pagination controls */}
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-600">
                                        <button
                                            onClick={() => setYearPage(Math.max(0, yearPage - 1))}
                                            disabled={yearPage === 0}
                                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                        </button>
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            {years[0]} - {years[years.length - 1]}
                                        </span>
                                        <button
                                            onClick={() => setYearPage(Math.min(totalPages - 1, yearPage + 1))}
                                            disabled={yearPage === totalPages - 1}
                                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                        </button>
                                    </div>

                                    {/* Years grid */}
                                    <div className="grid grid-cols-4 gap-1">
                                        {years.map((year) => (
                                            <button
                                                key={year}
                                                onClick={() => {
                                                    const newDate = new Date(currentMonth)
                                                    newDate.setFullYear(year)
                                                    setCurrentMonth(newDate)
                                                    setShowYearPicker(false)
                                                }}
                                                className={`px-2 py-1 text-sm rounded-lg transition-colors ${year === currentMonth.getFullYear()
                                                    ? 'bg-blue-500 text-white'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                    }`}
                                            >
                                                {year}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Page indicator */}
                                    <div className="flex justify-center mt-3 pt-2 border-t border-slate-200 dark:border-slate-600">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            Page {currentPage + 1} of {totalPages}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                    <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((date, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            if (date) {
                                onDateSelect(formatDateForInput(date))
                            }
                        }}
                        disabled={!date}
                        className={`
                            p-2 text-sm rounded-xl transition-all duration-200 hover:scale-105
                            ${!date ? 'invisible' : ''}
                            ${isSelected(date)
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                : isToday(date)
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-semibold'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }
                        `}
                    >
                        {date?.getDate()}
                    </button>
                ))}
            </div>

            {/* Quick Navigation */}
            <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-600/50">
                <div className="flex space-x-2">
                    <button
                        onClick={() => {
                            const today = new Date()
                            setCurrentMonth(today)
                            onDateSelect(formatDateForInput(today))
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => {
                            const yesterday = new Date()
                            yesterday.setDate(yesterday.getDate() - 1)
                            setCurrentMonth(yesterday)
                            onDateSelect(formatDateForInput(yesterday))
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Yesterday
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CustomCalendar