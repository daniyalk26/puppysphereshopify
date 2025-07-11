// src/app/dashboard-tables.js

import { formatCurrency } from './dashboard-utils';

// Studio Performance Metrics Grid Component
export const StudioMetricsGrid = ({ data }) => {
  // Get top 6 studios by revenue
  const topStudios = data.slice(0, 6);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {topStudios.map((studio, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 text-sm mb-2">{studio.name}</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-medium">{formatCurrency(studio.value)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Orders:</span>
              <span className="font-medium">{studio.orders}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Market Share:</span>
              <span className="font-medium text-blue-600">{studio.percentage}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Avg Order:</span>
              <span className="font-medium">{formatCurrency(studio.value / studio.orders)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Studio Details Table Component
export const StudioDetailsTable = ({ studios, summary, avgOrderValue }) => {
  const totalNetSales = studios.reduce((sum, s) => sum + s.netSales, 0) || summary.netSales;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Studio
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Order
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gross Sales
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discounts
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Refunds
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Sales
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                % of Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {studios.map((studio, index) => {
              const percentOfTotal = (studio.netSales / totalNetSales) * 100;
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {studio.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {studio.orderCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(studio.avgOrderValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(studio.grossSales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={studio.discountRate > 20 ? 'text-red-600' : 'text-gray-900'}>
                      {formatCurrency(studio.discounts)}
                      {studio.discountRate > 0 && (
                        <span className="text-xs ml-1">({studio.discountRate.toFixed(0)}%)</span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={studio.refundRate > 5 ? 'text-red-600' : 'text-gray-900'}>
                      {formatCurrency(studio.refunds)}
                      {studio.refundRate > 0 && (
                        <span className="text-xs ml-1">({studio.refundRate.toFixed(0)}%)</span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                    {formatCurrency(studio.netSales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{percentOfTotal.toFixed(1)}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(percentOfTotal, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr className="font-semibold">
              <td className="px-6 py-4 text-sm text-gray-900">Total</td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                {summary.orderCount.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                {formatCurrency(avgOrderValue)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                {formatCurrency(summary.totalGrossSales)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                {formatCurrency(summary.totalDiscounts)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                {formatCurrency(summary.totalRefunds)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                {formatCurrency(summary.netSales)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right">100.0%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};