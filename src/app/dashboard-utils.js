// ===== FILE: src/app/dashboard-utils.js =====
import { format, parseISO } from 'date-fns';

/**
 * Color palette constants
 */
export const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  teal: '#14B8A6',
  orange: '#F97316',
  gradient: [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
  ],
};

/**
 * Format a number as USD currency
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a number as percentage
 * @param {number} value - The value to format
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value) => `${value.toFixed(1)}%`;

/**
 * Ensure a value is numeric, defaulting to 0
 * @param {*} value - The value to convert
 * @returns {number} Numeric value
 */
export const ensureNumeric = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Process studio data with calculations
 * @param {Object} studio - Raw studio data
 * @returns {Object} Processed studio data
 */
const processStudio = (studio) => {
  const netSales = ensureNumeric(studio.netSales);
  const grossSales = ensureNumeric(studio.grossSales);
  const orderCount = Math.max(1, ensureNumeric(studio.orderCount));
  const discounts = ensureNumeric(studio.discounts);
  const refunds = ensureNumeric(studio.refunds);
  
  return {
    ...studio,
    name: studio.name || 'Unknown Studio',
    netSales,
    grossSales,
    orderCount,
    quantity: ensureNumeric(studio.quantity),
    discounts,
    refunds,
    taxes: ensureNumeric(studio.taxes),
    avgOrderValue: netSales / orderCount,
    discountRate: grossSales > 0 ? (discounts / grossSales) * 100 : 0,
    refundRate: grossSales > 0 ? (refunds / grossSales) * 100 : 0,
  };
};

/**
 * Main data processing function
 * @param {Object} data - Raw data from API
 * @returns {Object} Processed data for dashboard
 */
export const processData = (data) => {
  if (!data || typeof data !== 'object') {
    return {
      summary: {},
      validStudios: [],
      monthlyRevenue: [],
      waterfallData: [],
      studioDonutData: []
    };
  }

  // Process summary with safety checks
  const summary = {
    totalGrossSales: ensureNumeric(data.summary?.totalGrossSales),
    netSales: ensureNumeric(data.summary?.netSales),
    orderCount: Math.max(1, ensureNumeric(data.summary?.orderCount)),
    totalRefunds: ensureNumeric(data.summary?.totalRefunds),
    totalDiscounts: ensureNumeric(data.summary?.totalDiscounts),
    totalTaxes: ensureNumeric(data.summary?.totalTaxes),
  };

  // Process and validate studios
  const validStudios = (data.studios || [])
    .map(processStudio)
    .filter(studio => studio.netSales > 0)
    .sort((a, b) => b.netSales - a.netSales);

  const totalNetSales = validStudios.reduce((sum, s) => sum + s.netSales, 0) || summary.netSales || 1;

  // Process monthly revenue data
  const monthlyRevenue = (data.byMonth || [])
    .map(item => {
      try {
        return {
          month: item.month ? format(parseISO(`${item.month}-01`), 'MMM yyyy') : 'Unknown',
          gross: ensureNumeric(item.grossSales),
          net: ensureNumeric(item.netSales),
          orders: ensureNumeric(item.orderCount),
          discounts: ensureNumeric(item.discounts),
          refunds: ensureNumeric(item.refunds),
        };
      } catch (error) {
        console.error('Error parsing month:', item.month, error);
        return null;
      }
    })
    .filter(item => item && item.month !== 'Unknown');

  // Prepare waterfall data
  const waterfallData = [
    { name: 'Gross Sales', value: summary.totalGrossSales },
    { name: 'Discounts', value: -Math.abs(summary.totalDiscounts) },
    { name: 'Refunds', value: -Math.abs(summary.totalRefunds) },
    { name: 'Taxes', value: summary.totalTaxes },
    { name: 'Net Sales', value: summary.netSales }
  ];

  // Prepare studio donut data
  const studioDonutData = validStudios.map(studio => ({
    name: studio.name,
    value: studio.netSales,
    orders: studio.orderCount,
    percentage: ((studio.netSales / totalNetSales) * 100).toFixed(1)
  }));

  return {
    summary,
    validStudios,
    monthlyRevenue,
    waterfallData,
    studioDonutData
  };
};