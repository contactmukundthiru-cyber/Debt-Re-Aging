/**
 * Forensic Transcription Engine
 * Handles call logging and voice-to-text transcription for evidence collection.
 */

export interface TranscriptionSegment {
    startTime: number;
    endTime: number;
    speaker: 'user' | 'creditor' | 'unknown';
    text: string;
    confidence: number;
}

export interface CallLog {
    id: string;
    timestamp: string;
    duration: number;
    recipient: string;
    purpose: string;
    transcription: TranscriptionSegment[];
    summary: string;
    keyPhrases: string[];
    violationFlags: string[];
}

/**
 * Capture real-time speech and convert to segments
 * (Wrapper for Web Speech API)
 */
export async function startLiveTranscription(onUpdate: (segment: TranscriptionSegment) => void): Promise<() => void> {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
        throw new Error('Speech Recognition not supported in this browser');
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
            onUpdate({
                startTime: Date.now(),
                endTime: Date.now(), // Simplified
                speaker: 'unknown',
                text: result[0].transcript,
                confidence: result[0].confidence
            });
        }
    };

    recognition.start();

    return () => recognition.stop();
}

/**
 * Analyze transcription for potential FDCPA violations
 */
export function analyzeTranscriptionForViolations(text: string): string[] {
    const violations: string[] = [];
    const patterns = [
        { regex: /arrest|jail|police|sheriff/i, violation: 'Threat of Arrest (FDCPA § 807(4))' },
        { regex: /sue|lawsuit|legal action/i, violation: 'Threat of Legal Action (FDCPA § 807(5))' },
        { regex: /liar|fraud|deadbeat|thief/i, violation: 'Abusive Language (FDCPA § 806(2))' },
        { regex: /work|employer|boss|office/i, violation: 'Third Party Contact (FDCPA § 805(b))' },
        { regex: /midnight|9pm|8am/i, violation: 'Inconvenient Time (FDCPA § 805(a)(1))' }
    ];

    patterns.forEach(p => {
        if (p.regex.test(text)) {
            violations.push(p.violation);
        }
    });

    return violations;
}

/**
 * Generate a summary of the call
 */
export function generateCallSummary(transcription: TranscriptionSegment[]): string {
    if (transcription.length === 0) return 'No content captured.';

    const fullText = transcription.map(s => s.text).join(' ');
    const violations = analyzeTranscriptionForViolations(fullText);

    return `Call captured with ${transcription.length} segments. ${violations.length > 0 ? `Detected potential violations: ${violations.join(', ')}.` : 'No obvious violations detected.'}`;
}
