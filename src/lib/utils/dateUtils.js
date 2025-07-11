// ===== FILE: src/lib/utils/dateUtils.js =====
/**
 * Calculate date range based on predefined time ranges or custom dates
 * @param {Object} params - Parameters for date calculation
 * @param {string} params.timeRange - Predefined time range ('30d', '90d', 'ytd', 'all')
 * @param {string} params.startDate - Custom start date
 * @param {string} params.endDate - Custom end date
 * @returns {Object} Object containing start and end dates
 */
export function calculateDateRange({ timeRange, startDate, endDate }) {
  if (startDate) {
    return { start: startDate, end: endDate };
  }
  
  if (!timeRange || timeRange === 'all') {
    return { start: null, end: null };
  }
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  switch (timeRange) {
    case '30d':
      return {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: today
      };
    case '90d':
      return {
        start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: today
      };
    case 'ytd':
      return {
        start: `${now.getFullYear()}-01-01`,
        end: today
      };
    default:
      return { start: null, end: null };
  }
}