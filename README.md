# Shopify Sales Dashboard

A professional Next.js dashboard for visualizing Shopify sales data with studio-level analytics.

## Features

- **Real-time Data Sync**: Fetch and process orders directly from Shopify API
- **Comprehensive Analytics**: View gross sales, net revenue, refunds, and discounts
- **Studio Performance**: Track individual studio/product performance
- **Time Range Filtering**: Analyze data for custom date ranges
- **Visual Charts**: Interactive waterfall, donut, and trend charts using D3.js
- **Export Functionality**: Download data as CSV
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 18+
- npm or yarn
- Shopify store with Admin API access

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd shopify-sales-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env.local` and update with your Shopify credentials:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:

   ```
   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   SHOPIFY_ADMIN_API_ACCESS_TOKEN=shpat_your_access_token_here
   ```

4. **Run development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open browser**

   Navigate to [http://localhost:3000](http://localhost:3000)
