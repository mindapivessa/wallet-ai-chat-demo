'use client';

import React, { useState, useEffect, useRef } from 'react';
import { IoWalletOutline, IoSendOutline } from 'react-icons/io5';
import { RiRobot2Line } from 'react-icons/ri';
import { MdPowerSettingsNew } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const PROMPT_TEMPLATES = [
  "Deploy an NFT",
  "Send 0.0001 ETH to paprika.base.eth",
  "Launch a token with total supply of 1 million"
];

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello, how can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [isPendingDeactivation, setIsPendingDeactivation] = useState(false);
  const isAutonomousRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use environment variable for wallet address
  const WALLET_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS || '';

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
      }]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = async (prompt: string) => {
    setInput(prompt);
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
      }]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setInput('');
      setIsLoading(false);
    }
  };

  const toggleAutonomousMode = async () => {
    setIsAutonomous(!isAutonomous);
    if (!isAutonomous) {
      // Start autonomous mode
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Autonomous mode activated. I will now proactively interact with the blockchain.'
      }]);
      
      // Set loading state before making the request
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: "You're now in autonomous mode. Please start performing interesting blockchain operations.",
            isAutonomous: true 
          }),
        });

        const data = await response.json();
        
        // Add the response to messages
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
        }]);

        // Set up polling for autonomous mode updates
        const pollForUpdates = async () => {
          // Check ref instead of state to handle closure correctly
          if (!isAutonomousRef.current) return;
          
          setIsLoading(true);
          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                message: "Continue with the next autonomous action.",
                isAutonomous: true 
              }),
            });

            const data = await response.json();
            
            // Only add message if still in autonomous mode
            if (isAutonomousRef.current) {
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response,
              }]);
            }
          } catch (error) {
            console.error('Error in autonomous mode:', error);
          } finally {
            setIsLoading(false);
            // Schedule next poll only if still in autonomous mode
            if (isAutonomousRef.current) {
              setTimeout(pollForUpdates, 10000);
            }
          }
        };

        // Start polling
        setTimeout(pollForUpdates, 10000);

      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Update ref when isAutonomous changes
  useEffect(() => {
    isAutonomousRef.current = isAutonomous;
    if (!isAutonomous && !isLoading && isPendingDeactivation) {
      setIsPendingDeactivation(false);
    }
  }, [isAutonomous, isLoading]);

  const handleDeactivation = () => {
    if (isLoading) {
      setIsPendingDeactivation(true);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Autonomous mode deactivated. I will stop performing autonomous actions after this action is completed.'
      }]);
    } else {
      setIsAutonomous(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Autonomous mode deactivated. I will stop performing autonomous actions.'
      }]);
    }
  };

  // Effect to handle deactivation after loading completes
  useEffect(() => {
    if (!isLoading && isPendingDeactivation) {
      setIsAutonomous(false);
    }
  }, [isLoading, isPendingDeactivation]);

  return (
    <div className="flex flex-col w-full max-w-sm rounded-2xl overflow-hidden shadow-lg h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900">
        <IoWalletOutline className="w-5 h-5 text-white" />
        <span className="text-sm font-mono text-white truncate px-2">
          {truncateAddress(WALLET_ADDRESS)}
        </span>
        <motion.button
          onClick={toggleAutonomousMode}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={isAutonomous ? {
            opacity: [1, 0.5, 1],
            transition: {
              repeat: Infinity,
              duration: 2
            }
          } : {}}
          disabled={isPendingDeactivation}
        >
          <RiRobot2Line className={`w-5 h-5 ${
            isAutonomous || isPendingDeactivation
              ? 'text-green-400'
              : 'text-green-500'
          }`} />
        </motion.button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-900 h-full">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-2 px-2 py-1.5 rounded-lg break-words whitespace-pre-wrap ${
                message.role === 'user' 
                  ? 'bg-blue-500/10  text-blue-500 rounded-br-none' 
                  : 'bg-zinc-800 text-white rounded-bl-none'
              }`}
            >
              <div className="text-sm">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 px-2 py-1.5 rounded-lg rounded-bl-none">
              <div className="animate-pulse text-sm text-white">Thinking...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Templates and Chat Input */}
      <AnimatePresence>
        {(!isAutonomous && !isPendingDeactivation) ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-3 border-t border-zinc-800 bg-zinc-900 flex-shrink-0"
          >
            <div className="flex overflow-x-auto gap-2 pb-3 scrollbar-hide">
              {PROMPT_TEMPLATES.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt)}
                  className="flex-shrink-0 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg hover:bg-[#3C3C3E] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full px-3 py-1.5 pr-10 bg-zinc-800 text-white text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-zinc-500"
                  placeholder="How can I help you?"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <IoSendOutline className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-3 border-t border-zinc-800 bg-zinc-900 flex-shrink-0"
          >
            <div className="flex items-center justify-between">
              <motion.div
                animate={{
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                }}
                className="text-green-400 text-sm font-medium"
              >
                {isPendingDeactivation ? 'Completing final action...' : 'Autonomous mode on'}
              </motion.div>
              {!isPendingDeactivation && (
                <motion.button
                  onClick={handleDeactivation}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-zinc-100 hover:text-white transition-colors"
                >
                  <MdPowerSettingsNew className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 