import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import { User, Mail, Phone, Building, Calendar, BookOpen, Edit2, Save, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'

const ProfilePage = () => {
    const { user, profile, refreshProfile } = useAuth()
    const [loading, setLoading] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        qualifications: '',
        citations: ''
    })

    // Initialize form data only when profile/user data is first loaded, never during edit mode
    useEffect(() => {
        if (profile && user && !editMode) {
            setFormData({
                email: user.email || '',
                phone: profile.phone || '',
                qualifications: profile.qualifications || '',
                citations: profile.citations || ''
            })
        }
    }, [profile?.id, user?.id]) // Removed editMode dependency to prevent interference

    const handleEdit = useCallback(() => {
        setEditMode(true)
    }, [])

    const handleCancel = useCallback(() => {
        setEditMode(false)
        setFormData({
            email: user.email || '',
            phone: profile.phone || '',
            qualifications: profile.qualifications || '',
            citations: profile.citations || ''
        })
    }, [user?.email, profile?.phone, profile?.qualifications, profile?.citations])

    const handleSave = async () => {
        if (user.role !== 'mentor') return

        setLoading(true)
        try {
            await api.put('/mentors/profile', formData)
            await refreshProfile()
            setEditMode(false)
            toast.success('Profile updated successfully!')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => {
            // Only update if the value actually changed
            if (prev[field] !== value) {
                return {
                    ...prev,
                    [field]: value
                }
            }
            return prev
        })
    }, [])

    if (!profile) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                </div>
            </Layout>
        )
    }

    const MentorProfile = useMemo(() => (
        <div className="space-y-8">
            {/* Profile Header */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="flex-shrink-0">
                            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl">
                                <span className="text-3xl font-bold text-white">
                                    {profile.fullName?.charAt(0)}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{profile.fullName}</h1>
                            <p className="text-lg text-slate-600 dark:text-slate-300 capitalize font-medium">{user.role}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Employee ID: {profile.employeeId}</p>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        {!editMode ? (
                            <button
                                onClick={handleEdit}
                                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
                            >
                                <Edit2 className="h-5 w-5" />
                                <span>Edit Profile</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                >
                                    <Save className="h-5 w-5" />
                                    <span>{loading ? 'Saving...' : 'Save'}</span>
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                >
                                    <X className="h-5 w-5" />
                                    <span>Cancel</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Information Cards */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Contact Information */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Contact Information</h3>
                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                                <Mail className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Email</dt>
                                {editMode ? (
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full px-4 py-2 bg-white/50 dark:bg-slate-600/50 border border-slate-300 dark:border-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                                        placeholder="Enter email"
                                    />
                                ) : (
                                    <dd className="text-lg font-medium text-slate-800 dark:text-white">{user.email}</dd>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0">
                                <Phone className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Phone</dt>
                                {editMode ? (
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className="w-full px-4 py-2 bg-white/50 dark:bg-slate-600/50 border border-slate-300 dark:border-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                                        placeholder="Enter phone number"
                                    />
                                ) : (
                                    <dd className="text-lg font-medium text-slate-800 dark:text-white">{profile.phone || 'Not provided'}</dd>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                                <Building className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Department</dt>
                                <dd className="text-lg font-medium text-slate-800 dark:text-white">{profile.department}</dd>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Professional Information */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Professional Information</h3>
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Subjects</dt>
                                <dd className="text-lg font-medium text-slate-800 dark:text-white">
                                    {profile.subjects?.length > 0 ? profile.subjects.join(', ') : 'Not specified'}
                                </dd>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Experience</dt>
                                <dd className="text-lg font-medium text-slate-800 dark:text-white">{profile.experience || 0} years</dd>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center shadow-lg">
                                <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Office Hours</dt>
                                <dd className="text-lg font-medium text-slate-800 dark:text-white">{profile.officeHours || 'Not specified'}</dd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Qualifications and Citations Side by Side */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Qualifications */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Qualifications</h3>
                    <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-6">
                        {editMode ? (
                            <textarea
                                value={formData.qualifications}
                                onChange={(e) => handleInputChange('qualifications', e.target.value)}
                                rows="6"
                                className="w-full px-4 py-3 bg-white/50 dark:bg-slate-600/50 border border-slate-300 dark:border-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white resize-none"
                                placeholder="Enter your qualifications, degrees, certifications..."
                            />
                        ) : (
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {profile.qualifications || 'No qualifications specified'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Citations */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                        Citations & Publications
                    </h3>
                    <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-6">
                        {editMode ? (
                            <textarea
                                value={formData.citations}
                                onChange={(e) => handleInputChange('citations', e.target.value)}
                                rows="6"
                                className="w-full px-4 py-3 bg-white/50 dark:bg-slate-600/50 border border-slate-300 dark:border-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white resize-none"
                                placeholder="Enter your citations, publications, research papers..."
                            />
                        ) : (
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm">
                                {profile.citations || 'No citations or publications listed'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    ), [profile, user, editMode, formData, loading, handleEdit, handleSave, handleCancel, handleInputChange])

    const MenteeProfile = () => (
        <div className="space-y-8">
            {/* Profile Header */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl">
                            <span className="text-3xl font-bold text-white">
                                {profile.fullName?.charAt(0)}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{profile.fullName}</h1>
                        <p className="text-lg text-slate-600 dark:text-slate-300 capitalize font-medium">{user.role}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Student ID: {profile.studentId}</p>
                    </div>
                </div>
            </div>

            {/* Information Cards */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Personal Information */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Personal Information</h3>
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                                <Mail className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Email</dt>
                                <dd className="text-lg font-medium text-slate-800 dark:text-white">{user.email}</dd>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                <Phone className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Phone</dt>
                                <dd className="text-lg font-medium text-slate-800 dark:text-white">{profile.phone || 'Not provided'}</dd>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Date of Birth</dt>
                                <dd className="text-lg font-medium text-slate-800 dark:text-white">
                                    {profile.dateOfBirth
                                        ? new Date(profile.dateOfBirth).toLocaleDateString()
                                        : 'Not provided'
                                    }
                                </dd>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Academic Information */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Academic Information</h3>
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Class</dt>
                                <dd className="text-lg font-medium text-slate-800 dark:text-white">{profile.class}</dd>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <Building className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Section</dt>
                                <dd className="text-lg font-medium text-slate-800 dark:text-white">{profile.section}</dd>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center shadow-lg">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Academic Year</dt>
                                <dd className="text-lg font-medium text-slate-800 dark:text-white">{profile.academicYear}</dd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Attendance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl p-6 text-center shadow-lg">
                        <p className="text-3xl font-bold text-white mb-2">
                            {profile.attendance?.totalDays || 0}
                        </p>
                        <p className="text-slate-200 font-medium">Total Days</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-center shadow-lg">
                        <p className="text-3xl font-bold text-white mb-2">
                            {profile.attendance?.presentDays || 0}
                        </p>
                        <p className="text-green-100 font-medium">Present Days</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-center shadow-lg">
                        <p className="text-3xl font-bold text-white mb-2">
                            {profile.attendance?.percentage || 0}%
                        </p>
                        <p className="text-blue-100 font-medium">Percentage</p>
                    </div>
                </div>
            </div>

            {/* Parent Information */}
            {profile.parentInfo && (
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Parent Information</h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-6">
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Father's Name</p>
                            <p className="text-lg font-medium text-slate-800 dark:text-white">{profile.parentInfo.fatherName || 'Not provided'}</p>
                        </div>
                        <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-6">
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Mother's Name</p>
                            <p className="text-lg font-medium text-slate-800 dark:text-white">{profile.parentInfo.motherName || 'Not provided'}</p>
                        </div>
                        <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-6">
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Primary Contact</p>
                            <p className="text-lg font-medium text-slate-800 dark:text-white">{profile.parentInfo.primaryContact || 'Not provided'}</p>
                        </div>
                        <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-6">
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Emergency Contact</p>
                            <p className="text-lg font-medium text-slate-800 dark:text-white">{profile.parentInfo.emergencyContact || 'Not provided'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <Layout>
            <div className="space-y-8">
                {/* Page Header */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                        Profile
                    </h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">
                        View and manage your profile information.
                    </p>
                </div>

                {user.role === 'mentor' ? MentorProfile : <MenteeProfile />}
            </div>
        </Layout>
    )
}

export default ProfilePage