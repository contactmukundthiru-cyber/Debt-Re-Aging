'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Download, ChevronRight, ChevronLeft, Shield, Scale } from 'lucide-react';
import { parseCreditReport, fieldsToSimple, getExtractionQuality } from '../lib/parser';
import { runRules, calculateRiskProfile, CreditFields, RuleFlag, RiskProfile } from '../lib/rules';
import { generateBureauLetter, generateValidationLetter, generateCaseSummary, ConsumerInfo } from '../lib/generator';

type Step = 1 | 2 | 3 | 4 | 5;

interface ParsedField {
  value: string;
  confidence: 'High' | 'Medium' | 'Low';
  sourceText: string;
}

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [extractedText, setExtractedText] = useState('');
  const [parsedFields, setParsedFields] = useState<Record<string, ParsedField>>({});
  const [editableFields, setEditableFields] = useState<CreditFields>({});
  const [flags, setFlags] = useState<RuleFlag[]>([]);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [consumer, setConsumer] = useState<ConsumerInfo>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);

    try {
      // For text files and some PDFs
      const text = await file.text();
      setExtractedText(text);

      // Parse the text
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
  const downloadLetter = useCallback((type: 'bureau' | 'validation' | 'summary') => {
    let content = '';
    let filename = '';

    if (type === 'bureau') {
      content = generateBureauLetter(editableFields, flags, consumer);
      filename = 'bureau_dispute_letter.txt';
    } else if (type === 'validation') {
      content = generateValidationLetter(editableFields, flags, consumer);
      filename = 'debt_validation_letter.txt';
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="mono text-xs text-primary-600 font-semibold tracking-wider">
                FORENSIC ANALYSIS SYSTEM
              </div>
              <h1 className="text-xl font-bold text-gray-900 -mt-0.5">
                Credit Report Analyzer
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              <span className="text-sm text-gray-600 hidden sm:inline">100% Private - Data Never Leaves Your Device</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-100 no-print">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Upload' },
              { num: 2, label: 'Review' },
              { num: 3, label: 'Verify' },
              { num: 4, label: 'Analysis' },
              { num: 5, label: 'Generate' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`step-indicator ${
                  step > s.num ? 'step-complete' : step === s.num ? 'step-active' : 'step-pending'
                }`}>
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                </div>
                <span className={`ml-2 text-sm font-medium hidden sm:inline ${
                  step >= s.num ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {s.label}
                </span>
                {i < 4 && (
                  <ChevronRight className="w-5 h-5 text-gray-300 mx-2 hidden sm:block" />
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
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Upload Your Credit Report
              </h2>
              <p className="text-gray-600">
                Upload a file or paste the text from your credit report account section
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* File Upload */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary-600" />
                  Upload File
                </h3>
                <label className="upload-zone">
                  <input
                    type="file"
                    accept=".txt,.pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    disabled={isProcessing}
                  />
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <span className="text-gray-600 font-medium">
                    {isProcessing ? 'Processing...' : 'Click to upload or drag & drop'}
                  </span>
                  <span className="text-sm text-gray-400 mt-1">
                    PDF, TXT, or image files
                  </span>
                </label>
              </div>

              {/* Text Paste */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Paste Text
                </h3>
                <textarea
                  className="textarea h-40"
                  placeholder="Paste the account details from your credit report here..."
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                />
                <button
                  className="btn-primary w-full mt-4"
                  onClick={handleTextSubmit}
                  disabled={!extractedText.trim()}
                >
                  Continue
                </button>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-green-800">Your Privacy is Protected</div>
                  <p className="text-sm text-green-700 mt-1">
                    All processing happens locally in your browser. Your credit report data is never uploaded to any server.
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
                Continue <ChevronRight className="w-4 h-4 ml-1 inline" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verify Fields */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Account Details</h2>
            <p className="text-gray-600 mb-6">
              We extracted these fields. Please verify and correct any errors.
            </p>

            <div className="card p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries({
                  originalCreditor: 'Original Creditor',
                  furnisherOrCollector: 'Furnisher/Collector',
                  accountType: 'Account Type',
                  accountStatus: 'Account Status',
                  currentBalance: 'Current Balance',
                  originalAmount: 'Original Amount',
                  dateOpened: 'Date Opened',
                  dofd: 'Date of First Delinquency',
                  chargeOffDate: 'Charge-Off Date',
                  dateLastPayment: 'Last Payment Date',
                  estimatedRemovalDate: 'Est. Removal Date',
                }).map(([key, label]) => {
                  const field = parsedFields[key];
                  const confidence = field?.confidence || 'Low';
                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          confidence === 'High' ? 'bg-green-100 text-green-700' :
                          confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {confidence}
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input"
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
              <h3 className="font-semibold text-gray-900 mb-4">Your Information (Optional)</h3>
              <div className="grid md:grid-cols-2 gap-4">
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Address</label>
                  <textarea
                    className="textarea h-20"
                    value={consumer.address || ''}
                    onChange={(e) => setConsumer(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St&#10;City, State ZIP"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button className="btn-secondary" onClick={() => setStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-1 inline" /> Back
              </button>
              <button className="btn-primary" onClick={runAnalysis}>
                Run Analysis <ChevronRight className="w-4 h-4 ml-1 inline" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Analysis Results */}
        {step === 4 && riskProfile && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Results</h2>
            <p className="text-gray-600 mb-6">
              We found {flags.length} potential issue{flags.length !== 1 ? 's' : ''} with this account.
            </p>

            {/* Risk Score Card */}
            <div className={`card p-6 mb-6 border-l-4 ${
              riskProfile.riskLevel === 'critical' ? 'border-l-red-500 bg-red-50' :
              riskProfile.riskLevel === 'high' ? 'border-l-orange-500 bg-orange-50' :
              riskProfile.riskLevel === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
              'border-l-green-500 bg-green-50'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Case Strength Score
                  </div>
                  <div className="text-4xl font-bold text-gray-900">
                    {riskProfile.overallScore}/100
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Risk Level: <span className="font-semibold uppercase">{riskProfile.riskLevel}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-4 py-2 rounded-full font-semibold text-white ${
                    riskProfile.disputeStrength === 'definitive' ? 'bg-red-600' :
                    riskProfile.disputeStrength === 'strong' ? 'bg-orange-600' :
                    riskProfile.disputeStrength === 'moderate' ? 'bg-yellow-600' :
                    'bg-gray-600'
                  }`}>
                    {riskProfile.disputeStrength.toUpperCase()} CASE
                  </div>
                  {riskProfile.litigationPotential && (
                    <div className="text-sm text-gray-600 mt-2 flex items-center justify-end gap-1">
                      <Scale className="w-4 h-4" /> Litigation Potential
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Flags List */}
            {flags.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900">Issues Found ({flags.length})</h3>
                {flags.map((flag, i) => (
                  <div key={i} className={`alert-${flag.severity} animate-slide-in`} style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-5 h-5 ${
                            flag.severity === 'high' ? 'text-red-600' :
                            flag.severity === 'medium' ? 'text-amber-600' :
                            'text-green-600'
                          }`} />
                          <span className="font-semibold text-gray-900">{flag.ruleName}</span>
                        </div>
                        <p className="text-gray-700 mt-1">{flag.explanation}</p>
                      </div>
                      <span className="mono text-xs text-gray-400 bg-white px-2 py-1 rounded">
                        {flag.ruleId}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {flags.length === 0 && (
              <div className="card p-6 mb-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">No Obvious Issues Found</h3>
                <p className="text-gray-600 mt-1">
                  The automated checks didn't find clear violations, but manual review is always recommended.
                </p>
              </div>
            )}

            {/* Recommendation */}
            <div className="card p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Recommended Approach</h3>
              <p className="text-gray-700">{riskProfile.recommendedApproach}</p>
            </div>

            <div className="flex justify-between">
              <button className="btn-secondary" onClick={() => setStep(3)}>
                <ChevronLeft className="w-4 h-4 mr-1 inline" /> Back
              </button>
              <button className="btn-primary" onClick={() => setStep(5)}>
                Generate Letters <ChevronRight className="w-4 h-4 ml-1 inline" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Generate Documents */}
        {step === 5 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Download Your Documents</h2>
            <p className="text-gray-600 mb-6">
              Click to download dispute letters and your case summary.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => downloadLetter('bureau')}
                className="card p-6 text-left hover:border-primary-300 transition-colors"
              >
                <Download className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Bureau Dispute Letter</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Send to Experian, Equifax, or TransUnion
                </p>
              </button>

              <button
                onClick={() => downloadLetter('validation')}
                className="card p-6 text-left hover:border-primary-300 transition-colors"
              >
                <Download className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Debt Validation Letter</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Send to the debt collector/furnisher
                </p>
              </button>

              <button
                onClick={() => downloadLetter('summary')}
                className="card p-6 text-left hover:border-primary-300 transition-colors"
              >
                <Download className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Case Summary</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Complete analysis for your records
                </p>
              </button>
            </div>

            {/* Legal Disclaimer */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
              <div className="font-semibold text-amber-800">Important Disclaimer</div>
              <p className="text-sm text-amber-700 mt-1">
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
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Credit Report Analyzer - A free civil rights tool</p>
          <p className="mt-1">Data is processed locally and never sent to any server</p>
        </div>
      </footer>
    </main>
  );
}
