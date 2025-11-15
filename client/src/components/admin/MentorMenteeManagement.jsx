import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    Users,
    UserPlus,
    Edit,
    Trash2,
    Shield,
    GraduationCap,
    User,
    Link as LinkIcon,
    Unlink,
    Search,
    Filter,
    Award,
    BookOpen,
    Clock,
    Phone,
    Mail,
    MapPin
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import LoadingSpinner from '../LoadingSpinner'

const MentorMenteeManagement = () => {
    const [searchParams] = useSearchParams()
    const [mentors, setMentors] = useState([])
    const [mentees, setMentees] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'mentors')
    const [searchTerm, setSearchTerm] = useState('')
    const [mentorFilter, setMentorFilter] = useState('all')
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [selectedMentee, setSelectedMentee] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedPerson, setSelectedPerson] = useState(null)
    const [editType, setEditType] = useState('')
    const [editFormData, setEditFormData] = useState({})

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [mentorsResponse, menteesResponse] = await Promise.all([
                api.get('/admin/mentors'),
                api.get('/admin/mentees')
            ])
            setMentors(mentorsResponse.data)
            setMentees(menteesResponse.data)
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }

    const handleAssignMentor = async (menteeId, mentorId) => {
        try {
            await api.put('/admin/assign-mentor', { menteeId, mentorId })
            toast.success('Mentor assigned successfully')
            fetchData()
            setShowAssignModal(false)
        } catch (error) {
            toast.error('Failed to assign mentor')
        }
    }

    const handleEditMentor = (mentor) => {
        setSelectedPerson(mentor)
        setEditType('mentor')
        setEditFormData({
            fullName: mentor.fullName || '',
            employeeId: mentor.employeeId || '',
            department: mentor.department || '',
            phone: mentor.phone || '',
            experience: mentor.experience || '',
            officeHours: mentor.officeHours || '',
            subjects: mentor.subjects ? mentor.subjects.join(', ') : '',
            qualifications: mentor.qualifications || ''
        })
        setShowEditModal(true)
    }

    const handleEditMentee = (mentee) => {
        setSelectedPerson(mentee)
        setEditType('mentee')
        setEditFormData({
            fullName: mentee.fullName || '',
            studentId: mentee.studentId || '',
            class: mentee.class || '',
            section: mentee.section || '',
            phone: mentee.phone || '',
            academicYear: mentee.academicYear || '',
            dateOfBirth: mentee.dateOfBirth ? new Date(mentee.dateOfBirth).toISOString().split('T')[0] : '',
            address: mentee.address || '',
            bloodGroup: mentee.bloodGroup || '',
            hobbies: mentee.hobbies ? mentee.hobbies.join(', ') : ''
        })
        setShowEditModal(true)
    }

    const handleUpdatePerson = async (e) => {
        e.preventDefault()
        try {
            const endpoint = editType === 'mentor'
                ? `/admin/users/${selectedPerson.userId._id}/profile`
                : `/admin/users/${selectedPerson.userId._id}/profile`

            const updateData = editType === 'mentor'
                ? {
                    ...editFormData,
                    subjects: editFormData.subjects.split(',').map(s => s.trim()).filter(s => s)
                }
                : {
                    ...editFormData,
                    hobbies: editFormData.hobbies.split(',').map(h => h.trim()).filter(h => h),
                    dateOfBirth: editFormData.dateOfBirth ? new Date(editFormData.dateOfBirth) : null
                }

            await api.put(endpoint, updateData)
            toast.success(`${editType === 'mentor' ? 'Mentor' : 'Mentee'} updated successfully`)
            setShowEditModal(false)
            fetchData()
        } catch (error) {
            console.error('Error updating person:', error)
            toast.error(`Failed to update ${editType}`)
        }
    }

    const filteredMentors = useMemo(() => {
        return mentors.filter(mentor => {
            const matchesSearch = mentor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                mentor.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                mentor.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
            return matchesSearch
        })
    }, [mentors, searchTerm])

    const filteredMentees = useMemo(() => {
        return mentees.filter(mentee => {
            const matchesSearch = mentee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                mentee.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                mentee.class.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesMentor = mentorFilter === 'all' ||
                (mentorFilter === 'unassigned' && !mentee.mentorId) ||
                mentee.mentorId?._id === mentorFilter

            return matchesSearch && matchesMentor
        })
    }, [mentees, searchTerm, mentorFilter])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        )
    }

    const MentorsTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map((mentor, index) => (
                    <div
                        key={mentor._id}
                        className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg rounded-2xl border border-white/20 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        {/* Mentor Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                            <div className="flex items-center space-x-3">
                                <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                                    <Shield className="h-8 w-8" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white truncate">
                                        {mentor.fullName}
                                    </h3>
                                    <p className="text-white/80 text-sm">
                                        {mentor.employeeId}
                                    </p>
                                    <p className="text-white/70 text-xs">
                                        {mentor.department}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mentor Details */}
                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {mentor.stats?.menteeCount || 0}
                                    </div>
                                    <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Mentees</div>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {mentor.stats?.groupCount || 0}
                                    </div>
                                    <div className="text-xs text-purple-600/70 dark:text-purple-400/70">Groups</div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                {mentor.phone && (
                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                        <Phone className="h-4 w-4 mr-2" />
                                        {mentor.phone}
                                    </div>
                                )}
                                {mentor.userId?.email && (
                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                        <Mail className="h-4 w-4 mr-2" />
                                        {mentor.userId.email}
                                    </div>
                                )}
                                {mentor.experience && (
                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                        <Award className="h-4 w-4 mr-2" />
                                        {mentor.experience} years experience
                                    </div>
                                )}
                                {mentor.officeHours && (
                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                        <Clock className="h-4 w-4 mr-2" />
                                        {mentor.officeHours}
                                    </div>
                                )}
                            </div>

                            {mentor.subjects && mentor.subjects.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Subjects:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {mentor.subjects.slice(0, 3).map((subject, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                                            >
                                                {subject}
                                            </span>
                                        ))}
                                        {mentor.subjects.length > 3 && (
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                                                +{mentor.subjects.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleEditMentor(mentor)}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                                >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => setActiveTab('mentees')}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-3 rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                                >
                                    <Users className="h-4 w-4 mr-1" />
                                    View Mentees
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
    )

    const MenteesTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentees.map((mentee, index) => (
                    <div
                        key={mentee._id}
                        className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg rounded-2xl border border-white/20 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        {/* Mentee Header */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                            <div className="flex items-center space-x-3">
                                <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                                    <GraduationCap className="h-8 w-8" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white truncate">
                                        {mentee.fullName}
                                    </h3>
                                    <p className="text-white/80 text-sm">
                                        {mentee.studentId}
                                    </p>
                                    <p className="text-white/70 text-xs">
                                        Class {mentee.class}-{mentee.section}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mentee Details */}
                        <div className="p-4">
                            {/* Mentor Assignment */}
                            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Assigned Mentor:</div>
                                {mentee.mentorId ? (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-slate-800 dark:text-white text-sm">
                                                {mentee.mentorId.fullName}
                                            </div>
                                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                                {mentee.mentorId.department}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedMentee(mentee)
                                                setShowAssignModal(true)
                                            }}
                                            className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-red-600 dark:text-red-400">No mentor assigned</span>
                                        <button
                                            onClick={() => {
                                                setSelectedMentee(mentee)
                                                setShowAssignModal(true)
                                            }}
                                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            Assign
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Attendance */}
                            {mentee.attendance && (
                                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">Attendance:</div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {mentee.attendance.percentage}%
                                        </div>
                                        <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
                                            {mentee.attendance.presentDays}/{mentee.attendance.totalDays} days
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Contact Info */}
                            <div className="space-y-2 mb-4">
                                {mentee.phone && (
                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                        <Phone className="h-4 w-4 mr-2" />
                                        {mentee.phone}
                                    </div>
                                )}
                                {mentee.userId?.email && (
                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                        <Mail className="h-4 w-4 mr-2" />
                                        {mentee.userId.email}
                                    </div>
                                )}
                                {mentee.academicYear && (
                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Academic Year: {mentee.academicYear}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleEditMentee(mentee)}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-3 rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                            >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit Profile
                            </button>
                        </div>
                    </div>
                ))}
            </div>
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                            <Users className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
                            Mentor & Mentee Management
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Manage mentor-mentee relationships and assignments
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex bg-slate-100/50 dark:bg-slate-700/50 rounded-2xl p-1">
                        <button
                            onClick={() => setActiveTab('mentors')}
                            className={`flex items-center px-6 py-2 rounded-xl font-medium transition-all duration-300 ${activeTab === 'mentors'
                                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-lg'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                        >
                            <Shield className="h-4 w-4 mr-2" />
                            Mentors ({mentors.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('mentees')}
                            className={`flex items-center px-6 py-2 rounded-xl font-medium transition-all duration-300 ${activeTab === 'mentees'
                                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-lg'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                        >
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Mentees ({mentees.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'mentors' && (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                <Shield className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                                Mentors ({filteredMentors.length})
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Manage mentor profiles and their mentee assignments
                            </p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search mentors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                            />
                        </div>
                    </div>
                    <MentorsTab />
                </div>
            )}
            
            {activeTab === 'mentees' && (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                <GraduationCap className="h-6 w-6 mr-3 text-green-600 dark:text-green-400" />
                                Mentees ({filteredMentees.length})
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Manage mentee profiles and mentor assignments
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search mentees..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                />
                            </div>
                            <select
                                value={mentorFilter}
                                onChange={(e) => setMentorFilter(e.target.value)}
                                className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                            >
                                <option value="all">All Mentors</option>
                                <option value="unassigned">Unassigned</option>
                                {mentors.map(mentor => (
                                    <option key={mentor._id} value={mentor._id}>
                                        {mentor.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <MenteesTab />
                </div>
            )}

            {/* Assign Mentor Modal */}
            {showAssignModal && selectedMentee && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                                Assign Mentor to {selectedMentee.fullName}
                            </h3>

                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {mentors.map(mentor => (
                                    <button
                                        key={mentor._id}
                                        onClick={() => handleAssignMentor(selectedMentee._id, mentor._id)}
                                        className="w-full p-3 text-left bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors"
                                    >
                                        <div className="font-medium text-slate-800 dark:text-white">
                                            {mentor.fullName}
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            {mentor.department} • {mentor.stats?.menteeCount || 0} mentees
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedPerson && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                    Edit {editType === 'mentor' ? 'Mentor' : 'Mentee'}: {selectedPerson.fullName}
                                </h3>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleUpdatePerson} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.fullName || ''}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                            required
                                        />
                                    </div>

                                    {editType === 'mentor' ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Employee ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editFormData.employeeId || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Department
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editFormData.department || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, department: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Phone
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={editFormData.phone || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Experience (years)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={editFormData.experience || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, experience: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Office Hours
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editFormData.officeHours || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, officeHours: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                    placeholder="e.g., 9:00 AM - 5:00 PM"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Subjects (comma-separated)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editFormData.subjects || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, subjects: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                    placeholder="e.g., Mathematics, Physics, Chemistry"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Qualifications
                                                </label>
                                                <textarea
                                                    value={editFormData.qualifications || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                                                    rows={3}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                    placeholder="Educational qualifications and certifications"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Student ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editFormData.studentId || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, studentId: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Class
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editFormData.class || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, class: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Section
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editFormData.section || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, section: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Phone
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={editFormData.phone || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Academic Year
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editFormData.academicYear || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                    placeholder="e.g., 2024-2025"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Date of Birth
                                                </label>
                                                <input
                                                    type="date"
                                                    value={editFormData.dateOfBirth || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Blood Group
                                                </label>
                                                <select
                                                    value={editFormData.bloodGroup || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                >
                                                    <option value="">Select Blood Group</option>
                                                    <option value="A+">A+</option>
                                                    <option value="A-">A-</option>
                                                    <option value="B+">B+</option>
                                                    <option value="B-">B-</option>
                                                    <option value="AB+">AB+</option>
                                                    <option value="AB-">AB-</option>
                                                    <option value="O+">O+</option>
                                                    <option value="O-">O-</option>
                                                </select>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Address
                                                </label>
                                                <textarea
                                                    value={editFormData.address || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                                                    rows={2}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                    placeholder="Full address"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Hobbies (comma-separated)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editFormData.hobbies || ''}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, hobbies: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                    placeholder="e.g., Reading, Sports, Music"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-colors"
                                    >
                                        Update {editType === 'mentor' ? 'Mentor' : 'Mentee'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MentorMenteeManagement