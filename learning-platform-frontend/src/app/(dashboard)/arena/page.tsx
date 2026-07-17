'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Brain, CheckCircle, XCircle, Send, Loader2, ArrowRight } from 'lucide-react';

const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate'];

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
  const [currentBloomLevel, setCurrentBloomLevel] = useState(0); // 0 = Remember
  const [fallbackTopic, setFallbackTopic] = useState<{ id: string, name: string } | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  
  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'tutor', text: string}[]>([
    { role: 'tutor', text: "Hello! I am your AI Tutor. Let me know if you need a hint!" }
  ]);

  const fetchQuestion = (levelIndex: number) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    setLoading(true);
    setError(null);
    setQuestion(null);
    setIsSubmitted(false);
    setSelectedOption(null);
    setShowFallback(false);

    fetch(`${API_URL}/api/questions/generate?topic=${encodeURIComponent(topicId)}&bloomLevel=${BLOOM_LEVELS[levelIndex]}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setQuestion(data.data);
        } else {
          setError(data.message || 'The tutor could not generate a question right now.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch question:", err);
        setError('Could not reach the learning server. Is the backend running?');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQuestion(currentBloomLevel);
  }, [topicId, currentBloomLevel]);

  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);
    
    // Auto-generate tutor response based on answer
    const isCorrect = selectedOption === question?.correct_answer;
    setIsTyping(true);
    
    // Core Bloom's Logic
    if (isCorrect) {
      if (currentBloomLevel < BLOOM_LEVELS.length - 1) {
        setMessages(prev => [...prev, { role: 'tutor', text: `Correct! You have mastered the "${BLOOM_LEVELS[currentBloomLevel]}" level. Click "Next Question" to advance.` }]);
      } else {
        setMessages(prev => [...prev, { role: 'tutor', text: `Incredible! You have mastered the highest level (${BLOOM_LEVELS[currentBloomLevel]}) for this topic!` }]);
      }
    } else {
      if (currentBloomLevel === 0) {
        // Failed at Remember level -> Check prerequisites
        checkPrerequisites();
      } else {
        setMessages(prev => [...prev, { role: 'tutor', text: `Not quite. Since you struggled with this "${BLOOM_LEVELS[currentBloomLevel]}" question, we will move down a level next time to rebuild fundamentals.` }]);
      }
    }
    
    setIsTyping(false);
  };

  const checkPrerequisites = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/api/topics/${encodeURIComponent(topicId)}/prerequisites`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        const prereq = data.data[0];
        setFallbackTopic(prereq);
        setShowFallback(true);
        setMessages(prev => [...prev, { role: 'tutor', text: `It looks like you might have a gap in the fundamental concepts. I highly recommend taking a step back and reviewing the prerequisite: ${prereq.name}.` }]);
      } else {
        setMessages(prev => [...prev, { role: 'tutor', text: `That's incorrect. Please review the explanation below carefully before trying again.` }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'tutor', text: `That's incorrect. Please review the explanation below carefully before trying again.` }]);
    }
  };

  const handleNextQuestion = () => {
    const isCorrect = selectedOption === question?.correct_answer;
    let nextLevel = currentBloomLevel;
    if (isCorrect) {
      nextLevel = Math.min(currentBloomLevel + 1, BLOOM_LEVELS.length - 1);
    } else {
      nextLevel = Math.max(currentBloomLevel - 1, 0);
    }
    setCurrentBloomLevel(nextLevel);
  };


  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;
    const userMessage = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    setIsTyping(true);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/api/questions/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicId, message: userMessage })
      });
      const data = await res.json();
      
      if (data.success && data.data?.reply) {
        setMessages(prev => [...prev, { role: 'tutor', text: data.data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'tutor', text: 'Sorry, I am having trouble connecting to my neural network right now.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'tutor', text: 'Error: Could not reach the server.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center px-8 border-b border-[#e4e5e7] bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white">
            <Brain size={18} />
          </div>
          <h1 className="font-heading text-lg font-bold text-foreground">Active Learning Arena</h1>
        </div>
      </header>
      
      <div className="p-6 h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-6xl h-full flex flex-col lg:flex-row-reverse gap-6">
          
          {/* LEFT COLUMN: Question Panel */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-[#e4e5e7] p-12">
                <Loader2 size={40} className="text-foreground animate-spin mb-4" />
                <h3 className="text-lg font-bold">Synthesizing Question...</h3>
                <p className="text-[#8f939b] text-sm text-center max-w-xs mt-2">The AI is currently generating a bespoke question based on your learning journey.</p>
              </div>
            ) : question ? (
              <div className="bg-white rounded-2xl border border-[#e4e5e7] p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-1 justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Dynamic Question</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Level: {BLOOM_LEVELS[currentBloomLevel]}</span>
                </div>
                
                <h2 className="text-lg font-semibold text-foreground leading-relaxed">
                  {question.question_text}
                </h2>

                <div className="flex flex-col gap-2 mt-2">
                  {question.options.map((opt, i) => {
                    const isSelected = selectedOption === opt;
                    const isCorrectAnswer = opt === question.correct_answer;
                    
                    let buttonClass = "p-2.5 text-sm rounded-xl border text-left font-medium transition-all duration-200 flex items-center justify-between ";
                    
                    if (!isSubmitted) {
                      buttonClass += isSelected 
                        ? "border-[var(--color-primary)] bg-[#f8f9fa] shadow-sm ring-1 ring-[var(--color-primary)]" 
                        : "border-[#e4e5e7] hover:border-[var(--color-primary)] hover:bg-[#f8f9fa]";
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
                    className="mt-4 py-3 text-sm rounded-xl bg-[var(--color-primary)] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-primary-light)] transition-colors shadow-[0_8px_16px_rgba(49,51,55,0.12)]"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <h4 className="text-blue-900 text-sm font-bold mb-1.5 flex items-center gap-2">
                        <Brain size={16} />
                        AI Explanation
                      </h4>
                      <p className="text-blue-800 text-[13px] leading-relaxed">
                        {question.explanation}
                      </p>
                    </div>

                    {showFallback && fallbackTopic ? (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col gap-3">
                        <h4 className="text-amber-900 text-sm font-bold flex items-center gap-2">
                          <XCircle size={16} className="text-amber-500" />
                          Prerequisite Gap Detected
                        </h4>
                        <p className="text-amber-800 text-[13px] leading-relaxed">
                          You missed a fundamental &quot;Remember&quot; level question. Let&apos;s go back and build a stronger foundation.
                        </p>
                        <button 
                          onClick={() => window.location.href = `/arena?topic=${fallbackTopic.id}`}
                          className="self-start px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-amber-600 transition-colors"
                        >
                          Switch to {fallbackTopic.name}
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={handleNextQuestion}
                        className="self-end px-6 py-2.5 text-sm rounded-xl bg-[#1e293b] text-white font-bold hover:bg-black transition-colors shadow-sm flex items-center gap-2"
                      >
                        Next Question <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-[#e4e5e7] p-12 text-center">
                <XCircle size={40} className="text-red-400 mb-4" />
                <h3 className="text-lg font-bold text-foreground">Couldn&apos;t load a question</h3>
                <p className="text-[#8f939b] text-sm max-w-xs mt-2">
                  {error || 'Failed to load question.'}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: AI Tutor Panel */}
          <div className="flex-1 w-full flex flex-col gap-4">
            
            {/* Chat Interface */}
            <div className="flex-1 bg-white rounded-2xl border border-[#e4e5e7] shadow-sm flex flex-col overflow-hidden min-h-0">
              <div className="p-3 border-b border-[#e4e5e7] bg-[#fcfcfc]">
                <h3 className="font-heading text-sm font-bold text-foreground">Tutor Chat</h3>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[var(--color-primary)] text-white rounded-tr-sm' 
                        : 'bg-[#f4f5f7] text-foreground rounded-tl-sm border border-[#e4e5e7]'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] p-3 rounded-2xl text-[13px] leading-relaxed bg-[#f4f5f7] text-foreground rounded-tl-sm border border-[#e4e5e7] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#8f939b] rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-[#8f939b] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-[#8f939b] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-[#e4e5e7] bg-white">
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask for a hint..."
                    className="w-full bg-[#f4f5f7] border-none rounded-full py-2 pl-4 pr-10 text-[13px] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="absolute right-1.5 p-1 rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors"
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
