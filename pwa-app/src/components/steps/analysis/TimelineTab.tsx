'use strict';

import React from 'react';
import { TimelineEvent } from '../../../lib/analytics';
import { formatDate } from '../../../lib/i18n';

interface TimelineTabProps {
  timeline: TimelineEvent[];
}

const TimelineTab: React.FC<TimelineTabProps> = ({ timeline }) => {
  if (timeline.length === 0) {
    return (
      <div className="panel-inset p-12 text-center dark:bg-gray-800/20 dark:border-gray-700">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="heading-md mb-1 dark:text-white">No Timeline Events</h3>
        <p className="body-sm text-gray-500 dark:text-gray-400">Add dates to your account data to see a chronological timeline.</p>
      </div>
    );
  }

  return (
    <div className="panel p-6 dark:bg-gray-800/50 dark:border-gray-700">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-6">
          {timeline.map((event, i) => (
            <div key={i} className="relative pl-10 fade-in">
              <div className={`absolute left-2 w-5 h-5 rounded-full border-2 bg-white dark:bg-gray-900 ${
                event.flagged ? 'border-red-500' :
                event.type === 'violation' ? 'border-red-500' :
                event.type === 'delinquency' ? 'border-amber-500' :
                event.type === 'chargeoff' ? 'border-orange-500' : 'border-gray-300 dark:border-gray-600'
              }`} />
              <div>
                <p className="mono text-xs text-gray-400 dark:text-gray-500 mb-1">{formatDate(event.date)}</p>
                <p className="heading-sm dark:text-white">{event.label}</p>
                <p className="body-sm text-gray-600 dark:text-gray-400">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineTab;
