import { useState, useCallback } from 'react';
import { extractTextFromFile, mergeSourcesText, ScanMode } from '../lib/ingestion';
import { validateFiles } from '../lib/validation-input';

interface Source {
    id: string;
    name: string;
    size: number;
    type: string;
    text: string;
}

export function useFileProcessor(
    setRawText: (text: string) => void,
    setFileName: (name: string | null) => void,
    setProcessing: (active: boolean, progress?: number, message?: string) => void,
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void,
    scanMode: ScanMode
) {
    const [sources, setSources] = useState<Source[]>([]);
    const maxUploadSizeMB = 20;

    const handleFilesUpload = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        if (fileArray.length === 0) return;

        const validation = validateFiles(fileArray);
        if (!validation.valid) {
            validation.errors.forEach(error => showToast(error, 'error'));
            if (validation.validFiles.length === 0) {
                setProcessing(false, 0, '');
                return;
            }
        }

        setProcessing(true, 0, `Processing ${validation.validFiles.length} source${validation.validFiles.length > 1 ? 's' : ''}...`);

        try {
            const extracted: Source[] = [];
            for (const file of validation.validFiles) {
                // We use the imported extractTextFromFile but with scanMode context
                const text = await extractTextFromFile(file, (p) => setProcessing(true, Math.round(p * 100)), scanMode);
                extracted.push({
                    id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    text
                });
            }

            await new Promise(resolve => setTimeout(resolve, 1200));

            setSources((prev) => {
                const next = [...prev, ...extracted];
                setRawText(mergeSourcesText(next));
                setFileName(next.length > 1 ? 'batch-upload.txt' : next[0]?.name ?? null);
                return next;
            });
            setProcessing(false, 100, 'Sources merged. Ready for analysis.');
        } catch (error) {
            console.error('Processing error:', error);
            const message = error instanceof Error ? error.message : 'File processing failed.';
            showToast(message, 'error');
            setProcessing(false, 0, '');
        }
    }, [scanMode, setProcessing, setRawText, setFileName, showToast]);

    const clearSources = useCallback(() => {
        setSources([]);
        setRawText('');
        setFileName(null);
    }, [setRawText, setFileName]);

    const removeSource = useCallback((id: string) => {
        setSources((prev) => {
            const next = prev.filter(source => source.id !== id);
            setRawText(next.length > 0 ? mergeSourcesText(next) : '');
            setFileName(next.length > 1 ? 'batch-upload.txt' : next[0]?.name ?? null);
            return next;
        });
    }, [setRawText, setFileName]);

    return {
        sources,
        setSources,
        handleFilesUpload,
        clearSources,
        removeSource
    };
}
