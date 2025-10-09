import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  Brain, Users, Mail, Search, Zap, Shield, Download, ChevronDown, Play, MessageSquare, 
  Clock, Star, Eye, Mic, Camera, Globe, Lock, Award, CheckCircle, ArrowRight,
  Layers, Target, TrendingUp, BarChart3, Lightbulb, Headphones, Monitor,
  FileText, Settings, Crown, Building, Sparkles, Infinity, Calendar
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

function App() {
  const [activeFeature, setActiveFeature] = useState('collaborative-ai')
  const [activeTier, setActiveTier] = useState('pro')
  const [isListening, setIsListening] = useState(false)
  const [currentInsight, setCurrentInsight] = useState('')
  const [showDemo, setShowDemo] = useState(false)

  const coreFeatures = [
    {
      id: 'collaborative-ai',
      title: 'Triple-AI Collaboration',
      icon: Brain,
      description: 'GPT-5, Claude Sonnet 4.5 & Gemini Flash 2.5 working together',
      color: 'from-slate-600 to-blue-700',
      details: 'Revolutionary AI collaboration where three specialized models provide complementary insights'
    },
    {
      id: 'predictive-outcomes',
      title: 'Predictive Meeting Outcomes',
      icon: TrendingUp,
      description: 'AI-powered prediction of meeting outcomes and decision points',
      color: 'from-purple-600 to-pink-600',
      details: 'Advanced algorithms analyze conversation patterns to forecast likely outcomes and strategic opportunities'
    },
    {
      id: 'multi-language',
      title: 'Multi-Language Support',
      icon: Globe,
      description: 'Real-time translation and support for 95+ languages',
      color: 'from-green-600 to-blue-600',
      details: 'Comprehensive internationalization with real-time translation and localized AI processing'
    },
    {
      id: 'enhanced-security',
      title: 'Enhanced Security',
      icon: Shield,
      description: 'Enterprise-grade security with AES-256-GCM encryption',
      color: 'from-red-600 to-orange-600',
      details: 'Military-grade encryption, comprehensive audit logging, and granular security controls'
    },
    {
      id: 'invisible-overlay',
      title: 'Invisible Assistant',
      icon: Eye,
      description: 'Transparent overlay that works on top of any application',
      color: 'from-blue-700 to-teal-600',
      details: 'Seamless integration that enhances your workflow without disruption'
    },
    {
      id: 'multi-vision',
      title: 'Multi-Vision Analysis',
      icon: Camera,
      description: 'Google Vision + OpenAI Vision for comprehensive screen understanding',
      color: 'from-teal-600 to-slate-600',
      details: 'Advanced computer vision that understands presentations, documents, and visual content'
    },
    {
      id: 'real-time-processing',
      title: 'Real-Time Intelligence',
      icon: Zap,
      description: 'Instant insights and response suggestions during conversations',
      color: 'from-slate-600 to-blue-700',
      details: 'Lightning-fast analysis that keeps pace with dynamic business conversations'
    }
  ]

  const advancedFeatures = [
    {
      title: 'Strategic Business Intelligence',
      icon: Target,
      description: 'Executive-level insights for high-stakes meetings and negotiations'
    },
    {
      title: 'Audio Processing & Transcription',
      icon: Headphones,
      description: 'Professional-grade audio capture with real-time speech-to-text'
    },
    {
      title: 'Screen Capture & OCR',
      icon: Monitor,
      description: 'Intelligent screen analysis with 99% text extraction accuracy'
    },
    {
      title: 'Platform Integrations',
      icon: Globe,
      description: 'Native support for Zoom, Teams, Webex, and other platforms'
    },
    {
      title: 'Knowledge Management',
      icon: FileText,
      description: 'Comprehensive meeting history and intelligent knowledge search'
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      description: 'Enterprise-grade security with local processing options'
    }
  ]

  const pricingTiers = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Perfect for individuals getting started with AI assistance',
      features: [
        'Single AI model (Gemini Flash 2.5)',
        'Basic meeting insights',
        'Basic predictive outcomes',
        '10 supported languages',
        'Standard security level',
        'Standard audio processing',
        'Email follow-ups',
        '10 hours/month usage',
        'Community support'
      ],
      color: 'from-slate-500 to-slate-600',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$79',
      period: '/month',
      description: 'Advanced AI collaboration for professionals',
      features: [
        'Triple-AI collaboration (GPT-5, Claude, Gemini)',
        'Advanced predictive outcomes with strategic suggestions',
        '30 supported languages with real-time translation',
        'High security level with session controls',
        'Invisible overlay interface',
        'Multi-vision analysis',
        'Real-time processing',
        'Advanced screen capture & OCR',
        'Platform integrations',
        'Unlimited usage',
        'Priority support'
      ],
      color: 'from-blue-600 to-teal-600',
      popular: true
    },
    {
      id: 'elite',
      name: 'Elite',
      price: '$149',
      period: '/month',
      description: 'Executive-level intelligence for strategic professionals',
      features: [
        'Everything in Pro',
        'Historical pattern analysis for predictions',
        '60 languages with offline packs & custom terminology',
        'Enterprise security with advanced audit logging',
        'Strategic business intelligence',
        'Advanced prompting & fine-tuning',
        'Custom AI model training',
        'Executive dashboard',
        'Advanced analytics',
        'White-label options',
        'Dedicated account manager'
      ],
      color: 'from-teal-600 to-slate-700',
      popular: false
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      description: 'Complete AI transformation for organizations',
      features: [
        'Everything in Elite',
        'Custom prediction models with full training',
        '95+ languages with custom language models',
        'Custom security policies & compliance reporting',
        'On-premise deployment',
        'Custom integrations',
        'Team management',
        'Advanced security controls',
        'Compliance certifications (SOC2, GDPR, HIPAA)',
        'Training & onboarding',
        '24/7 enterprise support'
      ],
      color: 'from-slate-700 to-slate-800',
      popular: false
    }
  ]

  const useCases = [
    {
      title: 'Executive Meetings',
      description: 'Strategic insights for C-suite discussions and board meetings',
      icon: Crown
    },
    {
      title: 'Sales Presentations',
      description: 'Real-time competitive intelligence and objection handling',
      icon: TrendingUp
    },
    {
      title: 'Client Consultations',
      description: 'Professional expertise and industry knowledge at your fingertips',
      icon: Users
    },
    {
      title: 'Technical Discussions',
      description: 'Instant access to technical documentation and best practices',
      icon: Settings
    },
    {
      title: 'Investor Pitches',
      description: 'Market data, financial insights, and persuasive messaging',
      icon: BarChart3
    },
    {
      title: 'Team Collaboration',
      description: 'Enhanced productivity and decision-making for remote teams',
      icon: Building
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Chief Revenue Officer',
      company: 'TechCorp',
      content: 'MeetingMind transformed our sales process. The triple-AI collaboration provides insights that would take a team of analysts to generate.',
      rating: 5,
      tier: 'Elite'
    },
    {
      name: 'Marcus Johnson',
      role: 'Management Consultant',
      company: 'Strategy Partners',
      content: 'The invisible overlay is revolutionary. I can access strategic intelligence without disrupting client conversations.',
      rating: 5,
      tier: 'Pro'
    },
    {
      name: 'Dr. Emily Rodriguez',
      role: 'Research Director',
      company: 'Innovation Labs',
      content: 'The multi-vision analysis capabilities have elevated our presentation quality and stakeholder engagement significantly.',
      rating: 5,
      tier: 'Elite'
    }
  ]

  useEffect(() => {
    const insights = [
      "Strategic opportunity detected: Client mentioned budget expansion",
      "Competitive advantage identified: Emphasize our unique AI collaboration",
      "Decision maker engagement: High interest in technical capabilities",
      "Market trend alignment: Perfect timing for digital transformation discussion",
      "Relationship building moment: Personal connection opportunity identified"
    ]
    
    const interval = setInterval(() => {
      setCurrentInsight(insights[Math.floor(Math.random() * insights.length)])
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const toggleListening = () => {
    setIsListening(!isListening)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-slate-600 to-blue-700 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-blue-800 bg-clip-text text-transparent">
                MeetingMind
              </span>
              <Badge className="bg-gradient-to-r from-teal-500 to-blue-600 text-white">
                Professional AI Assistant
              </Badge>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">Pricing</a>
              <a href="#enterprise" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">Enterprise</a>
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                Learn More
              </Button>
            </div>
            <Button className="bg-gradient-to-r from-slate-600 to-blue-700 hover:from-slate-700 hover:to-blue-800 text-white">
              Start Free Trial
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6">
                Your AI Strategic
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Business Partner
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                MeetingMind combines GPT-5, Claude Sonnet 4.5, and Gemini Flash 2.5 in a revolutionary 
                collaborative AI system that provides executive-level intelligence for every business conversation.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="bg-gradient-to-r from-slate-600 to-blue-700 hover:from-slate-700 hover:to-blue-800 text-white text-lg px-8 py-4">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 text-lg px-8 py-4">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Enterprise Security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Triple-AI Collaboration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Real-Time Intelligence</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Invisible Integration</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* AI Collaboration Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="bg-white/70 backdrop-blur-md border-slate-200/50 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-600 to-blue-700 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Infinity className="h-6 w-6" />
                    <CardTitle>Triple-AI Collaborative Intelligence</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`}></div>
                    <span className="text-sm">
                      {isListening ? 'Active Analysis' : 'Ready'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">GPT-5</h3>
                    <p className="text-sm text-slate-600">Strategic Intelligence</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Lightbulb className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">Claude Sonnet 4.5</h3>
                    <p className="text-sm text-slate-600">Analytical Reasoning</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">Gemini Flash 2.5</h3>
                    <p className="text-sm text-slate-600">Real-Time Processing</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="h-5 w-5 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <p className="text-slate-700 font-medium mb-2">Collaborative Insight:</p>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {currentInsight}
                      </p>
                      <div className="flex items-center space-x-4 mt-3 text-xs text-slate-500">
                        <span>Confidence: 94%</span>
                        <span>Processing: 1.2s</span>
                        <span>Sources: 3 AI models</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Revolutionary AI Collaboration Platform
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Experience the power of three specialized AI models working together to provide 
              unprecedented business intelligence and strategic insights.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {coreFeatures.map((feature) => (
                <Button
                  key={feature.id}
                  variant={activeFeature === feature.id ? "default" : "outline"}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`${
                    activeFeature === feature.id
                      ? `bg-gradient-to-r ${feature.color} text-white shadow-lg`
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  } transition-all duration-300`}
                >
                  <feature.icon className="mr-2 h-4 w-4" />
                  {feature.title}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white/80 backdrop-blur-md border-slate-200/50 shadow-xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4 flex items-center space-x-3">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-white text-sm font-medium">MeetingMind Professional</span>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {activeFeature === 'collaborative-ai' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-blue-700 rounded-lg flex items-center justify-center">
                              <Brain className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-slate-800 font-semibold">Triple-AI Analysis Active</p>
                              <p className="text-slate-600 text-sm">All models collaborating in real-time</p>
                            </div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-blue-800 text-sm mb-2">🧠 Strategic Intelligence (GPT-5):</p>
                            <p className="text-blue-700 text-sm">
                              This discussion represents a critical inflection point for market positioning. 
                              Recommend emphasizing competitive differentiation.
                            </p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <p className="text-purple-800 text-sm mb-2">💡 Analytical Insight (Claude):</p>
                            <p className="text-purple-700 text-sm">
                              Client's language patterns suggest high purchase intent. 
                              Optimal timing for value proposition presentation.
                            </p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                            <p className="text-orange-800 text-sm mb-2">⚡ Real-Time Context (Gemini):</p>
                            <p className="text-orange-700 text-sm">
                              Engagement metrics positive. Recommend transitioning to pricing discussion.
                            </p>
                          </div>
                        </>
                      )}
                      
                      {activeFeature === 'invisible-overlay' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-700 to-teal-600 rounded-lg flex items-center justify-center">
                              <Eye className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-slate-800 font-semibold">Invisible Overlay Active</p>
                              <p className="text-slate-600 text-sm">Seamless integration with any application</p>
                            </div>
                          </div>
                          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                            <p className="text-teal-800 text-sm mb-2">👁️ Overlay Status:</p>
                            <p className="text-teal-700 text-sm">
                              Transparent interface active on Zoom. Providing contextual insights 
                              without disrupting meeting flow.
                            </p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className="text-slate-800 text-sm mb-2">🎯 Smart Positioning:</p>
                            <p className="text-slate-700 text-sm">
                              Interface automatically positioned to avoid screen sharing areas. 
                              One-click response copying available.
                            </p>
                          </div>
                        </>
                      )}
                      
                      {activeFeature === 'multi-vision' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-teal-600 to-slate-600 rounded-lg flex items-center justify-center">
                              <Camera className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-slate-800 font-semibold">Multi-Vision Analysis</p>
                              <p className="text-slate-600 text-sm">Advanced screen understanding active</p>
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <p className="text-green-800 text-sm mb-2">📊 Google Vision API:</p>
                            <p className="text-green-700 text-sm">
                              PowerPoint slide detected: "Q4 Revenue Projections". 
                              99% OCR accuracy on financial data.
                            </p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-blue-800 text-sm mb-2">🎯 OpenAI Vision:</p>
                            <p className="text-blue-700 text-sm">
                              Chart analysis: Revenue trend shows 23% growth. 
                              Recommend highlighting market expansion success.
                            </p>
                          </div>
                        </>
                      )}
                      
                      {activeFeature === 'predictive-outcomes' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-slate-800 font-semibold">Predictive Outcomes Active</p>
                              <p className="text-slate-600 text-sm">AI forecasting meeting direction and outcomes</p>
                            </div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <p className="text-purple-800 text-sm mb-2">🔮 Outcome Prediction (87% confidence):</p>
                            <p className="text-purple-700 text-sm">
                              Meeting likely to conclude with budget approval. Decision point expected in 8 minutes.
                            </p>
                          </div>
                          <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                            <p className="text-pink-800 text-sm mb-2">📊 Strategic Recommendation:</p>
                            <p className="text-pink-700 text-sm">
                              Prepare implementation timeline discussion. Client showing high engagement with technical details.
                            </p>
                          </div>
                          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                            <p className="text-indigo-800 text-sm mb-2">⏰ Decision Timeline:</p>
                            <p className="text-indigo-700 text-sm">
                              Next 3 minutes: Technical questions | 5-8 min: Budget discussion | 8+ min: Final decision
                            </p>
                          </div>
                        </>
                      )}
                      
                      {activeFeature === 'multi-language' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                              <Globe className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-slate-800 font-semibold">Multi-Language Support</p>
                              <p className="text-slate-600 text-sm">Real-time translation across 95+ languages</p>
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <p className="text-green-800 text-sm mb-2">🌍 Language Detection:</p>
                            <p className="text-green-700 text-sm">
                              Primary: English | Secondary: Spanish detected | Auto-translation: Active
                            </p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-blue-800 text-sm mb-2">🔄 Real-time Translation:</p>
                            <p className="text-blue-700 text-sm">
                              "Excelente propuesta" → "Excellent proposal" | Confidence: 98% | Latency: 120ms
                            </p>
                          </div>
                          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                            <p className="text-teal-800 text-sm mb-2">🎯 Cultural Context:</p>
                            <p className="text-teal-700 text-sm">
                              Business context adapted for Latin American market. Formal tone maintained.
                            </p>
                          </div>
                        </>
                      )}
                      
                      {activeFeature === 'enhanced-security' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                              <Shield className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-slate-800 font-semibold">Enhanced Security Active</p>
                              <p className="text-slate-600 text-sm">Enterprise-grade protection enabled</p>
                            </div>
                          </div>
                          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <p className="text-red-800 text-sm mb-2">🔒 Encryption Status:</p>
                            <p className="text-red-700 text-sm">
                              AES-256-GCM encryption active. All data encrypted at rest and in transit.
                            </p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                            <p className="text-orange-800 text-sm mb-2">📋 Audit Log:</p>
                            <p className="text-orange-700 text-sm">
                              Session started: 14:32 | Security level: Enterprise | Compliance: SOC2, GDPR
                            </p>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <p className="text-yellow-800 text-sm mb-2">⚡ Session Security:</p>
                            <p className="text-yellow-700 text-sm">
                              Auto-timeout: 10 minutes | Failed attempts: 0/5 | MFA: Enabled
                            </p>
                          </div>
                        </>
                      )}
                      
                      {activeFeature === 'invisible-overlay' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-700 to-teal-600 rounded-lg flex items-center justify-center">
                              <Eye className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-slate-800 font-semibold">Invisible Overlay Active</p>
                              <p className="text-slate-600 text-sm">Seamless integration with any application</p>
                            </div>
                          </div>
                          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                            <p className="text-teal-800 text-sm mb-2">👁️ Overlay Status:</p>
                            <p className="text-teal-700 text-sm">
                              Transparent interface active on Zoom. Providing contextual insights 
                              without disrupting meeting flow.
                            </p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className="text-slate-800 text-sm mb-2">🎯 Smart Positioning:</p>
                            <p className="text-slate-700 text-sm">
                              Interface automatically positioned to avoid screen sharing areas. 
                              One-click response copying available.
                            </p>
                          </div>
                        </>
                      )}
                      
                      {activeFeature === 'multi-vision' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-teal-600 to-slate-600 rounded-lg flex items-center justify-center">
                              <Camera className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-slate-800 font-semibold">Multi-Vision Analysis</p>
                              <p className="text-slate-600 text-sm">Advanced screen understanding active</p>
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <p className="text-green-800 text-sm mb-2">📊 Google Vision API:</p>
                            <p className="text-green-700 text-sm">
                              PowerPoint slide detected: "Q4 Revenue Projections". 
                              99% OCR accuracy on financial data.
                            </p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-blue-800 text-sm mb-2">🎯 OpenAI Vision:</p>
                            <p className="text-blue-700 text-sm">
                              Chart analysis: Revenue trend shows 23% growth. 
                              Recommend highlighting market expansion success.
                            </p>
                          </div>
                        </>
                      )}
                      
                      {activeFeature === 'real-time-processing' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-blue-700 rounded-lg flex items-center justify-center">
                              <Zap className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-slate-800 font-semibold">Real-Time Intelligence</p>
                              <p className="text-slate-600 text-sm">Instant processing and response generation</p>
                            </div>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <p className="text-yellow-800 text-sm mb-2">⚡ Processing Speed:</p>
                            <p className="text-yellow-700 text-sm">
                              Analysis completed in 0.8 seconds. Response suggestions ready.
                            </p>
                          </div>
                          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                            <p className="text-indigo-800 text-sm mb-2">🎯 Suggested Response:</p>
                            <p className="text-indigo-700 text-sm">
                              "That's an excellent point about scalability. Our architecture 
                              is designed to handle 10x growth seamlessly."
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="space-y-6">
              {coreFeatures.map((feature) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: activeFeature === feature.id ? 1 : 0.7 }}
                  className={`p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
                    activeFeature === feature.id
                      ? 'bg-white border-slate-300 shadow-lg'
                      : 'bg-white/50 border-slate-200 hover:bg-white/80'
                  }`}
                  onClick={() => setActiveFeature(feature.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} flex-shrink-0`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">{feature.title}</h3>
                      <p className="text-slate-600 mb-3">{feature.description}</p>
                      <p className="text-sm text-slate-500">{feature.details}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
         {/* New Features Highlight Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white mb-4">
              🚀 New Features
            </Badge>
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Revolutionary AI Capabilities Just Launched
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Experience the future of meeting intelligence with our latest breakthrough features
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Predictive Outcomes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/90 backdrop-blur-md border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 h-full overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-white" />
                    <h3 className="text-xl font-bold text-white">Predictive Meeting Outcomes</h3>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-slate-600 mb-4">
                    AI-powered prediction engine that forecasts meeting outcomes, decision points, and strategic opportunities before they happen.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-slate-600">87% accuracy in outcome prediction</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-slate-600">Real-time decision timeline analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-slate-600">Strategic recommendations</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-purple-800 text-sm font-medium">Available in Pro tier and above</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Multi-Language Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/90 backdrop-blur-md border-green-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 h-full overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-8 w-8 text-white" />
                    <h3 className="text-xl font-bold text-white">Multi-Language Support</h3>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-slate-600 mb-4">
                    Comprehensive internationalization with real-time translation and support for 95+ languages worldwide.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-slate-600">95+ languages supported</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-slate-600">Real-time translation (&lt;200ms)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-slate-600">Cultural context adaptation</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-800 text-sm font-medium">10 languages in Starter, 95+ in Enterprise</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enhanced Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/90 backdrop-blur-md border-red-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 h-full overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-8 w-8 text-white" />
                    <h3 className="text-xl font-bold text-white">Enhanced Security</h3>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-slate-600 mb-4">
                    Enterprise-grade security with military-level encryption, comprehensive audit logging, and granular access controls.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-slate-600">AES-256-GCM encryption</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-slate-600">Comprehensive audit logging</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-slate-600">SOC2, GDPR, HIPAA compliance</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-800 text-sm font-medium">Standard security in all tiers, advanced in Elite+</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-4">
              <Sparkles className="mr-2 h-5 w-5" />
              Try New Features Free
            </Button>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Advanced Professional Capabilities
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive suite of enterprise-grade features designed for the modern professional
            </p>
          </div>         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advancedFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/80 backdrop-blur-md border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 bg-gradient-to-r from-slate-600 to-blue-700 rounded-lg">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">{feature.title}</h3>
                    </div>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Trusted by Professionals Worldwide
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              From executive boardrooms to client consultations, MeetingMind elevates every professional interaction
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/90 backdrop-blur-md border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-slate-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <useCase.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-3">{useCase.title}</h3>
                    <p className="text-slate-600">{useCase.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Choose Your AI Intelligence Level
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              From individual professionals to enterprise organizations, 
              we have the perfect AI collaboration solution for your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingTiers.map((tier) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative"
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <Card className={`bg-white/90 backdrop-blur-md border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 h-full ${
                  tier.popular ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                }`}>
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${tier.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      {tier.id === 'starter' && <Star className="h-8 w-8 text-white" />}
                      {tier.id === 'pro' && <Brain className="h-8 w-8 text-white" />}
                      {tier.id === 'elite' && <Crown className="h-8 w-8 text-white" />}
                      {tier.id === 'enterprise' && <Building className="h-8 w-8 text-white" />}
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">{tier.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-slate-800">{tier.price}</span>
                      <span className="text-slate-600">{tier.period}</span>
                    </div>
                    <p className="text-slate-600 mt-2">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${
                        tier.popular 
                          ? 'bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white' 
                          : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white'
                      }`}
                    >
                      {tier.id === 'enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-slate-600">
              See how professionals are transforming their business conversations with MeetingMind
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/90 backdrop-blur-md border-slate-200/50 shadow-lg h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-slate-600 mb-6 italic">"{testimonial.content}"</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{testimonial.name}</p>
                        <p className="text-sm text-slate-600">{testimonial.role}</p>
                        <p className="text-sm text-slate-500">{testimonial.company}</p>
                      </div>
                      <Badge className="bg-gradient-to-r from-slate-500 to-blue-600 text-white">
                        {testimonial.tier}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Professional Conversations?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have elevated their business intelligence 
              with MeetingMind's revolutionary AI collaboration platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-slate-700 hover:bg-slate-100 text-lg px-8 py-4">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Your Free Trial
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-slate-700 text-lg px-8 py-4">
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Demo
              </Button>
            </div>
            <p className="text-blue-200 text-sm mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-slate-600 to-blue-700 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">MeetingMind</span>
              </div>
              <p className="text-slate-300 text-sm">
                Professional AI assistant and strategic business partner for the modern workplace.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#enterprise" className="hover:text-white transition-colors">Enterprise</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#careers" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><a href="#help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#docs" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#api" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#status" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2024 MeetingMind. All rights reserved. Professional AI Assistant Platform.</p>
          </div>
        </div>
      </footer>
      </section>
    </div>
  )
}

export default App
