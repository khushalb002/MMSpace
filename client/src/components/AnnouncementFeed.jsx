import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import api from '../services/api'
import { toast } from 'react-hot-toast'
import {
    Megaphone,
    MessageCircle,
    Send,
    Clock,
    User,
    ChevronDown,
    ChevronUp,
    Heart,
    Share2
} from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

const AnnouncementFeed = () => {
    const { user, profile } = useAuth()
    const { socket } = useSocket()
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedAnnouncements, setExpandedAnnouncements] = useState(new Set())
    const [commentInputs, setCommentInputs] = useState({})
    const [loadingComments, setLoadingComments] = useState({})

    useEffect(() => {
        fetchAnnouncements()
    }, [])

    useEffect(() => {
        if (socket) {
            socket.on('newAnnouncement', handleNewAnnouncement)
            socket.on('newAnnouncementComment', handleNewComment)

            return () => {
                socket.off('newAnnouncement', handleNewAnnouncement)
                socket.off('newAnnouncementComment', handleNewComment)
            }
        }
    }, [socket])

    const fetchAnnouncements = async () => {
        try {
            const response = await api.get('/announcements')
            setAnnouncements(response.data.announcements || [])
        } catch (error) {
            console.error('Error fetching announcements:', error)
            toast.error('Failed to fetch announcements')
        } finally {
            setLoading(false)
        }
    }

    const handleNewAnnouncement = (announcement) => {
        setAnnouncements(prev => [announcement, ...prev])
        toast.success('New announcement received!')
    }

    const handleNewComment = ({ announcementId, comment }) => {
        setAnnouncements(prev => prev.map(announcement =>
            announcement._id === announcementId
                ? { ...announcement, comments: [...(announcement.comments || []), comment] }
                : announcement
        ))
    }

    const toggleExpanded = async (announcementId) => {
        const newExpanded = new Set(expandedAnnouncements)

        if (newExpanded.has(announcementId)) {
            newExpanded.delete(announcementId)
        } else {
            newExpanded.add(announcementId)
            // Fetch comments when expanding
            await fetchComments(announcementId)
        }

        setExpandedAnnouncements(newExpanded)
    }

    const fetchComments = async (announcementId) => {
        try {
            setLoadingComments(prev => ({ ...prev, [announcementId]: true }))
            const response = await api.get(`/announcements/${announcementId}/comments`)

            setAnnouncements(prev => prev.map(announcement =>
                announcement._id === announcementId
                    ? { ...announcement, comments: response.data }
                    : announcement
            ))
        } catch (error) {
            console.error('Error fetching comments:', error)
            toast.error('Failed to fetch comments')
        } finally {
            setLoadingComments(prev => ({ ...prev, [announcementId]: false }))
        }
    }

    const handleCommentSubmit = async (announcementId) => {
        const content = commentInputs[announcementId]?.trim()
        if (!content) return

        try {
            const response = await api.post(`/announcements/${announcementId}/comments`, {
                content
            })

            // Clear input
            setCommentInputs(prev => ({ ...prev, [announcementId]: '' }))

            // Update local state
            setAnnouncements(prev => prev.map(announcement =>
                announcement._id === announcementId
                    ? {
                        ...announcement,
                        comments: [...(announcement.comments || []), response.data]
                    }
                    : announcement
            ))

            toast.success('Comment added successfully!')
        } catch (error) {
            console.error('Error adding comment:', error)
            toast.error('Failed to add comment')
        }
    }

    const formatTime = (date) => {
        const now = new Date()
        const messageDate = new Date(date)
        const diffInHours = (now - messageDate) / (1000 * 60 * 60)

        if (diffInHours < 1) {
            return 'Just now'
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`
        } else {
            return messageDate.toLocaleDateString()
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'from-red-500 to-red-600'
            case 'high': return 'from-orange-500 to-orange-600'
            case 'medium': return 'from-blue-500 to-blue-600'
            case 'low': return 'from-gray-500 to-gray-600'
            default: return 'from-blue-500 to-blue-600'
        }
    }

    const getPriorityBadgeColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
            case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                    Announcements
                </h2>
                <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                    <Megaphone className="h-4 w-4" />
                    <span>{announcements.length} announcements</span>
                </div>
            </div>

            {announcements.length > 0 ? (
                <div className="space-y-4">
                    {announcements.map((announcement, index) => (
                        <div
                            key={announcement._id}
                            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg rounded-3xl border border-white/20 dark:border-slate-700/50 overflow-hidden hover:shadow-xl transition-all duration-300"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {/* Header */}
                            <div className={`p-6 bg-gradient-to-r ${getPriorityColor(announcement.priority)} text-white`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <Megaphone className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold mb-2">
                                                {announcement.title}
                                            </h3>
                                            <div className="flex items-center space-x-4 text-sm opacity-90">
                                                <div className="flex items-center space-x-1">
                                                    <User className="h-4 w-4" />
                                                    <span>{announcement.authorId?.email || 'System'}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{formatTime(announcement.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(announcement.priority)} bg-white/20 backdrop-blur-sm`}>
                                        {announcement.priority}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                    {announcement.content}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-600/50">
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => toggleExpanded(announcement._id)}
                                            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-700/50 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 transition-colors duration-200"
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                                {announcement.comments?.length || 0} Comments
                                            </span>
                                            {expandedAnnouncements.has(announcement._id) ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button className="p-2 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                            <Heart className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                        </button>
                                        <button className="p-2 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                            <Share2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                {expandedAnnouncements.has(announcement._id) && (
                                    <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-600/50">
                                        {/* Comment Input */}
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                {profile?.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    placeholder="Add a comment..."
                                                    value={commentInputs[announcement._id] || ''}
                                                    onChange={(e) => setCommentInputs(prev => ({
                                                        ...prev,
                                                        [announcement._id]: e.target.value
                                                    }))}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleCommentSubmit(announcement._id)
                                                        }
                                                    }}
                                                    className="flex-1 bg-slate-100/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                                                />
                                                <button
                                                    onClick={() => handleCommentSubmit(announcement._id)}
                                                    disabled={!commentInputs[announcement._id]?.trim()}
                                                    className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
                                                >
                                                    <Send className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Comments List */}
                                        {loadingComments[announcement._id] ? (
                                            <div className="flex items-center justify-center py-4">
                                                <LoadingSpinner size="sm" />
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {announcement.comments?.map((comment, commentIndex) => (
                                                    <div
                                                        key={comment._id || commentIndex}
                                                        className="flex items-start space-x-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-700/30 backdrop-blur-sm"
                                                    >
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-xs">
                                                            {comment.userId?.email?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <span className="font-medium text-slate-800 dark:text-white text-sm">
                                                                    {comment.userId?.email || 'Anonymous'}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${comment.userRole === 'mentor'
                                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                        : comment.userRole === 'admin'
                                                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                    }`}>
                                                                    {comment.userRole}
                                                                </span>
                                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {formatTime(comment.createdAt)}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-700 dark:text-slate-300 text-sm">
                                                                {comment.content}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!announcement.comments || announcement.comments.length === 0) && (
                                                    <div className="text-center py-4">
                                                        <MessageCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            No comments yet. Be the first to comment!
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="h-24 w-24 bg-gradient-to-br from-slate-400 to-slate-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                        <Megaphone className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        No announcements yet
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        Announcements from your mentors will appear here.
                    </p>
                </div>
            )}
        </div>
    )
}

export default AnnouncementFeed