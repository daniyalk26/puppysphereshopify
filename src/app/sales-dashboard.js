// src/app/sales-dashboard.js

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  RefreshCw,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Table2,
  Activity,
} from 'lucide-react';
import { 
  WaterfallChart, 
  StudioRevenueDonut, 
  MonthlyTrendChart 
} from './dashboard-charts';
import { 
  StudioMetricsGrid, 
  StudioDetailsTable 
} from './dashboard-tables';
import { 
  formatCurrency, 
  formatPercentage, 
  processData,
  COLORS 
} from './dashboard-utils';

// KPI Card Component
const KPICard = ({ title, value, icon: Icon, description, color = COLORS.primary }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Tab Component
const Tab = ({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active 
        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`}
  >
    {Icon && <Icon className="h-4 w-4" />}
    {children}
  </button>
);

// Loading Component
const LoadingState = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600">Loading sales data...</p>
    </div>
  </div>
);

// Error Component
const ErrorState = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
      <p className="text-red-600 mb-4">Error: {error}</p>
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  </div>
);

// Header Component
const DashboardHeader = ({ timeRange, onTimeRangeChange, onExport, onRefresh, refreshing }) => (
  <header className="bg-white shadow-sm border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopify Sales Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive sales analytics for all studios
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="ytd">Year to Date</option>
            <option value="90d">Last 90 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  </header>
);

// Summary Cards Component
const SummaryCards = ({ summary, validStudios, avgOrderValue }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
    <KPICard
      title="Gross Sales"
      value={formatCurrency(summary.totalGrossSales)}
      icon={DollarSign}
      description="Total revenue before deductions"
      color={COLORS.primary}
    />
    <KPICard
      title="Net Revenue"
      value={formatCurrency(summary.netSales)}
      icon={TrendingUp}
      description="After all deductions"
      color={COLORS.success}
    />
    <KPICard
      title="Total Orders"
      value={summary.orderCount.toLocaleString()}
      icon={ShoppingCart}
      description={`Avg ${formatCurrency(avgOrderValue)}/order`}
      color={COLORS.purple}
    />
    <KPICard
      title="Total Discounts"
      value={formatCurrency(summary.totalDiscounts)}
      icon={AlertCircle}
      description={`${summary.totalGrossSales > 0 ? ((summary.totalDiscounts / summary.totalGrossSales) * 100).toFixed(1) : '0.0'}% of gross`}
      color={COLORS.warning}
    />
    <KPICard
      title="Active Studios"
      value={validStudios.length}
      icon={Activity}
      description={`${validStudios.filter(s => s.orderCount > 10).length} with 10+ orders`}
      color={COLORS.teal}
    />
  </div>
);

// Main Dashboard Component
export default function SalesDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (range = 'all') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/shopify/orders?range=${range}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      
      setData(result.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(timeRange);
  };

  const exportData = () => {
    if (!data) return;
    
    const csv = [
      ['Studio', 'Orders', 'Quantity', 'Gross Sales', 'Discounts', 'Refunds', 'Taxes', 'Net Sales'],
      ...data.studios.map(s => [
        s.name,
        s.orderCount,
        s.quantity,
        s.grossSales,
        s.discounts,
        s.refunds,
        s.taxes,
        s.netSales
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopify-sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading && !refreshing) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => fetchData(timeRange)} />;
  if (!data) return null;

  // Process data
  const { summary, validStudios, monthlyRevenue, waterfallData, studioDonutData } = processData(data);
  const avgOrderValue = summary.orderCount > 0 ? summary.netSales / summary.orderCount : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onExport={exportData}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SummaryCards 
          summary={summary} 
          validStudios={validStudios} 
          avgOrderValue={avgOrderValue} 
        />

        {/* Revenue Waterfall Chart */}
        {summary.totalGrossSales > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="overflow-x-auto">
              <WaterfallChart data={waterfallData} />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-500">Total Deductions</p>
                <p className="font-semibold text-red-600">
                  {formatCurrency(summary.totalDiscounts + summary.totalRefunds)}
                </p>
                <p className="text-xs text-gray-500">
                  {summary.totalGrossSales > 0 ? 
                    ((summary.totalDiscounts + summary.totalRefunds) / summary.totalGrossSales * 100).toFixed(1) : '0.0'}% of gross
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Effective Tax Rate</p>
                <p className="font-semibold text-gray-900">
                  {summary.totalGrossSales > 0 ? 
                    ((summary.totalTaxes / summary.totalGrossSales) * 100).toFixed(1) : '0.0'}%
                </p>
                <p className="text-xs text-gray-500">On gross sales</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Net Margin</p>
                <p className="font-semibold text-green-600">
                  {summary.totalGrossSales > 0 ? 
                    ((summary.netSales / summary.totalGrossSales) * 100).toFixed(1) : '0.0'}%
                </p>
                <p className="text-xs text-gray-500">After all deductions</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <Tab
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={BarChart3}
          >
            Overview
          </Tab>
          <Tab
            active={activeTab === 'studios'}
            onClick={() => setActiveTab('studios')}
            icon={PieChartIcon}
          >
            Studio Analysis
          </Tab>
          <Tab
            active={activeTab === 'details'}
            onClick={() => setActiveTab('details')}
            icon={Table2}
          >
            Detailed Report
          </Tab>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && monthlyRevenue.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
              <div className="overflow-x-auto">
                <MonthlyTrendChart data={monthlyRevenue} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'studios' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Studio Revenue Distribution</h3>
              <div className="flex justify-center">
                <StudioRevenueDonut data={studioDonutData} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 6 Studios Performance</h3>
              <p className="text-sm text-gray-600 mb-4">Key metrics for top revenue-generating studios</p>
              <StudioMetricsGrid data={studioDonutData} />
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <StudioDetailsTable 
            studios={validStudios} 
            summary={summary}
            avgOrderValue={avgOrderValue}
          />
        )}
      </main>
    </div>
  );
}