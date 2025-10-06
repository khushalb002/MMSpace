import { useState, useEffect } from 'react'
import { X, Search, MessageSquare, User } from 'lucide-react'
import api from '../services/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'

const MenteeSelectionModal = ({ isOpen, onClose, onSelectMentee }) => {
    const [mentees, setMentees] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (isOpen) {
            fetchMentees()
        }
    }, [isOpen])

    const fetchMentees = async () => {
        try {
            const response = await api.get('/mentors/mentees')
            setMentees(response.data)
        } catch (error) {
            console.error('Error fetching mentees:', error)
            toast.error('Failed to fetch mentees')
        } finally {
            setLoading(false)
        }
    }

    const filteredMentees = mentees.filter(mentee =>
        mentee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentee.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${mentee.class}-${mentee.section}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSelectMentee = (mentee) => {
        const conversationId = `individual_${mentee._id}`
        const conversation = {
            _id: conversationId,
            type: 'individual',
            displayName: mentee.fullName,
            subtitle: `${mentee.class}-${mentee.section}`,
            menteeId: mentee._id,
            color: '#10B981'
        }
        onSelectMentee(conversation)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-md max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/20 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                            Start New Chat
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-slate-100/50 dark:bg-slate-700/50 hover:bg-red-100/50 dark:hover:bg-red-500/20 transition-colors duration-200"
                        >
                            <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mt-4 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search mentees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <LoadingSpinner />
                        </div>
                    ) : filteredMentees.length > 0 ? (
                        <div className="space-y-2">
                            {filteredMentees.map((mentee, index) => (
                                <div
                                    key={mentee._id}
                                    onClick={() => handleSelectMentee(mentee)}
                                    className="group p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg bg-white/50 dark:bg-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/80 backdrop-blur-sm border border-white/20 dark:border-slate-600/30"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                                                {mentee.fullName}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                {mentee.studentId} • {mentee.class}-{mentee.section}
                                            </p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <MessageSquare className="h-5 w-5 text-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {searchTerm ? 'No mentees found matching your search' : 'No mentees available'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MenteeSelectionModal