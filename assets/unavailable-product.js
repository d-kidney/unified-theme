// unavailable-product.js

// Function to load a single alternative product
function loadAlternativeProduct() {
  const container = document.getElementById('alternative-product-container');
  const alternativeHandle = container.dataset.alternativeHandle;
  
  if (!alternativeHandle) {
    console.error('No alternative product handle found');
    return;
  }
  
  // Show loading indicator
  container.innerHTML = '<div class="loading-spinner">Loading alternative product...</div>';
  
  console.log('Loading alternative product:', alternativeHandle);
  
  // Fetch the product page using the handle
  fetch(`/products/${alternativeHandle}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch product page: ${response.status} ${response.statusText}`);
      }
      return response.text();
    })
    .then(html => processProductPageHtml(html, alternativeHandle))
    .catch(error => {
      console.error('Error loading alternative product:', error);
      container.innerHTML = '<p>Error loading alternative product. Please try again later.</p>';
    });
}

// Function to process the product page HTML
function processProductPageHtml(html, productReference) {
  console.log('Fetched full product page');
  
  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Extract the main content
  const mainContent = tempDiv.querySelector('#MainContent');
  
  if (mainContent) {
    console.log('Found #MainContent');
    
    // Find the product container within the main content
    const productContent = mainContent.querySelector('.product');
    
    if (productContent) {
      console.log('Found product content');
      
      // Change the ID if it's "original-product-display"
      if (productContent.id === 'original-product-display') {
        console.log('Changing original-product-display ID to alt-product-display');
        productContent.id = 'alt-product-display';
      }
      
      // Fix IDs to prevent duplicates
      const elementsWithIds = productContent.querySelectorAll('[id]');
      elementsWithIds.forEach(el => {
        if (el.id) {
          el.id = 'alt-' + el.id;
        }
      });
      
      // Fix forms to ensure they point to the correct product
      const forms = productContent.querySelectorAll('form[action="/cart/add"]');
      forms.forEach(form => {
        // Make sure the form has the correct variant ID
        // (No need to modify as it should already be correct)
      });
      
      // Insert the product content
      document.getElementById('alternative-product-container').innerHTML = productContent.outerHTML;
      
      // Re-initialize any necessary scripts
      if (typeof initializeProductFunctionality === 'function') {
        initializeProductFunctionality(document.getElementById('alternative-product-container'));
      }
      
      // Set up event listeners
      setupEventListeners();
    } else {
      console.log('Product content not found, trying alternative selectors');
      
      // Try alternative selectors
      const productSection = mainContent.querySelector('[data-section="main-product"]') || 
                            mainContent.querySelector('.product-section');
      
      if (productSection) {
        console.log('Found product section');
        
        // Fix IDs
        const elementsWithIds = productSection.querySelectorAll('[id]');
        elementsWithIds.forEach(el => {
          if (el.id) {
            el.id = 'alt-' + el.id;
          }
        });
        
        document.getElementById('alternative-product-container').innerHTML = productSection.outerHTML;
        setupEventListeners();
      } else {
        console.log('No product content found, using main content');
        document.getElementById('alternative-product-container').innerHTML = 
          '<div class="product-alternative">' + mainContent.innerHTML + '</div>';
        setupEventListeners();
      }
    }
  } else {
    console.log('MainContent not found, searching for product directly');
    
    // Try to find the product directly
    const productContent = tempDiv.querySelector('.product') || 
                          tempDiv.querySelector('[data-section="main-product"]');
    
    if (productContent) {
      // Fix IDs
      const elementsWithIds = productContent.querySelectorAll('[id]');
      elementsWithIds.forEach(el => {
        if (el.id) {
          el.id = 'alt-' + el.id;
        }
      });
      
      document.getElementById('alternative-product-container').innerHTML = productContent.outerHTML;
      setupEventListeners();
    } else {
      console.log('No product content found anywhere');
      document.getElementById('alternative-product-container').innerHTML = 
        '<p>Could not load alternative product. <a href="/products/' + productReference + '">View product directly</a>.</p>';
    }
  }
}

// Function to load recommended products via Shopify API
function loadRecommendedProducts() {
  const productId = document.getElementById('recommended-products-container').dataset.productId;
  
  if (!productId) return;
  
  fetch(`/recommendations/products.json?product_id=${productId}&limit=9`)
    .then(response => response.json())
    .then(data => {
      renderRecommendedProducts(data.products);
      setupEventListeners();
    })
    .catch(error => {
      console.error('Error loading recommended products:', error);
      // Fallback in case recommendations fail
      document.getElementById('recommended-products-grid').innerHTML = '<p>Could not load recommendations.</p>';
    });
}

// Function to render recommended products
function renderRecommendedProducts(products) {
  const container = document.getElementById('recommended-products-grid');
  
  if (products.length === 0) {
    container.innerHTML = '<p>No recommended products found.</p>';
    return;
  }
  
  let html = '';
  
  products.forEach(product => {
    const price = (product.price / 100).toFixed(2);
    
    html += `
      <div class="product-card">
        <a href="${product.url}" class="product-link">
          <div class="product-image">
            <img src="${product.featured_image}" alt="${product.title}">
          </div>
          <h3 class="product-title">${product.title}</h3>
          <p class="product-price">£${price} <span class="vat-text">Inc VAT</span></p>
        </a>
        <form action="/cart/add" method="post">
          <input type="hidden" name="id" value="${product.variants[0].id}">
          <button type="submit" class="add-to-cart-btn">Add to cart</button>
        </form>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Event listeners for toggling between archived and alternative/recommended products
function setupEventListeners() {
  // Remove any existing event listeners to prevent duplicates
  document.body.removeEventListener('click', handleArchiveClick);
  document.body.removeEventListener('click', handleAlternativeClick);
  
  // Add new event listeners
  document.body.addEventListener('click', handleArchiveClick);
  document.body.addEventListener('click', handleAlternativeClick);
}

// Handler for archive link click
function handleArchiveClick(e) {
  if (e.target.hasAttribute('data-show-archived') || e.target.closest('[data-show-archived]')) {
    e.preventDefault();
    console.log('Archive link clicked');
    
    // Get all the relevant elements
    const alternativeContainer = document.getElementById('alternative-product-container');
    const recommendedContainer = document.getElementById('recommended-products-container');
    const productUnavailable = document.querySelector('.product--unavailable');
    
    console.log('Toggle state (archive):', {
      alternativeContainer,
      recommendedContainer,
      productUnavailable
    });
    
    // Add body class to control visibility
    document.body.classList.add('showing-archived');
    document.body.classList.remove('showing-alternative');
    
    // Hide alternative/recommended containers
    if (alternativeContainer) {
      console.log('Hiding alternative container');
      alternativeContainer.classList.add('hidden');
    }
    
    if (recommendedContainer) {
      console.log('Hiding recommended container');
      recommendedContainer.classList.add('hidden');
    }
    
    // Show the original product display
    if (productUnavailable) {
      console.log('Setting unavailable product to visible');
      // Add show class for additional styling
      productUnavailable.classList.add('show');
      
      // Log the current state to debug
      console.log('Unavailable product state:', {
        bodyClasses: document.body.classList,
        productClasses: productUnavailable.classList
      });
    } else {
      console.error('Unavailable product element not found');
      // Try to find it by another selector
      const altProductUnavailable = document.querySelector('.product');
      console.log('Alternative product element found:', altProductUnavailable);
      if (altProductUnavailable) {
        altProductUnavailable.classList.add('show');
      }
    }
    
    // Update the notice text
    updateNoticeText('View recommended product(s)', 'data-show-alternative', 'data-show-archived');
  }
}

// Handler for alternative link click
function handleAlternativeClick(e) {
  if (e.target.hasAttribute('data-show-alternative') || e.target.closest('[data-show-alternative]')) {
    e.preventDefault();
    
    // Toggle visibility
    const alternativeContainer = document.getElementById('alternative-product-container');
    const recommendedContainer = document.getElementById('recommended-products-container');
    const productUnavailable = document.querySelector('.product--unavailable');
    
    console.log('Alternative link clicked');
    console.log('Toggle state (alternative):', {
      alternativeContainer,
      recommendedContainer,
      productUnavailable
    });
    
    // Add body class to control visibility
    document.body.classList.add('showing-alternative');
    document.body.classList.remove('showing-archived');
    
    // Show alternative/recommended containers
    if (alternativeContainer) {
      console.log('Showing alternative container');
      alternativeContainer.classList.remove('hidden');
    }
    
    if (recommendedContainer) {
      console.log('Showing recommended container');
      recommendedContainer.classList.remove('hidden');
    }
    
    // Hide the original product display
    if (productUnavailable) {
      console.log('Hiding unavailable product');
      // Remove show class
      productUnavailable.classList.remove('show');
      
      // Log the current state to debug
      console.log('Unavailable product state:', {
        bodyClasses: document.body.classList,
        productClasses: productUnavailable.classList
      });
    }
    
    // Update the notice text back
    updateNoticeText('View archived product page', 'data-show-archived', 'data-show-alternative');
  }
}

function updateNoticeText(newText, addAttribute, removeAttribute) {
  const noticeElement = document.querySelector('[data-unavailable-notice]');
  if (noticeElement) {
    const linkElement = noticeElement.querySelector('.archive-link');
    if (linkElement) {
      linkElement.textContent = newText;
      linkElement.setAttribute(addAttribute, '');
      linkElement.removeAttribute(removeAttribute);
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing unavailable product functionality');
  
  // Log initial elements for debugging
  console.log('Initial elements:', {
    alternativeContainer: document.getElementById('alternative-product-container'),
    originalProductDisplay: document.getElementById('original-product-display'),
    recommendedContainer: document.getElementById('recommended-products-container')
  });
  
  // Initial setup of event listeners
  setupEventListeners();
  
  // Set initial state - default to showing alternative if available
  if (document.getElementById('alternative-product-container') || 
      document.getElementById('recommended-products-container')) {
    // Default to showing alternative
    document.body.classList.add('showing-alternative');
    document.body.classList.remove('showing-archived');
    
    // Make sure the unavailable product is hidden initially
    const productUnavailable = document.querySelector('.product--unavailable');
    if (productUnavailable) {
      productUnavailable.classList.remove('show');
    }
    
    console.log('Initial state set to showing alternative');
  }
  
  // Load alternative product if container exists
  if (document.getElementById('alternative-product-container') && 
      document.getElementById('alternative-product-container').dataset.alternativeHandle) {
    loadAlternativeProduct();
  }
  
  // Load recommended products if container exists
  if (document.getElementById('recommended-products-container') && 
      document.getElementById('recommended-products-container').dataset.productId) {
    loadRecommendedProducts();
  }
});
