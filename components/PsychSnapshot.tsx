import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface SnapshotData {
  userId: string;
  phoneNumber: string;
  messages: Message[];
  snapshot: {
    emotionalPatterns: {
      currentState: string;
      stressTriggers: string[];
      stressResponse: string;
      regulation: string[];
    };
    relationshipPatterns: {
      connectionStyle: string;
      uncertaintyResponse: string;
      conflictStyle: string;
      attachmentNotes: string;
    };
    whatHelps: string[];
    whatHurts: string[];
    personalityTendencies: {
      bigFive: any;
      cognitiveStyle: string;
      naturalRhythm: string;
    };
    meaningfulExperiences: string;
    summary: string;
  };
  snapshotUrl: string;
  createdAt: number;
}

const COUNTRY_CODES = [
  { code: '+91', country: 'IN' },
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
];

export const PsychSnapshot: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [snapshotGenerated, setSnapshotGenerated] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserPhone(user.phoneNumber || '');
        console.log('[PsychSnapshot] User authenticated:', user.phoneNumber);
      } else {
        setIsAuthenticated(false);
        setUserPhone('');
        console.log('[PsychSnapshot] User not authenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  // Load chat history and snapshot state from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('psychSnapshot_messages');
    const savedSnapshotUrl = localStorage.getItem('psychSnapshot_url');
    const savedSnapshotGenerated = localStorage.getItem('psychSnapshot_generated');
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      // Send initial greeting only if no saved messages
      const greeting: Message = {
        id: 'init',
        role: 'assistant',
        text: "This space is for reflection, not evaluation. You can go slowly, skip questions, or stop at any time. Nothing here needs to be finished today. How are you feeling right now?",
        timestamp: Date.now()
      };
      setMessages([greeting]);
    }
    
    if (savedSnapshotUrl) {
      setSnapshotUrl(savedSnapshotUrl);
    }
    
    if (savedSnapshotGenerated === 'true') {
      setSnapshotGenerated(true);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('psychSnapshot_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Helper to detect multiple choice questions and extract options
  const parseMultipleChoice = (text: string): { question: string; options: string[] } | null => {
    // Match patterns like: "question? (Option1, Option2, Option3)"
    const match = text.match(/^(.+?)\?\s*\(([^)]+)\)$/s);
    if (match) {
      const question = match[1].trim() + '?';
      const options = match[2].split(',').map(opt => opt.trim());
      return { question, options };
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/snapshot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: isAuthenticated ? auth.currentUser?.uid : 'anonymous-' + Date.now(),
          phoneNumber: isAuthenticated ? userPhone : 'anonymous',
          message: currentInput,
          conversationHistory: messages
        })
      });

      const data = await response.json();

      // Handle rate limit error
      if (response.status === 429 || data.error === 'rate_limit') {
        const rateLimitMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: (data.response || "I'm currently at capacity. Please try again in a few minutes. Your conversation is saved and you can continue where you left off.").trim(),
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, rateLimitMessage]);
        setIsChatLoading(false);
        return;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.response.trim(),
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if snapshot is complete
      if (data.isComplete) {
        console.log('[PSYCHSNAPSHOT] Snapshot complete!');
        console.log('[PSYCHSNAPSHOT] Snapshot URL:', data.snapshotUrl);
        console.log('[PSYCHSNAPSHOT] Snapshot data:', data.snapshot);
        
        setSnapshotGenerated(true);
        setSnapshotUrl(data.snapshotUrl);
        
        // Save to localStorage
        localStorage.setItem('psychSnapshot_url', data.snapshotUrl);
        localStorage.setItem('psychSnapshot_generated', 'true');
        
        // Save full snapshot data if available
        if (data.snapshot) {
          console.log('[PSYCHSNAPSHOT] Saving snapshot data to localStorage');
          localStorage.setItem('psychSnapshot_data', JSON.stringify(data.snapshot));
        } else {
          console.warn('[PSYCHSNAPSHOT] No snapshot data received from backend');
        }
        
        // Add completion message with buttons to the conversation
        const completionMessage: Message = {
          id: 'completion-' + Date.now(),
          role: 'assistant',
          text: 'SNAPSHOT_READY',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, completionMessage]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copySnapshotUrl = () => {
    const fullUrl = `${window.location.origin}/#/snapshot/${snapshotUrl}`;
    navigator.clipboard.writeText(fullUrl);
    alert('Snapshot URL copied to clipboard!');
  };

  const startFresh = () => {
    if (confirm('Are you sure you want to start fresh? This will clear your current conversation and snapshot.')) {
      localStorage.removeItem('psychSnapshot_messages');
      localStorage.removeItem('psychSnapshot_url');
      localStorage.removeItem('psychSnapshot_generated');
      localStorage.removeItem('psychSnapshot_data');
      
      const greeting: Message = {
        id: 'init',
        role: 'assistant',
        text: "This space is for reflection, not evaluation. You can go slowly, skip questions, or stop at any time. Nothing here needs to be finished today. How are you feeling right now?",
        timestamp: Date.now()
      };
      setMessages([greeting]);
      setSnapshotGenerated(false);
      setSnapshotUrl('');
    }
  };

  // Chat Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-white to-accent/10">
      {/* Info Banner */}
      <div className="bg-blue-50 border-b border-blue-200 py-2.5 px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="text-sm text-blue-800 text-center">
            <i className="fas fa-info-circle mr-2"></i>
            Your snapshot will be saved temporarily. <strong>Login (free)</strong> to save it permanently and access it anytime.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary p-4 sm:p-6 text-white">
            {/* User Auth Status Bar */}
            {isAuthenticated ? (
              <div className="mb-3 pb-3 border-b border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fas fa-user-check text-green-300"></i>
                  <span className="text-xs sm:text-sm font-medium">Logged in as {userPhone}</span>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <i className="fas fa-th-large mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              </div>
            ) : (
              <div className="mb-3 pb-3 border-b border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fas fa-info-circle text-yellow-300"></i>
                  <span className="text-xs sm:text-sm">Creating anonymous snapshot</span>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <i className="fas fa-sign-in-alt mr-1 sm:mr-2"></i>
                  Login
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold mb-1">Build Your Psychological Snapshot</h1>
                <p className="text-xs sm:text-sm text-white/80 hidden sm:block">Answer questions to create your mental health profile</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {snapshotGenerated && (
                  <div className="text-center hidden sm:block">
                    <i className="fas fa-check-circle text-3xl sm:text-4xl text-green-300 mb-2"></i>
                    <p className="text-xs sm:text-sm">Complete!</p>
                  </div>
                )}
                <Button
                  onClick={startFresh}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs sm:text-sm px-3 sm:px-4"
                >
                  <i className="fas fa-redo sm:mr-2"></i>
                  <span className="hidden sm:inline">Start Fresh</span>
                </Button>
              </div>
            </div>
          </div>



          {/* Messages */}
          <div className="h-[60vh] sm:h-[500px] overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.text === 'SNAPSHOT_READY' ? (
                  <div className="max-w-[95%] sm:max-w-[75%] bg-green-50 border-2 border-green-200 p-4 sm:p-6 rounded-xl sm:rounded-2xl rounded-bl-none">
                    <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <i className="fas fa-check-circle text-2xl sm:text-3xl text-green-600 mt-1"></i>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-green-900 mb-1">Your Psychological Snapshot is Ready!</h3>
                        <p className="text-xs sm:text-sm text-green-700">Your personalized profile has been created based on our conversation.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/#/snapshot/${snapshotUrl}`;
                        console.log('[PSYCHSNAPSHOT] Opening snapshot in new tab:', url);
                        console.log('[PSYCHSNAPSHOT] Current localStorage data:', {
                          url: localStorage.getItem('psychSnapshot_url'),
                          generated: localStorage.getItem('psychSnapshot_generated'),
                          hasData: !!localStorage.getItem('psychSnapshot_data')
                        });
                        window.open(url, '_blank');
                      }}
                      className="w-full bg-primary hover:bg-primaryHover text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all inline-flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <i className="fas fa-external-link-alt"></i>
                      View Snapshot
                    </button>
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-xl sm:rounded-2xl text-sm sm:text-base ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    {msg.role === 'assistant' && (() => {
                      const multipleChoice = parseMultipleChoice(msg.text);
                      if (multipleChoice) {
                        return (
                          <div>
                            <p className="whitespace-pre-wrap mb-3">{multipleChoice.question}</p>
                            <div className="flex flex-wrap gap-2">
                              {multipleChoice.options.map((option, idx) => (
                                <button
                                  key={idx}
                                  onClick={async () => {
                                    if (isChatLoading) return;
                                    
                                    setIsChatLoading(true);
                                    const userMessage: Message = {
                                      id: Date.now().toString(),
                                      role: 'user',
                                      text: option,
                                      timestamp: Date.now()
                                    };
                                    setMessages(prev => [...prev, userMessage]);
                                    
                                    try {
                                      const response = await fetch('/api/snapshot/chat', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          userId: isAuthenticated ? auth.currentUser?.uid : 'guest',
                                          phoneNumber: isAuthenticated ? userPhone : '',
                                          message: option,
                                          conversationHistory: [...messages, userMessage]
                                        })
                                      });
                                      
                                      if (response.ok) {
                                        const data = await response.json();
                                        const assistantMessage: Message = {
                                          id: (Date.now() + 1).toString(),
                                          role: 'assistant',
                                          text: data.response.trim(),
                                          timestamp: Date.now()
                                        };
                                        setMessages(prev => [...prev, assistantMessage]);
                                        
                                        if (data.isComplete) {
                                          setSnapshotGenerated(true);
                                          setSnapshotUrl(data.snapshotUrl);
                                          localStorage.setItem('psychSnapshot_url', data.snapshotUrl);
                                          localStorage.setItem('psychSnapshot_generated', 'true');
                                          if (data.snapshot) {
                                            localStorage.setItem('psychSnapshot_data', JSON.stringify(data.snapshot));
                                          }
                                          const completionMessage: Message = {
                                            id: 'completion-' + Date.now(),
                                            role: 'assistant',
                                            text: 'SNAPSHOT_READY',
                                            timestamp: Date.now()
                                          };
                                          setMessages(prev => [...prev, completionMessage]);
                                        }
                                      }
                                    } catch (err) {
                                      console.error('Chat error:', err);
                                    } finally {
                                      setIsChatLoading(false);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-primary border border-accent rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isChatLoading}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return <p className="whitespace-pre-wrap">{msg.text}</p>;
                    })()}
                    {msg.role === 'user' && <p className="whitespace-pre-wrap">{msg.text}</p>}
                  </div>
                )}
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {!snapshotGenerated && (
            <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response..."
                  disabled={isChatLoading}
                  rows={1}
                  className="flex-1 resize-none overflow-y-auto max-h-32 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  style={{ minHeight: '44px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !input.trim()}
                  className="px-4 sm:px-6 h-11 sm:h-12"
                >
                  <i className="fas fa-paper-plane text-sm sm:text-base"></i>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
