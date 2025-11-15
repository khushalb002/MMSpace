import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'
import { Send, Paperclip, MessageSquare, X, Plus, Image, FileText, Smile, MoreVertical, Megaphone, History, RefreshCcw, Trash2, Clock } from 'lucide-react'
import GroupIcon from '../components/icons/GroupIcon'
import UserIcon from '../components/icons/UserIcon'
import MenteeSelectionModal from '../components/MenteeSelectionModal'
import AnnouncementHistory from '../components/AnnouncementHistory'
import { toast } from 'react-hot-toast'

const resolveSenderId = (sender) => {
    if (!sender) return ''
    if (typeof sender === 'string') return sender
    if (typeof sender === 'object' && sender._id) return sender._id
    return ''
}

const deriveSenderRoleFromMessage = (message) => {
    if (!message) return undefined
    if (message.senderRole) return message.senderRole
    if (typeof message.senderId === 'object' && message.senderId?.role) {
        return message.senderId.role
    }
    return undefined
}

const deriveSenderEmailFromMessage = (message) => {
    if (!message) return undefined
    if (message.senderEmail) return message.senderEmail
    if (typeof message.senderId === 'object' && message.senderId?.email) {
        return message.senderId.email
    }
    return undefined
}

const deriveSenderNameFromMessage = (message) => {
    if (!message) return undefined
    if (message.senderName) return message.senderName
    if (typeof message.senderId === 'object' && message.senderId?.fullName) {
        return message.senderId.fullName
    }
    return undefined
}

const deriveSenderLabelFromRole = (role) => {
    switch (role) {
        case 'guardian':
            return 'Guardian'
        case 'mentee':
            return 'Student'
        case 'mentor':
            return 'Mentor'
        case 'admin':
            return 'Admin'
        default:
            return role ? role.charAt(0).toUpperCase() + role.slice(1) : undefined
    }
}

const deriveSenderInitialFromMeta = (role, email, name) => {
    if (name && typeof name === 'string' && name.trim().length > 0) {
        return name.trim().charAt(0).toUpperCase()
    }
    if (role === 'guardian') return 'G'
    if (role === 'mentor') return 'M'
    if (role === 'mentee') return 'S'
    if (role === 'admin') return 'A'
    if (email && typeof email === 'string' && email.length > 0) {
        return email.charAt(0).toUpperCase()
    }
    return '?'
}

const enrichMessage = (message) => {
    if (!message) return message

    const senderObject = typeof message.senderId === 'object' && message.senderId !== null
        ? message.senderId
        : null

    const senderId = resolveSenderId(message.senderId)
    const senderRole = deriveSenderRoleFromMessage(message)
    const senderEmail = deriveSenderEmailFromMessage(message)
    const senderName = deriveSenderNameFromMessage(message)
    const senderInitial = message.senderInitial || deriveSenderInitialFromMeta(senderRole, senderEmail, senderName)
    const senderLabel = message.senderLabel || deriveSenderLabelFromRole(senderRole)

    return {
        ...message,
        senderId,
        senderRole,
        senderEmail,
        senderName,
        senderInitial,
        senderLabel,
        senderUser: senderObject
    }
}

const getSenderBadgeClasses = (role) => {
    switch (role) {
        case 'guardian':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
        case 'mentor':
            return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
        case 'mentee':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
        default:
            return 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-200'
    }
}

const ModernChatPage = () => {
    const { id: conversationId } = useParams()
    const { user, profile } = useAuth()
    const { socket, joinGroup, leaveGroup } = useSocket()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [conversations, setConversations] = useState([])
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [conversationType, setConversationType] = useState('group')
    const [showCreateChat, setShowCreateChat] = useState(false)
    const [showMenteeSelection, setShowMenteeSelection] = useState(false)
    const [showChatMenu, setShowChatMenu] = useState(false)
    const [showAttachMenu, setShowAttachMenu] = useState(false)
    const [activeTab, setActiveTab] = useState('chats')
    const [announcements, setAnnouncements] = useState([])
    const [announcementsLoading, setAnnouncementsLoading] = useState(false)
    const [announcementForm, setAnnouncementForm] = useState({
        title: '',
        content: '',
        priority: 'medium',
        targetAudience: 'all'
    })
    const [creatingAnnouncement, setCreatingAnnouncement] = useState(false)
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [conversationActionLoading, setConversationActionLoading] = useState(false)
    const messagesEndRef = useRef(null)
    const fileInputRef = useRef(null)

    const latestGuardianMessage = useMemo(() => {
        for (let i = messages.length - 1; i >= 0; i -= 1) {
            const candidate = messages[i]
            if (candidate?.senderRole === 'guardian' && candidate?.senderName) {
                return candidate
            }
        }
        return null
    }, [messages])

    const mergeAnnouncementComment = (announcementList, announcementId, comment) => {
        return announcementList.map(announcement => {
            if (announcement._id !== announcementId) return announcement

            const existingComments = announcement.comments || []
            const alreadyExists = existingComments.some(existing => existing._id === comment._id)

            if (alreadyExists) {
                return announcement
            }

            return {
                ...announcement,
                comments: [...existingComments, comment]
            }
        })
    }

    const mergeAnnouncementLikes = (announcementList, announcementId, likes) => {
        return announcementList.map(announcement =>
            announcement._id === announcementId
                ? { ...announcement, likes }
                : announcement
        )
    }

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

    useEffect(() => {
        if (user.role === 'mentor') {
            fetchAnnouncements()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.role])

    useEffect(() => {
        if (user.role !== 'mentor' || !socket) return

        const handleNewAnnouncement = (announcement) => {
            setAnnouncements(prev => [{
                ...announcement,
                comments: announcement.comments || [],
                likes: announcement.likes || []
            }, ...prev])
        }

        const handleNewAnnouncementComment = ({ announcementId, comment }) => {
            setAnnouncements(prev => mergeAnnouncementComment(prev, announcementId, comment))
        }

        const handleAnnouncementLikeUpdated = ({ announcementId, likes }) => {
            setAnnouncements(prev => mergeAnnouncementLikes(prev, announcementId, likes))
        }

        socket.on('newAnnouncement', handleNewAnnouncement)
        socket.on('newAnnouncementComment', handleNewAnnouncementComment)
        socket.on('announcementLikeUpdated', handleAnnouncementLikeUpdated)

        return () => {
            socket.off('newAnnouncement', handleNewAnnouncement)
            socket.off('newAnnouncementComment', handleNewAnnouncementComment)
            socket.off('announcementLikeUpdated', handleAnnouncementLikeUpdated)
        }
    }, [socket, user.role])

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

                // Add separate guardian conversations
                try {
                    const guardiansResponse = await api.get('/mentors/guardians')
                    const guardianChats = guardiansResponse.data.map(guardian => {
                        const conversationId = `guardian_${guardian._id}`
                        const menteeNames = guardian.menteeIds?.map(m => m.fullName).join(', ') || 'Guardian'
                        return {
                            _id: conversationId,
                            type: 'guardian',
                            displayName: guardian.fullName,
                            subtitle: `Guardian: ${menteeNames}`,
                            guardianId: guardian._id,
                            color: '#F59E0B'
                        }
                    })
                    conversationList = [...conversationList, ...guardianChats]
                } catch (error) {
                    console.error('Error fetching guardians:', error)
                }

            } else if (user.role === 'guardian') {
                // Fetch guardian profile to get guardian ID
                const guardianProfileResponse = await api.get('/guardians/profile')
                const guardianProfile = guardianProfileResponse.data
                
                if (guardianProfile && guardianProfile._id) {
                    const menteesResponse = await api.get('/guardians/mentees')
                    const mentees = Array.isArray(menteesResponse.data) ? menteesResponse.data : []
                    
                    // Get unique mentors from mentees
                    const mentorMap = new Map()
                    mentees.forEach(mentee => {
                        if (mentee.mentorId && mentee.mentorId._id) {
                            if (!mentorMap.has(mentee.mentorId._id)) {
                                mentorMap.set(mentee.mentorId._id, {
                                    mentor: mentee.mentorId,
                                    mentees: []
                                })
                            }
                            mentorMap.get(mentee.mentorId._id).mentees.push(mentee)
                        }
                    })
                    
                    // Create one guardian conversation per mentor
                    const guardianChats = Array.from(mentorMap.values()).map(({ mentor, mentees: menteesForMentor }) => {
                        const conversationId = `guardian_${guardianProfile._id}`
                        const menteeNames = menteesForMentor.map(m => m.fullName).join(', ')
                        return {
                            _id: conversationId,
                            type: 'guardian',
                            displayName: mentor.fullName || 'Assigned Mentor',
                            subtitle: `About: ${menteeNames}`,
                            guardianId: guardianProfile._id,
                            color: '#14B8A6'
                        }
                    })

                    conversationList = guardianChats
                }
            } else {
                // For mentees, show groups they belong to and chat with their mentor
                try {
                    console.log('Fetching groups for mentee...')
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

        } catch (error) {
            console.error('Error fetching conversations:', error)
            toast.error('Failed to fetch conversations')
        } finally {
            setLoading(false)
        }
    }

    const fetchMessages = async () => {
        try {
            let endpoint = ''
            let currentConversationId = selectedConversation._id

            if (conversationType === 'group') {
                endpoint = `/messages/group/${currentConversationId}`
            } else if (conversationType === 'guardian') {
                currentConversationId = currentConversationId.replace('guardian_', '')
                endpoint = `/messages/guardian/${currentConversationId}`
            } else {
                currentConversationId = currentConversationId.replace('individual_', '')
                endpoint = `/messages/individual/${currentConversationId}`
            }
            const response = await api.get(endpoint)
            const normalizedMessages = Array.isArray(response.data)
                ? response.data.map(enrichMessage)
                : []
            setMessages(normalizedMessages)
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    const handleNewMessage = (message) => {
        const incomingMessage = enrichMessage(message)

        console.log('Received new message:', incomingMessage)
        console.log('Current selected conversation:', selectedConversation?._id)
        console.log('Message conversation ID:', incomingMessage.conversationId)

        // Only add message if it belongs to the current conversation
        if (selectedConversation) {
            let shouldAddMessage = false

            if (selectedConversation.type === 'group') {
                shouldAddMessage = incomingMessage.conversationId === selectedConversation._id
            } else if (selectedConversation.type === 'guardian') {
                // For guardian chats, check if the message belongs to this guardian conversation
                const actualConversationId = selectedConversation._id.replace('guardian_', '')
                shouldAddMessage = incomingMessage.conversationId === actualConversationId
            } else {
                // For individual chats, check if the message belongs to this conversation
                const actualConversationId = selectedConversation._id.replace('individual_', '')
                shouldAddMessage = incomingMessage.conversationId === actualConversationId
            }

            if (!shouldAddMessage) {
                console.log('Message does not belong to current conversation, skipping')
                return
            }
        }

        setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const messageExists = prev.some(msg => msg._id === incomingMessage._id)
            if (messageExists) {
                console.log('Message already exists, skipping')
                return prev
            }

            // If this is a real message and we have an optimistic message with the same content and sender,
            // replace the optimistic message instead of adding a duplicate
            const optimisticIndex = prev.findIndex(msg =>
                msg.isOptimistic &&
                msg.senderId === incomingMessage.senderId &&
                msg.content === incomingMessage.content &&
                Math.abs(new Date(msg.createdAt) - new Date(incomingMessage.createdAt)) < 5000 // Within 5 seconds
            )

            if (optimisticIndex !== -1) {
                // Replace optimistic message with real message
                const newMessages = [...prev]
                newMessages[optimisticIndex] = incomingMessage
                console.log('Replaced optimistic message with real message')
                return newMessages
            }

            console.log('Adding new message to chat')
            return [...prev, incomingMessage]
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
            senderRole: user.role,
            senderName: profile?.fullName,
            senderInitial: deriveSenderInitialFromMeta(user.role, user?.email, profile?.fullName),
            senderLabel: deriveSenderLabelFromRole(user.role),
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
            } else if (conversationType === 'guardian') {
                actualConversationId = selectedConversation._id.replace('guardian_', '')
            }

            const messageData = {
                conversationType,
                conversationId: actualConversationId,
                content: messageContent
            }

            const response = await api.post('/messages', messageData)
            console.log('Message sent successfully:', response.data._id)

            // Replace optimistic message with real message
            const savedMessage = enrichMessage(response.data)
            setMessages(prev => prev.map(msg =>
                msg._id === optimisticMessage._id ? savedMessage : msg
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

    const handleDeleteConversation = async () => {
        if (!selectedConversation || conversationActionLoading) return

        const shouldDelete = window.confirm('Delete this conversation? This will remove the chat history for all participants.')
        if (!shouldDelete) return

        const type = selectedConversation.type || conversationType
        let conversationId = selectedConversation._id

        if (type === 'individual') {
            conversationId = conversationId.replace('individual_', '')
        }

        try {
            setConversationActionLoading(true)
            await api.delete(`/messages/conversation/${type}/${conversationId}`)
            setMessages([])
            toast.success('Conversation deleted successfully')
        } catch (error) {
            console.error('Error deleting conversation:', error)
            toast.error(error.response?.data?.message || 'Failed to delete conversation')
        } finally {
            setConversationActionLoading(false)
            setShowChatMenu(false)
        }
    }

    const fetchAnnouncements = async () => {
        if (user.role !== 'mentor') return

        try {
            setAnnouncementsLoading(true)
            const response = await api.get('/announcements')
            const list = (response.data?.announcements || []).map(announcement => ({
                ...announcement,
                comments: announcement.comments || [],
                likes: announcement.likes || []
            }))
            setAnnouncements(list)
        } catch (error) {
            console.error('Error fetching announcements:', error)
            toast.error('Failed to fetch announcements')
        } finally {
            setAnnouncementsLoading(false)
        }
    }

    const handleCreateAnnouncement = async (event) => {
        if (user.role !== 'mentor') return
        event.preventDefault()

        const title = announcementForm.title.trim()
        const content = announcementForm.content.trim()

        if (!title || !content) {
            toast.error('Title and content are required')
            return
        }

        try {
            setCreatingAnnouncement(true)
            await api.post('/announcements', {
                title,
                content,
                priority: announcementForm.priority,
                targetAudience: announcementForm.targetAudience
            })

            toast.success('Announcement posted successfully')
            setAnnouncementForm({ title: '', content: '', priority: 'medium', targetAudience: 'all' })
            await fetchAnnouncements()
            setSelectedAnnouncement({ _id: 'all' })
        } catch (error) {
            console.error('Error creating announcement:', error)
            toast.error(error.response?.data?.message || 'Failed to create announcement')
        } finally {
            setCreatingAnnouncement(false)
        }
    }

    const announcementFormIsValid = announcementForm.title.trim().length > 0 && announcementForm.content.trim().length > 0

    const handleShowChats = () => {
        setActiveTab('chats')
        setSelectedAnnouncement(null)
    }

    const handleShowAnnouncements = () => {
        setActiveTab('announcements')
        if (!announcements.length) {
            fetchAnnouncements()
        }
        setSelectedAnnouncement(prev => prev || { _id: 'all' })
    }

    const sortedAnnouncementsForHistory = useMemo(() => {
        return [...announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }, [announcements])

    const handleSelectAnnouncementForHistory = (announcement) => {
        setActiveTab('announcements')
        setSelectedAnnouncement(announcement)
        setShowHistoryModal(false)
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
                <div className="w-full max-w-md xl:max-w-lg flex flex-col bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50">
                    {/* Header */}
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

                        {user.role === 'mentor' ? (
                            <div className="flex bg-slate-100/50 dark:bg-slate-700/50 rounded-2xl p-1 backdrop-blur-sm">
                                <button
                                    onClick={handleShowChats}
                                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'chats'
                                        ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-lg transform scale-105'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                        }`}
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Chats
                                </button>
                                <button
                                    onClick={handleShowAnnouncements}
                                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'announcements'
                                        ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-lg transform scale-105'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                        }`}
                                >
                                    <Megaphone className="h-4 w-4 mr-2" />
                                    Announcements
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300">
                                <MessageSquare className="h-5 w-5 text-blue-500" />
                                <span className="text-sm font-medium">
                                    Browse your recent conversations
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto">
                        {user.role === 'mentor' && activeTab === 'announcements' ? (
                            <div className="p-4 space-y-6">
                                <form onSubmit={handleCreateAnnouncement} className="bg-white/60 dark:bg-slate-700/60 border border-white/40 dark:border-slate-600/40 rounded-2xl p-6 shadow-inner space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            value={announcementForm.title}
                                            onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="Announcement headline"
                                            className="w-full bg-white/80 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-600/50 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                                                Priority
                                            </label>
                                            <select
                                                value={announcementForm.priority}
                                                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, priority: e.target.value }))}
                                                className="w-full bg-white/80 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-600/50 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                                                Audience
                                            </label>
                                            <select
                                                value={announcementForm.targetAudience}
                                                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                                                className="w-full bg-white/80 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-600/50 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                                            >
                                                <option value="all">Everyone</option>
                                                <option value="mentees">Mentees</option>
                                                <option value="mentors">Mentors</option>
                                                <option value="guardians">Guardians</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                                            Message
                                        </label>
                                        <textarea
                                            value={announcementForm.content}
                                            onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                                            rows={4}
                                            placeholder="Write the announcement details..."
                                            className="w-full bg-white/80 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-600/50 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 resize-none"
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
                                        <button
                                            type="button"
                                            onClick={() => setAnnouncementForm({ title: '', content: '', priority: 'medium', targetAudience: 'all' })}
                                            className="px-4 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-all duration-200 text-sm font-medium"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!announcementFormIsValid || creatingAnnouncement}
                                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all duration-300 ${(!announcementFormIsValid || creatingAnnouncement)
                                                ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white opacity-70 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                                                }`}
                                        >
                                            <Send className="h-4 w-4" />
                                            <span>{creatingAnnouncement ? 'Posting...' : 'Post Announcement'}</span>
                                        </button>
                                    </div>
                                </form>

                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Recent Announcements</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fetchAnnouncements()}
                                            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100/60 dark:bg-slate-700/60 hover:bg-slate-200/60 dark:hover:bg-slate-600/60 text-sm font-medium text-slate-600 dark:text-slate-300 transition-all duration-200"
                                        >
                                            <RefreshCcw className="h-4 w-4" />
                                            <span>Refresh</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!announcements.length) {
                                                    toast.error('No announcements to view yet')
                                                    return
                                                }
                                                setShowHistoryModal(true)
                                            }}
                                            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-100/60 dark:bg-blue-900/40 hover:bg-blue-200/60 dark:hover:bg-blue-900/60 text-sm font-medium text-blue-700 dark:text-blue-200 transition-all duration-200"
                                        >
                                            <History className="h-4 w-4" />
                                            <span>View History</span>
                                        </button>
                                    </div>
                                </div>

                                {announcementsLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <LoadingSpinner />
                                    </div>
                                ) : announcements.length > 0 ? (
                                    <div className="space-y-3">
                                        {announcements.map((announcement, index) => (
                                            <div
                                                key={announcement._id || index}
                                                onClick={() => setSelectedAnnouncement(announcement)}
                                                className="bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/40 rounded-2xl p-4 hover:shadow-lg hover:bg-white/80 dark:hover:bg-slate-700/80 cursor-pointer transition-all duration-300"
                                                style={{ animationDelay: `${index * 0.1}s` }}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
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
                                                            {new Date(announcement.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${announcement.priority === 'urgent'
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        : announcement.priority === 'high'
                                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                                            : announcement.priority === 'medium'
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                        }`}>
                                                        {announcement.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <div className="h-16 w-16 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl">
                                            <Megaphone className="h-8 w-8" />
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            No announcements yet. Create your first update above.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
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
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {user.role === 'mentor' && activeTab === 'announcements' ? (
                        selectedAnnouncement ? (
                            <AnnouncementHistory
                                announcements={announcements}
                                selectedAnnouncement={selectedAnnouncement}
                                onClose={() => setSelectedAnnouncement(null)}
                                onRefresh={fetchAnnouncements}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center animate-fadeIn">
                                    <div className="h-24 w-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                        <Megaphone className="h-12 w-12 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                        Announcement Hub
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                        Create a new announcement or select one from the sidebar to review and edit its history.
                                    </p>
                                </div>
                            </div>
                        )
                    ) : selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 relative z-30">
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
                                    <div className="relative chat-menu z-40">
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
                                                <button
                                                    onClick={handleDeleteConversation}
                                                    disabled={conversationActionLoading}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-100/40 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span>Delete Conversation</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-white/30 dark:to-slate-800/30 relative z-10">
                                {messages.map((message, index) => {
                                    const isOwnMessage = message.senderId === user.id
                                    const badgeClasses = !isOwnMessage && message.senderRole
                                        ? getSenderBadgeClasses(message.senderRole)
                                        : ''
                                    const badgeTextParts = []
                                    // Only show badges in group conversations
                                    if (!isOwnMessage && conversationType === 'group') {
                                        // For group chats, show label and name to identify different members
                                        if (message.senderLabel) {
                                            badgeTextParts.push(message.senderLabel)
                                        }
                                        if (message.senderName) {
                                            badgeTextParts.push(message.senderName)
                                        }
                                    }
                                    const badgeText = badgeTextParts.join(' • ')

                                    return (
                                        <div
                                            key={message._id}
                                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-slideInUp`}
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                                {!isOwnMessage && (
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                                        {message.senderInitial || '?'}
                                                    </div>
                                                )}
                                                <div
                                                    className={`px-4 py-3 rounded-3xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${isOwnMessage
                                                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-lg'
                                                        : 'bg-white/80 dark:bg-slate-700/80 text-slate-800 dark:text-white rounded-bl-lg border border-white/20 dark:border-slate-600/30'
                                                        } ${message.isOptimistic ? 'opacity-70 animate-pulse' : ''}`}
                                                >
                                                    {!isOwnMessage && badgeText && (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide mb-2 gap-1 ${badgeClasses}`}>
                                                            {badgeText}
                                                        </span>
                                                    )}
                                                    <p className="text-sm leading-relaxed">{message.content}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <p className={`text-xs ${isOwnMessage
                                                            ? 'text-blue-100'
                                                            : 'text-slate-500 dark:text-slate-400'
                                                            }`}>
                                                            {formatTime(message.createdAt)}
                                                        </p>
                                                        {isOwnMessage && !message.isOptimistic && (
                                                            <div className="text-blue-200 text-xs">✓</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
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
                                        : user.role === 'guardian'
                                            ? 'Your conversations will appear here once a mentor is linked to your student.'
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

            {showHistoryModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
                        onClick={() => setShowHistoryModal(false)}
                    />

                    <div className="relative z-10 w-full max-w-lg bg-white/95 dark:bg-slate-900/95 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/60 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                            <div>
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Announcement History</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Select an announcement to review its details.</p>
                            </div>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="p-2 rounded-full hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
                                aria-label="Close announcement history"
                            >
                                <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                            </button>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto">
                            <button
                                onClick={() => handleSelectAnnouncementForHistory({ _id: 'all' })}
                                className="w-full text-left px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-blue-900/20 transition-colors"
                            >
                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">View All Announcements</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Browse the complete announcement history.</p>
                            </button>

                            {sortedAnnouncementsForHistory.length > 0 ? (
                                sortedAnnouncementsForHistory.map(announcement => (
                                    <button
                                        key={announcement._id}
                                        onClick={() => handleSelectAnnouncementForHistory(announcement)}
                                        className="w-full text-left px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors flex items-start gap-4"
                                    >
                                        <div className="mt-1">
                                            <Megaphone className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-1">
                                                {announcement.title}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                                {announcement.content}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-2">
                                                <Clock className="h-4 w-4" />
                                                <span>{new Date(announcement.createdAt).toLocaleString()}</span>
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                                                    {announcement.priority}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                    No announcements available yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}

export default ModernChatPage