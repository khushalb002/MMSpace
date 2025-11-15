import { useState, useEffect } from 'react'
import {
    Users,
    UserPlus,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Search,
    Filter,
    Eye,
    Shield,
    GraduationCap,
    User,
    Upload
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import LoadingSpinner from '../LoadingSpinner'
import CSVUpload from './CSVUpload'

const UserManagement = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 30
    const [showAddUserModal, setShowAddUserModal] = useState(false)
    const [showCSVUpload, setShowCSVUpload] = useState(false)
    const [selectedUsers, setSelectedUsers] = useState([])
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [userToDelete, setUserToDelete] = useState(null)
    const [addFormData, setAddFormData] = useState({
        email: '',
        password: '',
        role: 'mentee',
        fullName: '',
        employeeId: '',
        studentId: '',
        department: '',
        class: '',
        section: '',
        phone: ''
    })
    const [selectedUser, setSelectedUser] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editFormData, setEditFormData] = useState({
        email: '',
        fullName: '',
        employeeId: '',
        studentId: '',
        department: '',
        class: '',
        section: '',
        phone: '',
        role: '',
        password: ''
    })

    useEffect(() => {
        fetchUsers()
    }, [roleFilter])

    // Debounce search to avoid too many API calls
    // Debounced search - no need to refetch, just filter client-side
    useEffect(() => {
        if (searchTerm) {
            setCurrentPage(1) // Reset to first page when searching
        }
    }, [searchTerm])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                limit: 1000, // Fetch all users for client-side sorting and pagination
                ...(roleFilter !== 'all' && { role: roleFilter })
            })

            const response = await api.get(`/admin/users?${params}`)
            setUsers(response.data.users)
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleUserStatus = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/toggle-status`)
            toast.success('User status updated successfully')
            fetchUsers()
        } catch (error) {
            toast.error('Failed to update user status')
        }
    }

    const handleDeleteUser = async (userId) => {
        setUserToDelete(userId)
        setShowDeleteConfirm(true)
    }

    const confirmDeleteUser = async () => {
        try {
            await api.delete(`/admin/users/${userToDelete}`)
            toast.success('User deleted successfully')
            setShowDeleteConfirm(false)
            setUserToDelete(null)
            fetchUsers()
        } catch (error) {
            toast.error('Failed to delete user')
        }
    }

    const handleBulkDelete = async () => {
        if (selectedUsers.length === 0) {
            toast.error('No users selected')
            return
        }

        setShowBulkDeleteConfirm(false)

        try {
            const deletePromises = selectedUsers.map(userId =>
                api.delete(`/admin/users/${userId}`)
            )

            await Promise.all(deletePromises)

            toast.success(`Successfully deleted ${selectedUsers.length} user(s)`)
            setSelectedUsers([])
            fetchUsers()
        } catch (error) {
            console.error('Bulk delete error:', error)
            toast.error('Failed to delete some users')
            fetchUsers() // Refresh to show which ones were deleted
        }
    }

    const handleSelectUser = (userId) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId)
            } else {
                return [...prev, userId]
            }
        })
    }

    const handleSelectAll = () => {
        if (selectedUsers.length === paginatedUsers.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(paginatedUsers.map(user => user._id))
        }
    }

    const handleEditUser = (user) => {
        setSelectedUser(user)
        setEditFormData({
            email: user.email || '',
            fullName: user.profile?.fullName || '',
            employeeId: user.profile?.employeeId || '',
            studentId: user.profile?.studentId || '',
            department: user.profile?.department || '',
            class: user.profile?.class || '',
            section: user.profile?.section || '',
            phone: user.profile?.phone || '',
            role: user.role || '',
            password: ''
        })
        setShowEditModal(true)
    }

    const handleUpdateUser = async (e) => {
        e.preventDefault()
        try {
            // Update user basic info (including password if provided)
            const userUpdateData = {
                email: editFormData.email
            }
            if (editFormData.password && editFormData.password.trim() !== '') {
                userUpdateData.password = editFormData.password
            }
            await api.put(`/admin/users/${selectedUser._id}`, userUpdateData)

            // Update user profile
            await api.put(`/admin/users/${selectedUser._id}/profile`, {
                fullName: editFormData.fullName,
                employeeId: editFormData.employeeId,
                studentId: editFormData.studentId,
                department: editFormData.department,
                class: editFormData.class,
                section: editFormData.section,
                phone: editFormData.phone
            })

            toast.success('User updated successfully')
            setShowEditModal(false)
            fetchUsers()
        } catch (error) {
            console.error('Error updating user:', error)
            toast.error('Failed to update user')
        }
    }

    const handleAddUser = async (e) => {
        e.preventDefault()

        // Validate required fields
        if (!addFormData.email || !addFormData.password) {
            toast.error('Email and password are required')
            return
        }

        try {
            console.log('Creating user with data:', {
                email: addFormData.email,
                role: addFormData.role,
                fullName: addFormData.fullName
            })

            // Try the signup endpoint with all data first
            const signupData = {
                email: addFormData.email,
                password: addFormData.password,
                role: addFormData.role,
                fullName: addFormData.fullName,
                phone: addFormData.phone
            }

            // Add role-specific fields
            if (addFormData.role === 'mentor') {
                signupData.employeeId = addFormData.employeeId
                signupData.department = addFormData.department
            } else if (addFormData.role === 'mentee') {
                signupData.studentId = addFormData.studentId
                signupData.class = addFormData.class
                signupData.section = addFormData.section
            }

            const userResponse = await api.post('/auth/register', signupData)
            console.log('User creation response:', userResponse.data)

            toast.success('User created successfully')
            setShowAddUserModal(false)
            setAddFormData({
                email: '',
                password: '',
                role: 'mentee',
                fullName: '',
                employeeId: '',
                studentId: '',
                department: '',
                class: '',
                section: '',
                phone: ''
            })
            fetchUsers()
        } catch (error) {
            console.error('Error creating user:', error)
            console.error('Error response:', error.response?.data)
            console.error('Error status:', error.response?.status)

            // More specific error messages
            if (error.response?.status === 400) {
                toast.error(error.response?.data?.message || 'Invalid user data provided')
            } else if (error.response?.status === 409) {
                toast.error('User with this email already exists')
            } else if (error.response?.status === 500) {
                toast.error('Server error. Please try again later.')
            } else {
                toast.error(error.response?.data?.message || 'Failed to create user')
            }
        }
    }

    // Filter and sort users
    const filteredAndSortedUsers = users
        .filter(user => {
            // Status filter
            if (statusFilter === 'active' && !user.isActive) return false
            if (statusFilter === 'inactive' && user.isActive) return false

            // Search filter (client-side for better UX)
            if (searchTerm) {
                const search = searchTerm.toLowerCase()
                const email = user.email?.toLowerCase() || ''
                const fullName = user.profile?.fullName?.toLowerCase() || ''
                const studentId = user.profile?.studentId?.toLowerCase() || ''
                const employeeId = user.profile?.employeeId?.toLowerCase() || ''
                const department = user.profile?.department?.toLowerCase() || ''
                const className = user.profile?.class?.toLowerCase() || ''
                const phone = user.profile?.phone?.toLowerCase() || ''

                return email.includes(search) ||
                    fullName.includes(search) ||
                    studentId.includes(search) ||
                    employeeId.includes(search) ||
                    department.includes(search) ||
                    className.includes(search) ||
                    phone.includes(search)
            }

            return true
        })
        .sort((a, b) => {
            // Sort by role: admin -> mentor -> mentee
            const roleOrder = { admin: 0, mentor: 1, mentee: 2 }
            const roleA = roleOrder[a.role] ?? 3
            const roleB = roleOrder[b.role] ?? 3
            return roleA - roleB
        })

    // Calculate pagination
    const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedUsers = filteredAndSortedUsers.slice(startIndex, endIndex)

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <Shield className="h-5 w-5" />
            case 'mentor': return <User className="h-5 w-5" />
            case 'mentee': return <GraduationCap className="h-5 w-5" />
            default: return <User className="h-5 w-5" />
        }
    }

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'from-red-500 to-red-600'
            case 'mentor': return 'from-blue-500 to-indigo-600'
            case 'mentee': return 'from-green-500 to-emerald-600'
            default: return 'from-gray-500 to-gray-600'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                            <Users className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                            User Management ({users.length})
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Manage all system users, their roles, and permissions
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {selectedUsers.length > 0 && (
                            <button
                                onClick={() => setShowBulkDeleteConfirm(true)}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                                <Trash2 className="h-5 w-5 mr-2" />
                                Delete Selected ({selectedUsers.length})
                            </button>
                        )}
                        <button
                            onClick={() => setShowCSVUpload(true)}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                            <Upload className="h-5 w-5 mr-2" />
                            Bulk Upload CSV
                        </button>
                        <button
                            onClick={() => setShowAddUserModal(true)}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                            <UserPlus className="h-5 w-5 mr-2" />
                            Add New User
                        </button>
                    </div>
                </div>

                {/* Selection Info */}
                {selectedUsers.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>{selectedUsers.length}</strong> user(s) selected
                            <button
                                onClick={() => setSelectedUsers([])}
                                className="ml-4 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Clear selection
                            </button>
                        </p>
                    </div>
                )}

                {/* Filters */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="mentor">Mentor</option>
                        <option value="mentee">Mentee</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <Filter className="h-4 w-4" />
                        <span>{filteredAndSortedUsers.length} users found</span>
                    </div>
                </div>
            </div>

            {/* Users Grid */}
            {/* Select All Checkbox */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg rounded-2xl border border-white/20 dark:border-slate-700/50 p-4 mb-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                        onChange={handleSelectAll}
                        className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Select All ({paginatedUsers.length} on this page)
                    </span>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedUsers.map((user, index) => (
                    <div
                        key={user._id}
                        className={`group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl rounded-2xl border ${selectedUsers.includes(user._id)
                            ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/50'
                            : 'border-slate-200/50 dark:border-slate-700/50'
                            } hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        {/* User Header */}
                        <div className={`relative bg-gradient-to-r ${getRoleColor(user.role)} p-5`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="relative flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user._id)}
                                    onChange={() => handleSelectUser(user._id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-4 w-4 rounded border-white/50 text-white bg-white/20 focus:ring-white/50 cursor-pointer"
                                />
                                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                    {getRoleIcon(user.role)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-white truncate">
                                        {user.profile?.fullName || 'No Name'}
                                    </h3>
                                    <p className="text-white/90 text-xs truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* User Details */}
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${user.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                    user.role === 'mentor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                    }`}>
                                    {user.role}
                                </span>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${user.isActive
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-700/20 rounded-xl p-3 mb-4 border border-slate-200/50 dark:border-slate-600/30">
                                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                                    <p className="flex items-center justify-between">
                                        <span className="font-medium">ID:</span>
                                        <span className="text-slate-800 dark:text-slate-300">{user.profile?.employeeId || user.profile?.studentId || 'N/A'}</span>
                                    </p>
                                    <p className="flex items-center justify-between">
                                        <span className="font-medium">Department:</span>
                                        <span className="text-slate-800 dark:text-slate-300">{user.profile?.department || user.profile?.class || 'N/A'}</span>
                                    </p>
                                    <p className="flex items-center justify-between">
                                        <span className="font-medium">Last Login:</span>
                                        <span className="text-slate-800 dark:text-slate-300">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditUser(user)}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 px-3 rounded-xl font-semibold text-xs shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                                >
                                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleToggleUserStatus(user._id)}
                                    className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center ${user.isActive
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                                        }`}
                                >
                                    {user.isActive ? <ToggleRight className="h-3.5 w-3.5 mr-1.5" /> : <ToggleLeft className="h-3.5 w-3.5 mr-1.5" />}
                                    {user.isActive ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(user._id)}
                                    className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300 hover:scale-110 shadow-md"
                                    title="Delete User"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredAndSortedUsers.length === 0 && (
                <div className="text-center py-12">
                    <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">No users found</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                            ? 'Try adjusting your filters to see more results.'
                            : 'Get started by adding your first user.'}
                    </p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-6 py-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-xl">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} users
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded-lg bg-white dark:bg-slate-600 text-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
                        >
                            First
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded-lg bg-white dark:bg-slate-600 text-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
                        >
                            Previous
                        </button>
                        <div className="flex items-center space-x-1">
                            {[...Array(totalPages)].map((_, idx) => {
                                const pageNum = idx + 1
                                // Show first page, last page, current page, and pages around current
                                if (
                                    pageNum === 1 ||
                                    pageNum === totalPages ||
                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                ) {
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`px-3 py-1 rounded-lg transition-colors ${
                                                currentPage === pageNum
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-500'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                } else if (
                                    (pageNum === currentPage - 2 && pageNum > 1) ||
                                    (pageNum === currentPage + 2 && pageNum < totalPages)
                                ) {
                                    return <span key={pageNum} className="text-slate-400">...</span>
                                }
                                return null
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded-lg bg-white dark:bg-slate-600 text-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
                        >
                            Next
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded-lg bg-white dark:bg-slate-600 text-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
                        >
                            Last
                        </button>
                    </div>
                </div>
            )}
            </div>

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                    Edit User: {selectedUser.email}
                                </h3>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={editFormData.email}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.fullName}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={editFormData.phone}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Role
                                        </label>
                                        <select
                                            value={editFormData.role}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                            disabled
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="mentor">Mentor</option>
                                            <option value="mentee">Mentee</option>
                                        </select>
                                        <p className="text-xs text-slate-500 mt-1">Role cannot be changed</p>
                                    </div>

                                    {selectedUser.role === 'mentor' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Employee ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editFormData.employeeId}
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
                                                    value={editFormData.department}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, department: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {selectedUser.role === 'mentee' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Student ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editFormData.studentId}
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
                                                    value={editFormData.class}
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
                                                    value={editFormData.section}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, section: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Password Field - for all roles */}
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            New Password (optional)
                                        </label>
                                        <input
                                            type="password"
                                            value={editFormData.password}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                                            placeholder="Leave blank to keep current password"
                                            className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Enter a new password to change it, or leave blank to keep existing password</p>
                                    </div>
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
                                        Update User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                    Add New User
                                </h3>
                                <button
                                    onClick={() => setShowAddUserModal(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={addFormData.email}
                                            onChange={(e) => setAddFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Password *
                                        </label>
                                        <input
                                            type="password"
                                            value={addFormData.password}
                                            onChange={(e) => setAddFormData(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Role *
                                        </label>
                                        <select
                                            value={addFormData.role}
                                            onChange={(e) => setAddFormData(prev => ({ ...prev, role: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                            required
                                        >
                                            <option value="mentee">Mentee</option>
                                            <option value="mentor">Mentor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={addFormData.fullName}
                                            onChange={(e) => setAddFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={addFormData.phone}
                                            onChange={(e) => setAddFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    {addFormData.role === 'mentor' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Employee ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={addFormData.employeeId}
                                                    onChange={(e) => setAddFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Department
                                                </label>
                                                <input
                                                    type="text"
                                                    value={addFormData.department}
                                                    onChange={(e) => setAddFormData(prev => ({ ...prev, department: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {addFormData.role === 'mentee' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Student ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={addFormData.studentId}
                                                    onChange={(e) => setAddFormData(prev => ({ ...prev, studentId: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Class
                                                </label>
                                                <input
                                                    type="text"
                                                    value={addFormData.class}
                                                    onChange={(e) => setAddFormData(prev => ({ ...prev, class: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Section
                                                </label>
                                                <input
                                                    type="text"
                                                    value={addFormData.section}
                                                    onChange={(e) => setAddFormData(prev => ({ ...prev, section: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddUserModal(false)}
                                        className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-colors"
                                    >
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV Upload Modal */}
            {showCSVUpload && (
                <CSVUpload
                    onClose={() => setShowCSVUpload(false)}
                    onSuccess={(results) => {
                        setShowCSVUpload(false)
                        fetchUsers() // Refresh user list
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 max-w-md w-full p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                Confirm Delete
                            </h3>
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Are you sure you want to delete this user?
                            This action cannot be undone and will permanently remove all associated data.
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false)
                                    setUserToDelete(null)
                                }}
                                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteUser}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 max-w-md w-full p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                Confirm Delete
                            </h3>
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Are you sure you want to delete this user?
                            This action cannot be undone and will permanently remove all associated data.
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false)
                                    setUserToDelete(null)
                                }}
                                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteUser}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBulkDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 max-w-md w-full p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                Confirm Bulk Delete
                            </h3>
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Are you sure you want to delete <strong>{selectedUsers.length}</strong> user(s)?
                            This action cannot be undone and will permanently remove all associated data.
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowBulkDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default UserManagement