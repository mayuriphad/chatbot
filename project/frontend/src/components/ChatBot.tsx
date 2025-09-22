import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, AlertTriangle } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m here to help provide general information about symptoms and conditions. Please describe your symptoms, and I\'ll try to provide helpful insights. Remember, this is for educational purposes only.',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          conversationHistory: messages.slice(-5) // Send last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble connecting right now. Please try again later or consult with a healthcare professional directly.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      <div
        className={`mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ease-in-out transform ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl text-white">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <h3 className="font-semibold">Medical Assistant</h3>
          </div>
          <button
            onClick={toggleChat}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Medical Disclaimer */}
        <div className="p-3 bg-amber-50 border-b border-amber-200">
          <div className="flex items-start space-x-2 text-xs text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <p className="leading-relaxed">
              <strong>Medical Disclaimer:</strong> This AI provides general information only. 
              Always consult qualified healthcare professionals for proper medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                  message.isUser
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                {message.text}
                <div className={`text-xs mt-1 ${
                  message.isUser ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl rounded-bl-md">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your symptoms..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className="w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 flex items-center justify-center group animate-pulse hover:animate-none"
      >
        <MessageCircle 
          size={24} 
          className="group-hover:scale-110 transition-transform duration-200" 
        />
      </button>
    </div>
  );
};

export default ChatBot;