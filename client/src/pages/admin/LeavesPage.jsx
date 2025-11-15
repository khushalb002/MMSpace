import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import {
    Calendar,
    Clock,
    User,
    CheckCircle,
    XCircle,
    AlertCircle,
    Search,
    Filter,
    Eye,
    Download
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'

const AdminLeavesPage = () => {
    const { user, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [leaves, setLeaves] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [selectedLeave, setSelectedLeave] = useState(null)
    const [showViewModal, setShowViewModal] = useState(false)

    useEffect(() => {
        if (user && user.role !== 'admin') {
            toast.error('Access denied. Admin privileges required.')
            navigate('/dashboard')
        } else if (user && user.role === 'admin') {
            fetchLeaves()
        }
    }, [user, navigate])

    const fetchLeaves = async () => {
        try {
            setLoading(true)
            // Fetch all leave requests from all mentors (admin view)
            const response = await api.get('/leaves/admin')
            setLeaves(response.data)
        } catch (error) {
            console.error('Error fetching leaves:', error)
            toast.error('Failed to fetch leave requests')
            setLeaves([]) // Set empty array on error
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (leaveId, status) => {
        try {
            if (status === 'approved') {
                await api.put(`/leaves/${leaveId}/approve`, { mentorComments: 'Approved by admin' })
            } else if (status === 'rejected') {
                await api.put(`/leaves/${leaveId}/reject`, { mentorComments: 'Rejected by admin' })
            }
            toast.success(`Leave request ${status}`)
            fetchLeaves()
        } catch (error) {
            console.error('Error updating leave status:', error)
            toast.error('Failed to update leave status')
        }
    }

    const handleViewLeave = (leave) => {
        setSelectedLeave(leave)
        setShowViewModal(true)
    }

    const filteredLeaves = leaves.filter(leave => {
        const matchesSearch =
            leave.menteeId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            leave.mentorId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            leave.leaveType?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || leave.status === statusFilter
        const matchesType = typeFilter === 'all' || leave.leaveType === typeFilter

        return matchesSearch && matchesStatus && matchesType
    })

    const handleExportReport = () => {
        try {
            // Prepare CSV data
            const csvHeaders = ['Date', 'Student Name', 'Roll No', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Mentor', 'Approved By', 'Comments']
            const csvRows = filteredLeaves.map(l => [
                new Date(l.createdAt).toLocaleDateString(),
                l.menteeId?.fullName || 'N/A',
                l.menteeId?.studentId || 'N/A',
                l.leaveType || 'N/A',
                new Date(l.startDate).toLocaleDateString(),
                new Date(l.endDate).toLocaleDateString(),
                l.daysCount || 0,
                l.status || 'N/A',
                `"${(l.reason || '').replace(/"/g, '""')}"`,
                l.mentorId?.fullName || 'N/A',
                l.approvedBy?.fullName || 'N/A',
                `"${(l.mentorComments || '').replace(/"/g, '""')}"`
            ])

            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map(row => row.join(','))
            ].join('\n')

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `admin_leaves_report_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success('Report exported successfully!')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export report')
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle className="h-4 w-4" />
            case 'rejected': return <XCircle className="h-4 w-4" />
            case 'pending': return <AlertCircle className="h-4 w-4" />
            default: return <Clock className="h-4 w-4" />
        }
    }

    if (authLoading || loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                </div>
            </Layout>
        )
    }

    if (!user || user.role !== 'admin') {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Calendar className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600">You need admin privileges to access this page.</p>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                                <Calendar className="h-6 w-6 mr-3 text-amber-600 dark:text-amber-400" />
                                Leave Management ({filteredLeaves.length})
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Monitor and manage all leave requests across the system
                            </p>
                        </div>

                        <button
                            onClick={handleExportReport}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search leaves..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-800 dark:text-white"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-800 dark:text-white"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-800 dark:text-white"
                        >
                            <option value="all">All Types</option>
                            <option value="sick">Sick Leave</option>
                            <option value="casual">Casual Leave</option>
                            <option value="emergency">Emergency Leave</option>
                            <option value="vacation">Vacation</option>
                        </select>

                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                            <Filter className="h-4 w-4" />
                            <span>{filteredLeaves.length} requests found</span>
                        </div>
                    </div>
                </div>

                {/* Leave Requests Table */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg rounded-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Student</th>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Type</th>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Duration</th>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Dates</th>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Status</th>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Approved By</th>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeaves.map((leave, index) => (
                                    <tr
                                        key={leave._id}
                                        className="border-b border-slate-100/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {leave.menteeId?.fullName?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800 dark:text-white">
                                                        {leave.menteeId?.fullName || 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                                        {leave.menteeId?.studentId}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                                                {leave.leaveType}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                                            {leave.daysCount} day{leave.daysCount !== 1 ? 's' : ''}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                                            <div className="text-sm">
                                                <div>{new Date(leave.startDate).toLocaleDateString()}</div>
                                                <div>to {new Date(leave.endDate).toLocaleDateString()}</div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                                                {getStatusIcon(leave.status)}
                                                <span className="ml-1 capitalize">{leave.status}</span>
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                                            {leave.approvedBy?.fullName || '-'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex space-x-2">
                                                {leave.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(leave._id, 'approved')}
                                                            className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(leave._id, 'rejected')}
                                                            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleViewLeave(leave)}
                                                    className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredLeaves.length === 0 && (
                        <div className="text-center py-12">
                            <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">No leave requests found</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                                    ? 'Try adjusting your filters to see more results.'
                                    : 'No leave requests have been submitted yet.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* View Leave Modal */}
                {showViewModal && selectedLeave && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                                        <Calendar className="h-6 w-6 mr-3 text-amber-600 dark:text-amber-400" />
                                        Leave Request Details
                                    </h2>
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        <XCircle className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Student Info */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                                    <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">Student Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Name</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                {selectedLeave.menteeId?.fullName || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Roll No</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                {selectedLeave.menteeId?.studentId || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Class</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                {selectedLeave.menteeId?.class || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Section</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                {selectedLeave.menteeId?.section || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Leave Details */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Leave Type</p>
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                                                {selectedLeave.leaveType}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</p>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLeave.status)}`}>
                                                {getStatusIcon(selectedLeave.status)}
                                                <span className="ml-1 capitalize">{selectedLeave.status}</span>
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Start Date</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                {new Date(selectedLeave.startDate).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">End Date</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                {new Date(selectedLeave.endDate).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Duration</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                {selectedLeave.daysCount} day{selectedLeave.daysCount !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Submitted On</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                {new Date(selectedLeave.createdAt).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Reason</p>
                                        <p className="text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                            {selectedLeave.reason || 'No reason provided'}
                                        </p>
                                    </div>

                                    {selectedLeave.mentorId && (
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Assigned Mentor</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                {selectedLeave.mentorId.fullName}
                                            </p>
                                        </div>
                                    )}

                                    {selectedLeave.approvedBy && (
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                                {selectedLeave.status === 'approved' ? 'Approved By' : 'Reviewed By'}
                                            </p>
                                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                                <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                    {selectedLeave.approvedBy.fullName}
                                                </p>
                                                {selectedLeave.reviewedAt && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {new Date(selectedLeave.reviewedAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {selectedLeave.mentorComments && (
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Comments</p>
                                            <p className="text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                                {selectedLeave.mentorComments}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                {selectedLeave.status === 'pending' && (
                                    <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <button
                                            onClick={() => {
                                                handleStatusUpdate(selectedLeave._id, 'approved')
                                                setShowViewModal(false)
                                            }}
                                            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                                        >
                                            <CheckCircle className="h-5 w-5 mr-2" />
                                            Approve Leave
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleStatusUpdate(selectedLeave._id, 'rejected')
                                                setShowViewModal(false)
                                            }}
                                            className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                                        >
                                            <XCircle className="h-5 w-5 mr-2" />
                                            Reject Leave
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}

export default AdminLeavesPage