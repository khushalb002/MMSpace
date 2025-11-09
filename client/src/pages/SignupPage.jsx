import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, User, GraduationCap, Shield } from 'lucide-react'
import SparkleIcon from '../components/icons/SparkleIcon'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'

const ModernSignupPage = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const { isAuthenticated } = useAuth()

    const { register, handleSubmit, formState: { errors }, watch } = useForm()

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />
    }

    const onSubmit = async (data) => {
        setLoading(true)
        try {
            const response = await api.post('/auth/register', data)
            toast.success('Account created successfully! Please login.')
            window.location.href = '/login'
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const watchRole = watch('role')

    return (
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-lg w-full max-h-[95vh] overflow-y-auto">
                {/* Signup Card */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 p-6 animate-fadeIn my-4">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <SparkleIcon className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                            Join Our Platform
                        </h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">
                            Create your account to get started
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        {/* Role Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                I am a:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <label className={`relative flex cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] ${watchRole === 'mentor'
                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg'
                                    : 'border-white/20 dark:border-slate-600/30 bg-white/50 dark:bg-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-600/50'
                                    }`}>
                                    <input
                                        {...register('role', { required: 'Please select your role' })}
                                        type="radio"
                                        value="mentor"
                                        className="sr-only"
                                    />
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                            <User className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-800 dark:text-white">Mentor</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Teacher/Guide</div>
                                        </div>
                                    </div>
                                </label>

                                <label className={`relative flex cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] ${watchRole === 'mentee'
                                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20 shadow-lg'
                                    : 'border-white/20 dark:border-slate-600/30 bg-white/50 dark:bg-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-600/50'
                                    }`}>
                                    <input
                                        {...register('role', { required: 'Please select your role' })}
                                        type="radio"
                                        value="mentee"
                                        className="sr-only"
                                    />
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                            <GraduationCap className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-800 dark:text-white">Mentee</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Student</div>
                                        </div>
                                    </div>
                                </label>

                                <label className={`relative flex cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] ${watchRole === 'guardian'
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-lg'
                                    : 'border-white/20 dark:border-slate-600/30 bg-white/50 dark:bg-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-600/50'
                                    }`}>
                                    <input
                                        {...register('role', { required: 'Please select your role' })}
                                        type="radio"
                                        value="guardian"
                                        className="sr-only"
                                    />
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                            <Shield className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-800 dark:text-white">Guardian</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Parent / Caregiver</div>
                                        </div>
                                    </div>
                                </label>
                            </div>
                            {errors.role && (
                                <p className="text-sm text-red-500 flex items-center mt-2">
                                    <span className="mr-1">⚠️</span>
                                    {errors.role.message}
                                </p>
                            )}
                        </div>

                        {/* Basic Information */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Full Name
                                </label>
                                <input
                                    {...register('fullName', { required: 'Full name is required' })}
                                    type="text"
                                    className="w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300"
                                    placeholder="Enter your full name"
                                />
                                {errors.fullName && (
                                    <p className="text-sm text-red-500 flex items-center mt-1">
                                        <span className="mr-1">⚠️</span>
                                        {errors.fullName.message}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Email Address
                                </label>
                                <input
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^\S+@\S+$/i,
                                            message: 'Invalid email address'
                                        }
                                    })}
                                    type="email"
                                    className="w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300"
                                    placeholder="Enter your email address"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500 flex items-center mt-1">
                                        <span className="mr-1">⚠️</span>
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('password', {
                                            required: 'Password is required',
                                            minLength: {
                                                value: 6,
                                                message: 'Password must be at least 6 characters'
                                            }
                                        })}
                                        type={showPassword ? 'text' : 'password'}
                                        className="w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300"
                                        placeholder="Create a password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-500 flex items-center mt-1">
                                        <span className="mr-1">⚠️</span>
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Phone Number
                                </label>
                                <input
                                    {...register('phone', { required: 'Phone number is required' })}
                                    type="tel"
                                    className="w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300"
                                    placeholder="Enter your phone number"
                                />
                                {errors.phone && (
                                    <p className="text-sm text-red-500 flex items-center mt-1">
                                        <span className="mr-1">⚠️</span>
                                        {errors.phone.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Role-specific fields */}
                        {watchRole === 'mentor' && (
                            <div className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
                                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Mentor Information</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Department
                                        </label>
                                        <input
                                            {...register('department', { required: 'Department is required' })}
                                            type="text"
                                            className="w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300"
                                            placeholder="e.g., Computer Science"
                                        />
                                        {errors.department && (
                                            <p className="text-sm text-red-500 flex items-center mt-1">
                                                <span className="mr-1">⚠️</span>
                                                {errors.department.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Employee ID (Optional)
                                        </label>
                                        <input
                                            {...register('employeeId')}
                                            type="text"
                                            className="w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300"
                                            placeholder="Leave blank for auto-generation"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {watchRole === 'mentee' && (
                            <div className="space-y-4 p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-2xl border border-purple-200/50 dark:border-purple-800/50">
                                <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">Student Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Class
                                        </label>
                                        <input
                                            {...register('class', { required: 'Class is required' })}
                                            type="text"
                                            className="w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300"
                                            placeholder="e.g., 10"
                                        />
                                        {errors.class && (
                                            <p className="text-sm text-red-500 flex items-center mt-1">
                                                <span className="mr-1">⚠️</span>
                                                {errors.class.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Section
                                        </label>
                                        <input
                                            {...register('section', { required: 'Section is required' })}
                                            type="text"
                                            className="w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300"
                                            placeholder="e.g., A"
                                        />
                                        {errors.section && (
                                            <p className="text-sm text-red-500 flex items-center mt-1">
                                                <span className="mr-1">⚠️</span>
                                                {errors.section.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Student ID (Optional)
                                    </label>
                                    <input
                                        {...register('studentId')}
                                        type="text"
                                        className="w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300"
                                        placeholder="Leave blank for auto-generation"
                                    />
                                </div>
                            </div>
                        )}

                        {watchRole === 'guardian' && (
                            <div className="space-y-4 p-4 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50">
                                <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Guardian Details</h3>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Student ID
                                    </label>
                                    <input
                                        {...register('studentId', { required: 'Student ID is required to link your account' })}
                                        type="text"
                                        className="w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300"
                                        placeholder="Enter your child's student ID"
                                    />
                                    {errors.studentId && (
                                        <p className="text-sm text-red-500 flex items-center mt-1">
                                            <span className="mr-1">⚠️</span>
                                            {errors.studentId.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Relationship (Optional)
                                    </label>
                                    <input
                                        {...register('relationship')}
                                        type="text"
                                        className="w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300"
                                        placeholder="e.g., Mother, Father, Guardian"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] disabled:hover:scale-100"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <LoadingSpinner size="sm" />
                                    <span className="ml-2">Creating Account...</span>
                                </div>
                            ) : (
                                'Create Account'
                            )}
                        </button>

                        {/* Links */}
                        <div className="text-center space-y-3 pt-3">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-300/50 dark:border-slate-600/50"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400">
                                        Already have an account?
                                    </span>
                                </div>
                            </div>

                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center w-full py-3 px-6 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 rounded-2xl font-medium text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-600/50 transition-all duration-300 hover:scale-[1.02]"
                            >
                                Sign In Instead
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        © 2024 MMSpace. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ModernSignupPage