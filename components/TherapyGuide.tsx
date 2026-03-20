import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

interface QuizOption {
  id: string;
  label: string;
  sublabel?: string;
  next: string;
}

interface QuizQuestion {
  type: 'question';
  id: string;
  stepLabel: string;
  question: string;
  subtext?: string;
  options: QuizOption[];
}

interface TherapyResult {
  type: 'result';
  id: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  suits: string[];
  whatToExpect: string[];
  icon: string;
  gradientFrom: string;
  gradientTo: string;
}

type QuizNode = QuizQuestion | TherapyResult;

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ DATA — full decision tree
// ─────────────────────────────────────────────────────────────────────────────

const NODES: Record<string, QuizNode> = {
  // ── root ──────────────────────────────────────────────────────────────────
  start: {
    type: 'question', id: 'start',
    stepLabel: 'Getting Started',
    question: 'What best describes what you are looking for in therapy right now?',
    subtext: 'There are no right or wrong answers. Choose whatever feels most true.',
    options: [
      { id: 'a', label: 'Practical tools to manage things better day-to-day', sublabel: 'Short-term strategies I can apply right away', next: 'q_practical' },
      { id: 'b', label: 'Deeper exploration to resolve long-standing issues', sublabel: 'Understanding root causes and recurring patterns', next: 'q_deeper' },
      { id: 'c', label: 'Support for a specific concern or situation', sublabel: 'Couples, family, trauma, gender identity, etc.', next: 'q_specific' },
      { id: 'd', label: 'A therapy style that matches my personality', sublabel: 'How I naturally think and process emotions', next: 'q_personality' },
    ],
  },

  // ── practical branch ──────────────────────────────────────────────────────
  q_practical: {
    type: 'question', id: 'q_practical',
    stepLabel: 'Practical Tools',
    question: 'What are you mainly hoping to work through?',
    options: [
      { id: 'a', label: 'I feel stuck in a loop — the same thoughts or emotions keep coming back', next: 'q_stuck' },
      { id: 'b', label: 'I want to quickly learn and apply new strategies and techniques', next: 'q_strategies' },
    ],
  },

  q_stuck: {
    type: 'question', id: 'q_stuck',
    stepLabel: 'Understanding the Loop',
    question: 'What are you most stuck in?',
    subtext: 'Pick the one that feels most dominant right now.',
    options: [
      { id: 'a', label: 'Thoughts — my mind keeps spinning, overthinking, ruminating', next: 'q_thoughts' },
      { id: 'b', label: 'Emotions — my feelings are hard to manage or make sense of', next: 'q_emotions' },
    ],
  },

  q_thoughts: {
    type: 'question', id: 'q_thoughts',
    stepLabel: 'Your Thought Patterns',
    question: 'What would feel most helpful when it comes to those thoughts?',
    options: [
      { id: 'a', label: 'Accepting them without judgement and focusing on what truly matters to me', sublabel: 'Letting thoughts exist without letting them control me', next: 'r_act' },
      { id: 'b', label: 'Actively understanding and changing them', sublabel: 'Replacing unhelpful patterns with more balanced ones', next: 'r_cbt' },
    ],
  },

  q_emotions: {
    type: 'question', id: 'q_emotions',
    stepLabel: 'Emotional Intensity',
    question: 'How intense are these emotional experiences for you?',
    options: [
      { id: 'a', label: 'Persistent but manageable — they are there, but I can still get through my day', next: 'q_low_emotions' },
      { id: 'b', label: 'Overwhelming — they spike intensely and feel hard to control', next: 'r_dbt' },
    ],
  },

  q_low_emotions: {
    type: 'question', id: 'q_low_emotions',
    stepLabel: 'Working with Emotions',
    question: 'What kind of support feels most right for you?',
    options: [
      { id: 'a', label: 'Learning techniques to calm, ground, and regulate what I feel', next: 'r_mindfulness' },
      { id: 'b', label: 'Exploring and processing where these feelings come from', next: 'r_humanistic' },
    ],
  },

  q_strategies: {
    type: 'question', id: 'q_strategies',
    stepLabel: 'Focus Area',
    question: 'Are relationships a central part of what you want to work on?',
    options: [
      { id: 'a', label: 'Yes — how I connect with others is a big part of what I want to address', sublabel: 'Patterns of attachment, trust, or closeness', next: 'r_attachment' },
      { id: 'b', label: 'Not specifically — I want broader tools and practical strategies', next: 'r_cbt_sft' },
    ],
  },

  // ── deeper branch ─────────────────────────────────────────────────────────
  q_deeper: {
    type: 'question', id: 'q_deeper',
    stepLabel: 'Deeper Exploration',
    question: 'What draws you to longer-term, deeper work?',
    options: [
      { id: 'a', label: 'I want to understand how my past shapes who I am today', sublabel: 'Early experiences, patterns, and unconscious influences', next: 'r_psychodynamic' },
      { id: 'b', label: 'I want to grow into the best, most authentic version of myself', sublabel: 'Self-discovery, meaning, and personal fulfilment', next: 'r_person_centered' },
    ],
  },

  // ── specific concern branch ───────────────────────────────────────────────
  q_specific: {
    type: 'question', id: 'q_specific',
    stepLabel: 'Your Situation',
    question: 'What type of support are you looking for?',
    options: [
      { id: 'a', label: 'Support for me and my partner', next: 'r_couples' },
      { id: 'b', label: 'Individual support — just for myself', next: 'q_individual' },
      { id: 'c', label: 'Support that involves my whole family', next: 'r_family' },
    ],
  },

  q_individual: {
    type: 'question', id: 'q_individual',
    stepLabel: 'Individual Support',
    question: 'Is your concern particularly related to:',
    subtext: 'Choose the most relevant one. If nothing fits exactly, select the last option.',
    options: [
      { id: 'a', label: 'Gender identity, sexual orientation, or LGBTQ+ experiences', next: 'r_queer' },
      { id: 'b', label: 'Past trauma or traumatic experiences', next: 'r_trauma' },
      { id: 'c', label: 'Something else — or I am not sure yet', next: 'r_individual' },
    ],
  },

  // ── personality branch ────────────────────────────────────────────────────
  q_personality: {
    type: 'question', id: 'q_personality',
    stepLabel: 'Your Style',
    question: 'Which of these describes how you typically process challenges?',
    options: [
      { id: 'a', label: 'Analytical and action-oriented', sublabel: 'I like goals, structure, and solving problems logically', next: 'r_cbt_sft' },
      { id: 'b', label: 'A chronic overthinker, stuck in mental loops', sublabel: 'My mind never really switches off', next: 'r_act' },
      { id: 'c', label: 'Deeply reflective and emotionally driven', sublabel: 'I process things inwardly and feel them deeply', next: 'r_psychodynamic' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // RESULTS
  // ─────────────────────────────────────────────────────────────────────────

  r_act: {
    type: 'result', id: 'r_act',
    name: 'Acceptance & Commitment Therapy',
    badge: 'ACT',
    tagline: 'Stop fighting your mind. Start living your values.',
    description: 'ACT helps you change your relationship with difficult thoughts rather than fighting them. Instead of trying to eliminate your inner critic or suppress anxious feelings, you learn to notice them, accept them for what they are, and still take meaningful steps forward. The focus is on building a life in line with what matters most to you — even with noise in your head.',
    suits: ['People caught in battles with their own thoughts', 'Those who want mindfulness tools without spiritual associations', 'Anyone who values living intentionally despite inner noise'],
    whatToExpect: ['Learning to "defuse" from unhelpful thoughts — seeing them as just thoughts', 'Clarifying your core values and making committed action plans', 'Mindfulness exercises woven directly into sessions', 'A compassionate, non-judgmental pace throughout'],
    icon: '🧭',
    gradientFrom: '#ecfdf5',
    gradientTo: '#f0fdf4',
  },

  r_cbt: {
    type: 'result', id: 'r_cbt',
    name: 'Cognitive Behavioural Therapy',
    badge: 'CBT',
    tagline: 'Change the patterns that hold you back.',
    description: 'CBT is one of the most extensively researched therapies in the world. It works on the connection between your thoughts, feelings, and behaviours — helping you identify distorted thinking patterns and replace them with more balanced, helpful ones. It is practical, structured, and typically time-limited.',
    suits: ['Those who prefer a structured, goal-oriented approach', 'People dealing with anxiety, depression, stress, or phobias', 'Anyone who wants evidence-based, measurable progress'],
    whatToExpect: ['Thought records — tracking and questioning unhelpful beliefs', 'Behavioural experiments to test your assumptions in real life', 'Practical homework between sessions to practise new skills', 'Clear milestones and visible, measurable progress over time'],
    icon: '🔄',
    gradientFrom: '#eff6ff',
    gradientTo: '#eef2ff',
  },

  r_dbt: {
    type: 'result', id: 'r_dbt',
    name: 'Dialectical Behaviour Therapy',
    badge: 'DBT',
    tagline: 'Build the skills to ride the wave of intense emotions.',
    description: 'DBT was developed specifically for people who experience emotions with great intensity. It teaches four core skill sets — mindfulness, distress tolerance, emotional regulation, and interpersonal effectiveness — to help you find balance and create a life worth living even when emotions feel overwhelming.',
    suits: ['Those whose emotions spike intensely and rapidly', 'People who struggle with impulsive behaviours or self-harm urges', 'Anyone whose emotional reactivity affects their relationships'],
    whatToExpect: ['Concrete, practical coping skills you can use immediately', 'Individual therapy sessions alongside a DBT skills group', 'Between-session support for applying skills in real situations', 'A validating, non-judgmental therapeutic relationship'],
    icon: '🌊',
    gradientFrom: '#f5f3ff',
    gradientTo: '#faf5ff',
  },

  r_mindfulness: {
    type: 'result', id: 'r_mindfulness',
    name: 'Mindfulness-Based Therapy',
    badge: 'Mindfulness',
    tagline: 'Find stillness in the chaos.',
    description: 'Mindfulness-based approaches teach you to observe your thoughts and feelings from a place of calm curiosity rather than being swept away by them. By developing present-moment awareness, you build a more grounded, stable relationship with your inner experience — and interrupt automatic cycles of anxiety or low mood.',
    suits: ['Those seeking emotional regulation without over-analysing', 'People experiencing chronic stress, anxiety, or recurring depression', 'Anyone drawn to meditation or body-based practices'],
    whatToExpect: ['Guided mindfulness and meditation practices each session', 'Body scans, breathing exercises, and grounding techniques', 'Daily practice between sessions to build the skill over time', 'A focus on awareness and presence rather than analysis'],
    icon: '🌿',
    gradientFrom: '#f0fdf4',
    gradientTo: '#f7fee7',
  },

  r_humanistic: {
    type: 'result', id: 'r_humanistic',
    name: 'Humanistic Therapy',
    badge: 'Humanistic',
    tagline: 'Be seen, heard, and understood — fully.',
    description: 'Humanistic therapy is built on the belief that you are inherently capable of growth and self-healing when given the right conditions. Your therapist creates a warm, non-judgmental space where you lead the way — exploring your authentic feelings and experiences at your own pace, without a rigid agenda.',
    suits: ['Those who feel unheard, unseen, or misunderstood', 'People processing grief, transitions, or identity questions', 'Anyone who wants empathetic, open-ended support without structure'],
    whatToExpect: ['Genuine, warm, empathic listening — you set the agenda', 'Your therapist reflecting your feelings back with deep understanding', 'Unconditional positive regard throughout every session', 'A slower, more exploratory pace than structured therapies'],
    icon: '🌻',
    gradientFrom: '#fefce8',
    gradientTo: '#fffbeb',
  },

  r_psychodynamic: {
    type: 'result', id: 'r_psychodynamic',
    name: 'Psychodynamic Therapy',
    badge: 'Psychodynamic',
    tagline: 'Understand where you have come from to change where you are going.',
    description: 'Psychodynamic therapy explores how unconscious patterns, early relationships, and formative experiences continue to shape your thoughts, feelings, and behaviours today. By bringing these patterns into awareness — in the safety of a therapeutic relationship — you gain insight and the freedom to do things differently.',
    suits: ['Those drawn to deep self-understanding over quick fixes', 'People experiencing recurring relational or emotional patterns', 'Anyone who senses something from the past is still at play'],
    whatToExpect: ['Open-ended, reflective conversations with no fixed agenda', 'Exploration of childhood, early relationships, and recurring themes', 'Looking at how past dynamics show up in current relationships', 'Often a longer-term commitment to allow real depth to develop'],
    icon: '🔍',
    gradientFrom: '#f8fafc',
    gradientTo: '#f1f5f9',
  },

  r_person_centered: {
    type: 'result', id: 'r_person_centered',
    name: 'Person-Centred Therapy',
    badge: 'Person-Centred',
    tagline: 'Grow into the fullest version of yourself.',
    description: 'Person-centred therapy trusts in your innate capacity for growth and self-direction. The therapeutic relationship itself is the healing force — your therapist offers unconditional positive regard, deep empathy, and genuine presence. Together these conditions allow your natural growth tendency to unfold at its own pace.',
    suits: ['Those navigating major life transitions or identity questions', 'People seeking greater authenticity and self-awareness', 'Anyone who feels unfulfilled or disconnected from who they really are'],
    whatToExpect: ['A deeply collaborative, non-prescriptive exploration', 'Your therapist following your lead, never directing it', 'Conversations about values, meaning, and what a fulfilling life looks like', 'Gradual, organic growth rather than structured exercises or homework'],
    icon: '🌱',
    gradientFrom: '#f0fdfa',
    gradientTo: '#ecfeff',
  },

  r_attachment: {
    type: 'result', id: 'r_attachment',
    name: 'Attachment-Focused Therapy',
    badge: 'Attachment-Based',
    tagline: 'Heal your relationship with yourself and with others.',
    description: 'Attachment-focused therapy explores how your earliest bonds — with parents, caregivers, and siblings — created relational patterns that still play out in your relationships today. By understanding your attachment style and its origins, you can consciously shift towards more secure, fulfilling connections.',
    suits: ['Those struggling with trust, intimacy, or dependency in relationships', 'People who experience anxiety or avoidance in close bonds', 'Anyone who traces current relational difficulties back to early family experiences'],
    whatToExpect: ['Exploration of your early attachment history in a safe space', 'Understanding your attachment style — anxious, avoidant, or disorganised', 'Using the therapeutic relationship itself as a "secure base"', 'Developing new, more secure ways of relating to others over time'],
    icon: '🤝',
    gradientFrom: '#fff1f2',
    gradientTo: '#fdf2f8',
  },

  r_cbt_sft: {
    type: 'result', id: 'r_cbt_sft',
    name: 'CBT & Solution-Focused Therapy',
    badge: 'CBT + SFT',
    tagline: 'Focus on what works and build on it.',
    description: 'This combination is ideal if you want practical, efficient results without spending much time on problems. Solution-Focused Therapy (SFT) zooms in on your existing strengths and what is already working — then amplifies it. Paired with the cognitive tools of CBT, you get a powerful, action-oriented toolkit grounded in getting results.',
    suits: ['Action-oriented, goal-driven individuals', 'Those who want fast, tangible outcomes from a short course of therapy', 'People who are analytical and prefer structure over open-ended exploration'],
    whatToExpect: ['Setting clear, concrete goals from the very first session', 'Identifying and amplifying your existing strengths and coping strategies', 'Cognitive tools to shift unhelpful thinking patterns', 'Short-term, focused work typically within 8–16 sessions'],
    icon: '🎯',
    gradientFrom: '#fff7ed',
    gradientTo: '#fffbeb',
  },

  r_couples: {
    type: 'result', id: 'r_couples',
    name: 'Couples Therapy',
    badge: 'Couples',
    tagline: 'Navigate conflict and deepen connection.',
    description: 'Couples therapy provides a structured, safe space for partners to improve communication, resolve recurring conflicts, and rebuild intimacy. Whether you are navigating a specific crisis or simply want to strengthen what you already have, a skilled couples therapist acts as a neutral guide so both partners feel heard.',
    suits: ['Partners experiencing frequent conflict or communication breakdowns', 'Couples navigating major life transitions together', 'Those wanting to prevent small problems from becoming larger ones'],
    whatToExpect: ['Joint sessions with practical tools for communication', 'Identifying negative cycles and learning to break them together', 'Exercises to strengthen emotional and physical intimacy', 'A space where both voices are equally valued and heard'],
    icon: '💫',
    gradientFrom: '#fff1f2',
    gradientTo: '#fdf2f8',
  },

  r_family: {
    type: 'result', id: 'r_family',
    name: 'Family Therapy',
    badge: 'Family',
    tagline: 'Strengthen the system. Support every member.',
    description: 'Family therapy views difficulties in the context of the whole family system — rather than locating the problem in any one person. By improving communication, understanding, and dynamics between family members, therapy helps the entire family function more healthily and support each other more effectively.',
    suits: ['Families experiencing significant conflict or breakdown in communication', 'Those supporting a family member through mental health challenges', 'Families navigating major changes, losses, or life transitions together'],
    whatToExpect: ['Sessions involving multiple family members together', 'Identifying patterns in how the family communicates and relates', 'Developing shared understanding and new ways of interacting', 'A systemic, non-blaming approach that sees the family as a team'],
    icon: '🏡',
    gradientFrom: '#fff7ed',
    gradientTo: '#fffbeb',
  },

  r_queer: {
    type: 'result', id: 'r_queer',
    name: 'Queer-Affirmative Therapy',
    badge: 'Queer-Affirmative',
    tagline: 'Be supported by someone who truly understands.',
    description: 'Queer-affirmative therapy is provided by practitioners who are specifically trained and deeply committed to supporting LGBTQ+ individuals. Your identity is affirmed and celebrated — never treated as a problem to solve. Sessions offer space to explore identity, process family dynamics, navigate discrimination, and build self-acceptance.',
    suits: ['LGBTQ+ individuals seeking a safe, affirming therapeutic space', 'Those navigating coming out, identity exploration, or gender transition', 'People processing family rejection, discrimination, or internalised shame'],
    whatToExpect: ['A therapist who uses affirming language and never pathologises identity', 'Exploration of identity and its intersections without judgement', 'Space to process both external pressures and your inner experience', 'A relationship built on genuine allyship, competence, and understanding'],
    icon: '🌈',
    gradientFrom: '#f5f3ff',
    gradientTo: '#faf5ff',
  },

  r_trauma: {
    type: 'result', id: 'r_trauma',
    name: 'Trauma-Focused Therapy',
    badge: 'Trauma-Focused',
    tagline: 'Process the past. Reclaim your present.',
    description: 'Trauma-focused therapies — including EMDR, Trauma-Focused CBT, and somatic approaches — are designed to help you safely process traumatic memories and their lasting effects. The goal is not to relive the past, but to reprocess it so it no longer controls your present or hijacks your daily life.',
    suits: ['Survivors of abuse, accidents, loss, or other traumatic events', 'Those experiencing flashbacks, nightmares, or persistent hypervigilance', 'People whose past trauma is affecting current relationships or daily functioning'],
    whatToExpect: ['An initial phase focused entirely on building safety and stabilisation', 'Gradual, carefully paced processing of traumatic memories', 'Evidence-based techniques such as EMDR, grounding, and somatic methods', 'A trauma-specialist who will never rush or retraumatise you'],
    icon: '🌄',
    gradientFrom: '#f0f9ff',
    gradientTo: '#eff6ff',
  },

  r_individual: {
    type: 'result', id: 'r_individual',
    name: 'Individual Therapy',
    badge: 'Individual',
    tagline: 'A space that is entirely yours.',
    description: 'Individual therapy offers a private, confidential space to explore whatever brings you here — whether that is specific symptoms, life challenges, relationship difficulties, or simply a desire to know yourself better. Your therapist will work collaboratively with you to find the approach that fits you best.',
    suits: ['Anyone seeking personal support, clarity, or growth', 'Those who are unsure exactly where to start', 'People who want a tailored, flexible therapeutic relationship'],
    whatToExpect: ['An initial assessment to understand your history and goals', 'Collaborative goal-setting at a pace that suits you', 'An approach that adapts to what you need, session by session', 'Full confidentiality and unconditional support throughout'],
    icon: '💬',
    gradientFrom: '#fafaf9',
    gradientTo: '#f5f5f4',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SEO FAQ DATA — injected as JSON-LD
// ─────────────────────────────────────────────────────────────────────────────

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Which therapy is right for me?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The right therapy depends on your goals, personality, and the nature of your concerns. CBT is ideal for structured, goal-driven individuals dealing with anxiety or depression. ACT suits those who overthink or get stuck in mental loops. DBT helps with intense emotions. Psychodynamic therapy is best for long-term self-exploration and understanding recurring patterns. There is no single right answer — the best fit is the one that aligns with how you think, what you need, and what you are ready to explore.',
      },
    },
    {
      '@type': 'Question',
      name: 'How to choose the right therapy for me?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The best way is to reflect on three things: your goal (short-term practical tools vs. deeper long-term exploration), your personality (structured and analytical, or reflective and emotional), and any specific concern you are bringing — such as trauma, relationship difficulties, or identity. Use our free interactive therapy matching guide on this page, which walks you through exactly these questions and points you to the approach most likely to work for you.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is CBT and ACT?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'CBT (Cognitive Behavioural Therapy) is a structured, evidence-based approach that helps you identify and change unhelpful thought patterns and behaviours. It is goal-oriented, typically short-term, and highly effective for anxiety, depression, and stress. ACT (Acceptance and Commitment Therapy) is an evolution of CBT that takes a different angle — instead of changing thoughts, it teaches you to accept difficult thoughts without letting them control you, and commit to actions aligned with your core values. Both are evidence-based; CBT focuses on restructuring thoughts while ACT focuses on changing your relationship with them.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between DBT and Psychodynamic therapy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'DBT (Dialectical Behaviour Therapy) is a practical, skills-based approach designed for people who experience emotions very intensely. It teaches concrete tools — mindfulness, distress tolerance, emotional regulation, and interpersonal effectiveness — and is typically structured and short-to-medium term. Psychodynamic therapy, by contrast, is open-ended and exploratory. It focuses on how unconscious patterns, early relationships, and past experiences shape your current thoughts and behaviour. DBT gives you skills to cope now; psychodynamic therapy gives you insight into why certain patterns keep repeating.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between CBT and SFT therapy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'CBT (Cognitive Behavioural Therapy) focuses on identifying and changing unhelpful thought patterns and behaviours — it looks at what is going wrong and works to correct it. SFT (Solution-Focused Therapy) takes the opposite angle: rather than examining problems, it focuses on your existing strengths, past successes, and what is already working — then builds on those. CBT is better suited for people who want to understand and shift deep-seated patterns; SFT is ideal for those who want fast, actionable results without spending much time analysing the problem.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is ACT therapy different from Mindfulness therapy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ACT (Acceptance and Commitment Therapy) incorporates mindfulness as one of its core tools, but extends beyond it. Mindfulness-based therapy focuses primarily on cultivating present-moment awareness and breaking automatic cycles of stress or low mood through meditation and body-based practices. ACT adds two further elements: psychological flexibility (learning to accept difficult thoughts and feelings without being controlled by them) and values-based committed action (using clarity about what matters to you to guide behaviour change). Mindfulness therapy teaches you to be present; ACT teaches you to be present and then act intentionally.',
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const trackEvent = (name: string, params?: Record<string, string>) => {
  try {
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', name, params);
    }
  } catch (_) {}
};

export const TherapyGuide: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'intro' | 'quiz'>('intro');
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  const [history, setHistory] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [expandedFAQs, setExpandedFAQs] = useState<Set<number>>(new Set());

  const currentNode = NODES[currentNodeId];

  // ── Auth state ────────────────────────────────────────────────────────────
  useEffect(() => {
    import('../services/firebase').then(({ auth }) => {
      const unsub = auth.onAuthStateChanged((user: unknown) => setIsLoggedIn(!!user));
      return () => unsub();
    });
  }, []);

  const toggleFAQ = useCallback((index: number) => {
    setExpandedFAQs(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }, []);

  const FAQS: { question: string; answer: React.ReactNode }[] = [
    {
      question: 'Which therapy is right for me?',
      answer: (
        <>
          It depends on your goals, personality, and what you are bringing to therapy. CBT works well for anxiety and depression. ACT suits chronic overthinkers. DBT is built for intense emotions. Psychodynamic therapy is for those who want to understand deep-rooted patterns. No single approach fits everyone; the right one is the one that matches how you think and what you need.{' '}
          <button
            onClick={() => { trackEvent('therapy_guide_started', { source: 'faq_1' }); setPhase('quiz'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 transition-colors"
            style={{ color: 'var(--color-primary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-primary)')}
          >
            Try our free therapy matching guide →
          </button>
        </>
      ),
    },
    {
      question: 'How to choose the right therapy for me?',
      answer: (
        <>
          Ask yourself three things: What is my goal (practical tools now, or deeper exploration over time)? How do I process things (structured and logical, or reflective and emotional)? Do I have a specific concern like trauma, relationships, or identity? Your answers point clearly to an approach.{' '}
          <button
            onClick={() => { trackEvent('therapy_guide_started', { source: 'faq_2' }); setPhase('quiz'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 transition-colors"
            style={{ color: 'var(--color-primary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-primary)')}
          >
            Try our free therapy matching guide →
          </button>
        </>
      ),
    },
    {
      question: 'What is CBT and ACT?',
      answer: 'CBT (Cognitive Behavioural Therapy) helps you identify and change unhelpful thought patterns. It is structured, goal-oriented, and typically short-term. ACT (Acceptance and Commitment Therapy) takes a different approach: rather than changing thoughts, it teaches you to accept them without letting them drive your behaviour, and to act in line with your values instead. CBT restructures thinking; ACT changes your relationship with it.',
    },
    {
      question: 'What is the difference between DBT and Psychodynamic therapy?',
      answer: 'DBT (Dialectical Behaviour Therapy) is skills-focused and practical. It teaches four concrete tools: mindfulness, distress tolerance, emotional regulation, and interpersonal effectiveness. It is structured and works well for intense, fast-moving emotions. Psychodynamic therapy is the opposite: open-ended and exploratory, it looks at how unconscious patterns and past relationships shape the present. DBT gives you tools to cope now; psychodynamic therapy helps you understand why the same patterns keep repeating.',
    },
    {
      question: 'What is the difference between CBT and SFT therapy?',
      answer: 'CBT examines what is going wrong and works to change it, targeting unhelpful thoughts and behaviours directly. SFT (Solution-Focused Therapy) ignores the problem and instead asks: what is already working? It builds on your existing strengths and past successes. CBT suits people who want to understand and shift ingrained patterns; SFT suits those who want fast, targeted results without deep analysis.',
    },
    {
      question: 'How is ACT therapy different from Mindfulness therapy?',
      answer: 'Mindfulness-based therapy teaches present-moment awareness through meditation and body-based practices to interrupt stress or low mood cycles. ACT uses mindfulness as a foundation but goes further: it adds psychological flexibility (accepting difficult thoughts without being controlled by them) and values-based action (using clarity on what matters to drive real behaviour change). Mindfulness teaches you to be present; ACT teaches you to be present and then move forward with intention.',
    },
  ];

  // ── SEO ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Which Therapy Is Right for Me? Free Guide | TheMindNetwork';

    const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content') ?? '';
    metaDesc?.setAttribute(
      'content',
      'Not sure what therapy to choose? Use our free interactive guide to discover which therapy is right for you — CBT, ACT, DBT, Psychodynamic, Person-Centred and more. TheMindNetwork India.',
    );

    // Inject FAQ JSON-LD schema
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'therapy-guide-faq-schema';
    script.text = JSON.stringify(FAQ_SCHEMA);
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      metaDesc?.setAttribute('content', prevDesc);
      document.getElementById('therapy-guide-faq-schema')?.remove();
    };
  }, []);

  // ── IP Protection ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      // Block print
      if (ctrl && e.key === 'p') { e.preventDefault(); e.stopPropagation(); }
      // Block save
      if (ctrl && e.key === 's') { e.preventDefault(); e.stopPropagation(); }
      // Block view-source
      if (ctrl && e.key === 'u') { e.preventDefault(); e.stopPropagation(); }
      // Block DevTools (Ctrl+Shift+I / F12)
      if (ctrl && e.shiftKey && e.key === 'I') { e.preventDefault(); e.stopPropagation(); }
      if (e.key === 'F12') { e.preventDefault(); e.stopPropagation(); }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  // ── Quiz navigation ───────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (option: QuizOption) => {
      if (isTransitioning) return;
      setSelectedOption(option.id);
      setIsTransitioning(true);
      setTimeout(() => {
        setHistory(prev => [...prev, currentNodeId]);
        setCurrentNodeId(option.next);
        setSelectedOption(null);
        setIsTransitioning(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 280);
    },
    [isTransitioning, currentNodeId],
  );

  const handleBack = useCallback(() => {
    if (history.length === 0) { setPhase('intro'); return; }
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setCurrentNodeId(prev);
    setSelectedOption(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [history]);

  const handleRestart = useCallback(() => {
    setCurrentNodeId('start');
    setHistory([]);
    setSelectedOption(null);
    setPhase('intro');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isResult = currentNode?.type === 'result';

  // ── GA4: fire completed event once when result is first reached ──────────
  const firedCompletionRef = React.useRef(false);
  useEffect(() => {
    if (isResult && !firedCompletionRef.current) {
      firedCompletionRef.current = true;
      trackEvent('therapy_guide_completed', { therapy_type: (currentNode as TherapyResult).badge });
    }
    if (!isResult) {
      firedCompletionRef.current = false;
    }
  }, [isResult, currentNode]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={{ background: '#FAF9F7', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
      onContextMenu={e => e.preventDefault()}
      draggable={false}
    >
      {/* ── Global IP-protection styles + print block ── */}
      <style>{`
        @media print { body { display: none !important; } }
        * { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
        img { -webkit-user-drag: none; user-drag: none; pointer-events: none; }
      `}</style>

      {/* ── Navbar (matches Landing) ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottomColor: 'var(--color-secondary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Logo + name */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
              <i className="fas fa-brain text-white text-xl"></i>
            </div>
            <span className="text-base sm:text-xl md:text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>TheMindNetwork</span>
          </button>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {phase === 'quiz' && (
              <button
                onClick={handleBack}
                className="hidden sm:flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{ color: 'var(--color-text-primary)', borderWidth: '1px', borderColor: 'var(--color-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back
              </button>
            )}
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/profile')}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base font-semibold shadow-md rounded-lg transition-all text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
              >
                <i className="fas fa-user-circle mr-2"></i>Profile
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base font-semibold shadow-md rounded-lg transition-all text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
              >
                <i className="fas fa-sign-in-alt mr-2"></i>Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Progress bar (quiz only) ── */}
      {phase === 'quiz' && !isResult && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24">
          <div className="flex gap-1.5">
            {[...Array(history.length + 1)].map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i < history.length ? 'bg-[#2E3A2F]' : 'bg-[#A3B18A]'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          INTRO / LANDING SCREEN
      ════════════════════════════════════════════════════════════════════ */}
      {phase === 'intro' && (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 animate-fade-in">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#A3B18A] bg-opacity-20 rounded-full px-4 py-1.5 text-[#2E3A2F] text-xs font-semibold tracking-widest uppercase mb-5">
              Free Interactive Guide
            </div>
            {/* H1 — primary SEO keyword */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#2E3A2F] leading-tight mb-4">
              Which Therapy Is<br />Right for Me?
            </h1>
            <p className="text-lg text-[#7A7A7A] max-w-xl mx-auto leading-relaxed mb-2">
              Not sure what therapy to choose? Answer a few short questions and we will point you toward the approach most likely to work for you.
            </p>
            <p className="text-sm text-[#A3B18A] font-medium">Takes about 2 minutes &nbsp;·&nbsp; No sign-up required</p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={() => { trackEvent('therapy_guide_started', { source: 'intro_cta' }); setPhase('quiz'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="inline-flex items-center gap-2 bg-[#2E3A2F] hover:bg-[#3d4d3e] text-white font-bold text-base px-8 py-4 rounded-xl transition-colors shadow-sm"
            >
              Find my therapy match
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M7 13L11 9L7 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <p className="mt-3 text-xs text-[#7A7A7A]">
              This guide is for informational purposes and does not replace professional diagnosis or treatment.
            </p>
          </div>

          {/* FAQ section — collapsible, matching Landing style */}
          <section className="mt-16 border-t border-[#D6CFC7] pt-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-center text-base sm:text-lg mb-10" style={{ color: 'var(--color-text-muted)' }}>
              Common questions about choosing and understanding different types of therapy.
            </p>

            <div className="space-y-4">
              {FAQS.map((faq, index) => (
                <div key={index} className="rounded-2xl shadow-md overflow-hidden" style={{ backgroundColor: 'white' }}>
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                    style={{ backgroundColor: expandedFAQs.has(index) ? 'rgba(163, 177, 138, 0.05)' : 'white' }}
                  >
                    <h3 className="text-base sm:text-lg font-bold pr-4" style={{ color: 'var(--color-text-primary)' }}>
                      {faq.question}
                    </h3>
                    <i
                      className="fas fa-chevron-down transition-transform duration-300 flex-shrink-0"
                      style={{ color: 'var(--color-accent)', transform: expandedFAQs.has(index) ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    ></i>
                  </button>
                  {expandedFAQs.has(index) && (
                    <div className="px-4 pb-4 sm:px-6 sm:pb-6 border-t" style={{ borderTopColor: 'rgba(163, 177, 138, 0.2)' }}>
                      <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.7' }}>
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          QUIZ SCREEN
      ════════════════════════════════════════════════════════════════════ */}
      {phase === 'quiz' && (
        <main
          className={`max-w-3xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-12 transition-opacity duration-300 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {currentNode.type === 'question' ? (
            /* ── Question ── */
            <div className="animate-fade-in">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#A3B18A] mb-3">
                {currentNode.stepLabel}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2E3A2F] leading-snug mb-3">
                {currentNode.question}
              </h1>
              {currentNode.subtext && (
                <p className="text-[#7A7A7A] text-base mb-8">{currentNode.subtext}</p>
              )}
              {!currentNode.subtext && <div className="mb-8" />}

              <div className="space-y-3">
                {currentNode.options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                      selectedOption === option.id
                        ? 'border-[#2E3A2F] bg-[#2E3A2F]'
                        : 'border-[#D6CFC7] bg-white hover:border-[#A3B18A] hover:bg-[#FAF9F7]'
                    }`}
                  >
                    <span
                      className={`font-medium text-base leading-snug block ${
                        selectedOption === option.id ? 'text-white' : 'text-[#2B2B2B]'
                      }`}
                    >
                      {option.label}
                    </span>
                    {option.sublabel && (
                      <span
                        className={`text-sm mt-1 block ${
                          selectedOption === option.id ? 'text-[#D6CFC7]' : 'text-[#7A7A7A]'
                        }`}
                      >
                        {option.sublabel}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Result ── */
            <div className="animate-fade-in">
              {/* Header */}
              <div className="text-center mb-8">
                <p className="text-xs font-semibold tracking-widest uppercase text-[#A3B18A] mb-4">
                  Your Therapy Match
                </p>
                <div
                  className="inline-flex items-center justify-center w-24 h-24 rounded-2xl text-5xl mb-5 border border-[#D6CFC7]"
                  style={{ background: `linear-gradient(135deg, ${(currentNode as TherapyResult).gradientFrom}, ${(currentNode as TherapyResult).gradientTo})` }}
                >
                  {(currentNode as TherapyResult).icon}
                </div>
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-[#2E3A2F] bg-opacity-10 rounded-full text-[#2E3A2F] text-sm font-bold">
                    {(currentNode as TherapyResult).badge}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#2E3A2F] mb-2">
                  {(currentNode as TherapyResult).name}
                </h1>
                <p className="text-lg text-[#7A7A7A] italic">
                  &ldquo;{(currentNode as TherapyResult).tagline}&rdquo;
                </p>
              </div>

              {/* Description */}
              <div
                className="border border-[#D6CFC7] rounded-2xl p-6 mb-5"
                style={{ background: `linear-gradient(135deg, ${(currentNode as TherapyResult).gradientFrom}, ${(currentNode as TherapyResult).gradientTo})` }}
              >
                <p className="text-[#2B2B2B] text-base leading-relaxed">
                  {(currentNode as TherapyResult).description}
                </p>
              </div>

              {/* Two-column info */}
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div className="bg-white border border-[#D6CFC7] rounded-2xl p-5">
                  <h3 className="font-bold text-[#2E3A2F] mb-3 flex items-center gap-2">
                    <span className="text-[#A3B18A]">✓</span> This may suit you if…
                  </h3>
                  <ul className="space-y-2">
                    {(currentNode as TherapyResult).suits.map((s, i) => (
                      <li key={i} className="text-sm text-[#2B2B2B] flex items-start gap-2">
                        <span className="text-[#A3B18A] mt-0.5 flex-shrink-0">·</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white border border-[#D6CFC7] rounded-2xl p-5">
                  <h3 className="font-bold text-[#2E3A2F] mb-3 flex items-center gap-2">
                    <span className="text-[#A3B18A]">→</span> What to expect
                  </h3>
                  <ul className="space-y-2">
                    {(currentNode as TherapyResult).whatToExpect.map((e, i) => (
                      <li key={i} className="text-sm text-[#2B2B2B] flex items-start gap-2">
                        <span className="text-[#A3B18A] mt-0.5 flex-shrink-0">·</span>
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTA card */}
              <div className="bg-[#2E3A2F] rounded-2xl p-6 sm:p-8 text-center mb-6">
                <h3 className="text-white font-bold text-xl mb-2">
                  Find a {(currentNode as TherapyResult).badge} therapist on TheMindNetwork
                </h3>
                <p className="text-[#A3B18A] text-sm mb-5">
                  We match you with verified therapists who specialise in the approach that is right for you.
                </p>
                <button
                  onClick={() => { trackEvent('therapy_guide_login_intent', { therapy_type: (currentNode as TherapyResult).badge }); navigate('/create'); }}
                  className="bg-[#A3B18A] hover:bg-[#8fa075] text-[#2E3A2F] font-bold px-8 py-3.5 rounded-xl transition-colors text-base"
                >
                  Build my profile &amp; get matched
                </button>
              </div>

              {/* Restart */}
              <div className="text-center">
                <button
                  onClick={handleRestart}
                  className="text-[#7A7A7A] hover:text-[#2E3A2F] text-sm transition-colors underline underline-offset-2"
                >
                  Start over with different answers
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ── Footer ── */}
      <footer className="max-w-3xl mx-auto px-4 sm:px-6 pb-10 pt-4 text-center">
        <p className="text-xs text-[#D6CFC7]">
          © {new Date().getFullYear()} TheMindNetwork · All rights reserved · Proprietary content · Unauthorised reproduction prohibited
        </p>
        <p className="text-xs text-[#D6CFC7] mt-1">
          This guide is informational and does not constitute a clinical diagnosis or treatment recommendation.
        </p>
      </footer>
    </div>
  );
};

export default TherapyGuide;
