'use client';

import React, { useMemo } from 'react';
import { calculateLiability } from '../../../lib/liability';
import { RuleFlag } from '../../../lib/rules';
import LiabilityRadarView from './LiabilityRadarView';

interface LiabilityRadarTabProps {
    flags: RuleFlag[];
}

const LiabilityRadarTab: React.FC<LiabilityRadarTabProps> = ({ flags }) => {
    const liability = useMemo(() => calculateLiability(flags), [flags]);

    const radarMetrics = useMemo(function radarMetricsFn() {
        const categories = {
            Statutory: flags.filter(f => f.legalCitations.length > 0).length,
            Forensic: flags.filter(f => f.severity === 'critical').length,
            Procedural: flags.filter(f => f.ruleId.startsWith('B')).length,
            Substantive: flags.filter(f => f.ruleId.startsWith('E')).length,
            Temporal: flags.filter(f => f.ruleId.includes('A')).length,
        };
        const max = Math.max(...Object.values(categories), 5);
        return Object.entries(categories).map(function mapEntry(entry: [string, number], i: number, arr: [string, number][]) {
            const [label, value] = entry;
            const angle = (i / arr.length) * 2 * Math.PI - Math.PI / 2;
            const r = (value / max) * 100;
            return {
                label,
                x: 150 + r * Math.cos(angle),
                y: 150 + r * Math.sin(angle),
                bgX: 150 + 100 * Math.cos(angle),
                bgY: 150 + 100 * Math.sin(angle),
            };
        });
    }, [flags]);

    return React.createElement(LiabilityRadarView, { liability, radarMetrics });
};

export default LiabilityRadarTab;
