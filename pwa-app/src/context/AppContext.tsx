'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { CreditFields, RuleFlag, RiskProfile } from '../lib/rules';
import { ConsumerInfo, AnalyzedAccount } from '../lib/types';

// Types
export type Step = 1 | 2 | 3 | 4 | 5 | 6;

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
  isPrivacyMode: boolean;

  // Active Tab
  activeTab: string;
  showSecurityModal: boolean;
  showStatsBar: boolean;
}

// Actions
type AppAction =
  | { type: 'SET_STEP'; payload: Step }
  | { type: 'SET_STEP_FUNC'; payload: Step | ((prev: Step) => Step) }
  | { type: 'SET_RAW_TEXT'; payload: string }
  | { type: 'SET_FILE_NAME'; payload: string | null }
  | { type: 'SET_EDITABLE_FIELDS'; payload: CreditFields }
  | { type: 'SET_EDITABLE_FIELDS_FUNC'; payload: CreditFields | ((prev: CreditFields) => CreditFields) }
  | { type: 'UPDATE_FIELD'; payload: { key: keyof CreditFields; value: string } }
  | { type: 'SET_CONSUMER'; payload: Partial<ConsumerInfo> }
  | { type: 'SET_CONSUMER_FUNC'; payload: Partial<ConsumerInfo> | ((prev: ConsumerInfo) => ConsumerInfo) }
  | { type: 'SET_FLAGS'; payload: RuleFlag[] }
  | { type: 'SET_RISK_PROFILE'; payload: RiskProfile | null }
  | { type: 'SET_ANALYZED_ACCOUNTS'; payload: AnalyzedAccount[] }
  | { type: 'SET_SELECTED_ACCOUNT'; payload: string | null }
  | { type: 'SET_PROCESSING'; payload: { isProcessing: boolean; progress?: number; progressText?: string } }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_DARK_MODE'; payload: boolean }
  | { type: 'SET_PRIVACY_MODE'; payload: boolean }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_SECURITY_MODAL'; payload: boolean }
  | { type: 'SET_STATS_BAR'; payload: boolean }
  | { type: 'RESET' };

// Initial State
const initialState: AppState = {
  step: 1,
  rawText: '',
  fileName: null,
  editableFields: {},
  consumer: { name: '', address: '', city: '', state: '', zip: '' },
  flags: [],
  riskProfile: null,
  analyzedAccounts: [],
  selectedAccountId: null,
  isProcessing: false,
  progress: 0,
  progressText: '',
  isAnalyzing: false,
  darkMode: false,
  isPrivacyMode: false,
  activeTab: 'violations',
  showSecurityModal: false,
  showStatsBar: false,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_STEP_FUNC': {
      const nextStep = typeof action.payload === 'function' ? action.payload(state.step) : action.payload;
      return { ...state, step: nextStep };
    }

    case 'SET_RAW_TEXT':
      return { ...state, rawText: action.payload };

    case 'SET_FILE_NAME':
      return { ...state, fileName: action.payload };

    case 'SET_EDITABLE_FIELDS':
      return { ...state, editableFields: action.payload };

    case 'SET_EDITABLE_FIELDS_FUNC': {
      const newFields = typeof action.payload === 'function' ? action.payload(state.editableFields) : action.payload;
      return { ...state, editableFields: newFields };
    }
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

    case 'SET_CONSUMER_FUNC': {
      const newConsumer = typeof action.payload === 'function' ? action.payload(state.consumer) : { ...state.consumer, ...action.payload };
      return { ...state, consumer: newConsumer };
    }

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

    case 'SET_PRIVACY_MODE':
      return { ...state, isPrivacyMode: action.payload };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_SECURITY_MODAL':
      return { ...state, showSecurityModal: action.payload };
    case 'SET_STATS_BAR':
      return { ...state, showStatsBar: action.payload };

    case 'RESET':
      return {
        ...initialState,
        darkMode: state.darkMode, // Preserve dark mode preference
        showStatsBar: state.showStatsBar, // Preserve stats bar preference
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
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  setRawText: (text: string) => void;
  setFileName: (name: string | null) => void;
  setEditableFields: React.Dispatch<React.SetStateAction<CreditFields>>;
  updateField: (key: keyof CreditFields, value: string) => void;
  setConsumer: React.Dispatch<React.SetStateAction<ConsumerInfo>>;
  setFlags: (flags: RuleFlag[]) => void;
  setRiskProfile: (profile: RiskProfile | null) => void;
  setAnalyzedAccounts: (accounts: AnalyzedAccount[]) => void;
  setSelectedAccount: (id: string | null) => void;
  setProcessing: (isProcessing: boolean, progress?: number, progressText?: string) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setDarkMode: (darkMode: boolean) => void;
  setPrivacyMode: (isPrivacyMode: boolean) => void;
  setActiveTab: (tab: string) => void;
  setStatsBar: (showStatsBar: boolean) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Convenience action creators
  const setStep = useCallback((step: Step | ((prev: Step) => Step)) => {
    dispatch({ type: 'SET_STEP_FUNC', payload: step });
  }, []);

  const setRawText = useCallback((text: string) => {
    dispatch({ type: 'SET_RAW_TEXT', payload: text });
  }, []);

  const setFileName = useCallback((name: string | null) => {
    dispatch({ type: 'SET_FILE_NAME', payload: name });
  }, []);

  const setEditableFields = useCallback((fields: CreditFields | ((prev: CreditFields) => CreditFields)) => {
    dispatch({ type: 'SET_EDITABLE_FIELDS_FUNC', payload: fields });
  }, []);

  const updateField = useCallback((key: keyof CreditFields, value: string) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { key, value } });
  }, []);

  const setConsumer = useCallback((info: Partial<ConsumerInfo> | ((prev: ConsumerInfo) => ConsumerInfo)) => {
    dispatch({ type: 'SET_CONSUMER_FUNC', payload: info });
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

  const setPrivacyMode = useCallback((isPrivacyMode: boolean) => {
    dispatch({ type: 'SET_PRIVACY_MODE', payload: isPrivacyMode });
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  const setStatsBar = useCallback((showStatsBar: boolean) => {
    dispatch({ type: 'SET_STATS_BAR', payload: showStatsBar });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Persistent Theme Support: read initial theme from DOM (set by layout script) or localStorage
  React.useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    const saved = localStorage.getItem('cra_dark_mode');
    const savedPrivacy = localStorage.getItem('cra_privacy_mode');
    const savedStatsBar = localStorage.getItem('cra_show_stats_bar');
    if (saved !== null) {
      dispatch({ type: 'SET_DARK_MODE', payload: saved === 'true' });
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      dispatch({ type: 'SET_DARK_MODE', payload: prefersDark });
    }
    if (savedPrivacy !== null) {
      dispatch({ type: 'SET_PRIVACY_MODE', payload: savedPrivacy === 'true' });
    }
    if (savedStatsBar !== null) {
      dispatch({ type: 'SET_STATS_BAR', payload: savedStatsBar === 'true' });
    }
  }, []);

  // Follow system preference when user has never set a preference
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (localStorage.getItem('cra_dark_mode') !== null) return;
      dispatch({ type: 'SET_DARK_MODE', payload: mq.matches });
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Sync privacy mode to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cra_privacy_mode', state.isPrivacyMode ? 'true' : 'false');
    }
  }, [state.isPrivacyMode]);

  // Sync stats bar to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cra_show_stats_bar', state.showStatsBar ? 'true' : 'false');
    }
  }, [state.showStatsBar]);

  // Sync theme to DOM and localStorage; avoid overwriting script-set dark on first paint
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (state.darkMode) {
      root.classList.add('dark');
      localStorage.setItem('cra_dark_mode', 'true');
    } else {
      const stored = localStorage.getItem('cra_dark_mode');
      const scriptSetDark = root.classList.contains('dark') && stored !== 'false';
      if (scriptSetDark) {
        // Layout script set dark from system pref; sync state to match
        dispatch({ type: 'SET_DARK_MODE', payload: true });
      } else {
        root.classList.remove('dark');
        localStorage.setItem('cra_dark_mode', 'false');
      }
    }
  }, [state.darkMode]);

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
    setPrivacyMode,
    setActiveTab,
    setStatsBar,
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
