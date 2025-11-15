import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import {
    FileText,
    Clock,
    User,
    CheckCircle,
    XCircle,
    AlertCircle,
    Search,
    Filter,
    Eye,
    Download,
    MessageSquare
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'

const AdminGrievancesPage = () => {
    const { user, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [grievances, setGrievances] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [selectedGrievance, setSelectedGrievance] = useState(null)
    const [showViewModal, setShowViewModal] = useState(false)
    const [showCommentModal, setShowCommentModal] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)

    useEffect(() => {
        if (user && user.role !== 'admin') {
            toast.error('Access denied. Admin privileges required.')
            navigate('/dashboard')
        } else if (user && user.role === 'admin') {
            fetchGrievances()
        }
    }, [user, navigate])

    const fetchGrievances = async () => {
        try {
            setLoading(true)
            // Fetch all grievances (admin view)
            const response = await api.get('/grievances/admin')
            setGrievances(response.data)
        } catch (error) {
            console.error('Error fetching grievances:', error)
            toast.error('Failed to fetch grievances')
            setGrievances([]) // Set empty array on error
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (grievanceId, status) => {
        try {
            if (status === 'resolved') {
                await api.put(`/grievances/${grievanceId}/resolve`, {
                    resolution: 'Resolved by admin',
                    adminComments: 'Issue has been addressed and resolved.'
                })
            } else if (status === 'rejected') {
                await api.put(`/grievances/${grievanceId}/reject`, {
                    adminComments: 'Grievance rejected after review.'
                })
            } else if (status === 'in-progress') {
                await api.put(`/grievances/${grievanceId}/review`, {
                    status: 'in-progress',
                    adminComments: 'Grievance is being reviewed.'
                })
            }
            toast.success(`Grievance ${status.replace('-', ' ')}`)
            fetchGrievances()
        } catch (error) {
            console.error('Error updating grievance status:', error)
            toast.error('Failed to update grievance status')
        }
    }

    const handleViewGrievance = (grievance) => {
        setSelectedGrievance(grievance)
        setShowViewModal(true)
    }

    const handleOpenCommentModal = (grievance) => {
        setSelectedGrievance(grievance)
        setShowCommentModal(true)
        setCommentText('')
    }

    const handleAddComment = async () => {
        if (!commentText.trim() || !selectedGrievance) return

        try {
            setSubmittingComment(true)
            await api.post(`/grievances/${selectedGrievance._id}/comment`, {
                text: commentText.trim()
            })
            toast.success('Comment added successfully')
            setShowCommentModal(false)
            setCommentText('')
            fetchGrievances()
        } catch (error) {
            console.error('Error adding comment:', error)
            toast.error('Failed to add comment')
        } finally {
            setSubmittingComment(false)
        }
    }

    const filteredGrievances = grievances.filter(grievance => {
        const matchesSearch =
            grievance.menteeId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            grievance.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            grievance.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            grievance.grievanceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            grievance.category?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || grievance.status === statusFilter
        const matchesCategory = categoryFilter === 'all' ||
            grievance.grievanceType === categoryFilter ||
            grievance.category === categoryFilter

        return matchesSearch && matchesStatus && matchesCategory
    })

    const handleExportReport = () => {
        try {
            // Prepare CSV data
            const csvHeaders = ['Date', 'Student Name', 'Roll No', 'Subject', 'Type', 'Category', 'Priority', 'Status', 'Description', 'Resolution', 'Mentor']
            const csvRows = filteredGrievances.map(g => [
                new Date(g.createdAt).toLocaleDateString(),
                g.menteeId?.fullName || 'N/A',
                g.rollNo || g.menteeId?.studentId || 'N/A',
                g.subject || g.title || 'N/A',
                g.grievanceType || 'N/A',
                g.category || 'N/A',
                g.priority || 'N/A',
                g.status || 'N/A',
                `"${(g.description || '').replace(/"/g, '""')}"`,
                `"${(g.resolution || 'Pending').replace(/"/g, '""')}"`,
                g.mentorId?.fullName || 'N/A'
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
            link.setAttribute('download', `admin_grievances_report_${new Date().toISOString().split('T')[0]}.csv`)
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
            case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'resolved': return <CheckCircle className="h-4 w-4" />
            case 'rejected': return <XCircle className="h-4 w-4" />
            case 'in-progress': return <Clock className="h-4 w-4" />
            case 'pending': return <AlertCircle className="h-4 w-4" />
            default: return <FileText className="h-4 w-4" />
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
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
                        <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
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
                                <FileText className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
                                Grievance Management ({filteredGrievances.length})
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Monitor and resolve student grievances and complaints
                            </p>
                        </div>

                        <button
                            onClick={handleExportReport}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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
                                placeholder="Search grievances..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-white"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-white"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-white"
                        >
                            <option value="all">All Categories</option>
                            <option value="misconduct-complaint">Misconduct / Complaint</option>
                            <option value="user-experience">User Experience</option>
                            <option value="billing-payment">Billing / Payment</option>
                            <option value="communication-support">Communication & Support</option>
                            <option value="administrative-issues">Administrative Issues</option>
                            <option value="technical-issues">Technical Issues</option>
                            <option value="other">Other</option>
                        </select>

                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                            <Filter className="h-4 w-4" />
                            <span>{filteredGrievances.length} grievances found</span>
                        </div>
                    </div>
                </div>

                {/* Grievances Table */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg rounded-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Student</th>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Title</th>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Category</th>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Priority</th>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Status</th>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Submitted</th>
                                    <th className="text-left py-4 px-6 font-medium text-slate-600 dark:text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGrievances.map((grievance, index) => (
                                    <tr
                                        key={grievance._id}
                                        className="border-b border-slate-100/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {grievance.menteeId?.fullName?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800 dark:text-white">
                                                        {grievance.menteeId?.fullName || 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                                        {grievance.menteeId?.studentId}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="max-w-xs">
                                                <div className="font-medium text-slate-800 dark:text-white truncate">
                                                    {grievance.subject || grievance.title || 'No Subject'}
                                                </div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                    {grievance.description}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                                                {grievance.grievanceType || grievance.category || 'General'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(grievance.priority || 'medium')}`}>
                                                {grievance.priority || 'Medium'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(grievance.status)}`}>
                                                {getStatusIcon(grievance.status)}
                                                <span className="ml-1 capitalize">{grievance.status?.replace('-', ' ')}</span>
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                                            <div className="text-sm">
                                                {new Date(grievance.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex space-x-2">
                                                {grievance.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(grievance._id, 'in-progress')}
                                                            className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                            title="Start Processing"
                                                        >
                                                            <Clock className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(grievance._id, 'resolved')}
                                                            className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                            title="Resolve"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(grievance._id, 'rejected')}
                                                            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {grievance.status === 'in-progress' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(grievance._id, 'resolved')}
                                                        className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                        title="Resolve"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleViewGrievance(grievance)}
                                                    className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenCommentModal(grievance)}
                                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-900/50 transition-colors"
                                                    title="Add Comment"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredGrievances.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">No grievances found</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                                    ? 'Try adjusting your filters to see more results.'
                                    : 'No grievances have been submitted yet.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* View Grievance Modal */}
                {showViewModal && selectedGrievance && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                                        <FileText className="h-6 w-6 mr-2 text-purple-600 dark:text-purple-400" />
                                        Grievance Details
                                    </h3>
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                    >
                                        <XCircle className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Student Info */}
                                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/50">
                                        <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Student Information</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
                                                <p className="text-base font-medium text-slate-800 dark:text-white">{selectedGrievance.menteeId?.fullName || 'Unknown'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">Roll No</p>
                                                <p className="text-base font-medium text-slate-800 dark:text-white">{selectedGrievance.rollNo || selectedGrievance.menteeId?.studentId}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
                                                <p className="text-base font-medium text-slate-800 dark:text-white">{selectedGrievance.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">Mentor</p>
                                                <p className="text-base font-medium text-slate-800 dark:text-white">{selectedGrievance.mentorId?.fullName || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grievance Details */}
                                    <div>
                                        <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Grievance Information</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">Subject</p>
                                                <p className="text-base font-medium text-slate-800 dark:text-white">{selectedGrievance.subject || selectedGrievance.title}</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Type</p>
                                                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                                                        {selectedGrievance.grievanceType || selectedGrievance.category}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Priority</p>
                                                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(selectedGrievance.priority)}`}>
                                                        {selectedGrievance.priority || 'Medium'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
                                                    <span className={`inline-flex items-center mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedGrievance.status)}`}>
                                                        {getStatusIcon(selectedGrievance.status)}
                                                        <span className="ml-1 capitalize">{selectedGrievance.status?.replace('-', ' ')}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">Description</p>
                                                <p className="text-base text-slate-800 dark:text-white mt-1 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg whitespace-pre-wrap">
                                                    {selectedGrievance.description}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">Date of Incident</p>
                                                <p className="text-base font-medium text-slate-800 dark:text-white">{new Date(selectedGrievance.dateOfIncident).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">Submitted On</p>
                                                <p className="text-base font-medium text-slate-800 dark:text-white">{new Date(selectedGrievance.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resolution */}
                                    {selectedGrievance.resolution && (
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-800/50">
                                            <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Resolution</h4>
                                            <p className="text-base text-slate-800 dark:text-white whitespace-pre-wrap">{selectedGrievance.resolution}</p>
                                        </div>
                                    )}

                                    {/* Comments Section */}
                                    {selectedGrievance.comments && selectedGrievance.comments.length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Comments ({selectedGrievance.comments.length})</h4>
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {selectedGrievance.comments.map((comment, index) => (
                                                    <div key={index} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center space-x-2">
                                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                                                                    comment.authorRole === 'admin' ? 'bg-purple-500' :
                                                                    comment.authorRole === 'mentor' ? 'bg-blue-500' :
                                                                    'bg-green-500'
                                                                }`}>
                                                                    {comment.authorName?.charAt(0) || 'U'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{comment.authorName}</p>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{comment.authorRole}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                {new Date(comment.createdAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm text-slate-700 dark:text-slate-300">{comment.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Comment Modal */}
                {showCommentModal && selectedGrievance && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-lg">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                        <MessageSquare className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                                        Add Comment
                                    </h3>
                                    <button
                                        onClick={() => setShowCommentModal(false)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                    >
                                        <XCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                        Adding comment to: <span className="font-semibold text-slate-800 dark:text-white">{selectedGrievance.subject || selectedGrievance.title}</span>
                                    </p>
                                    <textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Enter your comment here..."
                                        className="w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-white resize-none"
                                        rows="5"
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setShowCommentModal(false)}
                                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddComment}
                                        disabled={submittingComment || !commentText.trim()}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submittingComment ? 'Submitting...' : 'Submit Comment'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}

export default AdminGrievancesPage