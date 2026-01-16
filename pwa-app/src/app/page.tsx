'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Upload, FileText, CheckCircle, AlertTriangle, Download, ChevronRight, ChevronLeft,
  Shield, Scale, Printer, FileWarning, Calendar, DollarSign, Building2, Clock,
  Smartphone, ExternalLink, Info, Zap
} from 'lucide-react';
import { parseCreditReport, fieldsToSimple, getExtractionQuality } from '../lib/parser';
import { runRules, calculateRiskProfile, CreditFields, RuleFlag, RiskProfile } from '../lib/rules';
import { generateBureauLetter, generateValidationLetter, generateCaseSummary, generateCFPBNarrative, ConsumerInfo } from '../lib/generator';

type Step = 1 | 2 | 3 | 4 | 5;

interface ParsedField {
  value: string;
  confidence: 'High' | 'Medium' | 'Low';
  sourceText: string;
}

// Sample data for demo
const SAMPLE_TEXT = `Account Information:
Creditor: PORTFOLIO RECOVERY ASSOC
Original Creditor: CAPITAL ONE BANK
Account Type: Collection
Account Status: Open
Balance: $2,847.00
Original Amount: $1,523.00
Date Opened: 2019-03-15
Date of First Delinquency: 2020-08-22
Charge-Off Date: 2020-06-15
Last Payment: 2020-05-10
Estimated Removal: 2029-08-22
Payment History: 30 60 90 120 CO`;

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [extractedText, setExtractedText] = useState('');
  const [parsedFields, setParsedFields] = useState<Record<string, ParsedField>>({});
  const [editableFields, setEditableFields] = useState<CreditFields>({});
  const [flags, setFlags] = useState<RuleFlag[]>([]);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [consumer, setConsumer] = useState<ConsumerInfo>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // PWA Install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await file.text();
      setExtractedText(text);
      const parsed = parseCreditReport(text);
      setParsedFields(parsed);
      setEditableFields(fieldsToSimple(parsed));
      setStep(2);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try pasting the text directly.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Load sample data
  const loadSample = useCallback(() => {
    setExtractedText(SAMPLE_TEXT);
    const parsed = parseCreditReport(SAMPLE_TEXT);
    setParsedFields(parsed);
    setEditableFields(fieldsToSimple(parsed));
    setStep(2);
  }, []);

  // Handle text paste
  const handleTextSubmit = useCallback(() => {
    if (!extractedText.trim()) return;
    const parsed = parseCreditReport(extractedText);
    setParsedFields(parsed);
    setEditableFields(fieldsToSimple(parsed));
    setStep(2);
  }, [extractedText]);

  // Run the analysis
  const runAnalysis = useCallback(() => {
    const detectedFlags = runRules(editableFields);
    setFlags(detectedFlags);
    const profile = calculateRiskProfile(detectedFlags, editableFields);
    setRiskProfile(profile);
    setStep(4);
  }, [editableFields]);

  // Download generated letters
  const downloadLetter = useCallback((type: 'bureau' | 'validation' | 'summary' | 'cfpb') => {
    let content = '';
    let filename = '';

    if (type === 'bureau') {
      content = generateBureauLetter(editableFields, flags, consumer);
      filename = 'bureau_dispute_letter.txt';
    } else if (type === 'validation') {
      content = generateValidationLetter(editableFields, flags, consumer);
      filename = 'debt_validation_letter.txt';
    } else if (type === 'cfpb') {
      content = generateCFPBNarrative(editableFields, flags);
      filename = 'cfpb_complaint.txt';
    } else {
      content = generateCaseSummary(editableFields, flags, riskProfile!);
      filename = 'case_summary.md';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [editableFields, flags, consumer, riskProfile]);

  // Calculate timeline for visualization
  const getTimelineData = () => {
    const dates: Array<{ label: string; date: Date; color: string }> = [];

    if (editableFields.dateOpened) {
      const d = new Date(editableFields.dateOpened);
      if (!isNaN(d.getTime())) dates.push({ label: 'Opened', date: d, color: '#3b82f6' });
    }
    if (editableFields.dofd) {
      const d = new Date(editableFields.dofd);
      if (!isNaN(d.getTime())) dates.push({ label: 'DOFD', date: d, color: '#ef4444' });
    }
    if (editableFields.chargeOffDate) {
      const d = new Date(editableFields.chargeOffDate);
      if (!isNaN(d.getTime())) dates.push({ label: 'Charge-Off', date: d, color: '#f59e0b' });
    }
    if (editableFields.estimatedRemovalDate) {
      const d = new Date(editableFields.estimatedRemovalDate);
      if (!isNaN(d.getTime())) dates.push({ label: 'Removal', date: d, color: '#22c55e' });
    }

    return dates.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Install Prompt Banner */}
      {showInstallPrompt && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5" />
              <span className="text-sm font-medium">Install this app for offline access</span>
            </div>
            <div className="flex gap-2">
              <button onClick={installApp} className="bg-white text-primary-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition">
                Install
              </button>
              <button onClick={() => setShowInstallPrompt(false)} className="text-white/80 hover:text-white px-2">
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="mono text-[10px] text-primary-600 font-bold tracking-[0.2em] uppercase">
                  Forensic Analysis
                </div>
                <h1 className="text-lg font-bold text-gray-900 -mt-0.5 tracking-tight">
                  Credit Report Analyzer
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                100% Private
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-100 no-print">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Upload', icon: Upload },
              { num: 2, label: 'Review', icon: FileText },
              { num: 3, label: 'Verify', icon: CheckCircle },
              { num: 4, label: 'Analysis', icon: Zap },
              { num: 5, label: 'Export', icon: Download },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`step-indicator ${
                    step > s.num ? 'step-complete' : step === s.num ? 'step-active' : 'step-pending'
                  }`}>
                    {step > s.num ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
                  </div>
                  <span className={`ml-2 text-sm font-medium hidden lg:inline ${
                    step >= s.num ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < 4 && (
                  <div className={`flex-1 h-0.5 mx-3 rounded ${step > s.num ? 'bg-primary-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                Detect Credit Report Violations
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload or paste your credit report text. Our AI-powered analyzer will detect
                FCRA/FDCPA violations and generate dispute letters automatically.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* File Upload */}
              <div className="card p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-4 h-4 text-primary-600" />
                  </div>
                  Upload File
                </h3>
                <label className="upload-zone group">
                  <input
                    type="file"
                    accept=".txt,.pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    disabled={isProcessing}
                  />
                  <div className="w-16 h-16 bg-gray-100 group-hover:bg-primary-100 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                  <span className="text-gray-700 font-medium">
                    {isProcessing ? 'Processing...' : 'Click to upload'}
                  </span>
                  <span className="text-sm text-gray-400 mt-1">
                    TXT or PDF files
                  </span>
                </label>
              </div>

              {/* Text Paste */}
              <div className="card p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary-600" />
                  </div>
                  Paste Text
                </h3>
                <textarea
                  className="textarea h-36 text-sm"
                  placeholder="Paste the account section from your credit report here...

Include: Creditor name, dates, balances, payment history"
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                />
                <button
                  className="btn-primary w-full mt-4"
                  onClick={handleTextSubmit}
                  disabled={!extractedText.trim()}
                >
                  Analyze Text
                </button>
              </div>
            </div>

            {/* Try Sample */}
            <div className="text-center mb-8">
              <button
                onClick={loadSample}
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                <Zap className="w-4 h-4" />
                Try with sample data (shows re-aging violation)
              </button>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Shield, title: '100% Private', desc: 'Data never leaves your device' },
                { icon: Zap, title: '20+ Rules', desc: 'FCRA & FDCPA violation detection' },
                { icon: FileWarning, title: 'Auto Letters', desc: 'Generate dispute documents' },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/50">
                  <f.icon className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{f.title}</div>
                    <div className="text-sm text-gray-500">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Privacy Notice */}
            <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-green-800">Your Privacy is Protected</div>
                  <p className="text-sm text-green-700 mt-1">
                    This app runs entirely in your browser. Your credit report data is processed locally
                    and is never sent to any server. You can even use this app offline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Extracted Text</h2>
            <p className="text-gray-600 mb-6">
              Check that the text looks correct. Fix any errors before continuing.
            </p>

            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Raw Text</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                  {extractedText.length} characters
                </span>
              </div>
              <textarea
                className="textarea h-64 mono text-sm"
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
              />
            </div>

            <div className="flex justify-between">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1 inline" /> Back
              </button>
              <button className="btn-primary" onClick={() => {
                const parsed = parseCreditReport(extractedText);
                setParsedFields(parsed);
                setEditableFields(fieldsToSimple(parsed));
                setStep(3);
              }}>
                Extract Fields <ChevronRight className="w-4 h-4 ml-1 inline" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verify Fields */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Account Details</h2>
            <p className="text-gray-600 mb-6">
              We extracted these fields. Please verify and correct any errors — dates are critical for detection.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Creditor</span>
                </div>
                <div className="font-bold text-gray-900 truncate">
                  {editableFields.furnisherOrCollector || editableFields.originalCreditor || '—'}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Balance</span>
                </div>
                <div className="font-bold text-gray-900">
                  ${editableFields.currentBalance || '0'}
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 border border-red-200/50">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">DOFD</span>
                </div>
                <div className="font-bold text-gray-900">
                  {editableFields.dofd || 'Missing!'}
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/50">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Removal</span>
                </div>
                <div className="font-bold text-gray-900">
                  {editableFields.estimatedRemovalDate || '—'}
                </div>
              </div>
            </div>

            <div className="card p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Account Fields</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries({
                  originalCreditor: 'Original Creditor',
                  furnisherOrCollector: 'Furnisher/Collector',
                  accountType: 'Account Type',
                  accountStatus: 'Account Status',
                  currentBalance: 'Current Balance ($)',
                  originalAmount: 'Original Amount ($)',
                  dateOpened: 'Date Opened',
                  dofd: 'Date of First Delinquency (CRITICAL)',
                  chargeOffDate: 'Charge-Off Date',
                  dateLastPayment: 'Last Payment Date',
                  estimatedRemovalDate: 'Est. Removal Date',
                }).map(([key, label]) => {
                  const field = parsedFields[key];
                  const confidence = field?.confidence || 'Low';
                  const isCritical = key === 'dofd';
                  return (
                    <div key={key} className={isCritical ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          confidence === 'High' ? 'bg-green-100 text-green-700' :
                          confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {confidence}
                        </span>
                      </label>
                      <input
                        type="text"
                        className={`input ${isCritical ? 'border-2 border-red-300 focus:border-red-500' : ''}`}
                        value={(editableFields as any)[key] || ''}
                        onChange={(e) => setEditableFields(prev => ({
                          ...prev,
                          [key]: e.target.value
                        }))}
                        placeholder={key.includes('date') || key === 'dofd' ? 'YYYY-MM-DD' : ''}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consumer Info */}
            <div className="card p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Information (for letters)</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    className="input"
                    value={consumer.name || ''}
                    onChange={(e) => setConsumer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your State</label>
                  <select
                    className="input"
                    value={consumer.state || ''}
                    onChange={(e) => {
                      setConsumer(prev => ({ ...prev, state: e.target.value }));
                      setEditableFields(prev => ({ ...prev, stateCode: e.target.value }));
                    }}
                  >
                    <option value="">Select State</option>
                    {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Address</label>
                  <input
                    type="text"
                    className="input"
                    value={consumer.address || ''}
                    onChange={(e) => setConsumer(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, City, ST 12345"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button className="btn-secondary" onClick={() => setStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-1 inline" /> Back
              </button>
              <button className="btn-primary" onClick={runAnalysis}>
                Run Analysis <Zap className="w-4 h-4 ml-1 inline" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Analysis Results */}
        {step === 4 && riskProfile && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                <p className="text-gray-600">
                  Found {flags.length} potential violation{flags.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => window.print()} className="btn-secondary no-print">
                <Printer className="w-4 h-4 mr-2 inline" /> Print
              </button>
            </div>

            {/* Risk Score Card */}
            <div className={`rounded-2xl p-6 mb-6 border-2 ${
              riskProfile.riskLevel === 'critical' ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100/50' :
              riskProfile.riskLevel === 'high' ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100/50' :
              riskProfile.riskLevel === 'medium' ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-100/50' :
              'border-green-300 bg-gradient-to-br from-green-50 to-green-100/50'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Case Strength Score
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-gray-900">{riskProfile.overallScore}</span>
                    <span className="text-2xl text-gray-400">/100</span>
                  </div>
                  <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                    riskProfile.riskLevel === 'critical' ? 'bg-red-200 text-red-800' :
                    riskProfile.riskLevel === 'high' ? 'bg-orange-200 text-orange-800' :
                    riskProfile.riskLevel === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-green-200 text-green-800'
                  }`}>
                    {riskProfile.riskLevel.toUpperCase()} RISK
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-5 py-2.5 rounded-xl font-bold text-white shadow-lg ${
                    riskProfile.disputeStrength === 'definitive' ? 'bg-gradient-to-r from-red-600 to-red-700' :
                    riskProfile.disputeStrength === 'strong' ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
                    riskProfile.disputeStrength === 'moderate' ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' :
                    'bg-gradient-to-r from-gray-600 to-gray-700'
                  }`}>
                    {riskProfile.disputeStrength.toUpperCase()} CASE
                  </div>
                  {riskProfile.litigationPotential && (
                    <div className="mt-3 flex items-center justify-end gap-2 text-sm font-semibold text-gray-700">
                      <Scale className="w-4 h-4" /> Litigation Potential
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline Visualization */}
            {getTimelineData().length >= 2 && (
              <div className="card p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Account Timeline</h3>
                <div className="relative h-24 flex items-center">
                  <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-full" />
                  {getTimelineData().map((item, i, arr) => {
                    const minDate = arr[0].date.getTime();
                    const maxDate = arr[arr.length - 1].date.getTime();
                    const range = maxDate - minDate || 1;
                    const pos = ((item.date.getTime() - minDate) / range) * 90 + 5;
                    return (
                      <div
                        key={i}
                        className="absolute flex flex-col items-center"
                        style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
                      >
                        <div
                          className="w-4 h-4 rounded-full border-4 border-white shadow-lg"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="mt-2 text-xs font-bold text-gray-600 whitespace-nowrap">{item.label}</div>
                        <div className="text-[10px] text-gray-400 mono">
                          {item.date.toISOString().split('T')[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Flags List */}
            {flags.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Violations Detected ({flags.length})
                </h3>
                {flags.map((flag, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-5 border-l-4 ${
                      flag.severity === 'high' ? 'bg-red-50 border-l-red-500' :
                      flag.severity === 'medium' ? 'bg-amber-50 border-l-amber-500' :
                      'bg-green-50 border-l-green-500'
                    } animate-slide-in`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{flag.ruleName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            flag.severity === 'high' ? 'bg-red-200 text-red-800' :
                            flag.severity === 'medium' ? 'bg-amber-200 text-amber-800' :
                            'bg-green-200 text-green-800'
                          }`}>
                            {flag.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{flag.explanation}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          Legal basis: {flag.legalCitations.join(', ')}
                        </div>
                      </div>
                      <span className="mono text-xs text-gray-400 bg-white px-2 py-1 rounded-lg border">
                        {flag.ruleId}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {flags.length === 0 && (
              <div className="card p-8 mb-6 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">No Obvious Violations Found</h3>
                <p className="text-gray-600 mt-2 max-w-md mx-auto">
                  The automated checks didn't detect clear violations, but manual review is always recommended.
                </p>
              </div>
            )}

            {/* Recommendation */}
            <div className="card p-6 mb-6 bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Recommended Approach</h3>
                  <p className="text-gray-700">{riskProfile.recommendedApproach}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button className="btn-secondary" onClick={() => setStep(3)}>
                <ChevronLeft className="w-4 h-4 mr-1 inline" /> Back
              </button>
              <button className="btn-primary" onClick={() => setStep(5)}>
                Generate Documents <ChevronRight className="w-4 h-4 ml-1 inline" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Generate Documents */}
        {step === 5 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Download Your Documents</h2>
            <p className="text-gray-600 mb-6">
              Click any card to download that document.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => downloadLetter('bureau')}
                className="card p-6 text-left hover:shadow-lg hover:border-primary-300 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Bureau Dispute Letter</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Send to Experian, Equifax, or TransUnion to dispute inaccuracies
                </p>
                <div className="mt-3 text-primary-600 text-sm font-semibold flex items-center gap-1">
                  Download <Download className="w-4 h-4" />
                </div>
              </button>

              <button
                onClick={() => downloadLetter('validation')}
                className="card p-6 text-left hover:shadow-lg hover:border-primary-300 transition-all group"
              >
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileWarning className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Debt Validation Letter</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Send to the debt collector to demand proof of the debt
                </p>
                <div className="mt-3 text-primary-600 text-sm font-semibold flex items-center gap-1">
                  Download <Download className="w-4 h-4" />
                </div>
              </button>

              <button
                onClick={() => downloadLetter('cfpb')}
                className="card p-6 text-left hover:shadow-lg hover:border-primary-300 transition-all group"
              >
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Scale className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">CFPB Complaint</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Pre-written narrative for filing a complaint with the CFPB
                </p>
                <div className="mt-3 text-primary-600 text-sm font-semibold flex items-center gap-1">
                  Download <Download className="w-4 h-4" />
                </div>
              </button>

              <button
                onClick={() => downloadLetter('summary')}
                className="card p-6 text-left hover:shadow-lg hover:border-primary-300 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Case Summary</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Complete analysis report with all findings for your records
                </p>
                <div className="mt-3 text-primary-600 text-sm font-semibold flex items-center gap-1">
                  Download <Download className="w-4 h-4" />
                </div>
              </button>
            </div>

            {/* External Resources */}
            <div className="card p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Helpful Resources</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <a
                  href="https://www.consumerfinance.gov/complaint/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">CFPB Complaint Portal</div>
                    <div className="text-xs text-gray-500">File your complaint online</div>
                  </div>
                </a>
                <a
                  href="https://www.annualcreditreport.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Free Credit Reports</div>
                    <div className="text-xs text-gray-500">Official source for free reports</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Legal Disclaimer */}
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl mb-6">
              <div className="font-semibold text-amber-800 mb-1">Important Disclaimer</div>
              <p className="text-sm text-amber-700">
                This tool provides information only and is not legal advice. For serious violations,
                consider consulting with a consumer rights attorney. Many offer free consultations for FCRA cases.
              </p>
            </div>

            <div className="flex justify-between">
              <button className="btn-secondary" onClick={() => setStep(4)}>
                <ChevronLeft className="w-4 h-4 mr-1 inline" /> Back to Analysis
              </button>
              <button className="btn-primary" onClick={() => {
                setStep(1);
                setExtractedText('');
                setParsedFields({});
                setEditableFields({});
                setFlags([]);
                setRiskProfile(null);
              }}>
                Analyze Another Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto no-print">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary-600" />
              <span className="font-bold text-gray-900">Credit Report Analyzer</span>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              A free civil rights tool for detecting FCRA/FDCPA violations
            </p>
            <p className="text-xs text-gray-400">
              100% client-side processing • Data never leaves your device • Open source
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
