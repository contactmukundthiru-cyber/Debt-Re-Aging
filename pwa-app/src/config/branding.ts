/**
 * Institutional Branding Configuration
 * 
 * Update these values to whitelabel the application for a specific
 * law firm, legal aid organization, or credit counseling agency.
 */

export const BRANDING = {
    // The primary name of the application
    appName: 'Credit Report Analyzer',

    // The organization responsible for the instance
    organizationName: 'Forensic Credit Analysis Team',

    // Default URL for the organization
    organizationUrl: 'https://example.com',

    // SEO Meta
    metaTitle: 'Credit Report Analyzer | FCRA Violation Detection',
    metaDescription: 'Professional forensic tool involved in the detection of illegal debt re-aging and FCRA/FDCPA violations.',

    // Interface Customization
    theme: {
        primaryColor: 'emerald', // emerald, blue, indigo, violet, rose, amber
        enableDarkMode: true,
    },

    // Feature Flags for Institutional tiers
    features: {
        enableMetro2Analysis: true,
        enableLegalAffidavits: true,
        enableCloudSync: false, // Keep false for local-first privacy
    }
};
