import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatMessage } from '../../types';
import { Button } from '../ui/Button';

interface StepChatbotIntakeProps {
  data: UserProfile;
  updateData: (section: keyof UserProfile, payload: any) => void;
  onComplete: () => void;
}

interface Question {
  key: string;
  text: string;
  buttons?: string[];
  slider?: boolean;
  // Evaluate visibility based on the latest responses snapshot
  condition?: (r: typeof responses) => boolean;
}

export const StepChatbotIntake: React.FC<StepChatbotIntakeProps> = ({ data, updateData, onComplete }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showButtons, setShowButtons] = useState<string[]>([]);
  const [showSlider, setShowSlider] = useState(false);
  const [sliderValue, setSliderValue] = useState(1000);
  const [responses, setResponses] = useState<any>({
    hasPriorTherapy: false,
    priorExperience: '',
    hasDiagnosis: false,
    diagnosisMedications: '',
    presentingProblem: '',
    mode: '',
    location: '',
    budget: '',
    riskFactors: []
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  const questions: Question[] = [
    {
      key: 'hasPriorTherapy',
      text: "Have you tried therapy before?",
      buttons: ['Yes', 'No']
    },
    {
      key: 'priorExperience',
      text: "How was your experience with therapy?",
      condition: (r) => r.hasPriorTherapy
    },
    {
      key: 'hasDiagnosis',
      text: "Do you have an existing diagnosis or medications prescribed?",
      buttons: ['Yes', 'No']
    },
    {
      key: 'diagnosisMedications',
      text: "Please share your diagnosis and medications.",
      condition: (r) => r.hasDiagnosis
    },
    {
      key: 'presentingProblem',
      text: "What issues are you currently facing that you'd like help with?"
    },
    {
      key: 'mode',
      text: "Are you looking for Online or In-person sessions, or are you open to both?",
      buttons: ['Online', 'In-person', 'Both']
    },
    {
      key: 'location',
      text: "Which city do you stay in?",
      condition: (r) => r.mode === 'offline'
    },
    {
      key: 'budget',
      text: "What is your budget per session? (Typically a session is 1 hour)",
      slider: true
    },
    {
      key: 'complete',
      text: "Thank you so much for sharing! We have everything we need. Your profile is ready to submit. Click the button below when you're ready!"
    }
  ];

  useEffect(() => {
    // Start with first question
    if (!initialized.current) {
      initialized.current = true;
      addBotMessage(questions[0].text);
      if (questions[0].buttons) {
        setShowButtons(questions[0].buttons);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Keep input focused for better UX
    if (!showSubmit) {
      inputRef.current?.focus();
    }
  }, [messages, showSubmit]);

  const addBotMessage = (text: string) => {
    const msg: ChatMessage = {
      id: Date.now().toString(),
      role: 'model',
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, msg]);
  };

  const addUserMessage = (text: string) => {
    const msg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleButtonClick = async (buttonText: string) => {
    addUserMessage(buttonText);
    setShowButtons([]);
    await processResponse(buttonText);
  };

  const handleSliderSubmit = async () => {
    const budgetText = `₹${sliderValue}`;
    addUserMessage(budgetText);
    setShowSlider(false);
    await processResponse(budgetText);
  };

  const processResponse = async (userText: string) => {
    setIsTyping(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Process response based on current question
    const q = questions[currentQuestion];
    console.log('Current question:', q.key, 'Question index:', currentQuestion);
    
    // Track updated values locally for immediate use
    let updatedResponses = { ...responses };
    
    // Update responses based on current question
    if (q.key === 'hasPriorTherapy') {
      updatedResponses.hasPriorTherapy = userText.toLowerCase() === 'yes';
    } else if (q.key === 'priorExperience') {
      updatedResponses.priorExperience = userText;
    } else if (q.key === 'hasDiagnosis') {
      updatedResponses.hasDiagnosis = userText.toLowerCase() === 'yes';
    } else if (q.key === 'diagnosisMedications') {
      updatedResponses.diagnosisMedications = userText;
    } else if (q.key === 'presentingProblem') {
      updatedResponses.presentingProblem = userText;
      // Save presenting problem immediately to profile
      updateData('clinical', {
        ...data.clinical,
        presentingProblem: userText
      });
    } else if (q.key === 'mode') {
      const text = userText.toLowerCase();
      if (text.includes('online')) {
        updatedResponses.mode = 'online';
      } else if (text.includes('in-person')) {
        updatedResponses.mode = 'offline';
      } else {
        updatedResponses.mode = 'both';
      }
    } else if (q.key === 'location') {
      updatedResponses.location = userText;
    } else if (q.key === 'budget') {
      updatedResponses.budget = userText;
      
      // Save all responses to profile when budget is answered (last data question)
      updateData('clinical', {
        presentingProblem: updatedResponses.presentingProblem,
        currentMood: '',
        hasPriorTherapy: updatedResponses.hasPriorTherapy,
        priorExperience: updatedResponses.priorExperience,
        medications: updatedResponses.diagnosisMedications,
        riskFactors: []
      });
      
      updateData('basicInfo', {
        ...data.basicInfo,
        location: updatedResponses.location || data.basicInfo.location
      });
      
      updateData('preferences', {
        providerGenderPreference: '',
        mode: updatedResponses.mode,
        budget: updatedResponses.budget
      });
    }
    
    // Update state with new responses
    setResponses(updatedResponses);

    // Find next question using the updated responses (not stale state)
    let nextQuestionIndex = currentQuestion + 1;
    
    // Skip conditional questions that shouldn't be shown
    while (nextQuestionIndex < questions.length) {
      const nextQ = questions[nextQuestionIndex];
      
      // Check if this question should be skipped based on updated responses
      if (nextQ.condition && !nextQ.condition(updatedResponses)) {
        nextQuestionIndex++;
        continue;
      }
      
      // This question is valid, stop searching
      break;
    }
    
    if (nextQuestionIndex < questions.length) {
      console.log('Moving to question:', nextQuestionIndex, questions[nextQuestionIndex].key);
      setCurrentQuestion(nextQuestionIndex);
      addBotMessage(questions[nextQuestionIndex].text);
      
      // Show buttons or slider if applicable
      if (questions[nextQuestionIndex].buttons) {
        setShowButtons(questions[nextQuestionIndex].buttons);
      } else if (questions[nextQuestionIndex].slider) {
        setShowSlider(true);
      }
      
      // Show submit button ONLY if we reached the complete message
      if (questions[nextQuestionIndex].key === 'complete') {
        console.log('Showing submit button NOW');
        setShowSubmit(true);
      }
    }
    
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    addUserMessage(userText);
    setInput('');
    await processResponse(userText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-3">Let's Chat About Your Needs</h2>
        <p className="text-lg text-slate-600">
          Welcome! I'll ask you a few simple questions to understand how we can best support you. This will only take a few minutes.
        </p>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-[500px] overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'text-white shadow-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
                style={msg.role === 'user' ? {
                  backgroundColor: 'var(--color-primary)'
                } : {}}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          
          {/* Button Options - Inside chat area */}
          {showButtons.length > 0 && !isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-2 flex-wrap max-w-[80%]">
                {showButtons.map((button) => (
                  <button
                    key={button}
                    onClick={() => handleButtonClick(button)}
                    className="px-5 py-2.5 bg-white rounded-xl transition-all text-sm font-medium shadow-sm hover:shadow-md border-2"
                    style={{
                      borderColor: 'var(--color-primary)',
                      color: 'var(--color-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }}
                  >
                    {button}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Budget Slider - Inside chat area */}
          {showSlider && !isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 space-y-3">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>₹{sliderValue}</p>
                  <p className="text-xs text-slate-500">per session</p>
                </div>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>₹100</span>
                  <span>₹5,000</span>
                </div>
                <button
                  onClick={handleSliderSubmit}
                  className="w-full py-2.5 text-white rounded-lg transition-all text-sm font-medium hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--color-primary)'
                  }}
                >
                  Continue <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-primary)', animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-primary)', animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Always show except when submitted */}
        {!showSubmit && (
          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled={isTyping}
                autoFocus
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="px-6"
              >
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>
          </div>
        )}

        {/* Complete Button */}
        {showSubmit && (
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <Button
              onClick={onComplete}
              className="w-full py-3 text-lg"
            >
              Submit Profile <i className="fas fa-check ml-2"></i>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
