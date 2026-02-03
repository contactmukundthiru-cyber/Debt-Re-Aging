import { useState, useCallback, useEffect } from 'react';
import { 
    AnalysisRecord, 
    getAllHistory, 
    getHistory, 
    deleteAnalysis, 
    exportHistory, 
    importHistory, 
    clearHistory 
} from '../lib/storage';

export function useAnalysisHistory(showToast: (msg: string, type?: 'success' | 'error' | 'info') => void) {
    const [history, setHistory] = useState<AnalysisRecord[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const refreshHistory = useCallback(async () => {
        const hist = await getAllHistory();
        setHistory(hist);
    }, []);

    useEffect(() => {
        refreshHistory();
    }, [refreshHistory]);

    const removeFromHistory = useCallback(async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        await deleteAnalysis(id);
        const hist = await getAllHistory();
        setHistory(hist);
        showToast('Analysis removed from history.', 'info');
    }, [showToast]);

    const handleExportHistory = useCallback(() => {
        const data = exportHistory();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const stamp = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `credit-analyzer-history-${stamp}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }, []);

    const handleImportHistory = useCallback(async (file: File) => {
        try {
            const text = await file.text();
            const added = importHistory(text);
            const hist = await getAllHistory();
            setHistory(hist);
            showToast(`Imported ${added} record${added === 1 ? '' : 's'}.`, added > 0 ? 'success' : 'info');
        } catch (error) {
            console.error('History import failed:', error);
            showToast('Unable to import history file.', 'error');
        }
    }, [showToast]);

    const handleClearHistory = useCallback(async () => {
        if (window.confirm('Are you sure you want to clear all analysis history? This cannot be undone.')) {
            await clearHistory();
            setHistory([]);
            setShowHistory(false);
            showToast('History cleared.', 'info');
        }
    }, [showToast]);

    return {
        history,
        setHistory,
        showHistory,
        setShowHistory,
        refreshHistory,
        removeFromHistory,
        handleExportHistory,
        handleImportHistory,
        handleClearHistory
    };
}
