import { useState, useEffect } from 'react';
import { BRANDING } from '../config/branding';

export interface BrandingConfig {
    appName: string;
    organizationName: string;
    organizationUrl: string;
    theme: {
        primaryColor: string;
        enableDarkMode: boolean;
    };
}

export function useBranding() {
    const [config, setConfig] = useState<BrandingConfig>(BRANDING);

    useEffect(() => {
        const storedBranding = localStorage.getItem('cra_branding_override');
        if (storedBranding) {
            try {
                const overrides = JSON.parse(storedBranding);
                setConfig(prev => ({
                    ...prev,
                    ...overrides
                }));
            } catch (e) {
                console.error('Failed to parse branding overrides');
            }
        }
    }, []);

    const updateBranding = (overrides: Partial<BrandingConfig>) => {
        const newConfig = { ...config, ...overrides };
        setConfig(newConfig);
        localStorage.setItem('cra_branding_override', JSON.stringify(overrides));
    };

    const resetBranding = () => {
        setConfig(BRANDING);
        localStorage.removeItem('cra_branding_override');
    };

    return { ...config, updateBranding, resetBranding };
}
