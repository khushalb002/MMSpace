import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'
import { Plus, Calendar, Check, X, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'

const LeavesPage = () => {
    const { user } = useAuth()
    const [leaves, setLeaves] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [filter, setFilter] = useState('all')

    const { register, handleSubmit, reset, formState: { errors } } = useForm()

    useEffect(() => {
        fetchLeaves()
    }, [filter])

    const fetchLeaves = async () => {
        try {
            const endpoint = user.role === 'mentor' ? '/leaves/mentor' : '/leaves/mentee'
            const params = filter !== 'all' ? `?status=${filter}` : ''
            const response = await api.get(`${endpoint}${params}`)
            setLeaves(response.data)
        } catch (error) {
            console.error('Error fetching leaves:', error)
            toast.error('Failed to fetch leave requests')
        } finally {
            setLoading(false)
        }
    }

    // Filter leaves on the frontend as well for better UX
    const filteredLeaves = filter === 'all'
        ? leaves
        : leaves.filter(leave => leave.status === filter)

    const handleCreateLeave = async (data) => {
        try {
            const response = await api.post('/leaves', data)
            setLeaves([response.data, ...leaves])
            setShowCreateModal(false)
            reset()
            toast.success('Leave request submitted successfully!')
        } catch (error) {
            toast.error('Failed to submit leave request')
        }
    }

    const handleApproveLeave = async (leaveId) => {
        try {
            const response = await api.put(`/leaves/${leaveId}/approve`, {
                mentorComments: 'Approved'
            })
            setLeaves(leaves.map(leave =>
                leave._id === leaveId ? response.data : leave
            ))
            toast.success('Leave request approved!')
        } catch (error) {
            toast.error('Failed to approve leave request')
        }
    }

    const handleRejectLeave = async (leaveId) => {
        const comments = prompt('Please provide a reason for rejection:')
        if (comments === null) return

        try {
            const response = await api.put(`/leaves/${leaveId}/reject`, {
                mentorComments: comments || 'Rejected'
            })
            setLeaves(leaves.map(leave =>
                leave._id === leaveId ? response.data : leave
            ))
            toast.success('Leave request rejected!')
        } catch (error) {
            toast.error('Failed to reject leave request')
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <Check className="h-4 w-4 text-green-600" />
            case 'rejected':
                return <X className="h-4 w-4 text-red-600" />
            default:
                return <Clock className="h-4 w-4 text-yellow-600" />
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800'
            case 'rejected':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-yellow-100 text-yellow-800'
        }
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

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                                Leave Requests
                            </h1>
                            <p className="mt-2 text-slate-600 dark:text-slate-300">
                                {user.role === 'mentor'
                                    ? 'Manage leave requests from your mentees'
                                    : 'Submit and track your leave requests'
                                }
                            </p>
                        </div>
                        {user.role === 'mentee' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Request Leave
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-2 border border-white/20 dark:border-slate-700/50">
                    <nav className="flex space-x-2">
                        {['all', 'pending', 'approved', 'rejected'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-6 py-3 rounded-xl font-medium text-sm capitalize transition-all duration-300 ${filter === status
                                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-lg transform scale-105'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Leave Requests List */}
                <div className="space-y-4">
                    {filteredLeaves.map((leave, index) => (
                        <div
                            key={leave._id}
                            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg rounded-3xl border border-white/20 dark:border-slate-700/50 p-6 hover:shadow-xl transition-all duration-300 message-bubble"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg ${leave.status === 'approved' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                                        leave.status === 'rejected' ? 'bg-gradient-to-br from-red-500 to-pink-600' :
                                            'bg-gradient-to-br from-amber-500 to-orange-600'
                                        }`}>
                                        {getStatusIcon(leave.status)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                            {user.role === 'mentor'
                                                ? leave.menteeId?.fullName
                                                : `${leave.leaveType} Leave`
                                            }
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {new Date(leave.startDate).toLocaleDateString()} - {' '}
                                            {new Date(leave.endDate).toLocaleDateString()} ({leave.daysCount} days)
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${leave.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                        leave.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                            'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                        }`}>
                                        {leave.status}
                                    </span>
                                    {user.role === 'mentor' && leave.status === 'pending' && (
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleApproveLeave(leave._id)}
                                                className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-300"
                                            >
                                                <Check className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleRejectLeave(leave._id)}
                                                className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-white/50 dark:bg-slate-700/50 rounded-2xl backdrop-blur-sm">
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-semibold">Reason:</span> {leave.reason}
                                </p>
                                {leave.mentorComments && (
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                                        <span className="font-semibold">Comments:</span> {leave.mentorComments}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredLeaves.length === 0 && (
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-12">
                        <div className="text-center">
                            <div className="h-24 w-24 bg-gradient-to-br from-slate-400 to-slate-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <Calendar className="h-12 w-12 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                No leave requests
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                {user.role === 'mentee'
                                    ? 'You haven\'t submitted any leave requests yet.'
                                    : 'No leave requests from your mentees.'
                                }
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Leave Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-md">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                                    Request Leave
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false)
                                        reset()
                                    }}
                                    className="p-2 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                                >
                                    <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(handleCreateLeave)} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Leave Type
                                    </label>
                                    <select
                                        {...register('leaveType', { required: 'Leave type is required' })}
                                        className="w-full bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white backdrop-blur-sm"
                                    >
                                        <option value="">Select leave type</option>
                                        <option value="sick">Sick Leave</option>
                                        <option value="casual">Casual Leave</option>
                                        <option value="emergency">Emergency Leave</option>
                                    </select>
                                    {errors.leaveType && (
                                        <p className="mt-2 text-sm text-red-600">{errors.leaveType.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            {...register('startDate', { required: 'Start date is required' })}
                                            className="w-full bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white backdrop-blur-sm"
                                        />
                                        {errors.startDate && (
                                            <p className="mt-2 text-sm text-red-600">{errors.startDate.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            {...register('endDate', { required: 'End date is required' })}
                                            className="w-full bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white backdrop-blur-sm"
                                        />
                                        {errors.endDate && (
                                            <p className="mt-2 text-sm text-red-600">{errors.endDate.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Reason
                                    </label>
                                    <textarea
                                        {...register('reason', { required: 'Reason is required' })}
                                        className="w-full bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 backdrop-blur-sm resize-none"
                                        rows="4"
                                        placeholder="Please provide a reason for your leave"
                                    />
                                    {errors.reason && (
                                        <p className="mt-2 text-sm text-red-600">{errors.reason.message}</p>
                                    )}
                                </div>

                                <div className="flex space-x-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false)
                                            reset()
                                        }}
                                        className="flex-1 px-6 py-3 text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-700/50 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 rounded-xl font-medium transition-all duration-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                    >
                                        Submit Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}

export default LeavesPage