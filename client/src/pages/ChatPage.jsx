import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'
import { Send, Paperclip, MessageSquare, Megaphone, X, Plus, Image, FileText, Smile, MoreVertical } from 'lucide-react'
import GroupIcon from '../components/icons/GroupIcon'
import UserIcon from '../components/icons/UserIcon'
import MenteeSelectionModal from '../components/MenteeSelectionModal'
import AnnouncementFeed from '../components/AnnouncementFeed'
import { toast } from 'react-hot-toast'

const ModernChatPage = () => {
    const { id: conversationId } = useParams()
    const { user, profile } = useAuth()
    const { socket, joinGroup, leaveGroup } = useSocket()
    const [messages, setMessages] = useState([])
    const [announcements, setAnnouncements] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [newAnnouncement, setNewAnnouncement] = useState('')
    const [loading, setLoading] = useState(true)
    const [conversations, setConversations] = useState([])
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [conversationType, setConversationType] = useState('group')
    const [activeTab, setActiveTab] = useState('chats') // 'chats' or 'announcements'
    const [showCreateChat, setShowCreateChat] = useState(false)
    const [showMenteeSelection, setShowMenteeSelection] = useState(false)
    const [showChatMenu, setShowChatMenu] = useState(false)
    const [showAttachMenu, setShowAttachMenu] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        fetchConversations()
    }, [])

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages()
            if (socket) {
                let roomId = selectedConversation._id

                // For individual chats, only join the conversation room
                if (conversationType === 'individual') {
                    roomId = selectedConversation._id.replace('individual_', '')
                    joinGroup(roomId) // Join the conversation room
                } else {
                    joinGroup(roomId) // Join group room
                }

                // Remove any existing listeners first to prevent duplicates
                socket.off('newMessage', handleNewMessage)
                socket.on('newMessage', handleNewMessage)

                return () => {
                    if (conversationType === 'individual') {
                        const actualId = selectedConversation._id.replace('individual_', '')
                        leaveGroup(actualId)
                    } else {
                        leaveGroup(selectedConversation._id)
                    }
                    socket.off('newMessage', handleNewMessage)
                }
            }
        }
    }, [selectedConversation, socket, conversationType])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Close chat menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showChatMenu && !event.target.closest('.chat-menu')) {
                setShowChatMenu(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showChatMenu])

    const fetchConversations = async () => {
        try {
            let conversationList = []

            if (user.role === 'mentor') {
                // Fetch groups for mentor
                const groupsResponse = await api.get('/groups')
                const groups = groupsResponse.data.map(group => ({
                    ...group,
                    type: 'group',
                    displayName: group.name,
                    subtitle: `${group.menteeIds?.length || 0} members`
                }))
                conversationList = [...groups]

                // Add individual chats with mentees
                const menteesResponse = await api.get('/mentors/mentees')
                const individualChats = menteesResponse.data.map(mentee => {
                    const conversationId = `individual_${mentee._id}`
                    return {
                        _id: conversationId,
                        type: 'individual',
                        displayName: mentee.fullName,
                        subtitle: `${mentee.class}-${mentee.section}`,
                        menteeId: mentee._id,
                        color: '#10B981'
                    }
                })
                conversationList = [...conversationList, ...individualChats]

            } else {
                // For mentees, show groups they belong to and chat with their mentor
                try {
                    console.log('Fetching groups for mentee...')
                    // Fetch groups that the mentee belongs to
                    const groupsResponse = await api.get('/groups/mentee')
                    console.log('Mentee groups response:', groupsResponse.data)
                    const groups = groupsResponse.data.map(group => ({
                        ...group,
                        type: 'group',
                        displayName: group.name,
                        subtitle: `${group.menteeIds?.length || 0} members`
                    }))
                    conversationList = [...groups]
                    console.log('Processed groups for mentee:', conversationList)
                } catch (error) {
                    console.error('Error fetching mentee groups:', error)
                    console.error('Error details:', error.response?.data)
                }

                // Add individual chat with mentor
                if (profile?.mentorId) {
                    const mentorId = profile.mentorId._id || profile.mentorId
                    const conversationId = `individual_${profile._id}`
                    conversationList.push({
                        _id: conversationId,
                        type: 'individual',
                        displayName: profile.mentorId.fullName || 'Your Mentor',
                        subtitle: profile.mentorId.department || 'Mentor',
                        mentorId: mentorId,
                        color: '#3B82F6'
                    })
                }
            }

            setConversations(conversationList)

            // Set selected conversation
            if (conversationList.length > 0 && !conversationId) {
                setSelectedConversation(conversationList[0])
                setConversationType(conversationList[0].type)
            } else if (conversationId) {
                const conversation = conversationList.find(c =>
                    c._id === conversationId || c._id.includes(conversationId)
                )
                if (conversation) {
                    setSelectedConversation(conversation)
                    setConversationType(conversation.type)
                }
            }

            // Fetch announcements
            await fetchAnnouncements()
        } catch (error) {
            console.error('Error fetching conversations:', error)
            toast.error('Failed to fetch conversations')
        } finally {
            setLoading(false)
        }
    }

    const fetchAnnouncements = async () => {
        try {
            const response = await api.get('/announcements')
            setAnnouncements(response.data.announcements || [])
        } catch (error) {
            console.error('Error fetching announcements:', error)
        }
    }

    const sendAnnouncement = async () => {
        if (!newAnnouncement.trim()) return

        try {
            const announcementData = {
                title: 'General Announcement',
                content: newAnnouncement.trim(),
                targetAudience: 'mentees',
                priority: 'medium'
            }

            await api.post('/announcements', announcementData)
            toast.success('Announcement sent successfully!')
            setNewAnnouncement('')
            await fetchAnnouncements()
        } catch (error) {
            console.error('Error sending announcement:', error)
            toast.error('Failed to send announcement')
        }
    }

    const fetchMessages = async () => {
        try {
            let endpoint = ''
            let currentConversationId = selectedConversation._id

            if (conversationType === 'group') {
                endpoint = `/messages/group/${currentConversationId}`
            } else {
                currentConversationId = currentConversationId.replace('individual_', '')
                endpoint = `/messages/individual/${currentConversationId}`
            }
            const response = await api.get(endpoint)
            setMessages(response.data)
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    const handleNewMessage = (message) => {
        console.log('Received new message:', message)
        console.log('Current selected conversation:', selectedConversation?._id)
        console.log('Message conversation ID:', message.conversationId)

        // Only add message if it belongs to the current conversation
        if (selectedConversation) {
            let shouldAddMessage = false

            if (selectedConversation.type === 'group') {
                shouldAddMessage = message.conversationId === selectedConversation._id
            } else {
                // For individual chats, check if the message belongs to this conversation
                const actualConversationId = selectedConversation._id.replace('individual_', '')
                shouldAddMessage = message.conversationId === actualConversationId
            }

            if (!shouldAddMessage) {
                console.log('Message does not belong to current conversation, skipping')
                return
            }
        }

        setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const messageExists = prev.some(msg => msg._id === message._id)
            if (messageExists) {
                console.log('Message already exists, skipping')
                return prev
            }

            // If this is a real message and we have an optimistic message with the same content and sender,
            // replace the optimistic message instead of adding a duplicate
            const optimisticIndex = prev.findIndex(msg =>
                msg.isOptimistic &&
                msg.senderId === message.senderId &&
                msg.content === message.content &&
                Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 5000 // Within 5 seconds
            )

            if (optimisticIndex !== -1) {
                // Replace optimistic message with real message
                const newMessages = [...prev]
                newMessages[optimisticIndex] = message
                console.log('Replaced optimistic message with real message')
                return newMessages
            }

            console.log('Adding new message to chat')
            return [...prev, message]
        })
    }

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedConversation) return

        const messageContent = newMessage.trim()
        setNewMessage('') // Clear input immediately

        // Create optimistic message for immediate display
        const optimisticMessage = {
            _id: `temp_${Date.now()}`,
            content: messageContent,
            senderId: user.id,
            createdAt: new Date().toISOString(),
            isOptimistic: true
        }

        // Add optimistic message to UI immediately
        setMessages(prev => [...prev, optimisticMessage])

        try {
            let actualConversationId = selectedConversation._id

            // For individual chats, extract the actual ID
            if (conversationType === 'individual') {
                actualConversationId = selectedConversation._id.replace('individual_', '')
            }

            const messageData = {
                conversationType,
                conversationId: actualConversationId,
                content: messageContent
            }

            const response = await api.post('/messages', messageData)
            console.log('Message sent successfully:', response.data._id)

            // Replace optimistic message with real message
            setMessages(prev => prev.map(msg =>
                msg._id === optimisticMessage._id ? response.data : msg
            ))
        } catch (error) {
            // Remove optimistic message on error
            setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id))
            toast.error('Failed to send message')
            setNewMessage(messageContent) // Restore message content
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleFileUpload = (file) => {
        if (file) {
            // Handle file upload logic here
            toast.success(`Selected: ${file.name}`)
            // You can implement actual file upload to server here
        }
    }

    const handleSelectMentee = (conversation) => {
        // Add the new conversation to the list if it doesn't exist
        setConversations(prev => {
            const exists = prev.find(c => c._id === conversation._id)
            if (exists) {
                return prev
            }
            return [...prev, conversation]
        })

        // Select the conversation
        setSelectedConversation(conversation)
        setConversationType(conversation.type)
        setShowMenteeSelection(false)

        // Update URL
        window.history.pushState(null, '', `/chat/${conversation._id}`)
    }

    const handleCloseChat = () => {
        if (selectedConversation) {
            // Only remove individual chats from the sidebar, keep groups
            if (selectedConversation.type === 'individual' && selectedConversation._id.startsWith('individual_')) {
                // Only remove if it's a dynamically created individual chat (not the default mentor chat for mentees)
                if (user.role === 'mentor') {
                    setConversations(prev => prev.filter(conv => conv._id !== selectedConversation._id))
                }
            }

            // Leave the socket room
            if (socket) {
                if (selectedConversation.type === 'individual') {
                    const actualId = selectedConversation._id.replace('individual_', '')
                    socket.emit('leaveGroup', actualId)
                } else {
                    // Don't leave group rooms permanently, just stop listening to this specific group
                    socket.emit('leaveGroup', selectedConversation._id)
                }
            }
        }

        setSelectedConversation(null)
        setMessages([])
        setShowChatMenu(false)
        window.history.pushState(null, '', '/chat')
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
            <div className="h-[calc(100vh-8rem)] flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                {/* Sidebar */}
                <div className="w-80 flex flex-col bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50">
                    {/* Header with Tabs */}
                    <div className="p-6 bg-gradient-to-r from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                                Messages
                            </h1>
                            {user.role === 'mentor' && (
                                <button
                                    onClick={() => setShowMenteeSelection(true)}
                                    className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
                                    title="Start new chat"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex bg-slate-100/50 dark:bg-slate-700/50 rounded-2xl p-1 backdrop-blur-sm">
                            <button
                                onClick={() => setActiveTab('chats')}
                                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'chats'
                                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-lg transform scale-105'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                            >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Chats
                            </button>
                            <button
                                onClick={() => setActiveTab('announcements')}
                                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'announcements'
                                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-lg transform scale-105'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                            >
                                <Megaphone className="h-4 w-4 mr-2" />
                                Announcements
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'chats' ? (
                            <div className="p-2">
                                {conversations.map((conversation, index) => (
                                    <div
                                        key={conversation._id}
                                        onClick={() => {
                                            setSelectedConversation(conversation)
                                            setConversationType(conversation.type)
                                            window.history.pushState(null, '', `/chat/${conversation._id}`)
                                        }}
                                        className={`group relative p-4 m-2 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${selectedConversation?._id === conversation._id
                                            ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 dark:from-blue-400/20 dark:to-indigo-400/20 shadow-lg border border-blue-200/50 dark:border-blue-400/30'
                                            : 'bg-white/50 dark:bg-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/80 backdrop-blur-sm'
                                            }`}
                                        style={{
                                            animationDelay: `${index * 0.1}s`,
                                        }}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                <div
                                                    className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg backdrop-blur-sm"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${conversation.color}dd, ${conversation.color})`
                                                    }}
                                                >
                                                    {conversation.type === 'group' ? <GroupIcon className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                                                    {conversation.displayName}
                                                </h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                    {conversation.subtitle}
                                                </p>
                                            </div>
                                            {selectedConversation?._id === conversation._id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedConversation(null)
                                                    }}
                                                    className="p-1 rounded-full bg-slate-200/50 dark:bg-slate-600/50 hover:bg-red-200/50 dark:hover:bg-red-500/20 transition-colors duration-200"
                                                >
                                                    <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4">
                                {user.role === 'mentor' ? (
                                    <div className="space-y-4">
                                        {/* Announcement Input */}
                                        <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-4">
                                            <h3 className="font-semibold text-slate-800 dark:text-white mb-3">
                                                Create Announcement
                                            </h3>
                                            <textarea
                                                value={newAnnouncement}
                                                onChange={(e) => setNewAnnouncement(e.target.value)}
                                                placeholder="Type your announcement..."
                                                className="w-full bg-white/50 dark:bg-slate-600/50 border border-white/20 dark:border-slate-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 resize-none"
                                                rows="3"
                                            />
                                            <button
                                                onClick={sendAnnouncement}
                                                disabled={!newAnnouncement.trim()}
                                                className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
                                            >
                                                Send Announcement
                                            </button>
                                        </div>

                                        {/* Recent Announcements */}
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 px-2">
                                                Recent Announcements
                                            </h3>
                                            {announcements.length > 0 ? (
                                                announcements.map((announcement, index) => (
                                                    <div
                                                        key={announcement._id}
                                                        className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-slate-600/30 hover:shadow-lg transition-all duration-300"
                                                        style={{ animationDelay: `${index * 0.1}s` }}
                                                    >
                                                        <div className="flex items-start space-x-3">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg">
                                                                📢
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-slate-800 dark:text-white text-sm">
                                                                    {announcement.title}
                                                                </h4>
                                                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                                                                    {announcement.content}
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                                    {new Date(announcement.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${announcement.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                                announcement.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                                                    announcement.priority === 'medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                                }`}>
                                                                {announcement.priority}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8">
                                                    <Megaphone className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        No announcements yet
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* Announcement Feed for Mentees */
                                    <AnnouncementFeed />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div
                                            className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg"
                                            style={{
                                                background: `linear-gradient(135deg, ${selectedConversation.color}dd, ${selectedConversation.color})`
                                            }}
                                        >
                                            {selectedConversation.type === 'group' ? <GroupIcon className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                                {selectedConversation.displayName}
                                            </h2>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                                                <span className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                                                {selectedConversation.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative chat-menu">
                                        <button
                                            onClick={() => setShowChatMenu(!showChatMenu)}
                                            className="p-2 rounded-full bg-slate-100/50 dark:bg-slate-700/50 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 transition-colors duration-200"
                                        >
                                            <MoreVertical className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {showChatMenu && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 py-2 z-50">
                                                <button
                                                    onClick={handleCloseChat}
                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200 flex items-center space-x-2"
                                                >
                                                    <X className="h-4 w-4" />
                                                    <span>Close Chat</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-white/30 dark:to-slate-800/30">
                                {messages.map((message, index) => (
                                    <div
                                        key={message._id}
                                        className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'} animate-slideInUp`}
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${message.senderId === user.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                            {message.senderId !== user.id && (
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                                    {message.senderId?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                            <div
                                                className={`px-4 py-3 rounded-3xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${message.senderId === user.id
                                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-lg'
                                                    : 'bg-white/80 dark:bg-slate-700/80 text-slate-800 dark:text-white rounded-bl-lg border border-white/20 dark:border-slate-600/30'
                                                    } ${message.isOptimistic ? 'opacity-70 animate-pulse' : ''}`}
                                            >
                                                <p className="text-sm leading-relaxed">{message.content}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className={`text-xs ${message.senderId === user.id
                                                        ? 'text-blue-100'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                        }`}>
                                                        {formatTime(message.createdAt)}
                                                    </p>
                                                    {message.senderId === user.id && !message.isOptimistic && (
                                                        <div className="text-blue-200 text-xs">✓</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-t border-white/20 dark:border-slate-700/50">
                                <form onSubmit={sendMessage} className="flex items-center space-x-4">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowAttachMenu(!showAttachMenu)}
                                            className="p-3 rounded-full bg-slate-100/50 dark:bg-slate-700/50 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 transition-all duration-300 hover:scale-110"
                                        >
                                            <Paperclip className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                        </button>

                                        {/* Attachment Menu */}
                                        {showAttachMenu && (
                                            <div className="absolute bottom-full left-0 mb-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 p-2 min-w-[200px]">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        fileInputRef.current?.click()
                                                        setShowAttachMenu(false)
                                                    }}
                                                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                                                >
                                                    <Image className="h-5 w-5 text-blue-500" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Photo</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        // Create a file input for documents
                                                        const input = document.createElement('input')
                                                        input.type = 'file'
                                                        input.accept = '.pdf,.doc,.docx,.txt'
                                                        input.onchange = (e) => handleFileUpload(e.target.files[0])
                                                        input.click()
                                                        setShowAttachMenu(false)
                                                    }}
                                                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                                                >
                                                    <FileText className="h-5 w-5 text-green-500" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Document</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-600/50 transition-colors duration-200"
                                        >
                                            <Smile className="h-5 w-5 text-slate-400" />
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-110 disabled:hover:scale-100"
                                    >
                                        <Send className="h-5 w-5" />
                                    </button>
                                </form>

                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e.target.files[0])}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center animate-fadeIn">
                                <div className="h-24 w-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl backdrop-blur-sm">
                                    <MessageSquare className="h-12 w-12 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                    {user.role === 'mentor' ? 'Select a conversation' : 'Welcome to Chat!'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md">
                                    {user.role === 'mentor'
                                        ? 'Choose a conversation from the sidebar to start messaging'
                                        : 'Your conversations will appear here. Contact your mentor to get started!'
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Chat Modal */}
                {showCreateChat && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl border border-white/20 dark:border-slate-700/50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Create New Chat</h3>
                                <button
                                    onClick={() => setShowCreateChat(false)}
                                    className="p-2 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                                >
                                    <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Feature coming soon! You'll be able to create new group chats and invite mentees.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Mentee Selection Modal */}
            <MenteeSelectionModal
                isOpen={showMenteeSelection}
                onClose={() => setShowMenteeSelection(false)}
                onSelectMentee={handleSelectMentee}
            />
        </Layout>
    )
}

export default ModernChatPage