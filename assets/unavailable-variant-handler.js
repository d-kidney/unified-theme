// Handles unavailable variant UI updates and interactions
class UnavailableVariantHandler {
  constructor() {
    this.productElement = document.querySelector('.product[data-product-id]');
    if (!this.productElement) return;
    
    this.allVariantsUnavailable = this.productElement.dataset.allVariantsUnavailable === 'true';
    this.variantNotice = document.querySelector('[data-variant-notice]');
    this.buyButton = document.querySelector('.product-form__submit');
    this.currentVariantId = null;
    
    // Store variant data from the page
    this.variantData = this.extractVariantData();
    
    this.initializeListeners();
  }

  extractVariantData() {
    // Extract variant metafield data from the page
    // This would be populated by Liquid when the page loads
    const variantData = {};
    const scripts = document.querySelectorAll('script[data-variant-metafields]');
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        Object.assign(variantData, data);
      } catch (e) {
        console.error('Error parsing variant metafields:', e);
      }
    });
    return variantData;
  }

  initializeListeners() {
    // Listen for variant changes via pub/sub system
    if (window.subscribe && window.PUB_SUB_EVENTS) {
      this.variantChangeUnsubscriber = subscribe(
        PUB_SUB_EVENTS.optionValueSelectionChange,
        this.handleVariantChange.bind(this)
      );
    }
    
    // Listen for "view alternatives" clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-show-variant-alternatives]')) {
        e.preventDefault();
        this.showVariantAlternatives(e.target);
      }
      
      if (e.target.matches('.button--unavailable[data-show-alternatives]')) {
        e.preventDefault();
        this.showVariantAlternatives(e.target);
      }
    });
    
    // Set initial state
    this.updateInitialState();
  }

  updateInitialState() {
    const currentStatus = this.productElement.dataset.currentVariantStatus;
    if (currentStatus && this.variantNotice) {
      this.updateVariantNotice(null, currentStatus);
    }
    // Also update in stock label on initial load
    this.updateInStockLabel(null, currentStatus);
  }

  async handleVariantChange(event) {
    // This is called when variant selection changes
    // We need to update the UI based on the new variant's status
    
    // Wait a moment for the DOM to update
    setTimeout(() => {
      this.updateFromProductInfo();
    }, 100);
  }

  updateFromProductInfo() {
    // Get the updated product info element
    const productInfo = document.querySelector('product-info');
    if (!productInfo) return;
    
    // Find the current variant ID from the form
    const variantIdInput = productInfo.querySelector('input[name="id"]');
    if (!variantIdInput) return;
    
    const variantId = variantIdInput.value;
    if (variantId === this.currentVariantId) return; // No change
    
    this.currentVariantId = variantId;
    
    // Get variant status from our stored data or from data attributes
    const variantStatus = this.getVariantStatus(variantId);
    
    // Update UI elements
    this.updateVariantNotice(variantId, variantStatus);
    this.updateBuyButton(variantId, variantStatus);
    this.updateInStockLabel(variantId, variantStatus);
  }

  getVariantStatus(variantId) {
    // First check our stored variant data
    if (this.variantData[variantId]) {
      return this.variantData[variantId].status;
    }
    
    // Fallback: check data attributes on variant options
    const variantOption = document.querySelector(`[data-variant-id="${variantId}"]`);
    if (variantOption) {
      return variantOption.dataset.variantStatus;
    }
    
    return null;
  }

  updateVariantNotice(variantId, status) {
    if (!this.variantNotice || this.allVariantsUnavailable) return;
    
    const isUnavailable = status === 'discontinued' || status === 'not_for_sale';
    this.variantNotice.style.display = isUnavailable ? 'block' : 'none';
    
    // Update notice content if needed
    if (isUnavailable && variantId) {
      this.variantNotice.dataset.variantId = variantId;
      
      const noticeText = this.variantNotice.querySelector('.notice-text strong');
      if (noticeText) {
        if (status === 'discontinued') {
          noticeText.textContent = 'This variant is discontinued';
        } else if (status === 'not_for_sale') {
          noticeText.textContent = "We don't sell this variant";
        }
      }
    }
  }

  updateBuyButton(variantId, status) {
    if (!this.buyButton) return;
    
    const isUnavailable = status === 'discontinued' || status === 'not_for_sale';
    const buttonText = this.buyButton.querySelector('span');
    if (!buttonText) return;
    
    // Store original button state
    if (!this.originalButtonText) {
      this.originalButtonText = buttonText.textContent.trim();
    }
    
    if (isUnavailable) {
      this.buyButton.disabled = true;
      this.buyButton.classList.add('button--unavailable');
      
      // Check if variant has alternatives
      const hasAlternatives = this.variantData[variantId]?.hasAlternatives || false;
      
      if (status === 'discontinued') {
        buttonText.textContent = hasAlternatives ? 
          'Discontinued - View Alternatives' : 'Discontinued';
      } else {
        buttonText.textContent = hasAlternatives ? 
          'Not Available - View Alternatives' : 'Not Available';
      }
      
      if (hasAlternatives) {
        this.buyButton.dataset.showAlternatives = 'true';
      } else {
        delete this.buyButton.dataset.showAlternatives;
      }
    } else {
      // Reset button to original state
      this.buyButton.classList.remove('button--unavailable');
      delete this.buyButton.dataset.showAlternatives;
      
      // Let the normal product form handle the button state
      // Just remove our unavailable-specific changes
    }
  }

  updateInStockLabel(variantId, status) {
    const inStockLabel = document.querySelector('[data-in-stock-label]');
    if (!inStockLabel) return;
    
    const textElement = inStockLabel.querySelector('.in_stock_text');
    if (!textElement) return;
    
    // Handle discontinued and no_restock_date - show in red
    if (status === 'discontinued' || status === 'no_restock_date') {
      inStockLabel.style.display = 'block';
      inStockLabel.classList.add('in_stock_label--unavailable');
      inStockLabel.classList.remove('in_stock_label');
      
      if (status === 'discontinued') {
        textElement.textContent = 'Discontinued';
      } else {
        textElement.textContent = 'Out of Stock';
      }
      
      // Disable the delivery date script updates
      inStockLabel.dataset.skipDeliveryUpdate = 'true';
    } 
    // Hide for all other statuses except normal stock
    else if (status && status !== '') {
      inStockLabel.style.display = 'none';
    } 
    // Show normal in stock for variants with no status
    else {
      inStockLabel.style.display = 'block';
      inStockLabel.classList.remove('in_stock_label--unavailable');
      inStockLabel.classList.add('in_stock_label');
      textElement.textContent = 'In stock';
      
      // Re-enable delivery date updates
      delete inStockLabel.dataset.skipDeliveryUpdate;
    }
  }

  async showVariantAlternatives(trigger) {
    const variantId = this.currentVariantId || 
                     trigger.closest('[data-variant-id]')?.dataset.variantId;
    if (!variantId) return;
    
    const container = document.querySelector(`[data-variant-alternatives][data-variant-id="${variantId}"]`);
    if (!container) return;
    
    // Toggle visibility
    if (container.style.display === 'block') {
      container.style.display = 'none';
      return;
    }
    
    // Load alternatives if not already loaded
    if (!container.dataset.loaded) {
      container.innerHTML = '<div class="loading">Loading alternatives...</div>';
      container.style.display = 'block';
      
      try {
        // Get alternative product data
        const alternativeData = this.variantData[variantId]?.alternative;
        
        if (alternativeData) {
          // Fetch the alternative product
          const response = await fetch(`/products/${alternativeData.handle}.js`);
          const product = await response.json();
          
          container.innerHTML = `
            <div class="variant-alternatives">
              <h4>Recommended Alternative:</h4>
              <div class="alternative-product-card">
                <a href="${product.url}" class="alternative-product-link">
                  ${product.featured_image ? `
                    <img src="${product.featured_image}" alt="${product.title}" class="alternative-product-image">
                  ` : ''}
                  <div class="alternative-product-info">
                    <h5>${product.title}</h5>
                    <p class="alternative-product-price">
                      ${this.formatMoney(product.price)} 
                      ${product.compare_at_price ? `<s>${this.formatMoney(product.compare_at_price)}</s>` : ''}
                    </p>
                  </div>
                </a>
              </div>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="variant-alternatives">
              <p>No specific alternative set. Please <a href="/pages/contact-us">contact us</a> for recommendations.</p>
            </div>
          `;
        }
        
        container.dataset.loaded = 'true';
      } catch (error) {
        console.error('Error loading alternative:', error);
        container.innerHTML = `
          <div class="variant-alternatives">
            <p>Error loading alternative. Please <a href="/pages/contact-us">contact us</a> for recommendations.</p>
          </div>
        `;
      }
    } else {
      container.style.display = 'block';
    }
  }

  formatMoney(cents) {
    // Simple money formatting - adjust based on your shop's currency
    return '£' + (cents / 100).toFixed(2);
  }

  disconnect() {
    if (this.variantChangeUnsubscriber) {
      this.variantChangeUnsubscriber();
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.unavailableVariantHandler = new UnavailableVariantHandler();
});

// Also initialize after dynamic content updates
document.addEventListener('product-info:loaded', () => {
  if (!window.unavailableVariantHandler) {
    window.unavailableVariantHandler = new UnavailableVariantHandler();
  }
});