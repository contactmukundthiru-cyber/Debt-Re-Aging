'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  loadDisputes, 
  getDisputeStats, 
  createDispute,
  updateDisputeStatus,
  Dispute 
} from '../lib/dispute-tracker';

export function useDisputeTracking() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [disputeStats, setDisputeStats] = useState(() => getDisputeStats());

    const refreshDisputes = useCallback(() => {
        const loaded = loadDisputes();
        setDisputes(loaded);
        setDisputeStats(getDisputeStats());
    }, []);

    useEffect(() => {
        refreshDisputes();
    }, [refreshDisputes]);

    return {
        disputes,
        setDisputes,
        disputeStats,
        setDisputeStats,
        refreshDisputes,
        createDispute,
        updateDisputeStatus,
        loadDisputes,
        getDisputeStats
    };
}
