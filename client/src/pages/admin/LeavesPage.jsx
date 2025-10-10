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

    const filteredLeaves = leaves.filter(leave => {
        const matchesSearch =
            leave.menteeId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            leave.mentorId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            leave.leaveType?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || leave.status === statusFilter
        const matchesType = typeFilter === 'all' || leave.leaveType === typeFilter

        return matchesSearch && matchesStatus && matchesType
    })

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

                        <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
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
                                            {leave.approvedBy ? (
                                                <div className="text-sm">
                                                    <div className="font-medium">{leave.approvedBy.fullName}</div>
                                                    <div className="text-xs">{new Date(leave.updatedAt).toLocaleDateString()}</div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
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
            </div>
        </Layout>
    )
}

export default AdminLeavesPage