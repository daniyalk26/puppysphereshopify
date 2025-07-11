// ===== FILE: src/app/api/shopify/orders/route.js =====
import { NextResponse } from 'next/server';
import { fetchAllOrders, processOrdersData } from '@/lib/shopify';
import { calculateDateRange } from '@/lib/utils/dateUtils';

/**
 * GET /api/shopify/orders
 * Fetches and processes Shopify order data with optional date filtering
 * 
 * @param {Request} request - The incoming request object
 * @returns {NextResponse} JSON response with processed order data
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Calculate date range based on parameters
    const { start, end } = calculateDateRange({ timeRange, startDate, endDate });
    
    console.log('Fetching orders...', { startDate: start, endDate: end });
    
    // Fetch orders from Shopify
    const orders = await fetchAllOrders(start, end);
    
    if (!orders.length) {
      return NextResponse.json({
        success: true,
        metadata: {
          totalOrders: 0,
          dateRange: { start: null, end: null },
          generatedAt: new Date().toISOString()
        },
        data: {
          summary: {},
          studios: [],
          byDate: [],
          byMonth: []
        }
      });
    }
    
    console.log(`Processing ${orders.length} orders...`);
    
    // Process the data
    const processedData = processOrdersData(orders);
    
    // Build response
    const response = {
      success: true,
      metadata: {
        totalOrders: orders.length,
        dateRange: processedData.dateRange,
        generatedAt: new Date().toISOString()
      },
      data: processedData
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in orders API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}