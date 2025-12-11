import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatMessage } from '../../types';
import { Button } from '../ui/Button';

interface StepChatbotIntakeProps {
  data: UserProfile;
  updateData: (section: keyof UserProfile, payload: any) => void;
  onComplete: () => void;
}

export const StepChatbotIntake: React.FC<StepChatbotIntakeProps> = ({ data, updateData, onComplete }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);
  const [responses, setResponses] = useState<any>({
    presentingProblem: '',
    currentMood: '',
    hasPriorTherapy: false,
    priorExperience: '',
    medications: '',
    mode: '',
    location: '',
    budget: '',
    preferences: '',
    bio: '',
    riskFactors: []
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  const questions = [
    {
      key: 'confidentiality',
      text: `Hi ${data.basicInfo.fullName}! Before we begin, I want you to know that this conversation is completely confidential and safe. Everything you share here is private and will only be used to help match you with the right therapist. Shall we start?`
    },
    {
      key: 'presentingProblem',
      text: "What brings you to therapy today?"
    },
    {
      key: 'hasPriorTherapy',
      text: "Have you tried therapy before? Just type 'yes' or 'no'."
    },
    {
      key: 'priorExperience',
      text: "How was your experience with therapy?",
      condition: () => responses.hasPriorTherapy
    },
    {
      key: 'medications',
      text: "Do you have an existing diagnosis or medications prescribed? If not, just type 'none'."
    },
    {
      key: 'mode',
      text: "Are you looking for Online or In-person sessions, or are you open to both? Just type 'online', 'in-person', or 'both'."
    },
    {
      key: 'location',
      text: "Which city and area do you stay in?",
      condition: () => responses.mode !== 'online'
    },
    {
      key: 'budget',
      text: "What is your budget range per session? (Typically a session is 1 hour)"
    },
    {
      key: 'preferences',
      text: "Do you have any preferences for your therapist? (Gender, age, specialization, etc.) If none, just type 'none'."
    },
    {
      key: 'reachout',
      text: "Great, I have all the details now! Please wait for us to get in touch with you. We will reach out via email and the phone number you provided with therapists who would be best for you. One last thing before you go..."
    },
    {
      key: 'bio',
      text: "How would you describe yourself as a person?"
    },
    {
      key: 'complete',
      text: "Thank you so much for sharing! We have everything we need. Your profile is ready to submit. Click the button below when you're ready!"
    }
  ];

  useEffect(() => {
    // Start with greeting only once
    if (!initialized.current) {
      initialized.current = true;
      addBotMessage(questions[0].text);
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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    addUserMessage(userText);
    setInput('');
    setIsTyping(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Process response based on current question
    const q = questions[currentQuestion];
    console.log('Current question:', q.key, 'Question index:', currentQuestion);
    
    // Track updated values locally for immediate use
    let updatedResponses = { ...responses };
    
    // Update responses based on current question
    if (q.key === 'confidentiality') {
      // Just acknowledgment, no data to store
    } else if (q.key === 'presentingProblem') {
      updatedResponses.presentingProblem = userText;
    } else if (q.key === 'hasPriorTherapy') {
      // Flexible yes/no detection
      const text = userText.toLowerCase();
      const isYes = text.includes('yes') || text.includes('yeah') || text.includes('yep') || text.includes('yup') || text.match(/^y$/i);
      updatedResponses.hasPriorTherapy = isYes;
    } else if (q.key === 'priorExperience') {
      updatedResponses.priorExperience = userText;
    } else if (q.key === 'medications') {
      // Flexible none detection
      const text = userText.toLowerCase();
      const isNone = text === 'none' || text === 'no' || text === 'nope' || text === 'nothing' || text === 'n/a' || text === 'na';
      updatedResponses.medications = isNone ? '' : userText;
    } else if (q.key === 'mode') {
      // Flexible mode detection
      const text = userText.toLowerCase();
      let mode = 'both';
      if (text.includes('online') || text.includes('virtual') || text.includes('remote') || text.includes('video')) {
        mode = 'online';
      } else if (text.includes('in-person') || text.includes('offline') || text.includes('face to face') || text.includes('physical') || text.includes('in person')) {
        mode = 'offline';
      }
      updatedResponses.mode = mode;
    } else if (q.key === 'location') {
      updatedResponses.location = userText;
    } else if (q.key === 'budget') {
      updatedResponses.budget = userText;
    } else if (q.key === 'preferences') {
      // Flexible none detection
      const text = userText.toLowerCase();
      const isNone = text === 'none' || text === 'no' || text === 'nope' || text === 'nothing' || text === 'n/a' || text === 'na' || text.includes('no preference');
      updatedResponses.preferences = isNone ? '' : userText;
    } else if (q.key === 'reachout') {
      // Just acknowledgment, no data to store
    } else if (q.key === 'bio') {
      updatedResponses.bio = userText;
      
      // Save all responses to profile
      updateData('clinical', {
        presentingProblem: updatedResponses.presentingProblem,
        currentMood: updatedResponses.preferences || '',
        hasPriorTherapy: updatedResponses.hasPriorTherapy,
        priorExperience: updatedResponses.priorExperience,
        medications: updatedResponses.medications,
        riskFactors: []
      });
      
      updateData('basicInfo', {
        ...data.basicInfo,
        location: updatedResponses.location || data.basicInfo.location
      });
      
      // Store additional data in preferences
      updateData('preferences', {
        providerGenderPreference: updatedResponses.preferences || '',
        mode: updatedResponses.mode,
        budget: updatedResponses.budget,
        bio: userText
      });
    }
    
    // Update state with new responses
    setResponses(updatedResponses);

    // Find next question using the updated responses
    let nextQuestionIndex = currentQuestion + 1;
    
    // Skip conditional questions that shouldn't be shown
    while (nextQuestionIndex < questions.length) {
      const nextQ = questions[nextQuestionIndex];
      
      // Check if this question should be skipped based on updated responses
      if (nextQ.key === 'priorExperience' && !updatedResponses.hasPriorTherapy) {
        nextQuestionIndex++;
        continue;
      }
      if (nextQ.key === 'location' && updatedResponses.mode === 'online') {
        nextQuestionIndex++;
        continue;
      }
      
      // This question is valid, stop searching
      break;
    }
    
    if (nextQuestionIndex < questions.length) {
      console.log('Moving to question:', nextQuestionIndex, questions[nextQuestionIndex].key);
      console.log('showSubmit status:', showSubmit);
      setCurrentQuestion(nextQuestionIndex);
      addBotMessage(questions[nextQuestionIndex].text);
      
      // Show submit button ONLY if we reached the complete message (last question)
      if (questions[nextQuestionIndex].key === 'complete') {
        console.log('Showing submit button NOW');
        setShowSubmit(true);
      }
    } else {
      console.log('ERROR: nextQuestionIndex out of bounds:', nextQuestionIndex);
    }
    
    setIsTyping(false);
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
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Let's Chat About Your Needs</h2>
        <p className="text-slate-600">
          I'll ask you a few questions to understand how we can best support you.
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
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
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
