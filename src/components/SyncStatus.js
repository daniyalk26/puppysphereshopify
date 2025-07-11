// ===== FILE: src/components/SyncStatus.js =====
'use client';

import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Display sync status with visual indicators
 * @param {Object} props - Component props
 * @param {string} props.lastSync - ISO date string of last sync
 * @param {number} props.totalOrders - Total number of orders synced
 * @param {boolean} props.isLoading - Loading state
 */
export function SyncStatus({ lastSync, totalOrders, isLoading }) {
  const getSyncStatus = () => {
    if (isLoading) {
      return {
        icon: <Clock className="h-4 w-4 animate-spin" />,
        text: 'Syncing...',
        className: 'text-blue-600 bg-blue-50'
      };
    }
    
    if (!lastSync) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Never synced',
        className: 'text-gray-600 bg-gray-50'
      };
    }
    
    const lastSyncDate = new Date(lastSync);
    const minutesAgo = Math.floor((Date.now() - lastSyncDate) / 60000);
    
    if (minutesAgo < 5) {
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Just synced',
        className: 'text-green-600 bg-green-50'
      };
    }
    
    const timeAgo = formatDistanceToNow(lastSyncDate, { addSuffix: true });
    
    if (minutesAgo < 60) {
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        text: timeAgo,
        className: 'text-green-600 bg-green-50'
      };
    }
    
    return {
      icon: <AlertCircle className="h-4 w-4" />,
      text: timeAgo,
      className: 'text-yellow-600 bg-yellow-50'
    };
  };
  
  const status = getSyncStatus();
  
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${status.className}`}>
        {status.icon}
        <span className="font-medium">{status.text}</span>
      </div>
      {totalOrders > 0 && (
        <div className="text-gray-500">
          <span className="font-medium text-gray-700">{totalOrders.toLocaleString()}</span> orders synced
        </div>
      )}
    </div>
  );
}