// Enquiry System Configuration
window.EnquirySystemConfig = {
  apiUrl: 'https://shopify-enquiry-system.diarmuid-1c2.workers.dev',
  cookieExpiry: 7, // days
  debug: true, // Set to false in production
  shopDomain: window.Shopify?.shop || window.location.hostname,
  // Storefront API configuration (tokenless access)
  storefrontApiVersion: '2024-01'
};

// Helper functions
window.EnquirySystemHelpers = {
  // Cookie management
  setCookie: function(name, value, days) {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  },
  
  getCookie: function(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  },
  
  removeCookie: function(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },
  
  // Debug logging
  logDebug: function(message, data) {
    if (window.EnquirySystemConfig.debug) {
      console.log(`[Enquiry System] ${message}`, data || '');
    }
  },
  
  // Format price
  formatMoney: function(cents) {
    return '£' + (cents / 100).toFixed(2);
  },
  
  // Get Shopify product data
  getProductData: function() {
    // Try to get product data from various sources
    if (window.meta && window.meta.product) {
      return window.meta.product;
    }
    
    // Try to get from ShopifyAnalytics
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
      return window.ShopifyAnalytics.meta.product;
    }
    
    // Try to get from product JSON script
    const productJSON = document.querySelector('script[type="application/json"][data-product-json]');
    if (productJSON) {
      try {
        return JSON.parse(productJSON.textContent);
      } catch (e) {
        console.error('Error parsing product JSON:', e);
      }
    }
    
    return null;
  },
  
  // Storefront API query helper (uses tokenless access)
  queryStorefrontAPI: async function(query, variables = {}) {
    const config = window.EnquirySystemConfig;
    
    try {
      const response = await fetch(`/api/${config.storefrontApiVersion}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          variables: variables
        })
      });
      
      if (!response.ok) {
        throw new Error(`Storefront API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        throw new Error('GraphQL query failed');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error querying Storefront API:', error);
      throw error;
    }
  }
};