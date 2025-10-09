import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  Brain, Users, Mail, Search, Zap, Shield, Download, ChevronDown, Play, MessageSquare, 
  Clock, Star, Eye, Mic, Camera, Globe, Lock, Award, CheckCircle, ArrowRight,
  Layers, Target, TrendingUp, BarChart3, Lightbulb, Headphones, Monitor,
  FileText, Settings, Crown, Building, Sparkles, Infinity, Calendar,
  Database, Network, Cpu, Activity, Gauge, Radar, Binoculars, Rocket
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

function App() {
  const [activeFeature, setActiveFeature] = useState('triple-ai-collaboration')
  const [activeTier, setActiveTier] = useState('pro')
  const [isListening, setIsListening] = useState(false)
  const [currentInsight, setCurrentInsight] = useState('')
  const [showDemo, setShowDemo] = useState(false)

  const revolutionaryFeatures = [
    {
      id: 'triple-ai-collaboration',
      title: 'Triple-AI Collaboration',
      icon: Brain,
      description: 'GPT-5, Claude Sonnet 4.5 & Gemini Flash 2.5 working in perfect harmony',
      color: 'from-blue-600 to-purple-700',
      details: 'Revolutionary AI orchestration where three specialized models provide complementary intelligence, creating unprecedented analytical depth and accuracy that no single AI can match.'
    },
    {
      id: 'predictive-intelligence',
      title: 'Predictive Meeting Intelligence',
      icon: Binoculars,
      description: '87% accuracy in forecasting meeting outcomes and decision points',
      color: 'from-purple-600 to-pink-600',
      details: 'Advanced machine learning algorithms analyze conversation patterns, participant behavior, and historical data to predict likely outcomes, strategic opportunities, and potential roadblocks before they occur.'
    },
    {
      id: 'cross-meeting-memory',
      title: 'Cross-Meeting Memory System',
      icon: Database,
      description: 'Unlimited historical context with semantic relationship mapping',
      color: 'from-green-600 to-teal-600',
      details: 'Sophisticated memory architecture that maintains context across all meetings, automatically identifying relationships, tracking decisions, and surfacing relevant historical insights when needed.'
    },
    {
      id: 'real-time-coaching',
      title: 'AI Coaching & Optimization',
      icon: Target,
      description: 'Personalized performance coaching with real-time improvement suggestions',
      color: 'from-orange-600 to-red-600',
      details: 'Intelligent coaching system that analyzes your communication patterns, identifies improvement opportunities, and provides personalized recommendations to enhance meeting effectiveness.'
    },
    {
      id: 'opportunity-detection',
      title: 'Missed Opportunity Detection',
      icon: Radar,
      description: 'Real-time identification of collaboration gaps and strategic moments',
      color: 'from-teal-600 to-blue-600',
      details: 'Advanced detection algorithms identify missed clarification opportunities, engagement drops, decision points, and strategic moments, providing immediate alerts and post-meeting analysis.'
    },
    {
      id: 'enterprise-knowledge',
      title: 'Enterprise Knowledge Integration',
      icon: Network,
      description: 'Semantic search across organizational knowledge with proactive assistance',
      color: 'from-indigo-600 to-purple-600',
      details: 'Comprehensive knowledge base integration with semantic search, proactive information assistance, and intelligent content synthesis from multiple enterprise sources.'
    },
    {
      id: 'multi-language-global',
      title: 'Global Multi-Language Intelligence',
      icon: Globe,
      description: 'Real-time translation and cultural adaptation for 95+ languages',
      color: 'from-green-600 to-blue-600',
      details: 'Comprehensive internationalization with real-time translation, cultural context adaptation, and localized AI processing for global business communications.'
    },
    {
      id: 'enterprise-security',
      title: 'Military-Grade Security',
      icon: Shield,
      description: 'Zero-trust architecture with AES-256-GCM encryption and compliance',
      color: 'from-red-600 to-orange-600',
      details: 'Enterprise-grade security featuring zero-trust architecture, AES-256-GCM encryption, comprehensive audit logging, and compliance with SOC2, GDPR, HIPAA, and ISO 27001 standards.'
    }
  ]

  const advancedCapabilities = [
    {
      title: 'Unified Intelligence Hub',
      icon: Cpu,
      description: 'Master AI orchestrator coordinating all intelligence services with sub-200ms response times'
    },
    {
      title: 'Performance Optimization Engine',
      icon: Gauge,
      description: 'Real-time system optimization with predictive scaling and intelligent resource management'
    },
    {
      title: 'Multi-Tenant Enterprise Architecture',
      icon: Building,
      description: 'Complete data isolation for enterprises with horizontal scaling to 10,000+ concurrent users'
    },
    {
      title: 'Real-Time Monitoring Dashboard',
      icon: Activity,
      description: 'Comprehensive observability with WebSocket-based updates and anomaly detection'
    },
    {
      title: 'Advanced Analytics & ROI Tracking',
      icon: BarChart3,
      description: 'Detailed meeting effectiveness scoring with measurable productivity improvements'
    },
    {
      title: 'Invisible Overlay Technology',
      icon: Eye,
      description: 'Transparent integration that works across any application without disruption'
    }
  ]

  const pricingTiers = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Essential AI assistance for individuals',
      features: [
        'Single AI model (Gemini Flash 2.5)',
        'Basic meeting insights and summaries',
        'Basic predictive outcomes',
        '10 supported languages',
        'Standard security encryption',
        'Email follow-ups and action items',
        '50 hours/month usage limit',
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
        'Triple-AI collaboration (GPT-5, Claude Sonnet 4.5, Gemini Flash 2.5)',
        'Advanced predictive intelligence with 87% accuracy',
        'Cross-meeting memory with historical context',
        'Real-time opportunity detection',
        '30 supported languages with real-time translation',
        'AI coaching with personalized recommendations',
        'Advanced security with session controls',
        'Invisible overlay interface',
        'Multi-vision analysis capabilities',
        'Platform integrations (Zoom, Teams, etc.)',
        'Unlimited usage',
        'Priority support'
      ],
      color: 'from-blue-600 to-purple-600',
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
        'Advanced predictive modeling with custom training',
        'Enterprise knowledge base integration',
        '60 languages with offline packs and custom terminology',
        'Enhanced security with comprehensive audit logging',
        'Strategic business intelligence dashboard',
        'Advanced coaching with team performance analytics',
        'Custom AI model fine-tuning',
        'Executive reporting and ROI analytics',
        'White-label customization options',
        'Advanced API access',
        'Dedicated account manager'
      ],
      color: 'from-purple-600 to-pink-600',
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
        'Multi-tenant architecture with complete data isolation',
        'Custom prediction models with organizational training',
        '95+ languages with custom language models',
        'Military-grade security with zero-trust architecture',
        'SOC2, GDPR, HIPAA, ISO 27001 compliance',
        'On-premise deployment options',
        'Custom integrations and API development',
        'Advanced team management and analytics',
        'Performance optimization engine',
        'Real-time monitoring dashboard',
        'Comprehensive training and onboarding',
        '24/7 enterprise support with SLA guarantees'
      ],
      color: 'from-slate-700 to-slate-800',
      popular: false
    }
  ]

  const enterpriseUseCases = [
    {
      title: 'C-Suite Strategic Meetings',
      description: 'Executive-level intelligence for board meetings and strategic planning sessions',
      icon: Crown,
      metrics: '40% improvement in decision quality'
    },
    {
      title: 'Sales & Revenue Operations',
      description: 'Real-time competitive intelligence and predictive deal analysis',
      icon: TrendingUp,
      metrics: '35% increase in close rates'
    },
    {
      title: 'Client Consulting & Advisory',
      description: 'Professional expertise and industry knowledge at your fingertips',
      icon: Users,
      metrics: '50% reduction in prep time'
    },
    {
      title: 'Technical Architecture Reviews',
      description: 'Instant access to technical documentation and best practices',
      icon: Settings,
      metrics: '60% faster problem resolution'
    },
    {
      title: 'Investor Relations & Fundraising',
      description: 'Market data, financial insights, and persuasive messaging',
      icon: BarChart3,
      metrics: '25% improvement in funding success'
    },
    {
      title: 'Global Team Collaboration',
      description: 'Enhanced productivity with multi-language support and cultural adaptation',
      icon: Building,
      metrics: '45% increase in team effectiveness'
    }
  ]

  const competitiveAdvantages = [
    {
      title: 'Only Triple-AI Platform',
      description: 'Unique collaboration of GPT-5, Claude Sonnet 4.5, and Gemini Flash 2.5',
      icon: Brain,
      advantage: 'vs. Single AI competitors'
    },
    {
      title: 'Predictive Intelligence',
      description: '87% accuracy in meeting outcome forecasting',
      icon: Binoculars,
      advantage: 'vs. Reactive-only solutions'
    },
    {
      title: 'Cross-Meeting Memory',
      description: 'Unlimited historical context with semantic understanding',
      icon: Database,
      advantage: 'vs. Session-limited platforms'
    },
    {
      title: 'Enterprise Multi-Tenancy',
      description: 'Complete data isolation with shared infrastructure efficiency',
      icon: Building,
      advantage: 'vs. Single-tenant limitations'
    },
    {
      title: 'Real-Time Optimization',
      description: 'Sub-200ms response times with intelligent performance tuning',
      icon: Gauge,
      advantage: 'vs. Static performance systems'
    },
    {
      title: 'Military-Grade Security',
      description: 'Zero-trust architecture with comprehensive compliance',
      icon: Shield,
      advantage: 'vs. Basic security implementations'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Chief Revenue Officer',
      company: 'TechCorp Global',
      content: 'MeetingMind\'s triple-AI collaboration transformed our sales process. The predictive intelligence helped us close 35% more deals by anticipating client needs and objections.',
      rating: 5,
      tier: 'Elite',
      metrics: '35% increase in close rates'
    },
    {
      name: 'Marcus Johnson',
      role: 'Management Consultant',
      company: 'Strategy Partners',
      content: 'The cross-meeting memory is revolutionary. It remembers every client interaction and surfaces relevant insights instantly. Our consulting effectiveness improved by 50%.',
      rating: 5,
      tier: 'Pro',
      metrics: '50% improvement in consulting effectiveness'
    },
    {
      name: 'Dr. Emily Rodriguez',
      role: 'Chief Technology Officer',
      company: 'Innovation Labs',
      content: 'The enterprise security and multi-tenant architecture gave us confidence to deploy across our entire organization. The ROI was evident within the first quarter.',
      rating: 5,
      tier: 'Enterprise',
      metrics: 'Positive ROI in Q1'
    },
    {
      name: 'David Kim',
      role: 'VP of Business Development',
      company: 'Global Ventures',
      content: 'The multi-language support and cultural adaptation features enabled us to expand into 12 new international markets with unprecedented success.',
      rating: 5,
      tier: 'Elite',
      metrics: '12 new markets launched'
    }
  ]

  useEffect(() => {
    const insights = [
      "🎯 Strategic opportunity detected: Client mentioned budget expansion for Q4",
      "🧠 AI Synthesis: GPT-5 suggests technical approach, Claude validates risks, Gemini optimizes timing",
      "📊 Predictive Analysis: 92% probability of positive decision based on engagement patterns",
      "🔍 Cross-Meeting Context: Similar discussion from March meeting resulted in $2M contract",
      "💡 Coaching Insight: Increase technical detail by 15% to match client's expertise level",
      "🌐 Cultural Adaptation: Adjust communication style for Japanese business etiquette",
      "⚡ Real-Time Alert: Decision maker showing high interest - perfect moment for proposal",
      "📈 ROI Projection: Implementation of suggested approach could yield 40% efficiency gain"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-800 bg-clip-text text-transparent">
                MeetingMind
              </span>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                Revolutionary AI Platform
              </Badge>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">Platform</a>
              <a href="#advantages" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">Advantages</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">Pricing</a>
              <a href="#enterprise" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">Enterprise</a>
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                Learn More
              </Button>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white">
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
              <div className="flex justify-center mb-6">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-lg px-6 py-2">
                  🚀 Most Advanced Meeting Intelligence Platform
                </Badge>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6">
                Revolutionary
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Triple-AI Intelligence
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                The world's first platform combining <strong>GPT-5, Claude Sonnet 4.5, and Gemini Flash 2.5</strong> 
                in revolutionary collaboration. Featuring predictive meeting intelligence, cross-meeting memory, 
                and enterprise-grade security that transforms every business conversation.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white text-lg px-8 py-4">
                  <Rocket className="mr-2 h-5 w-5" />
                  Experience the Revolution
                </Button>
                <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 text-lg px-8 py-4">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Platform Demo
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-12">
                <div className="p-4">
                  <div className="text-3xl font-bold text-blue-600 mb-1">87%</div>
                  <div className="text-sm text-slate-600">Prediction Accuracy</div>
                </div>
                <div className="p-4">
                  <div className="text-3xl font-bold text-purple-600 mb-1">3</div>
                  <div className="text-sm text-slate-600">AI Models Collaborating</div>
                </div>
                <div className="p-4">
                  <div className="text-3xl font-bold text-pink-600 mb-1">95+</div>
                  <div className="text-sm text-slate-600">Languages Supported</div>
                </div>
                <div className="p-4">
                  <div className="text-3xl font-bold text-teal-600 mb-1">200ms</div>
                  <div className="text-sm text-slate-600">Response Time</div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Military-Grade Security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Enterprise Multi-Tenancy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Predictive Intelligence</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Cross-Meeting Memory</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Revolutionary AI Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <Card className="bg-white/70 backdrop-blur-md border-slate-200/50 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Infinity className="h-6 w-6" />
                    <CardTitle>Revolutionary Triple-AI Collaborative Intelligence</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`}></div>
                    <span className="text-sm">
                      {isListening ? 'Active Intelligence' : 'Ready for Analysis'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">GPT-5</h3>
                    <p className="text-sm text-slate-600 mb-2">Strategic Intelligence & Reasoning</p>
                    <Badge className="bg-green-100 text-green-800 text-xs">Language Generation</Badge>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lightbulb className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">Claude Sonnet 4.5</h3>
                    <p className="text-sm text-slate-600 mb-2">Analytical Reasoning & Safety</p>
                    <Badge className="bg-purple-100 text-purple-800 text-xs">Risk Assessment</Badge>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">Gemini Flash 2.5</h3>
                    <p className="text-sm text-slate-600 mb-2">Speed & Multimodal Processing</p>
                    <Badge className="bg-orange-100 text-orange-800 text-xs">Real-Time Response</Badge>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-slate-800">Live Intelligence Stream</span>
                  </div>
                  <div className="bg-white rounded-md p-4 border-l-4 border-blue-500">
                    <p className="text-slate-700 font-medium">
                      {currentInsight}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button 
                    onClick={toggleListening}
                    className={`${isListening 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800'
                    } text-white px-8 py-3`}
                  >
                    {isListening ? (
                      <>
                        <Mic className="mr-2 h-5 w-5 animate-pulse" />
                        Stop Analysis
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-5 w-5" />
                        Start AI Analysis
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Revolutionary Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-4">
              Revolutionary Platform Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Unprecedented AI Capabilities
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Experience the future of meeting intelligence with revolutionary features 
              that no other platform can match.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <div className="space-y-4">
              {revolutionaryFeatures.map((feature) => (
                <motion.div
                  key={feature.id}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                    activeFeature === feature.id
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200'
                      : 'bg-white hover:bg-slate-50 border border-slate-200'
                  }`}
                  onClick={() => setActiveFeature(feature.id)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color}`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 mb-1">{feature.title}</h3>
                      <p className="text-sm text-slate-600">{feature.description}</p>
                    </div>
                    <ArrowRight className={`h-5 w-5 transition-colors ${
                      activeFeature === feature.id ? 'text-blue-600' : 'text-slate-400'
                    }`} />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="lg:pl-8">
              <AnimatePresence mode="wait">
                {revolutionaryFeatures.map((feature) => (
                  activeFeature === feature.id && (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="bg-white shadow-xl border-0">
                        <CardHeader className={`bg-gradient-to-r ${feature.color} text-white`}>
                          <div className="flex items-center space-x-3">
                            <feature.icon className="h-8 w-8" />
                            <CardTitle className="text-xl">{feature.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <p className="text-slate-700 leading-relaxed mb-6">
                            {feature.details}
                          </p>
                          
                          {feature.id === 'triple-ai-collaboration' && (
                            <div className="space-y-4">
                              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm text-green-800">GPT-5: Strategic reasoning and content generation</span>
                              </div>
                              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-purple-600" />
                                <span className="text-sm text-purple-800">Claude: Analytical accuracy and risk assessment</span>
                              </div>
                              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-orange-600" />
                                <span className="text-sm text-orange-800">Gemini: Speed optimization and multimodal processing</span>
                              </div>
                            </div>
                          )}

                          {feature.id === 'predictive-intelligence' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                  <div className="text-2xl font-bold text-blue-600 mb-1">87%</div>
                                  <div className="text-xs text-blue-800">Prediction Accuracy</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                  <div className="text-2xl font-bold text-purple-600 mb-1">2s</div>
                                  <div className="text-xs text-purple-800">Analysis Speed</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {feature.id === 'enterprise-security' && (
                            <div className="space-y-3">
                              <Badge className="bg-red-100 text-red-800">SOC2 Compliant</Badge>
                              <Badge className="bg-blue-100 text-blue-800 ml-2">GDPR Ready</Badge>
                              <Badge className="bg-green-100 text-green-800 ml-2">HIPAA Certified</Badge>
                              <Badge className="bg-purple-100 text-purple-800 ml-2">ISO 27001</Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Advanced Capabilities Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedCapabilities.map((capability, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full bg-white hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                        <capability.icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-bold text-slate-800">{capability.title}</h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {capability.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Advantages Section */}
      <section id="advantages" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-green-500 to-teal-600 text-white mb-4">
              Unmatched Competitive Advantages
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Why MeetingMind Leads the Market
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Revolutionary capabilities that no other platform can match, 
              positioning MeetingMind as the definitive meeting intelligence solution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {competitiveAdvantages.map((advantage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full bg-white hover:shadow-xl transition-all duration-300 border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg">
                        <advantage.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 mb-1">{advantage.title}</h3>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {advantage.advantage}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {advantage.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white mb-4">
              Transparent Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Choose Your Intelligence Level
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              From individual professionals to enterprise organizations, 
              find the perfect plan for your meeting intelligence needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingTiers.map((tier) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`relative ${tier.popular ? 'lg:scale-105' : ''}`}
              >
                <Card className={`h-full ${tier.popular ? 'ring-2 ring-blue-500 shadow-xl' : 'shadow-lg'} bg-white`}>
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className={`bg-gradient-to-r ${tier.color} text-white text-center`}>
                    <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-lg opacity-80">{tier.period}</span>
                    </div>
                    <p className="text-sm opacity-90 mt-2">{tier.description}</p>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <ul className="space-y-3">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full mt-6 ${
                        tier.popular 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800' 
                          : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800'
                      } text-white`}
                    >
                      {tier.id === 'enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-600 mb-4">
              All plans include 14-day free trial • No credit card required • Cancel anytime
            </p>
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
              Compare All Features
            </Button>
          </div>
        </div>
      </section>

      {/* Enterprise Use Cases */}
      <section id="enterprise" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-4">
              Enterprise Success Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Transforming Business Outcomes
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              See how leading organizations leverage MeetingMind's revolutionary AI 
              to achieve unprecedented business results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enterpriseUseCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full bg-white hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                        <useCase.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-slate-800">{useCase.title}</h3>
                    </div>
                    <p className="text-slate-600 mb-4 leading-relaxed">
                      {useCase.description}
                    </p>
                    <Badge className="bg-green-100 text-green-800">
                      {useCase.metrics}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white mb-4">
              Customer Success Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Discover how professionals and organizations achieve extraordinary 
              results with MeetingMind's revolutionary AI platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full bg-gradient-to-br from-white to-slate-50 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    
                    <blockquote className="text-slate-700 mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{testimonial.name}</div>
                        <div className="text-sm text-slate-600">{testimonial.role}</div>
                        <div className="text-sm text-slate-500">{testimonial.company}</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800 mb-1">
                          {testimonial.tier} Plan
                        </Badge>
                        <div className="text-xs text-green-600 font-semibold">
                          {testimonial.metrics}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Experience the Revolution?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their meeting effectiveness 
              with MeetingMind's revolutionary triple-AI collaboration platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 text-lg px-8 py-4">
                <Rocket className="mr-2 h-5 w-5" />
                Start Your Free Trial
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Enterprise Demo
              </Button>
            </div>
            
            <p className="text-white/80 text-sm">
              14-day free trial • No credit card required • Full platform access
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">MeetingMind</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                The world's most advanced AI meeting intelligence platform, 
                featuring revolutionary triple-AI collaboration and predictive intelligence.
              </p>
              <div className="flex space-x-4">
                <Badge className="bg-blue-600">SOC2 Compliant</Badge>
                <Badge className="bg-green-600">GDPR Ready</Badge>
                <Badge className="bg-purple-600">HIPAA Certified</Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Platform</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Triple-AI Collaboration</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Predictive Intelligence</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Multi-Language Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2024 MeetingMind. All rights reserved. Revolutionary AI meeting intelligence platform.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
