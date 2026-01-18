'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { CreditFields, RuleFlag, RiskProfile } from '../lib/rules';

// Types
export type Step = 1 | 2 | 3 | 4 | 5 | 6;

export interface ConsumerInfo {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  ssn?: string;
  dob?: string;
}

export interface AnalyzedAccount {
  id: string;
  rawText: string;
  fields: CreditFields;
  flags: RuleFlag[];
  risk: RiskProfile;
}

export interface AppState {
  // Navigation
  step: Step;

  // Data
  rawText: string;
  fileName: string | null;
  editableFields: CreditFields;
  consumer: ConsumerInfo;

  // Analysis Results
  flags: RuleFlag[];
  riskProfile: RiskProfile | null;
  analyzedAccounts: AnalyzedAccount[];
  selectedAccountId: string | null;

  // UI State
  isProcessing: boolean;
  progress: number;
  progressText: string;
  isAnalyzing: boolean;
  darkMode: boolean;

  // Active Tab
  activeTab: string;
}

// Actions
type AppAction =
  | { type: 'SET_STEP'; payload: Step }
  | { type: 'SET_RAW_TEXT'; payload: string }
  | { type: 'SET_FILE_NAME'; payload: string | null }
  | { type: 'SET_EDITABLE_FIELDS'; payload: CreditFields }
  | { type: 'UPDATE_FIELD'; payload: { key: keyof CreditFields; value: string } }
  | { type: 'SET_CONSUMER'; payload: Partial<ConsumerInfo> }
  | { type: 'SET_FLAGS'; payload: RuleFlag[] }
  | { type: 'SET_RISK_PROFILE'; payload: RiskProfile | null }
  | { type: 'SET_ANALYZED_ACCOUNTS'; payload: AnalyzedAccount[] }
  | { type: 'SET_SELECTED_ACCOUNT'; payload: string | null }
  | { type: 'SET_PROCESSING'; payload: { isProcessing: boolean; progress?: number; progressText?: string } }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_DARK_MODE'; payload: boolean }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'RESET' };

// Initial State
const initialState: AppState = {
  step: 1,
  rawText: '',
  fileName: null,
  editableFields: {},
  consumer: {},
  flags: [],
  riskProfile: null,
  analyzedAccounts: [],
  selectedAccountId: null,
  isProcessing: false,
  progress: 0,
  progressText: '',
  isAnalyzing: false,
  darkMode: false,
  activeTab: 'violations',
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };

    case 'SET_RAW_TEXT':
      return { ...state, rawText: action.payload };

    case 'SET_FILE_NAME':
      return { ...state, fileName: action.payload };

    case 'SET_EDITABLE_FIELDS':
      return { ...state, editableFields: action.payload };

    case 'UPDATE_FIELD':
      return {
        ...state,
        editableFields: {
          ...state.editableFields,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_CONSUMER':
      return { ...state, consumer: { ...state.consumer, ...action.payload } };

    case 'SET_FLAGS':
      return { ...state, flags: action.payload };

    case 'SET_RISK_PROFILE':
      return { ...state, riskProfile: action.payload };

    case 'SET_ANALYZED_ACCOUNTS':
      return { ...state, analyzedAccounts: action.payload };

    case 'SET_SELECTED_ACCOUNT':
      return { ...state, selectedAccountId: action.payload };

    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload.isProcessing,
        progress: action.payload.progress ?? state.progress,
        progressText: action.payload.progressText ?? state.progressText,
      };

    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };

    case 'SET_DARK_MODE':
      return { ...state, darkMode: action.payload };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'RESET':
      return {
        ...initialState,
        darkMode: state.darkMode, // Preserve dark mode preference
      };

    default:
      return state;
  }
}

// Context
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience actions
  setStep: (step: Step) => void;
  setRawText: (text: string) => void;
  setFileName: (name: string | null) => void;
  setEditableFields: (fields: CreditFields) => void;
  updateField: (key: keyof CreditFields, value: string) => void;
  setConsumer: (info: Partial<ConsumerInfo>) => void;
  setFlags: (flags: RuleFlag[]) => void;
  setRiskProfile: (profile: RiskProfile | null) => void;
  setAnalyzedAccounts: (accounts: AnalyzedAccount[]) => void;
  setSelectedAccount: (id: string | null) => void;
  setProcessing: (isProcessing: boolean, progress?: number, progressText?: string) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setDarkMode: (darkMode: boolean) => void;
  setActiveTab: (tab: string) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Convenience action creators
  const setStep = useCallback((step: Step) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const setRawText = useCallback((text: string) => {
    dispatch({ type: 'SET_RAW_TEXT', payload: text });
  }, []);

  const setFileName = useCallback((name: string | null) => {
    dispatch({ type: 'SET_FILE_NAME', payload: name });
  }, []);

  const setEditableFields = useCallback((fields: CreditFields) => {
    dispatch({ type: 'SET_EDITABLE_FIELDS', payload: fields });
  }, []);

  const updateField = useCallback((key: keyof CreditFields, value: string) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { key, value } });
  }, []);

  const setConsumer = useCallback((info: Partial<ConsumerInfo>) => {
    dispatch({ type: 'SET_CONSUMER', payload: info });
  }, []);

  const setFlags = useCallback((flags: RuleFlag[]) => {
    dispatch({ type: 'SET_FLAGS', payload: flags });
  }, []);

  const setRiskProfile = useCallback((profile: RiskProfile | null) => {
    dispatch({ type: 'SET_RISK_PROFILE', payload: profile });
  }, []);

  const setAnalyzedAccounts = useCallback((accounts: AnalyzedAccount[]) => {
    dispatch({ type: 'SET_ANALYZED_ACCOUNTS', payload: accounts });
  }, []);

  const setSelectedAccount = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: id });
  }, []);

  const setProcessing = useCallback((isProcessing: boolean, progress?: number, progressText?: string) => {
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing, progress, progressText } });
  }, []);

  const setAnalyzing = useCallback((isAnalyzing: boolean) => {
    dispatch({ type: 'SET_ANALYZING', payload: isAnalyzing });
  }, []);

  const setDarkMode = useCallback((darkMode: boolean) => {
    dispatch({ type: 'SET_DARK_MODE', payload: darkMode });
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value: AppContextValue = {
    state,
    dispatch,
    setStep,
    setRawText,
    setFileName,
    setEditableFields,
    updateField,
    setConsumer,
    setFlags,
    setRiskProfile,
    setAnalyzedAccounts,
    setSelectedAccount,
    setProcessing,
    setAnalyzing,
    setDarkMode,
    setActiveTab,
    reset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
