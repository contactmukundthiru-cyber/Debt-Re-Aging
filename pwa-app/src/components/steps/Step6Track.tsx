'use strict';

import React from 'react';
import { CreditFields, RuleFlag } from '../../lib/rules';
import { Step } from '../../lib/constants';
import { Dispute, DisputeStatus } from '../../lib/dispute-tracker';

interface DisputeStats {
  total: number;
  active: number;
  resolved: number;
  successRate: number;
  avgResolutionDays: number;
  byStatus: Record<DisputeStatus, number>;
  byType: Record<'bureau' | 'furnisher' | 'validation' | 'cfpb' | 'legal', number>;
}

interface Step6TrackProps {
  disputes: Dispute[];
  setDisputes: (disputes: Dispute[]) => void;
  disputeStats: DisputeStats | null;
  setDisputeStats: (stats: DisputeStats | null) => void;
  editableFields: CreditFields;
  flags: RuleFlag[];
  createDispute: (
    account: Dispute['account'],
    type: Dispute['type'],
    reason: string,
    violations: string[],
    bureau?: Dispute['bureau']
  ) => Dispute;
  loadDisputes: () => Dispute[];
  getDisputeStats: () => DisputeStats;
  updateDisputeStatus: (disputeId: string, newStatus: DisputeStatus, notes?: string) => Dispute | null;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  reset: () => void;
}

const Step6Track: React.FC<Step6TrackProps> = ({
  disputes,
  setDisputes,
  disputeStats,
  setDisputeStats,
  editableFields,
  flags,
  createDispute,
  loadDisputes,
  getDisputeStats,
  updateDisputeStatus,
  setStep,
  reset
}) => {
  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="heading-xl mb-2 dark:text-white">Dispute Tracker</h2>
          <p className="body-md text-gray-600 dark:text-gray-400">
            Track your disputes, deadlines, and outcomes in one place.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary shadow-lg shadow-blue-500/20"
          onClick={() => {
            createDispute(
              {
                creditor: editableFields.originalCreditor || 'Unknown',
                collector: editableFields.furnisherOrCollector || undefined,
                balance: editableFields.currentBalance || '$0',
                accountType: editableFields.accountType || 'Unknown'
              },
              'bureau',
              flags.length > 0 ? flags[0].explanation : 'Inaccurate information',
              flags.map(f => f.ruleId)
            );
            setDisputes(loadDisputes());
            setDisputeStats(getDisputeStats());
          }}
        >
          + New Dispute
        </button>
      </div>

      {/* Stats Overview */}
      {disputeStats && (
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <div className="premium-card p-6 text-center bg-white dark:bg-slate-900/50">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total</p>
            <p className="text-3xl font-bold dark:text-white">{disputeStats.total}</p>
          </div>
          <div className="premium-card p-6 text-center border-blue-500/10 bg-blue-500/5">
            <p className="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-1">Active</p>
            <p className="text-3xl font-bold dark:text-white">{disputeStats.active}</p>
          </div>
          <div className="premium-card p-6 text-center border-emerald-500/10 bg-emerald-500/5">
            <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-1">Resolved</p>
            <p className="text-3xl font-bold dark:text-white">{disputeStats.resolved}</p>
          </div>
          <div className="premium-card p-6 text-center border-amber-500/10 bg-amber-500/5">
            <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-1">Success</p>
            <p className="text-3xl font-bold dark:text-white">{disputeStats.successRate}%</p>
          </div>
        </div>
      )}


      {/* List */}
      <div className="premium-card !p-0 overflow-hidden bg-white/50 dark:bg-slate-900/30">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Active Records</h3>
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900">{disputes.length} CASES</span>
        </div>

        {disputes.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${['draft', 'submitted', 'investigating'].includes(dispute.status) ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          dispute.status === 'resolved_favorable' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                        {dispute.status}
                      </span>
                      <span className="mono text-[10px] text-gray-400">Created {new Date(dispute.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="heading-md dark:text-white">{dispute.account.creditor}</h4>
                    <p className="body-sm text-gray-500 dark:text-gray-400">{dispute.account.accountType} · {dispute.account.balance}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      className="select text-xs py-1 h-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={dispute.status}
                      onChange={(e) => {
                        updateDisputeStatus(dispute.id, e.target.value as DisputeStatus);
                        setDisputes(loadDisputes());
                        setDisputeStats(getDisputeStats());
                      }}
                    >
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="investigating">Investigating</option>
                      <option value="response_received">Response Received</option>
                      <option value="escalated">Escalated</option>
                      <option value="resolved_favorable">Resolved (Favorable)</option>
                      <option value="resolved_unfavorable">Resolved (Unfavorable)</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="heading-md mb-1 dark:text-gray-300">No Disputes Yet</h3>
            <p className="body-sm text-gray-500 dark:text-gray-400">Create your first dispute to start tracking.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          className="btn btn-secondary dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
          onClick={() => setStep(5)}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary shadow-lg shadow-blue-500/20"
          onClick={reset}
        >
          Start New Analysis
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Step6Track;
