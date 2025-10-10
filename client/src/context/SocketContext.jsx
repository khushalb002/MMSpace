import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null)
    const [onlineUsers, setOnlineUsers] = useState([])
    const { token, isAuthenticated } = useAuth()

    useEffect(() => {
        if (isAuthenticated && token) {
            const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
            const newSocket = io(socketUrl, {
                auth: { token }
            })

            newSocket.on('connect', () => {
                console.log('Connected to server')
                setSocket(newSocket)
            })

            newSocket.on('disconnect', () => {
                console.log('Disconnected from server')
            })

            return () => {
                newSocket.close()
                setSocket(null)
            }
        }
    }, [isAuthenticated, token])

    const joinGroup = (groupId) => {
        if (socket) {
            socket.emit('joinGroup', groupId)
        }
    }

    const leaveGroup = (groupId) => {
        if (socket) {
            socket.emit('leaveGroup', groupId)
        }
    }

    const sendTyping = (conversationId, isTyping) => {
        if (socket) {
            socket.emit('typing', { conversationId, isTyping })
        }
    }

    const value = {
        socket,
        onlineUsers,
        joinGroup,
        leaveGroup,
        sendTyping
    }

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => {
    const context = useContext(SocketContext)
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider')
    }
    return context
}