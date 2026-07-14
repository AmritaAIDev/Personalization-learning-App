'use client';

import React, { useState } from 'react';
import { Target, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

interface QuestionProps {
  questionData: {
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  };
  onNext: () => void;
}

export default function QuestionCard({ questionData, onNext }: QuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedOption) setIsSubmitted(true);
  };

  const isCorrect = selectedOption === questionData.correct_answer;

  return (
    <div className="glass-card rounded-2xl p-8 w-full shadow-2xl relative overflow-hidden transition-all duration-500">
      
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
          <Target size={24} />
        </div>
        <h3 className="text-xl font-bold text-white tracking-wide">Competency Check</h3>
      </div>

      {/* The Question Text */}
      <p className="text-xl text-slate-200 mb-8 font-medium leading-relaxed">
        {questionData.question_text}
      </p>

      {/* Multiple Choice Options */}
      <div className="space-y-4 mb-8">
        {questionData.options.map((option, index) => {
          const isSelected = selectedOption === option;
          const showSuccess = isSubmitted && option === questionData.correct_answer;
          const showError = isSubmitted && isSelected && !isCorrect;

          return (
            <button
              key={index}
              onClick={() => !isSubmitted && setSelectedOption(option)}
              disabled={isSubmitted}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex justify-between items-center group
                ${!isSubmitted && !isSelected ? 'border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5' : ''}
                ${isSelected && !isSubmitted ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}
                ${showSuccess ? 'border-green-500 bg-green-500/10 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : ''}
                ${showError ? 'border-red-500 bg-red-500/10 text-red-300' : ''}
                ${isSubmitted && !showSuccess && !showError ? 'border-white/5 opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className="text-lg font-medium">{option}</span>
              
              {showSuccess && <CheckCircle2 className="text-green-500 animate-in zoom-in" />}
              {showError && <XCircle className="text-red-500 animate-in zoom-in" />}
            </button>
          );
        })}
      </div>

      {/* Submission & Explanation Area */}
      <div className="flex flex-col gap-4">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={`py-4 rounded-xl font-bold transition-all duration-300 
              ${selectedOption 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg transform hover:-translate-y-1' 
                : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
          >
            Submit Answer
          </button>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className={`p-6 rounded-xl mb-4 border ${isCorrect ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
              <h4 className={`text-lg font-bold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? 'Excellent Work!' : 'Not Quite...'}
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {questionData.explanation}
              </p>
            </div>
            
            <button
              onClick={onNext}
              className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group"
            >
              Next Question <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
