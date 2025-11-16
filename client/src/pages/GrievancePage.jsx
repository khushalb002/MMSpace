import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'
import { Plus, FileText, Check, X, Clock, Eye, AlertCircle, CheckCircle, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'

const GrievancePage = () => {
    const { user } = useAuth()
    const [grievances, setGrievances] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showResolutionModal, setShowResolutionModal] = useState(false)
    const [selectedGrievance, setSelectedGrievance] = useState(null)
    const [resolvingGrievance, setResolvingGrievance] = useState(null)
    const [selectedResolutionType, setSelectedResolutionType] = useState('Issue resolved through direct communication with relevant department')
    const [filter, setFilter] = useState('all')

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        defaultValues: {
            name: user?.fullName || '',
            email: user?.email || '',
            rollNo: user?.studentId || ''
        }
    })

    useEffect(() => {
        fetchGrievances()
    }, [filter])

    const fetchGrievances = async () => {
        try {
            const endpoint = user.role === 'mentor'
                ? '/grievances/mentor'
                : user.role === 'guardian'
                    ? '/grievances/guardian'
                    : '/grievances/mentee'
            const params = filter !== 'all' ? `?status=${filter}` : ''
            const response = await api.get(`${endpoint}${params}`)
            setGrievances(response.data)
        } catch (error) {
            console.error('Error fetching grievances:', error)
            toast.error('Failed to fetch grievances')
        } finally {
            setLoading(false)
        }
    }

    const filteredGrievances = filter === 'all'
        ? grievances
        : grievances.filter(grievance => grievance.status === filter)

    const handleExportReport = () => {
        try {
            // Prepare CSV data
            const csvHeaders = ['Date', 'Student Name', 'Roll No', 'Subject', 'Type', 'Status', 'Description', 'Resolution']
            const csvRows = filteredGrievances.map(g => [
                new Date(g.createdAt).toLocaleDateString(),
                g.menteeId?.fullName || 'N/A',
                g.rollNo || g.menteeId?.studentId || 'N/A',
                g.subject || 'N/A',
                g.grievanceType || 'N/A',
                g.status || 'N/A',
                `"${(g.description || '').replace(/"/g, '""')}"`,
                `"${(g.resolution || 'Pending').replace(/"/g, '""')}"`
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
            link.setAttribute('download', `grievances_report_${new Date().toISOString().split('T')[0]}.csv`)
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

    const handleCreateGrievance = async (data) => {
        try {
            const response = await api.post('/grievances', data)
            setGrievances([response.data, ...grievances])
            setShowCreateModal(false)
            reset({
                name: user?.fullName || '',
                email: user?.email || '',
                rollNo: user?.studentId || ''
            })
            toast.success('Grievance submitted successfully!')
        } catch (error) {
            toast.error('Failed to submit grievance')
        }
    }

    const handleReviewGrievance = async (grievanceId, status, comments) => {
        try {
            const response = await api.put(`/grievances/${grievanceId}/review`, {
                status,
                mentorComments: comments
            })
            setGrievances(grievances.map(grievance =>
                grievance._id === grievanceId ? response.data : grievance
            ))
            toast.success(`Grievance ${status}!`)
        } catch (error) {
            toast.error(`Failed to ${status} grievance`)
        }
    }

    const handleResolveGrievance = async (grievanceId) => {
        const grievance = grievances.find(g => g._id === grievanceId)
        setResolvingGrievance(grievance)
        setSelectedResolutionType('Issue resolved through direct communication with relevant department')
        setShowResolutionModal(true)
    }

    const submitResolution = async (resolutionData) => {
        try {
            const response = await api.put(`/grievances/${resolvingGrievance._id}/resolve`, {
                resolution: resolutionData.resolution,
                mentorComments: resolutionData.comments
            })
            setGrievances(grievances.map(grievance =>
                grievance._id === resolvingGrievance._id ? response.data : grievance
            ))
            toast.success('Grievance resolved!')
            setShowResolutionModal(false)
            setResolvingGrievance(null)
        } catch (error) {
            toast.error('Failed to resolve grievance')
        }
    }

    const handleRejectGrievance = async (grievanceId) => {
        const comments = prompt('Please provide a reason for rejection:')
        if (comments === null) return

        try {
            const response = await api.put(`/grievances/${grievanceId}/reject`, {
                mentorComments: comments || 'Rejected'
            })
            setGrievances(grievances.map(grievance =>
                grievance._id === grievanceId ? response.data : grievance
            ))
            toast.success('Grievance rejected!')
        } catch (error) {
            toast.error('Failed to reject grievance')
        }
    }

    const handleStudentConfirmation = async (grievanceId, isResolved) => {
        try {
            const response = await api.put(`/grievances/${grievanceId}/student-confirm`, {
                isResolved: isResolved ? 'yes' : 'no',
                feedback: ''
            })
            setGrievances(grievances.map(grievance =>
                grievance._id === grievanceId ? response.data : grievance
            ))
            setSelectedGrievance(response.data)
            toast.success(`Resolution marked as ${isResolved ? 'confirmed' : 'not confirmed'}!`)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to confirm resolution')
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'resolved':
                return <CheckCircle className="h-4 w-4 text-white" />
            case 'rejected':
                return <X className="h-4 w-4 text-white" />
            case 'in-review':
                return <Eye className="h-4 w-4 text-white" />
            default:
                return <Clock className="h-4 w-4 text-white" />
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'resolved':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            case 'in-review':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            default:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        }
    }

    const grievanceTypeOptions = [
        { value: 'misconduct-complaint', label: 'Misconduct / Complaint' },
        { value: 'user-experience', label: 'User Experience' },
        { value: 'billing-payment', label: 'Billing / Payment' },
        { value: 'communication-support', label: 'Communication & Support' },
        { value: 'administrative-issues', label: 'Administrative Issues' },
        { value: 'technical-issues', label: 'Technical Issues' },
        { value: 'other', label: 'Other' }
    ]

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
            <div className="space-y-8 smooth-scroll scrollbar-cyber" data-auto-hide-scroll>
                {/* Header */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                                Grievances
                            </h1>
                            <p className="mt-2 text-slate-600 dark:text-slate-300">
                                {user.role === 'mentor'
                                    ? 'Review and manage grievances from your mentees'
                                    : user.role === 'guardian'
                                        ? 'Monitor complaints raised by your student and follow up on their status'
                                        : 'Submit and track your grievances for resolution'
                                }
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {user.role === 'mentor' && (
                                <button
                                    onClick={handleExportReport}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                >
                                    <Download className="h-5 w-5 mr-2" />
                                    Export Report
                                </button>
                            )}
                            {user.role === 'mentee' && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Submit Grievance
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-2 border border-white/20 dark:border-slate-700/50">
                    <nav className="flex space-x-2">
                        {['all', 'pending', 'in-review', 'resolved', 'rejected'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-6 py-3 rounded-xl font-medium text-sm capitalize transition-all duration-300 ${filter === status
                                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-lg transform scale-105'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                {status === 'in-review' ? 'In Review' : status}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Grievances List */}
                <div className="space-y-4 smooth-scroll scrollbar-cyber" data-auto-hide-scroll>
                    {filteredGrievances.map((grievance, index) => (
                        <div
                            key={grievance._id}
                            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg rounded-3xl border border-white/20 dark:border-slate-700/50 p-6 hover:shadow-xl transition-all duration-300 message-bubble"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg ${grievance.status === 'resolved' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                                        grievance.status === 'rejected' ? 'bg-gradient-to-br from-red-500 to-pink-600' :
                                            grievance.status === 'in-review' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                                                'bg-gradient-to-br from-amber-500 to-orange-600'
                                        }`}>
                                        {getStatusIcon(grievance.status)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                                    {user.role === 'mentor'
                                                        ? grievance.menteeId?.fullName
                                                        : grievance.subject
                                                    }
                                                </h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {grievanceTypeOptions.find(opt => opt.value === grievance.grievanceType)?.label} •{' '}
                                                    {new Date(grievance.dateOfIncident).toLocaleDateString()}
                                                </p>
                                                {user.role === 'mentor' && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {grievance.subject}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2 ml-4">
                                                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(grievance.status)}`}>
                                                    {grievance.status === 'in-review' ? 'In Review' : grievance.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                                            {grievance.description}
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedGrievance(grievance)
                                                    setShowDetailsModal(true)
                                                }}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm flex items-center"
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                View Details
                                            </button>

                                            {/* MENTEE: Show Resolve button on resolved grievances */}
                                            {user.role === 'mentee' && grievance.status === 'resolved' && grievance.studentResolutionConfirmation === 'pending' && (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleStudentConfirmation(grievance._id, true)}
                                                        className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-300 flex items-center"
                                                    >
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Resolved
                                                    </button>
                                                    <button
                                                        onClick={() => handleStudentConfirmation(grievance._id, false)}
                                                        className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300 flex items-center"
                                                    >
                                                        <X className="h-4 w-4 mr-1" />
                                                        Not Resolved
                                                    </button>
                                                </div>
                                            )}

                                            {/* MENTEE: Show confirmation status */}
                                            {user.role === 'mentee' && grievance.status === 'resolved' && grievance.studentResolutionConfirmation !== 'pending' && (
                                                <div className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center ${grievance.studentResolutionConfirmation === 'yes'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                    }`}>
                                                    {grievance.studentResolutionConfirmation === 'yes' ? (
                                                        <>
                                                            <Check className="h-4 w-4 mr-1" />
                                                            Confirmed Resolved
                                                        </>
                                                    ) : (
                                                        <>
                                                            <X className="h-4 w-4 mr-1" />
                                                            Marked Not Resolved
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* MENTOR: Show student's confirmation status on resolved grievances */}
                                            {user.role === 'mentor' && grievance.status === 'resolved' && grievance.studentResolutionConfirmation !== 'pending' && (
                                                <div className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center ${grievance.studentResolutionConfirmation === 'yes'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                    }`}>
                                                    {grievance.studentResolutionConfirmation === 'yes' ? (
                                                        <>
                                                            <Check className="h-4 w-4 mr-1" />
                                                            Student Confirmed
                                                        </>
                                                    ) : (
                                                        <>
                                                            <X className="h-4 w-4 mr-1" />
                                                            Student Denied
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {user.role === 'mentor' && grievance.status === 'pending' && (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleReviewGrievance(grievance._id, 'in-review', 'Under review')}
                                                        className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-300"
                                                        title="Mark as In Review"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleResolveGrievance(grievance._id)}
                                                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-300"
                                                        title="Resolve"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectGrievance(grievance._id)}
                                                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300"
                                                        title="Reject"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}

                                            {user.role === 'mentor' && grievance.status === 'in-review' && (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleResolveGrievance(grievance._id)}
                                                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-300"
                                                        title="Resolve"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectGrievance(grievance._id)}
                                                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300"
                                                        title="Reject"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredGrievances.length === 0 && (
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-12">
                        <div className="text-center">
                            <div className="h-24 w-24 bg-gradient-to-br from-slate-400 to-slate-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <FileText className="h-12 w-12 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                No grievances found
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                {user.role === 'mentee'
                                    ? 'You haven\'t submitted any grievances yet.'
                                    : user.role === 'guardian'
                                        ? 'There are no complaints from your linked students yet.'
                                        : 'No grievances from your mentees.'
                                }
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Grievance Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-2xl max-h-[95vh] overflow-y-auto modal-scroll smooth-scroll" data-auto-hide-scroll>
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                                    Submit Grievance
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false)
                                        reset({
                                            name: user?.fullName || '',
                                            email: user?.email || '',
                                            rollNo: user?.studentId || ''
                                        })
                                    }}
                                    className="p-2 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                                >
                                    <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(handleCreateGrievance)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            {...register('name', { required: 'Name is required' })}
                                            className="w-full bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white backdrop-blur-sm"
                                            placeholder="Your full name"
                                        />
                                        {errors.name && (
                                            <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Email / Roll No / ID
                                        </label>
                                        <input
                                            type="text"
                                            {...register('email', { required: 'Email/Roll No/ID is required' })}
                                            className="w-full bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white backdrop-blur-sm"
                                            placeholder="Email or student ID"
                                        />
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Roll No
                                    </label>
                                    <input
                                        type="text"
                                        {...register('rollNo', { required: 'Roll number is required' })}
                                        className="w-full bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white backdrop-blur-sm"
                                        placeholder="Student roll number"
                                    />
                                    {errors.rollNo && (
                                        <p className="mt-2 text-sm text-red-600">{errors.rollNo.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Subject / Title
                                    </label>
                                    <input
                                        type="text"
                                        {...register('subject', { required: 'Subject is required' })}
                                        className="w-full bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white backdrop-blur-sm"
                                        placeholder="Brief title of your grievance"
                                    />
                                    {errors.subject && (
                                        <p className="mt-2 text-sm text-red-600">{errors.subject.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Grievance Type
                                    </label>
                                    <select
                                        {...register('grievanceType', { required: 'Grievance type is required' })}
                                        className="w-full bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white backdrop-blur-sm"
                                    >
                                        <option value="">Select grievance type</option>
                                        {grievanceTypeOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.grievanceType && (
                                        <p className="mt-2 text-sm text-red-600">{errors.grievanceType.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Date of Incident
                                    </label>
                                    <input
                                        type="date"
                                        {...register('dateOfIncident', { required: 'Date of incident is required' })}
                                        className="w-full bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white backdrop-blur-sm"
                                    />
                                    {errors.dateOfIncident && (
                                        <p className="mt-2 text-sm text-red-600">{errors.dateOfIncident.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        {...register('description', { required: 'Description is required' })}
                                        className="w-full bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 backdrop-blur-sm resize-none scrollbar-thin"
                                        rows="6"
                                        placeholder="Please provide a detailed description of your grievance"
                                    />
                                    {errors.description && (
                                        <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                                    )}
                                </div>

                                <div className="flex space-x-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false)
                                            reset({
                                                name: user?.fullName || '',
                                                email: user?.email || '',
                                                rollNo: user?.studentId || ''
                                            })
                                        }}
                                        className="flex-1 px-6 py-3 text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-700/50 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 rounded-xl font-medium transition-all duration-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                    >
                                        Submit Grievance
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Grievance Details Modal */}
            {showDetailsModal && selectedGrievance && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-2xl max-h-[95vh] overflow-y-auto modal-scroll smooth-scroll" data-auto-hide-scroll>
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                                    Grievance Details
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false)
                                        setSelectedGrievance(null)
                                    }}
                                    className="p-2 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                                >
                                    <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Name</h4>
                                        <p className="text-slate-800 dark:text-white">{selectedGrievance.name}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email/ID</h4>
                                        <p className="text-slate-800 dark:text-white">{selectedGrievance.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Roll No</h4>
                                        <p className="text-slate-800 dark:text-white">{selectedGrievance.rollNo}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Type</h4>
                                        <p className="text-slate-800 dark:text-white">
                                            {grievanceTypeOptions.find(opt => opt.value === selectedGrievance.grievanceType)?.label}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Subject</h4>
                                    <p className="text-slate-800 dark:text-white">{selectedGrievance.subject}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date of Incident</h4>
                                    <p className="text-slate-800 dark:text-white">
                                        {new Date(selectedGrievance.dateOfIncident).toLocaleDateString()}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</h4>
                                    <div className="bg-white/50 dark:bg-slate-700/50 rounded-xl p-4">
                                        <p className="text-slate-800 dark:text-white whitespace-pre-wrap">
                                            {selectedGrievance.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status</h4>
                                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedGrievance.status)}`}>
                                            {selectedGrievance.status === 'in-review' ? 'In Review' : selectedGrievance.status}
                                        </span>
                                    </div>
                                </div>

                                {selectedGrievance.mentorComments && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mentor Comments</h4>
                                        <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-4">
                                            <p className="text-slate-800 dark:text-white">
                                                {selectedGrievance.mentorComments}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {selectedGrievance.resolution && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Resolution</h4>
                                        <div className="bg-green-50/50 dark:bg-green-900/20 rounded-xl p-4">
                                            <p className="text-slate-800 dark:text-white">
                                                {selectedGrievance.resolution}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Comments Section */}
                                {selectedGrievance.comments && selectedGrievance.comments.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                            Comments ({selectedGrievance.comments.length})
                                        </h4>
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

                                {selectedGrievance.status === 'resolved' && user.role === 'mentee' && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                            Has your issue been resolved?
                                        </h4>
                                        {selectedGrievance.studentResolutionConfirmation === 'pending' ? (
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => handleStudentConfirmation(selectedGrievance._id, true)}
                                                    className="flex-1 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-300"
                                                >
                                                    <Check className="h-4 w-4 inline mr-1" />
                                                    Yes, Resolved
                                                </button>
                                                <button
                                                    onClick={() => handleStudentConfirmation(selectedGrievance._id, false)}
                                                    className="flex-1 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300"
                                                >
                                                    <X className="h-4 w-4 inline mr-1" />
                                                    No, Not Resolved
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={`p-4 rounded-xl ${selectedGrievance.studentResolutionConfirmation === 'yes'
                                                ? 'bg-green-50/50 dark:bg-green-900/20'
                                                : 'bg-red-50/50 dark:bg-red-900/20'
                                                }`}>
                                                <p className={`font-medium ${selectedGrievance.studentResolutionConfirmation === 'yes'
                                                    ? 'text-green-700 dark:text-green-300'
                                                    : 'text-red-700 dark:text-red-300'
                                                    }`}>
                                                    {selectedGrievance.studentResolutionConfirmation === 'yes'
                                                        ? '✓ You confirmed this issue has been resolved'
                                                        : '✗ You indicated this issue has not been resolved'
                                                    }
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                    Confirmed on {new Date(selectedGrievance.studentConfirmedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedGrievance.status === 'resolved' && user.role !== 'mentee' && selectedGrievance.studentResolutionConfirmation !== 'pending' && (
                                    <div className={`p-4 rounded-xl ${selectedGrievance.studentResolutionConfirmation === 'yes'
                                        ? 'bg-green-50/50 dark:bg-green-900/20'
                                        : 'bg-red-50/50 dark:bg-red-900/20'
                                        }`}>
                                        <h4 className="text-sm font-semibold mb-2">
                                            {selectedGrievance.studentResolutionConfirmation === 'yes'
                                                ? '✓ Student Confirmed - Issue Resolved'
                                                : '✗ Student Indicated - Issue Not Resolved'
                                            }
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                            Confirmed on {new Date(selectedGrievance.studentConfirmedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Submitted on {new Date(selectedGrievance.createdAt).toLocaleDateString()}
                                        {selectedGrievance.resolvedAt && (
                                            <> • Resolved on {new Date(selectedGrievance.resolvedAt).toLocaleDateString()}</>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolution Modal */}
            {showResolutionModal && resolvingGrievance && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto modal-scroll smooth-scroll" data-auto-hide-scroll>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                            Resolve Grievance
                        </h3>

                        <div className="mb-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                Submitted by: <span className="font-semibold">{resolvingGrievance.name}</span>
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                Type: <span className="font-semibold">{resolvingGrievance.type}</span>
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Subject: <span className="font-semibold">{resolvingGrievance.subject}</span>
                            </p>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const formData = new FormData(e.target)
                            const resolutionType = formData.get('resolutionType')
                            const customResolution = formData.get('customResolution')
                            const comments = formData.get('comments')

                            let resolution = resolutionType
                            if (resolutionType === 'custom') {
                                resolution = customResolution
                            }

                            submitResolution({
                                resolution,
                                comments: comments || resolution
                            })
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Resolution Type
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="resolutionType"
                                                value="Issue resolved through direct communication with relevant department"
                                                className="mr-2 text-blue-600"
                                                checked={selectedResolutionType === 'Issue resolved through direct communication with relevant department'}
                                                onChange={(e) => setSelectedResolutionType(e.target.value)}
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                Resolved through department communication
                                            </span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="resolutionType"
                                                value="Issue escalated to higher authorities for proper action"
                                                className="mr-2 text-blue-600"
                                                checked={selectedResolutionType === 'Issue escalated to higher authorities for proper action'}
                                                onChange={(e) => setSelectedResolutionType(e.target.value)}
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                Escalated to higher authorities
                                            </span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="resolutionType"
                                                value="Issue addressed through policy clarification and guidance"
                                                className="mr-2 text-blue-600"
                                                checked={selectedResolutionType === 'Issue addressed through policy clarification and guidance'}
                                                onChange={(e) => setSelectedResolutionType(e.target.value)}
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                Addressed through policy clarification
                                            </span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="resolutionType"
                                                value="Issue resolved with satisfactory outcome for all parties"
                                                className="mr-2 text-blue-600"
                                                checked={selectedResolutionType === 'Issue resolved with satisfactory outcome for all parties'}
                                                onChange={(e) => setSelectedResolutionType(e.target.value)}
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                Resolved with satisfactory outcome
                                            </span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="resolutionType"
                                                value="custom"
                                                className="mr-2 text-blue-600"
                                                checked={selectedResolutionType === 'custom'}
                                                onChange={(e) => setSelectedResolutionType(e.target.value)}
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                Custom resolution
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {selectedResolutionType === 'custom' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Custom Resolution Details
                                        </label>
                                        <textarea
                                            name="customResolution"
                                            rows="3"
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white modal-scroll"
                                            placeholder="Enter custom resolution details..."
                                        ></textarea>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Additional Comments (Optional)
                                    </label>
                                    <textarea
                                        name="comments"
                                        rows="2"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white modal-scroll"
                                        placeholder="Any additional comments or notes..."
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResolutionModal(false)
                                        setResolvingGrievance(null)
                                    }}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Resolve Grievance
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    )
}

export default GrievancePage