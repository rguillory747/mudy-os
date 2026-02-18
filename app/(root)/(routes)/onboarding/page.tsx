'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  Briefcase,
  Settings2,
  ClipboardCheck,
  Users,
  Headphones,
  FileText,
  Cpu,
  Search,
  ShoppingCart,
  BarChart3,
  MessageSquare,
  Database
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface FormData {
  companyName: string
  industry: string
  companySize: string
  description: string
  useCases: string[]
  budgetSensitivity: string
  latencyPreference: string
  dataPrivacy: string
}

const useCaseOptions = [
  { id: 'lead_generation', label: 'Lead Generation', icon: Users },
  { id: 'customer_support', label: 'Customer Support', icon: Headphones },
  { id: 'content_creation', label: 'Content Creation', icon: FileText },
  { id: 'operations', label: 'Operations', icon: Cpu },
  { id: 'software_development', label: 'Software Development', icon: Cpu },
  { id: 'research', label: 'Research', icon: Search },
  { id: 'sales', label: 'Sales', icon: ShoppingCart },
  { id: 'marketing_automation', label: 'Marketing Automation', icon: BarChart3 },
  { id: 'data_analysis', label: 'Data Analysis', icon: Database },
  { id: 'community_management', label: 'Community Management', icon: MessageSquare },
]

const preferenceOptions = {
  budget: [
    { id: 'cost_efficient', label: 'Cost-efficient', description: 'Prioritize lower costs' },
    { id: 'balanced', label: 'Balanced', description: 'Balance cost and performance' },
    { id: 'premium', label: 'Premium', description: 'Prioritize highest performance' },
  ],
  latency: [
    { id: 'real_time', label: 'Real-time', description: 'Instant responses required' },
    { id: 'standard', label: 'Standard', description: 'Acceptable delays are fine' },
    { id: 'batch', label: 'Batch', description: 'Process in scheduled batches' },
  ],
  privacy: [
    { id: 'standard', label: 'Standard', description: 'Basic data protection' },
    { id: 'sensitive', label: 'Sensitive', description: 'Enhanced privacy controls' },
    { id: 'regulated', label: 'Regulated', description: 'Compliance with strict regulations' },
  ]
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    industry: '',
    companySize: '',
    description: '',
    useCases: [],
    budgetSensitivity: '',
    latencyPreference: '',
    dataPrivacy: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleUseCase = (id: string) => {
    setFormData(prev => {
      const newUseCases = prev.useCases.includes(id)
        ? prev.useCases.filter(uc => uc !== id)
        : [...prev.useCases, id]
      
      return { ...prev, useCases: newUseCases }
    })
  }

  const handlePreferenceSelect = (category: string, value: string) => {
    setFormData(prev => ({ ...prev, [category]: value }))
  }

  const validateStep = () => {
    switch(step) {
      case 0:
        return formData.companyName.trim() !== '' && 
               formData.industry !== '' && 
               formData.companySize !== ''
      case 1:
        return formData.useCases.length > 0
      case 2:
        return formData.budgetSensitivity !== '' && 
               formData.latencyPreference !== '' && 
               formData.dataPrivacy !== ''
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, 3))
    } else {
      toast.error('Please complete all required fields')
    }
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await axios.post('/api/onboarding', formData)
      toast.success('Onboarding completed successfully!')
      router.push('/org-chart')
    } catch (error) {
      toast.error('Failed to complete onboarding. Please try again.')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[0, 1, 2, 3].map((stepNum) => (
        <div key={stepNum} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === stepNum 
              ? 'bg-primary text-primary-foreground' 
              : step > stepNum 
                ? 'bg-primary/20 text-primary' 
                : 'bg-secondary text-muted-foreground'
          }`}>
            {step > stepNum ? <Check className="w-4 h-4" /> : stepNum + 1}
          </div>
          {stepNum < 3 && (
            <div className={`w-16 h-0.5 mx-2 ${
              step > stepNum ? 'bg-primary' : 'bg-border'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStepContent = () => {
    switch(step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-primary">Business Profile</h1>
              <p className="text-muted-foreground">Tell us about your company</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName" className="text-primary">Company Name *</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="mt-1 bg-secondary border-primary/10 text-primary"
                  placeholder="Enter your company name"
                />
              </div>
              
              <div>
                <Label htmlFor="industry" className="text-primary">Industry *</Label>
                <Select value={formData.industry} onValueChange={(value) => handleSelectChange('industry', value)}>
                  <SelectTrigger className="mt-1 bg-secondary border-primary/10 text-primary">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-primary/10 text-primary">
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="companySize" className="text-primary">Company Size *</Label>
                <Select value={formData.companySize} onValueChange={(value) => handleSelectChange('companySize', value)}>
                  <SelectTrigger className="mt-1 bg-secondary border-primary/10 text-primary">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-primary/10 text-primary">
                    <SelectItem value="solo">Solo</SelectItem>
                    <SelectItem value="2-10">2-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-1000">201-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description" className="text-primary">Description (Optional)</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full mt-1 p-3 rounded-md bg-secondary border border-primary/10 text-primary min-h-[120px]"
                  placeholder="Tell us more about what your company does..."
                />
              </div>
            </div>
          </div>
        )
      
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-primary">Use Cases</h1>
              <p className="text-muted-foreground">Select how you plan to use our platform</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {useCaseOptions.map((option) => {
                const Icon = option.icon
                const isSelected = formData.useCases.includes(option.id)
                return (
                  <div
                    key={option.id}
                    onClick={() => toggleUseCase(option.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-primary/10 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3 text-primary" />
                      <span className="font-medium text-primary">{option.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-primary">Preferences</h1>
              <p className="text-muted-foreground">Configure your platform preferences</p>
            </div>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-primary mb-4">Budget Sensitivity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {preferenceOptions.budget.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => handlePreferenceSelect('budgetSensitivity', option.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        formData.budgetSensitivity === option.id
                          ? 'border-primary bg-primary/10'
                          : 'border-primary/10 hover:border-primary/30'
                      }`}
                    >
                      <h4 className="font-medium text-primary">{option.label}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary mb-4">Latency Preference</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {preferenceOptions.latency.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => handlePreferenceSelect('latencyPreference', option.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        formData.latencyPreference === option.id
                          ? 'border-primary bg-primary/10'
                          : 'border-primary/10 hover:border-primary/30'
                      }`}
                    >
                      <h4 className="font-medium text-primary">{option.label}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary mb-4">Data Privacy</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {preferenceOptions.privacy.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => handlePreferenceSelect('dataPrivacy', option.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        formData.dataPrivacy === option.id
                          ? 'border-primary bg-primary/10'
                          : 'border-primary/10 hover:border-primary/30'
                      }`}
                    >
                      <h4 className="font-medium text-primary">{option.label}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-primary">Review & Confirm</h1>
              <p className="text-muted-foreground">Review your selections before submitting</p>
            </div>
            
            <div className="bg-secondary rounded-lg p-6 border border-primary/10 space-y-6">
              <div>
                <h3 className="font-medium text-primary flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Business Profile
                </h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <p><span className="text-muted-foreground">Company:</span> {formData.companyName}</p>
                  <p><span className="text-muted-foreground">Industry:</span> {formData.industry}</p>
                  <p><span className="text-muted-foreground">Size:</span> {formData.companySize}</p>
                  <p><span className="text-muted-foreground">Description:</span> {formData.description || 'Not provided'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-primary flex items-center">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Use Cases
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.useCases.length > 0 ? (
                    formData.useCases.map((useCase) => {
                      const option = useCaseOptions.find(opt => opt.id === useCase)
                      return (
                        <span 
                          key={useCase} 
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {option?.label}
                        </span>
                      )
                    })
                  ) : (
                    <p className="text-muted-foreground text-sm">No use cases selected</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-primary flex items-center">
                  <Settings2 className="w-4 h-4 mr-2" />
                  Preferences
                </h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <p><span className="text-muted-foreground">Budget:</span> {
                    preferenceOptions.budget.find(b => b.id === formData.budgetSensitivity)?.label || 'Not selected'
                  }</p>
                  <p><span className="text-muted-foreground">Latency:</span> {
                    preferenceOptions.latency.find(l => l.id === formData.latencyPreference)?.label || 'Not selected'
                  }</p>
                  <p><span className="text-muted-foreground">Privacy:</span> {
                    preferenceOptions.privacy.find(p => p.id === formData.dataPrivacy)?.label || 'Not selected'
                  }</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing Onboarding...
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Complete Onboarding
                  </>
                )}
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {renderStepIndicator()}
        
        <div className="bg-secondary rounded-xl border border-primary/10 p-8 shadow-lg">
          {renderStepContent()}
          
          <div className="flex justify-between mt-8">
            <Button
              onClick={prevStep}
              disabled={step === 0}
              variant="outline"
              className="border-primary/10 text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {step < 3 ? (
              <Button
                onClick={nextStep}
                className="bg-primary hover:bg-primary/90"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}