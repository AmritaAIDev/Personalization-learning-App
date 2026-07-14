'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AvatarRenderer from '@/components/AvatarRenderer';
import { Brain, CheckCircle, XCircle, Send, Loader2 } from 'lucide-react';

interface Question {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

function ArenaContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topic') || 'general';

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'tutor', text: string}[]>([
    { role: 'tutor', text: "Hello! I am your AI Tutor. Let me know if you need a hint!" }
  ]);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    setLoading(true);
    setError(null);
    // Fetch question from backend
    fetch(`${API_URL}/api/questions/generate?topic=${encodeURIComponent(topicId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setQuestion(data.data);
        } else {
          // Backend surfaces a real error (e.g. LLM/vector DB unavailable) — show it
          setError(data.message || 'The tutor could not generate a question right now.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch question:", err);
        setError('Could not reach the learning server. Is the backend running?');
        setLoading(false);
      });
  }, [topicId]);

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);
    
    // Auto-generate tutor response based on answer
    const isCorrect = selectedOption === question?.correct_answer;
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { role: 'tutor', text: isCorrect 
          ? "Excellent work! That is absolutely correct." 
          : "Not quite, but you are on the right track! Take a look at the explanation below." 
        }
      ]);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    setChatInput('');
    
    // Mock tutor response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'tutor', text: "That's a great question! Based on this topic, I'd recommend reviewing the foundational formulas first." }]);
    }, 1500);
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center px-8 border-b border-[#e4e5e7] bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#111214] text-white">
            <Brain size={18} />
          </div>
          <h1 className="font-heading text-lg font-bold text-[#111214]">Active Learning Arena</h1>
        </div>
      </header>
      
      <div className="p-6 h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-6xl h-full flex flex-col lg:flex-row gap-6">
          
          {/* LEFT COLUMN: Question Panel */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-[#e4e5e7] p-12">
                <Loader2 size={40} className="text-[#111214] animate-spin mb-4" />
                <h3 className="text-lg font-bold">Synthesizing Question...</h3>
                <p className="text-[#8f939b] text-sm text-center max-w-xs mt-2">The AI is currently generating a bespoke question based on your learning journey.</p>
              </div>
            ) : question ? (
              <div className="bg-white rounded-2xl border border-[#e4e5e7] p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Dynamic Question</span>
                </div>
                
                <h2 className="text-lg font-semibold text-[#111214] leading-relaxed">
                  {question.question_text}
                </h2>

                <div className="flex flex-col gap-2 mt-2">
                  {question.options.map((opt, i) => {
                    const isSelected = selectedOption === opt;
                    const isCorrectAnswer = opt === question.correct_answer;
                    
                    let buttonClass = "p-3 text-sm rounded-xl border text-left font-medium transition-all duration-200 flex items-center justify-between ";
                    
                    if (!isSubmitted) {
                      buttonClass += isSelected 
                        ? "border-[#111214] bg-[#f8f9fa] shadow-sm ring-1 ring-[#111214]" 
                        : "border-[#e4e5e7] hover:border-[#111214] hover:bg-[#f8f9fa]";
                    } else {
                      if (isCorrectAnswer) {
                        buttonClass += "border-green-500 bg-green-50 text-green-900";
                      } else if (isSelected && !isCorrectAnswer) {
                        buttonClass += "border-red-500 bg-red-50 text-red-900";
                      } else {
                        buttonClass += "border-[#e4e5e7] opacity-50";
                      }
                    }

                    return (
                      <button 
                        key={i} 
                        onClick={() => !isSubmitted && setSelectedOption(opt)}
                        disabled={isSubmitted}
                        className={buttonClass}
                      >
                        <span>{opt}</span>
                        {isSubmitted && isCorrectAnswer && <CheckCircle size={20} className="text-green-500 shrink-0" />}
                        {isSubmitted && isSelected && !isCorrectAnswer && <XCircle size={20} className="text-red-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {!isSubmitted ? (
                  <button 
                    onClick={handleSubmit}
                    disabled={!selectedOption}
                    className="mt-4 py-3 text-sm rounded-xl bg-[#111214] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#313337] transition-colors shadow-[0_8px_16px_rgba(49,51,55,0.12)]"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <h4 className="text-blue-900 text-sm font-bold mb-1.5 flex items-center gap-2">
                      <Brain size={16} />
                      AI Explanation
                    </h4>
                    <p className="text-blue-800 text-[13px] leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-[#e4e5e7] p-12 text-center">
                <XCircle size={40} className="text-red-400 mb-4" />
                <h3 className="text-lg font-bold text-[#111214]">Couldn&apos;t load a question</h3>
                <p className="text-[#8f939b] text-sm max-w-xs mt-2">
                  {error || 'Failed to load question.'}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: AI Tutor Panel */}
          <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4">
            
            <AvatarRenderer />

            {/* Chat Interface */}
            <div className="flex-1 bg-white rounded-2xl border border-[#e4e5e7] shadow-sm flex flex-col overflow-hidden min-h-[300px]">
              <div className="p-4 border-b border-[#e4e5e7] bg-[#fcfcfc]">
                <h3 className="font-heading text-sm font-bold text-[#111214]">Tutor Chat</h3>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#111214] text-white rounded-tr-sm' 
                        : 'bg-[#f4f5f7] text-[#111214] rounded-tl-sm border border-[#e4e5e7]'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-[#e4e5e7] bg-white">
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask for a hint..."
                    className="w-full bg-[#f4f5f7] border-none rounded-full py-2.5 pl-4 pr-10 text-[13px] focus:ring-2 focus:ring-[#111214]/20 outline-none"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="absolute right-1.5 p-1.5 rounded-full bg-[#111214] text-white hover:bg-[#313337] transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<div>Loading Arena...</div>}>
      <ArenaContent />
    </Suspense>
  );
}
