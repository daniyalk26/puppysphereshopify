// ===== FILE: src/lib/shopify.js =====
const SHOPIFY_GRAPHQL_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

/**
 * Execute GraphQL query against Shopify Admin API
 * @param {string} query - GraphQL query string
 * @param {Object} variables - Query variables
 * @returns {Promise<Object>} Query response data
 */
export async function shopifyGraphQL(query, variables = {}) {
  try {
    const res = await fetch(SHOPIFY_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await res.json();

    if (data.errors) {
      console.error('Shopify GraphQL errors:', data.errors);
      throw new Error('Shopify GraphQL Error');
    }
    
    return data.data;
  } catch (err) {
    console.error('Shopify API Error:', err);
    throw err;
  }
}

/**
 * Fetch all orders with pagination and optional date filtering
 * @param {string|null} startDate - Start date in YYYY-MM-DD format
 * @param {string|null} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of order objects
 */
export async function fetchAllOrders(startDate = null, endDate = null) {
  let hasNextPage = true;
  let cursor = null;
  const allOrders = [];

  // Build date filter query
  let dateFilter = '';
  if (startDate) dateFilter = `created_at:>=${startDate}`;
  if (endDate) dateFilter += `${startDate ? ' AND' : ''} created_at:<=${endDate}`;

  const ORDERS_QUERY = `
    query getOrders($first: Int!, $after: String) {
      orders(first: $first, after: $after${dateFilter ? `, query: "${dateFilter}"` : ''}) {
        edges {
          node {
            id
            name
            createdAt
            totalPriceSet { shopMoney { amount currencyCode } }
            totalDiscountsSet { shopMoney { amount } }
            totalRefundedSet { shopMoney { amount } }
            totalTaxSet { shopMoney { amount } }
            totalShippingPriceSet { shopMoney { amount } }
            
            lineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  product { id title }
                  originalTotalSet { shopMoney { amount } }
                  discountAllocations {
                    allocatedAmountSet { shopMoney { amount } }
                  }
                  taxLines {
                    priceSet { shopMoney { amount } }
                  }
                }
              }
            }
            
            refunds {
              id
              createdAt
              refundLineItems(first: 50) {
                edges {
                  node {
                    lineItem { id product { title } }
                    subtotalSet { shopMoney { amount } }
                  }
                }
              }
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }`;

  while (hasNextPage) {
    const variables = { first: 50, after: cursor };
    const data = await shopifyGraphQL(ORDERS_QUERY, variables);
    const batch = data.orders.edges.map(edge => edge.node);

    allOrders.push(...batch);

    hasNextPage = data.orders.pageInfo.hasNextPage;
    cursor = data.orders.pageInfo.endCursor;
    
    console.log(`Fetched ${allOrders.length} orders so far...`);
  }

  return allOrders;
}

/**
 * Process raw order data into dashboard analytics
 * @param {Array} orders - Raw order data from Shopify
 * @returns {Object} Processed analytics data
 */
export function processOrdersData(orders) {
  const summary = {
    totalGrossSales: 0,
    totalDiscounts: 0,
    totalRefunds: 0,
    totalTaxes: 0,
    totalShipping: 0,
    netSales: 0,
    orderCount: orders.length,
  };

  const studioData = {};
  const dailyData = {};
  const monthlyData = {};

  // Process each order
  orders.forEach(order => {
    const date = order.createdAt.split('T')[0];
    const month = date.slice(0, 7);

    const gross = parseFloat(order.totalPriceSet.shopMoney.amount) || 0;
    const discounts = parseFloat(order.totalDiscountsSet?.shopMoney.amount) || 0;
    const refunds = parseFloat(order.totalRefundedSet?.shopMoney.amount) || 0;
    const taxes = parseFloat(order.totalTaxSet?.shopMoney.amount) || 0;
    const shipping = parseFloat(order.totalShippingPriceSet?.shopMoney.amount) || 0;

    // Update summary
    summary.totalGrossSales += gross;
    summary.totalDiscounts += discounts;
    summary.totalRefunds += refunds;
    summary.totalTaxes += taxes;
    summary.totalShipping += shipping;

    // Update daily data
    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        grossSales: 0,
        discounts: 0,
        refunds: 0,
        taxes: 0,
        shipping: 0,
        netSales: 0,
        orderCount: 0,
      };
    }
    
    dailyData[date].grossSales += gross;
    dailyData[date].discounts += discounts;
    dailyData[date].refunds += refunds;
    dailyData[date].taxes += taxes;
    dailyData[date].shipping += shipping;
    dailyData[date].netSales += (gross - discounts - refunds);
    dailyData[date].orderCount += 1;

    // Update monthly data
    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        grossSales: 0,
        discounts: 0,
        refunds: 0,
        taxes: 0,
        netSales: 0,
        orderCount: 0,
      };
    }
    
    monthlyData[month].grossSales += gross;
    monthlyData[month].discounts += discounts;
    monthlyData[month].refunds += refunds;
    monthlyData[month].taxes += taxes;
    monthlyData[month].netSales += (gross - discounts - refunds);
    monthlyData[month].orderCount += 1;

    // Process line items for studio data
    order.lineItems.edges.forEach(({ node: item }) => {
      const studioName = item.product?.title || item.title || 'Unknown Product';

      if (!studioData[studioName]) {
        studioData[studioName] = {
          name: studioName,
          grossSales: 0,
          discounts: 0,
          refunds: 0,
          taxes: 0,
          netSales: 0,
          orderIds: new Set(),
          quantity: 0,
          orders: [],
        };
      }

      const itemGross = parseFloat(item.originalTotalSet?.shopMoney.amount) || 0;
      const itemDiscounts = (item.discountAllocations || [])
        .reduce((sum, d) => sum + parseFloat(d.allocatedAmountSet?.shopMoney.amount || 0), 0);
      const itemTaxes = (item.taxLines || [])
        .reduce((sum, t) => sum + parseFloat(t.priceSet?.shopMoney.amount || 0), 0);

      const studio = studioData[studioName];
      studio.grossSales += itemGross;
      studio.discounts += itemDiscounts;
      studio.taxes += itemTaxes;
      studio.quantity += item.quantity;
      studio.orderIds.add(order.id);
      studio.orders.push({
        orderId: order.id,
        orderName: order.name,
        date: order.createdAt,
        amount: itemGross,
      });
    });

    // Process refunds by studio
    (order.refunds || []).forEach(refund => {
      refund.refundLineItems.edges.forEach(({ node }) => {
        const studioName = node.lineItem?.product?.title || 'Unknown Product';
        const refundAmount = parseFloat(node.subtotalSet?.shopMoney.amount) || 0;
        
        if (studioData[studioName]) {
          studioData[studioName].refunds += refundAmount;
        }
      });
    });
  });

  // Finalize studio data
  Object.values(studioData).forEach(studio => {
    studio.orderCount = studio.orderIds.size;
    delete studio.orderIds;
    studio.netSales = studio.grossSales - studio.discounts - studio.refunds;
  });

  // Calculate net sales for summary
  summary.netSales = summary.totalGrossSales - summary.totalDiscounts - summary.totalRefunds;

  // Convert to arrays and sort
  const studios = Object.values(studioData).sort((a, b) => b.netSales - a.netSales);
  const byDate = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  const byMonth = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

  return {
    summary,
    studios,
    byDate,
    byMonth,
    dateRange: {
      start: byDate[0]?.date || null,
      end: byDate[byDate.length - 1]?.date || null,
    },
  };
}
