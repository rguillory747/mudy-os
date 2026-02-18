'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, User, Bot, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: Date
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    costCents: number
  }
}

interface ChatInterfaceProps {
  roleId: string
  roleName: string
  persona?: string
}

interface Delegation {
  role: string
  response: string
  tokens: number
  costCents: number
}

export function ChatInterface({ roleId, roleName, persona }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [delegations, setDelegations] = useState<Delegation[]>([])
  const [showDelegations, setShowDelegations] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isMainBrain = roleName.toLowerCase().includes('main brain') ||
                      roleName.toLowerCase().includes('coo') ||
                      roleName.toLowerCase() === 'orchestrator'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Add system message with persona if available
    if (persona && messages.length === 0) {
      setMessages([
        {
          role: 'system',
          content: persona,
          timestamp: new Date()
        }
      ])
    }
  }, [persona])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      if (isMainBrain) {
        // Use orchestrated chat for Main Brain
        const conversationHistory = messages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role,
            content: m.content
          }))

        const response = await fetch(`/api/roles/${roleId}/chat-orchestrated`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: userMessage.content,
            conversationHistory
          })
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const data = await response.json()

        // Store delegations for display
        if (data.delegations) {
          setDelegations(data.delegations)
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          usage: data.usage
        }

        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Regular chat for specialist roles
        const chatMessages = [
          ...messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content
          })),
          { role: 'user' as const, content: userMessage.content }
        ]

        // Add system message if persona exists
        if (persona) {
          chatMessages.unshift({
            role: 'system' as const,
            content: persona
          })
        }

        const response = await fetch(`/api/roles/${roleId}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: chatMessages
          })
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const data = await response.json()

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          usage: data.usage
        }

        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to send message'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.filter(m => m.role !== 'system').map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
            )}

            <div
              className={cn(
                'max-w-[70%] rounded-lg p-3',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {message.usage && (
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-3 text-xs opacity-70">
                  <span>{message.usage.totalTokens} tokens</span>
                  <span>${(message.usage.costCents / 100).toFixed(4)}</span>
                </div>
              )}

              {/* Show delegations for Main Brain responses */}
              {message.role === 'assistant' && isMainBrain && delegations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <button
                    onClick={() => setShowDelegations(!showDelegations)}
                    className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <Users className="h-3 w-3" />
                    <span>Consulted {delegations.length} specialist{delegations.length > 1 ? 's' : ''}</span>
                    {showDelegations ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>

                  {showDelegations && (
                    <div className="mt-2 space-y-2">
                      {delegations.map((delegation, idx) => (
                        <div key={idx} className="text-xs p-2 bg-background/50 rounded border border-border/30">
                          <div className="font-medium mb-1">{delegation.role}</div>
                          <div className="text-muted-foreground line-clamp-2">{delegation.response}</div>
                          <div className="mt-1 flex gap-2 opacity-60">
                            <span>{delegation.tokens} tokens</span>
                            <span>${(delegation.costCents / 100).toFixed(4)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {message.timestamp && (
                <p className="text-xs opacity-50 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              )}
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${roleName}...`}
            className="resize-none"
            rows={3}
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
