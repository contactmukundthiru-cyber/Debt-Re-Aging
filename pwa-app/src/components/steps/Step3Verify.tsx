'use strict';

import React from 'react';
import { FIELD_CONFIG, ACCOUNT_TYPES, STATUSES, STATES, Step } from '../../lib/constants';
import { getDateValidation, getCurrencyValidation, getDateOrderIssues } from '../../lib/validation';
import { CreditFields } from '../../lib/rules';

interface Step3VerifyProps {
  editableFields: Partial<CreditFields>;
  setEditableFields: React.Dispatch<React.SetStateAction<Partial<CreditFields>>>;
  consumer: { name?: string; address?: string; state?: string };
  setConsumer: React.Dispatch<React.SetStateAction<{ name?: string; address?: string; state?: string }>>;
  runAnalysis: () => void;
  isAnalyzing: boolean;
  setStep: (step: Step) => void;
  showHelp: string | null;
  setShowHelp: (key: string | null) => void;
}

const Step3Verify: React.FC<Step3VerifyProps> = ({
  editableFields,
  setEditableFields,
  consumer,
  setConsumer,
  runAnalysis,
  isAnalyzing,
  setStep,
  showHelp,
  setShowHelp,
}) => {
  const dateFields = FIELD_CONFIG.filter(f => f.section === 'dates');
  const amountFields = FIELD_CONFIG.filter(f => f.section === 'amounts');
  const dateIssues = dateFields
    .map(field => {
      const value = (editableFields as Record<string, string>)[field.key] || '';
      const validation = getDateValidation(value, !!field.required);
      return {
        key: field.key,
        label: field.label,
        required: !!field.required,
        valid: validation.valid,
        message: validation.message
      };
    })
    .filter(issue => !issue.valid);

  const amountIssues = amountFields
    .map(field => {
      const value = (editableFields as Record<string, string>)[field.key] || '';
      const validation = getCurrencyValidation(value);
      return {
        key: field.key,
        label: field.label,
        valid: validation.valid,
        message: validation.message
      };
    })
    .filter(issue => !issue.valid);

  const blockingIssues = dateIssues.filter(issue => issue.required);
  const logicalIssues = getDateOrderIssues(editableFields as Record<string, string | undefined>);
  const logicalBlocking = logicalIssues.filter(issue => issue.severity === 'blocking');
  const canAnalyze = blockingIssues.length === 0 && logicalBlocking.length === 0;

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="heading-lg mb-2 dark:text-white">Verify Account Details</h2>
        <p className="body-md text-gray-600 dark:text-gray-400">
          Accurate dates are critical for violation detection. Hover over labels for guidance.
        </p>
      </div>

      {/* Account Info Section */}
      <div className="panel mb-4 dark:bg-gray-800/50 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
          <p className="heading-sm dark:text-white">Account Information</p>
        </div>
        <div className="p-4 grid sm:grid-cols-2 gap-4">
          {FIELD_CONFIG.filter(f => f.section === 'account').map(field => (
            <div key={field.key} className="relative">
              <label
                htmlFor={field.key}
                className="field-label flex items-center gap-1 cursor-help dark:text-gray-300"
                onMouseEnter={() => setShowHelp(field.key)}
                onMouseLeave={() => setShowHelp(null)}
              >
                {field.label}
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </label>
              {showHelp === field.key && field.help && (
                <div className="absolute z-10 left-0 top-full mt-1 p-2 bg-gray-900 dark:bg-black text-white text-xs rounded shadow-lg max-w-xs transition-opacity">
                  {field.help}
                </div>
              )}
              {field.key === 'accountType' ? (
                <select
                  id={field.key}
                  className="input dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  value={(editableFields as Record<string, string>)[field.key] || ''}
                  onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                >
                  <option value="">Select type...</option>
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : field.key === 'accountStatus' ? (
                <select
                  id={field.key}
                  className="input dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  value={(editableFields as Record<string, string>)[field.key] || ''}
                  onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                >
                  <option value="">Select status...</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input
                  id={field.key}
                  type="text"
                  className="input dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  value={(editableFields as Record<string, string>)[field.key] || ''}
                  onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Amounts Section */}
      <div className="panel mb-4 dark:bg-gray-800/50 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
          <p className="heading-sm dark:text-white">Financial Amounts</p>
          <p className="body-sm text-gray-500 dark:text-gray-400 mt-0.5">Enter numbers only; commas and $ are OK.</p>
        </div>
        <div className="p-4 grid sm:grid-cols-3 gap-4">
          {FIELD_CONFIG.filter(f => f.section === 'amounts').map(field => {
            const fieldValue = (editableFields as Record<string, string>)[field.key] || '';
            const validation = getCurrencyValidation(fieldValue);

            return (
              <div key={field.key} className="relative">
                <label
                  htmlFor={field.key}
                  className="field-label flex items-center gap-1 cursor-help dark:text-gray-300"
                  onMouseEnter={() => setShowHelp(field.key)}
                  onMouseLeave={() => setShowHelp(null)}
                >
                  {field.label}
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </label>
                {showHelp === field.key && field.help && (
                  <div className="absolute z-10 left-0 top-full mt-1 p-2 bg-gray-900 dark:bg-black text-white text-xs rounded shadow-lg max-w-xs">
                    {field.help}
                  </div>
                )}
                <input
                  id={field.key}
                  type="text"
                  className={`input font-mono dark:bg-gray-900 dark:text-white ${
                    !validation.valid
                      ? 'border-red-300 bg-red-50/50 focus:border-red-500 dark:border-red-900 dark:bg-red-950/20'
                      : fieldValue && validation.valid
                        ? 'border-green-300 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                        : 'dark:border-gray-700'
                  }`}
                  value={fieldValue}
                  onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder="$0.00"
                  aria-invalid={!validation.valid ? "true" : "false"}
                  aria-describedby={!validation.valid ? `${field.key}-error` : undefined}
                />
                {!validation.valid && validation.message && (
                  <p id={`${field.key}-error`} className="text-xs text-red-500 mt-1">{validation.message}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dates Section */}
      <div className="panel mb-4 dark:bg-gray-800/50 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
          <p className="heading-sm dark:text-white">Critical Dates</p>
          <p className="body-sm text-gray-500 dark:text-gray-400 mt-0.5">These dates determine violations. Enter as YYYY-MM-DD.</p>
        </div>
        <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FIELD_CONFIG.filter(f => f.section === 'dates').map(field => {
            const fieldValue = (editableFields as Record<string, string>)[field.key] || '';
            const validation = getDateValidation(fieldValue, !!field.required);

            return (
              <div key={field.key} className="relative">
                <label
                  htmlFor={field.key}
                  className="field-label flex items-center gap-1 cursor-help dark:text-gray-300"
                  onMouseEnter={() => setShowHelp(field.key)}
                  onMouseLeave={() => setShowHelp(null)}
                >
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </label>
                {showHelp === field.key && field.help && (
                  <div className="absolute z-10 left-0 top-full mt-1 p-2 bg-gray-900 dark:bg-black text-white text-xs rounded shadow-lg max-w-xs">
                    {field.help}
                  </div>
                )}
                <div className="relative">
                  <input
                    id={field.key}
                    type="text"
                    className={`input font-mono pr-8 dark:bg-gray-900 dark:text-white ${
                      !validation.valid
                        ? 'border-red-300 bg-red-50/50 focus:border-red-500 dark:border-red-900 dark:bg-red-950/20'
                        : fieldValue && validation.valid
                          ? 'border-green-300 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                          : 'dark:border-gray-700'
                    }`}
                    value={fieldValue}
                    onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder="YYYY-MM-DD"
                    aria-invalid={!validation.valid ? "true" : "false"}
                    aria-describedby={!validation.valid ? `${field.key}-error` : undefined}
                  />
                  {fieldValue && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                      {validation.valid ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </span>
                  )}
                </div>
                {!validation.valid && validation.message && (
                  <p id={`${field.key}-error`} className="text-xs text-red-500 mt-1">{validation.message}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Consumer Info */}
      <div className="panel mb-6 dark:bg-gray-800/50 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
          <p className="heading-sm dark:text-white">Your Information</p>
          <p className="body-sm text-gray-500 dark:text-gray-400 mt-0.5">Optional. Used for personalized dispute letters.</p>
        </div>
        <div className="p-4 grid sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="consumer-name" className="field-label dark:text-gray-300">Full Name</label>
            <input
              id="consumer-name"
              type="text"
              className="input dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              value={consumer.name || ''}
              onChange={(e) => setConsumer(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="consumer-address" className="field-label dark:text-gray-300">Address</label>
            <input
              id="consumer-address"
              type="text"
              className="input dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              value={consumer.address || ''}
              onChange={(e) => setConsumer(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="consumer-state" className="field-label dark:text-gray-300">State</label>
            <select
              id="consumer-state"
              className="input dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              value={consumer.state || ''}
              onChange={(e) => {
                setConsumer(prev => ({ ...prev, state: e.target.value }));
                setEditableFields(prev => ({ ...prev, stateCode: e.target.value }));
              }}
            >
              <option value="">Select...</option>
              {STATES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
        </div>
      </div>

      {(dateIssues.length > 0 || amountIssues.length > 0 || logicalIssues.length > 0) && (
        <div className="notice max-w-4xl mx-auto mb-6 border-amber-200 bg-amber-50/60 dark:bg-amber-900/10 dark:border-amber-900/30" aria-live="polite">
          <p className="heading-sm text-amber-800 dark:text-amber-200 mb-2">Validation Check</p>
          {(blockingIssues.length > 0 || logicalBlocking.length > 0) && (
            <p className="body-sm text-amber-700 dark:text-amber-300 mb-2">
              Required fields need attention before analysis.
            </p>
          )}
          <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-1">
            {dateIssues.map(issue => (
              <li key={`date-${issue.key}`}>{issue.label}: {issue.message}</li>
            ))}
            {amountIssues.map(issue => (
              <li key={`amount-${issue.key}`}>{issue.label}: {issue.message}</li>
            ))}
            {logicalIssues.map((issue, index) => (
              <li key={`logic-${issue.field}-${index}`}>
                {issue.message}{issue.severity === 'blocking' ? ' (blocking)' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!canAnalyze && (
        <p className="text-sm text-amber-600 dark:text-amber-300 mb-3">
          Complete required fields to run analysis.
        </p>
      )}
      <div className="flex justify-between">
        <button 
          type="button" 
          className="btn btn-secondary dark:border-gray-700 dark:text-white dark:hover:bg-gray-800" 
          onClick={() => setStep(2)} 
          disabled={isAnalyzing}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary min-w-[140px]"
          onClick={runAnalysis}
          disabled={isAnalyzing || !canAnalyze}
        >
          {isAnalyzing ? (
            <>
              <div className="spinner w-4 h-4 border-2 border-white/30 border-t-white mr-2" />
              Analyzing...
            </>
          ) : (
            'Run Analysis'
          )}
        </button>
      </div>
    </div>
  );
};

export default Step3Verify;
