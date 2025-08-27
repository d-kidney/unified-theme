// Debounce function to delay API calls
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Store pending updates to prevent duplicate API calls (scoped to window to prevent redeclaration)
window.enquiryDrawerPendingUpdates = window.enquiryDrawerPendingUpdates || {};

// Flag to prevent duplicate events when button triggers input change (scoped to window)
window.isButtonTriggeredChange = window.isButtonTriggeredChange || false;

// Check if EnquiryDrawer is already defined to prevent redeclaration errors
if (!customElements.get('enquiry-drawer')) {
  class EnquiryDrawer extends HTMLElement {
    constructor() {
      super();
      this.drawer = this.querySelector('#EnquiryDrawer');
      this.overlay = this.querySelector('#EnquiryDrawer-Overlay');
      this.itemsContainer = this.querySelector('#EnquiryItems');
      
      // Bind methods
      this.open = this.open.bind(this);
      this.close = this.close.bind(this);
      this.onBodyClick = this.onBodyClick.bind(this);
      
      // Create debounced methods
      this.debouncedUpdateQuantity = debounce(this.updateEnquiryItemQuantity.bind(this), 500);
      
      // Add event listeners
      this.overlay.addEventListener('click', this.close);
      this.addEventListener('keyup', (event) => event.code === 'Escape' && this.close());
      
      // Initialize
      this.initEnquiry();
    }
    
    initEnquiry() {
      try {
        // Initialize enquiry count
        this.updateEnquiryCount();
        
        // Enquiry icon now navigates directly to the enquiry form page
        // No click event listener needed as it uses standard href navigation
        
        // Log initialization
        if (window.EnquirySystemHelpers) {
          window.EnquirySystemHelpers.logDebug('Enquiry drawer initialized');
        } else {
          console.log('Enquiry drawer initialized');
        }
      } catch (e) {
        console.error('Error initializing enquiry drawer:', e);
      }
    }
    
    open() {
      // Render enquiry items
      this.renderEnquiryItems();
      
      // Show drawer
      this.drawer.classList.add('active');
      this.drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('overflow-hidden');
      
      // Add body click listener
      document.body.addEventListener('click', this.onBodyClick);
    }
    
    close() {
      this.drawer.classList.remove('active');
      this.drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('overflow-hidden');
      
      // Remove body click listener
      document.body.removeEventListener('click', this.onBodyClick);
    }
    
    onBodyClick(event) {
      if (!this.contains(event.target)) {
        this.close();
      }
    }
    
    async renderEnquiryItems() {
      const enquiryItems = await this.getEnquiryItems();
      
      // Clear current items
      if (this.itemsContainer) {
        this.itemsContainer.innerHTML = '';
        
        if (enquiryItems.length === 0) {
          // Show empty message
          this.classList.add('is-empty');
        } else {
          this.classList.remove('is-empty');
          
          // Add items to the drawer
          enquiryItems.forEach((item, index) => {
            const itemElement = document.createElement('tr');
            itemElement.id = `EnquiryItem-${index + 1}`;
            itemElement.className = 'cart-item';
            itemElement.setAttribute('role', 'row');
            
            // Create image HTML with error handling
            const imageHtml = item.image 
              ? `<img
                  class="cart-item__image"
                  src="${item.image}"
                  alt="${item.title}"
                  loading="lazy"
                  width="150"
                  height="150"
                  onerror="this.src='/assets/icon-cart.svg';"
                >`
              : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="cart-item__image" style="padding: 20%; opacity: 0.3;">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>`;
            
            itemElement.innerHTML = `
              <td class="cart-item__media" role="cell" headers="EnquiryDrawer-ColumnProductImage">
                <a href="${item.url || `/products/${item.handle || ''}`}" class="cart-item__link" tabindex="-1" aria-hidden="true"> </a>
                ${imageHtml}
              </td>
              <td class="cart-item__details" role="cell" headers="EnquiryDrawer-ColumnProduct">
                <a href="${item.url || `/products/${item.handle || ''}`}" class="cart-item__name h4 break">
                  ${item.title}
                </a>
                
                ${item.variant_title ? `
                  <dl>
                    <div class="product-option">
                      <dt>Options:</dt>
                      <dd>${item.variant_title}</dd>
                    </div>
                  </dl>
                ` : ''}
              </td>
              <td
                class="cart-item__quantity"
                role="cell"
                headers="EnquiryDrawer-ColumnQuantity"
              >
                <div class="cart-item__quantity-wrapper">
                  <div class="quantity-display">
                    <span class="quantity-label">Qty: ${item.quantity}</span>
                    <div class="quantity-info">Edit on enquiry form</div>
                  </div>
                  <button
                    type="button"
                    class="button button--tertiary enquiry-remove-button"
                    data-variant-id="${item.variant_id}"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true" focusable="false" class="icon icon-remove">
                      <path d="M14 3h-3.53a3.07 3.07 0 00-.6-1.65C9.44.82 8.8.5 8 .5s-1.44.32-1.87.85A3.06 3.06 0 005.53 3H2a.5.5 0 000 1h1.25v10c0 .28.22.5.5.5h8.5a.5.5 0 00.5-.5V4H14a.5.5 0 000-1zM6.91 1.98c.23-.29.58-.48 1.09-.48s.85.19 1.09.48c.2.24.3.6.36 1.02h-2.9c.05-.42.17-.78.36-1.02zm4.84 11.52h-7.5V4h7.5v9.5z" fill="currentColor"/>
                      <path d="M6.55 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5zM9.45 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </td>
            `;
            
            this.itemsContainer.appendChild(itemElement);
          });
          
          // Add event listeners for quantity changes and remove buttons
          this.addEventListeners();
        }
      }
    }
    
    addEventListeners() {
      // Remove button events only - quantity editing is handled on the enquiry form page
      const removeButtons = this.querySelectorAll('.enquiry-remove-button');
      removeButtons.forEach(button => {
        button.addEventListener('click', this.handleRemoveClick.bind(this));
      });
    }
    
    handleRemoveClick(event) {
      const button = event.currentTarget;
      const variantId = button.dataset.variantId;
      
      this.removeFromEnquiry(variantId);
    }
    
    async getEnquiryItems() {
      try {
        const helpers = window.EnquirySystemHelpers;
        const config = window.EnquirySystemConfig;
        
        if (!helpers || !config) {
          console.error('Enquiry system configuration not found');
          return [];
        }
        
        // Get draft order ID and token from cookies
        const draftOrderId = helpers.getCookie('enquiryDraftId');
        const token = helpers.getCookie('enquiryDraftToken');
        
        if (!draftOrderId || !token) {
          helpers.logDebug('No draft order ID or token found in cookies');
          return [];
        }
        
        // Call API to get draft order details
        const response = await fetch(
          `${config.apiUrl}/api/enquiry/get-draft?id=${draftOrderId}&token=${token}`
        );
        
        if (!response.ok) {
          // If draft order not found, clear cookies and return empty array
          if (response.status === 404) {
            helpers.logDebug('Draft order not found, clearing cookies');
            helpers.removeCookie('enquiryDraftId');
            helpers.removeCookie('enquiryDraftToken');
            return [];
          }
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          helpers.logDebug(`Retrieved ${data.items.length} items from API`);
          
          // Enrich items with product data if we have GIDs
          const itemsWithGids = data.items.filter(item => item.product_gid);
          if (itemsWithGids.length > 0) {
            try {
              const enrichedData = await this.enrichProductData(itemsWithGids);
              // Merge enriched data with items
              return data.items.map(item => {
                if (item.product_gid && enrichedData[item.product_gid]) {
                  return {
                    ...item,
                    ...enrichedData[item.product_gid],
                    url: `/products/${enrichedData[item.product_gid].handle}`
                  };
                }
                return item;
              });
            } catch (enrichError) {
              helpers.logDebug('Error enriching products, using basic data: ' + enrichError.message);
              return data.items;
            }
          }
          
          return data.items;
        } else {
          console.error('Error retrieving enquiry items:', data.error);
          return [];
        }
      } catch (e) {
        console.error('Error getting enquiry items:', e);
        return [];
      }
    }
    
    async enrichProductData(items) {
      const helpers = window.EnquirySystemHelpers;
      const config = window.EnquirySystemConfig;
      
      const productGids = [...new Set(items.map(item => item.product_gid).filter(Boolean))];
      
      helpers.logDebug(`Enriching ${productGids.length} products`);
      
      const response = await fetch(`${config.apiUrl}/api/enquiry/enrich-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productGids
        })
      });
      
      if (!response.ok) {
        throw new Error(`Enrichment API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.products;
      } else {
        throw new Error(data.error || 'Enrichment failed');
      }
    }
    
    async addToEnquiry(item) {
      try {
        const helpers = window.EnquirySystemHelpers;
        const config = window.EnquirySystemConfig;
        
        if (!helpers || !config) {
          console.error('Enquiry system configuration not found');
          return;
        }
        
        // Ensure item has a valid quantity
        if (!item.quantity || isNaN(item.quantity) || item.quantity < 1) {
          item.quantity = 1;
        }
        
        helpers.logDebug('Adding item to enquiry:', item);
        
        // Get draft order ID and token from cookies
        const draftOrderId = helpers.getCookie('enquiryDraftId');
        const token = helpers.getCookie('enquiryDraftToken');
        
        if (draftOrderId && token) {
          // Get current items
          const currentItems = await this.getEnquiryItems();
          
          // Check if we still have a valid draft order (cookies might have been cleared if 404)
          const stillHasDraftOrder = helpers.getCookie('enquiryDraftId');
          
          if (!stillHasDraftOrder) {
            // Draft order was deleted, create a new one
            helpers.logDebug('Draft order no longer exists, creating new one');
            const response = await fetch(`${config.apiUrl}/api/enquiry/create-draft`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                items: [item]
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              // Store draft order ID and token in cookies
              helpers.setCookie('enquiryDraftId', data.draftOrderId, config.cookieExpiry);
              helpers.setCookie('enquiryDraftToken', data.draftOrderToken, config.cookieExpiry);
              
              helpers.logDebug(`Created new draft order ${data.draftOrderId} with item ${item.variant_id}`);
              this.updateEnquiryCount();
              this.showNotification(item);
            } else {
              console.error('Error creating enquiry:', data.error);
              alert('There was an error adding the item to your enquiry. Please try again.');
            }
            return;
          }
          
          // Check if item already exists
          const existingItem = currentItems.find(i => i.variant_id === item.variant_id);
          
          if (existingItem) {
            // Update quantity if item already exists
            // Add the new quantity to the existing quantity (like Shopify's default cart)
            const newQuantity = existingItem.quantity + item.quantity;
            
            // Update the draft order
            const response = await fetch(`${config.apiUrl}/api/enquiry/update-draft`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                draftOrderId,
                token,
                items: currentItems.map(i => 
                  i.variant_id === item.variant_id 
                    ? { ...i, quantity: newQuantity }
                    : i
                )
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              helpers.logDebug(`Updated quantity of item ${item.variant_id} to ${newQuantity}`);
              this.updateEnquiryCount();
              this.showNotification(item);
            } else {
              console.error('Error updating enquiry:', data.error);
              alert('There was an error updating your enquiry. Please try again.');
            }
          } else {
            // Add new item to existing draft order
            const response = await fetch(`${config.apiUrl}/api/enquiry/update-draft`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                draftOrderId,
                token,
                items: [...currentItems, item]
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              helpers.logDebug(`Added new item ${item.variant_id} to existing draft order`);
              this.updateEnquiryCount();
              this.showNotification(item);
            } else {
              console.error('Error updating enquiry:', data.error);
              alert('There was an error adding the item to your enquiry. Please try again.');
            }
          }
        } else {
          // Create new draft order
          const response = await fetch(`${config.apiUrl}/api/enquiry/create-draft`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: [item]
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Store draft order ID and token in cookies
            helpers.setCookie('enquiryDraftId', data.draftOrderId, config.cookieExpiry);
            helpers.setCookie('enquiryDraftToken', data.draftOrderToken, config.cookieExpiry);
            
            helpers.logDebug(`Created new draft order ${data.draftOrderId} with item ${item.variant_id}`);
            this.updateEnquiryCount();
            this.showNotification(item);
          } else {
            console.error('Error creating enquiry:', data.error);
            alert('There was an error adding the item to your enquiry. Please try again.');
          }
        }
      } catch (e) {
        console.error('Error adding to enquiry:', e);
        alert('There was an error adding the item to your enquiry. Please try again.');
      }
    }
    
    async updateEnquiryItemQuantity(variantId, quantity) {
      try {
        const helpers = window.EnquirySystemHelpers;
        const config = window.EnquirySystemConfig;
        
        if (!helpers || !config) {
          console.error('Enquiry system configuration not found');
          return;
        }
        
        // Get draft order ID and token from cookies
        const draftOrderId = helpers.getCookie('enquiryDraftId');
        const token = helpers.getCookie('enquiryDraftToken');
        
        if (!draftOrderId || !token) {
          helpers.logDebug('No draft order ID or token found in cookies');
          return;
        }
        
        // Get current items
        const currentItems = await this.getEnquiryItems();
        
        // Update quantity of the specified item
        const updatedItems = currentItems.map(item => 
          item.variant_id === variantId 
            ? { ...item, quantity }
            : item
        );
        
        // Update the draft order
        const response = await fetch(`${config.apiUrl}/api/enquiry/update-draft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            draftOrderId,
            token,
            items: updatedItems
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          helpers.logDebug(`Updated quantity of item ${variantId} to ${quantity}`);
          // Only update the count, don't re-render the entire drawer
          // This prevents adding duplicate event listeners
          this.updateEnquiryCount();
          
          // Update the input value directly to ensure it shows the correct quantity
          const input = this.querySelector(`.quantity__input[data-variant-id="${variantId}"]`);
          if (input && input.value != quantity) {
            input.value = quantity;
          }
        } else {
          console.error('Error updating enquiry item quantity:', data.error);
        }
      } catch (e) {
        console.error('Error updating enquiry item quantity:', e);
      }
    }
    
    async removeFromEnquiry(variantId) {
      try {
        const helpers = window.EnquirySystemHelpers;
        const config = window.EnquirySystemConfig;
        
        if (!helpers || !config) {
          console.error('Enquiry system configuration not found');
          return;
        }
        
        // Get draft order ID and token from cookies
        const draftOrderId = helpers.getCookie('enquiryDraftId');
        const token = helpers.getCookie('enquiryDraftToken');
        
        if (!draftOrderId || !token) {
          helpers.logDebug('No draft order ID or token found in cookies');
          return;
        }
        
        // Get current items
        const currentItems = await this.getEnquiryItems();
        
        // Check if draft order still exists
        const stillHasDraftOrder = helpers.getCookie('enquiryDraftId');
        if (!stillHasDraftOrder) {
          // Draft order was deleted, just refresh display
          helpers.logDebug('Draft order no longer exists');
          this.updateEnquiryCount();
          this.renderEnquiryItems();
          return;
        }
        
        // Filter out the item to remove
        const updatedItems = currentItems.filter(item => item.variant_id !== variantId);
        
        // If no items left, delete the draft order instead of updating
        if (updatedItems.length === 0) {
          helpers.logDebug('No items remaining, deleting draft order');
          
          const response = await fetch(`${config.apiUrl}/api/enquiry/delete-draft`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              draftOrderId,
              token
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            helpers.logDebug('Draft order deleted successfully');
            
            // Clear the cookies
            helpers.removeCookie('enquiryDraftId');
            helpers.removeCookie('enquiryDraftToken');
            
            this.updateEnquiryCount();
            this.renderEnquiryItems();
          } else {
            console.error('Error deleting draft order:', data.error);
          }
        } else {
          // Update the draft order
          const response = await fetch(`${config.apiUrl}/api/enquiry/update-draft`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              draftOrderId,
              token,
              items: updatedItems
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            helpers.logDebug(`Removed item ${variantId} from enquiry`);
            
            this.updateEnquiryCount();
            this.renderEnquiryItems();
          } else {
            console.error('Error removing item from enquiry:', data.error);
          }
        }
      } catch (e) {
        console.error('Error removing from enquiry:', e);
      }
    }
    
    async updateEnquiryCount() {
      try {
        const enquiryItems = await this.getEnquiryItems();
        const count = enquiryItems.reduce((total, item) => total + item.quantity, 0);
        
        const countBubble = document.getElementById('enquiry-count-bubble');
        const countElement = document.getElementById('enquiry-count');
        
        if (countElement) {
          countElement.textContent = count;
        }
        
        if (countBubble) {
          countBubble.style.display = count > 0 ? 'flex' : 'none';
        }
        
        // Store count in localStorage to prevent flash on page reload
        try {
          localStorage.setItem('enquiryCount', count.toString());
        } catch (storageError) {
          // Fail silently if localStorage is not available
        }
      } catch (e) {
        console.error('Error updating enquiry count:', e);
      }
    }
    
    showNotification(item) {
      const notification = document.getElementById('enquiry-notification');
      const productContainer = document.getElementById('enquiry-notification-product');
      
      if (notification && productContainer) {
        // Get the latest quantity from the API if this item already exists
        this.getEnquiryItems().then(items => {
          let displayQuantity = item.quantity;
          const existingItem = items.find(i => i.variant_id === item.variant_id);
          
          if (existingItem) {
            displayQuantity = existingItem.quantity;
          }
          
          // Add product to notification
          productContainer.innerHTML = `
            <div class="cart-notification-product__image">
              <img src="${item.image}" alt="${item.title}" width="70" height="70" onerror="this.src='/assets/icon-cart.svg'">
            </div>
            <div>
              <h3 class="cart-notification-product__name h4">${item.title}</h3>
              ${item.variant_title ? `<p class="cart-notification-product__options">${item.variant_title}</p>` : ''}
              <p class="cart-notification-product__options">Quantity: ${displayQuantity}</p>
            </div>
          `;
          
          // Show notification
          notification.classList.add('animate', 'active');
          
          // Add close event
          const closeButton = notification.querySelector('.cart-notification__close');
          if (closeButton) {
            closeButton.addEventListener('click', () => {
              notification.classList.remove('animate', 'active');
            });
          }
          
          // Auto-hide after 5 seconds
          setTimeout(() => {
            notification.classList.remove('animate', 'active');
          }, 5000);
          
          // Cache product image and vendor
          if (item.variant_id && item.image) {
            try {
              const cache = JSON.parse(localStorage.getItem('enquiry_product_cache') || '{}');
              cache[item.variant_id] = {
                image: item.image,
                vendor: item.vendor || ''
              };
              localStorage.setItem('enquiry_product_cache', JSON.stringify(cache));
            } catch (e) {
              // Fail silently if localStorage is full/disabled
            }
          }
        });
      }
    }
  }

  // Define custom elements
  customElements.define('enquiry-drawer', EnquiryDrawer);
}

// Add to Enquiry Button functionality
if (!customElements.get('add-to-enquiry')) {
  class AddToEnquiryButton extends HTMLElement {
    constructor() {
      super();
      this.button = this.querySelector('button');
      
      if (this.button) {
        this.button.addEventListener('click', this.handleAddToEnquiry.bind(this));
      }
      
      // Log initialization for debugging
      console.log('AddToEnquiryButton initialized');
    }
    
    handleAddToEnquiry(event) {
      event.preventDefault();
      console.log('Add to Enquiry button clicked');
      
      // Try to get variant ID from different sources
      let variantId, quantity = 1;
      
      // 1. Try to get from form - using the exact approach from the theme
      // Find all product forms on the page (they follow the pattern 'product-form-SECTION_ID')
      const productForms = document.querySelectorAll('form[id^="product-form-"]');
      if (productForms.length > 0) {
        try {
          // Use the first product form (most likely the main one)
          const form = productForms[0];
          const formId = form.id;
          
          // Get the variant ID from the form
          const formData = new FormData(form);
          variantId = formData.get('id');
          
          // CRITICAL: In Dawn theme, the quantity input is OUTSIDE the form
          // but connected via the form attribute. We need to find it directly.
          const quantityInput = document.querySelector(`input[name="quantity"][form="${formId}"]`);
          
          if (quantityInput) {
            quantity = parseInt(quantityInput.value || 1);
          } else {
            // Fallbacks if the main approach fails
            // Try inside the form (less common in Dawn theme)
            const internalQuantityInput = form.querySelector('input[name="quantity"]');
            if (internalQuantityInput) {
              quantity = parseInt(internalQuantityInput.value || 1);
            } else {
              // Try any quantity input on the page as last resort
              const anyQuantityInput = document.querySelector('input.quantity__input[name="quantity"]');
              if (anyQuantityInput) {
                quantity = parseInt(anyQuantityInput.value || 1);
              }
            }
          }
          
          // Ensure quantity is at least 1
          if (isNaN(quantity) || quantity < 1) {
            quantity = 1;
          }
        } catch (e) {
          console.error('Error getting form data:', e);
        }
      }
      
      // 2. If no form or no variant ID, try to get it from the URL
      if (!variantId) {
        const urlParams = new URLSearchParams(window.location.search);
        variantId = urlParams.get('variant');
      }
      
      // 3. If still no variant ID, try to get it from hidden inputs
      if (!variantId) {
        const variantInput = document.querySelector('input[name="id"][data-product-selected-variant]');
        if (variantInput) {
          variantId = variantInput.value;
        }
      }
      
      // 4. If still no variant ID, try to get it from the product metafields
      if (!variantId && window.meta && window.meta.product) {
        variantId = window.meta.product.variants[0].id;
      }
      
      // 5. Last resort: use the product ID from the button's data attribute
      if (!variantId) {
        variantId = this.dataset.productId;
      }
      
      // If we still don't have a variant ID, show an error
      if (!variantId) {
        console.error('Could not determine variant ID for enquiry');
        return;
      }
      
      // Get product details
      let productTitle = '';
      const titleElement = document.querySelector('h1');
      if (titleElement) {
        productTitle = titleElement.textContent.trim();
      } else {
        // Fallback to meta title
        productTitle = document.title.split(' – ')[0].trim();
      }
      
      const productUrl = window.location.pathname;
      
      // Get variant title if available
      let variantTitle = '';
      const variantSelectors = document.querySelectorAll('.product-form__input select, .product-form__input input[type="radio"]:checked');
      if (variantSelectors.length > 0) {
        const variantOptions = [];
        variantSelectors.forEach(selector => {
          if (selector.tagName === 'SELECT') {
            variantOptions.push(selector.options[selector.selectedIndex].text);
          } else {
            variantOptions.push(selector.value);
          }
        });
        variantTitle = variantOptions.join(' / ');
      }
      
      // Get product image
      let productImage = '';
      
      // Try multiple selectors that match Dawn's structure
      const productImageElement = 
        document.querySelector('.product__media-item.is-active img') || // Active/selected image
        document.querySelector('.product__media-item img') ||           // Any product image
        document.querySelector('.product-featured-media img') ||        // Featured media
        document.querySelector('.thumbnail.global-media-settings img') || // Thumbnail
        document.querySelector('.product__image');                      // Direct product image
      
      if (productImageElement) {
        productImage = productImageElement.src;
      } else {
        // Try to get image from product JSON data
        try {
          const productJSON = document.querySelector('script[type="application/json"][data-product-json]');
          if (productJSON) {
            const productData = JSON.parse(productJSON.textContent);
            if (productData.featured_image) {
              productImage = productData.featured_image;
            } else if (productData.images && productData.images.length > 0) {
              productImage = productData.images[0];
            }
          }
        } catch (e) {
          console.error('Error parsing product JSON:', e);
        }
      }
      
      // Get product GID
      let productGid = null;
      
      // Try to get product ID from various sources
      if (window.meta && window.meta.product && window.meta.product.id) {
        // If we have the numeric ID, construct the GID
        productGid = `gid://shopify/Product/${window.meta.product.id}`;
      } else {
        // Try to get from product JSON
        try {
          const productJSON = document.querySelector('script[type="application/json"][data-product-json]');
          if (productJSON) {
            const productData = JSON.parse(productJSON.textContent);
            if (productData.id) {
              productGid = `gid://shopify/Product/${productData.id}`;
            }
          }
        } catch (e) {
          console.error('Error getting product ID from JSON:', e);
        }
      }
      
      // If still no product GID, try to get from button's data attribute
      if (!productGid && this.dataset.productId) {
        // Check if it's already a GID or just an ID
        if (this.dataset.productId.startsWith('gid://')) {
          productGid = this.dataset.productId;
        } else {
          productGid = `gid://shopify/Product/${this.dataset.productId}`;
        }
      }
      
      console.log('Product GID:', productGid);
      
      // Try to get vendor/brand
      let vendor = '';
      const vendorElement = document.querySelector('.product__vendor, .product__text, [itemprop="brand"]');
      if (vendorElement) {
        vendor = vendorElement.textContent.trim();
      }
      
      // Create the item object
      const item = {
        variant_id: variantId,
        product_gid: productGid,  // Use consistent naming: product_gid
        quantity: quantity,
        title: productTitle,
        variant_title: variantTitle,
        image: productImage,
        vendor: vendor,
        enquiryType: "POA"
      };
      
      // Find enquiry handler - either notification or drawer (mirrors Shopify's pattern)
      const enquiryHandler = document.querySelector('enquiry-notification') || document.querySelector('enquiry-drawer');
      if (enquiryHandler && typeof enquiryHandler.addToEnquiry === 'function') {
        // Add the item to the enquiry
        enquiryHandler.addToEnquiry(item);
      } else {
        console.error('Enquiry handler not found or addToEnquiry method not available');
        alert('There was an error adding the item to your enquiry. Please try again.');
      }
    }
  }
  
  // Register the custom element
  customElements.define('add-to-enquiry', AddToEnquiryButton);
}

// Enquiry Notification functionality
if (!customElements.get('enquiry-notification')) {
  class EnquiryNotification extends HTMLElement {
    constructor() {
      super();
      this.notification = this.querySelector('#enquiry-notification');
      this.closeButton = this.querySelector('.cart-notification__close');
      this.continueButton = this.querySelector('.button-label');
      this.productContainer = document.getElementById('enquiry-notification-product');
      
      if (this.closeButton) {
        this.closeButton.addEventListener('click', this.close.bind(this));
      }
      
      if (this.continueButton) {
        this.continueButton.addEventListener('click', this.close.bind(this));
      }
    }
    
    open() {
      this.notification.classList.add('animate', 'active');
      
      // Auto-hide after 5 seconds
      this.timeout = setTimeout(() => {
        this.close();
      }, 5000);
    }
    
    close() {
      this.notification.classList.remove('animate', 'active');
      
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
    }
    
    async addToEnquiry(item) {
      try {
        const helpers = window.EnquirySystemHelpers;
        const config = window.EnquirySystemConfig;
        
        if (!helpers || !config) {
          console.error('Enquiry system configuration not found');
          return;
        }
        
        // Ensure item has a valid quantity
        if (!item.quantity || isNaN(item.quantity) || item.quantity < 1) {
          item.quantity = 1;
        }
        
        helpers.logDebug('Adding item to enquiry:', item);
        
        // Get draft order ID and token from cookies
        const draftOrderId = helpers.getCookie('enquiryDraftId');
        const token = helpers.getCookie('enquiryDraftToken');
        
        if (draftOrderId && token) {
          // Get current items
          const currentItems = await this.getEnquiryItems();
          
          // Check if we still have a valid draft order (cookies might have been cleared if 404)
          const stillHasDraftOrder = helpers.getCookie('enquiryDraftId');
          
          if (!stillHasDraftOrder) {
            // Draft order was deleted, create a new one
            helpers.logDebug('Draft order no longer exists, creating new one');
            const response = await fetch(`${config.apiUrl}/api/enquiry/create-draft`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                items: [item]
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              // Store draft order ID and token in cookies
              helpers.setCookie('enquiryDraftId', data.draftOrderId, config.cookieExpiry);
              helpers.setCookie('enquiryDraftToken', data.draftOrderToken, config.cookieExpiry);
              
              helpers.logDebug(`Created new draft order ${data.draftOrderId} with item ${item.variant_id}`);
              this.updateEnquiryCount();
              this.showNotification(item);
            } else {
              console.error('Error creating enquiry:', data.error);
              alert('There was an error adding the item to your enquiry. Please try again.');
            }
            return;
          }
          
          // Check if item already exists
          const existingItem = currentItems.find(i => i.variant_id === item.variant_id);
          
          if (existingItem) {
            // Update quantity if item already exists
            // Add the new quantity to the existing quantity (like Shopify's default cart)
            const newQuantity = existingItem.quantity + item.quantity;
            
            // Update the draft order
            const response = await fetch(`${config.apiUrl}/api/enquiry/update-draft`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                draftOrderId,
                token,
                items: currentItems.map(i => 
                  i.variant_id === item.variant_id 
                    ? { ...i, quantity: newQuantity }
                    : i
                )
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              helpers.logDebug(`Updated quantity of item ${item.variant_id} to ${newQuantity}`);
              this.updateEnquiryCount();
              this.showNotification(item);
            } else {
              console.error('Error updating enquiry:', data.error);
              alert('There was an error updating your enquiry. Please try again.');
            }
          } else {
            // Add new item to existing draft order
            const response = await fetch(`${config.apiUrl}/api/enquiry/update-draft`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                draftOrderId,
                token,
                items: [...currentItems, item]
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              helpers.logDebug(`Added new item ${item.variant_id} to existing draft order`);
              this.updateEnquiryCount();
              this.showNotification(item);
            } else {
              console.error('Error updating enquiry:', data.error);
              alert('There was an error adding the item to your enquiry. Please try again.');
            }
          }
        } else {
          // Create new draft order
          const response = await fetch(`${config.apiUrl}/api/enquiry/create-draft`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: [item]
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Store draft order ID and token in cookies
            helpers.setCookie('enquiryDraftId', data.draftOrderId, config.cookieExpiry);
            helpers.setCookie('enquiryDraftToken', data.draftOrderToken, config.cookieExpiry);
            
            helpers.logDebug(`Created new draft order ${data.draftOrderId} with item ${item.variant_id}`);
            this.updateEnquiryCount();
            this.showNotification(item);
          } else {
            console.error('Error creating enquiry:', data.error);
            alert('There was an error adding the item to your enquiry. Please try again.');
          }
        }
      } catch (e) {
        console.error('Error adding to enquiry:', e);
        alert('There was an error adding the item to your enquiry. Please try again.');
      }
    }
    
    async getEnquiryItems() {
      try {
        const helpers = window.EnquirySystemHelpers;
        const config = window.EnquirySystemConfig;
        
        if (!helpers || !config) {
          console.error('Enquiry system configuration not found');
          return [];
        }
        
        // Get draft order ID and token from cookies
        const draftOrderId = helpers.getCookie('enquiryDraftId');
        const token = helpers.getCookie('enquiryDraftToken');
        
        if (!draftOrderId || !token) {
          helpers.logDebug('No draft order ID or token found in cookies');
          return [];
        }
        
        // Call API to get draft order details
        const response = await fetch(
          `${config.apiUrl}/api/enquiry/get-draft?id=${draftOrderId}&token=${token}`
        );
        
        if (!response.ok) {
          // If draft order not found, clear cookies and return empty array
          if (response.status === 404) {
            helpers.logDebug('Draft order not found, clearing cookies');
            helpers.removeCookie('enquiryDraftId');
            helpers.removeCookie('enquiryDraftToken');
            return [];
          }
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          helpers.logDebug(`Retrieved ${data.items.length} items from API`);
          return data.items;
        } else {
          console.error('Error retrieving enquiry items:', data.error);
          return [];
        }
      } catch (e) {
        console.error('Error getting enquiry items:', e);
        return [];
      }
    }
    
    async updateEnquiryCount() {
      try {
        const enquiryItems = await this.getEnquiryItems();
        const count = enquiryItems.reduce((total, item) => total + item.quantity, 0);
        
        const countBubble = document.getElementById('enquiry-count-bubble');
        const countElement = document.getElementById('enquiry-count');
        
        if (countElement) {
          countElement.textContent = count;
        }
        
        if (countBubble) {
          countBubble.style.display = count > 0 ? 'flex' : 'none';
        }
        
        // Store count in localStorage to prevent flash on page reload
        try {
          localStorage.setItem('enquiryCount', count.toString());
        } catch (storageError) {
          // Fail silently if localStorage is not available
        }
      } catch (e) {
        console.error('Error updating enquiry count:', e);
      }
    }
    
    showNotification(item) {
      if (this.notification && this.productContainer) {
        // Get the latest quantity from the API if this item already exists
        this.getEnquiryItems().then(items => {
          let displayQuantity = item.quantity;
          const existingItem = items.find(i => i.variant_id === item.variant_id);
          
          if (existingItem) {
            displayQuantity = existingItem.quantity;
          }
          
          // Add product to notification
          this.productContainer.innerHTML = `
            <div class="cart-notification-product__image">
              <img src="${item.image}" alt="${item.title}" width="70" height="70" onerror="this.src='/assets/icon-cart.svg'">
            </div>
            <div>
              <h3 class="cart-notification-product__name h4">${item.title}</h3>
              ${item.variant_title ? `<p class="cart-notification-product__options">${item.variant_title}</p>` : ''}
              <p class="cart-notification-product__options">Quantity: ${displayQuantity}</p>
            </div>
          `;
          
          // Show notification
          this.open();
          
          // Cache product image and vendor
          if (item.variant_id && item.image) {
            try {
              const cache = JSON.parse(localStorage.getItem('enquiry_product_cache') || '{}');
              cache[item.variant_id] = {
                image: item.image,
                vendor: item.vendor || ''
              };
              localStorage.setItem('enquiry_product_cache', JSON.stringify(cache));
            } catch (e) {
              // Fail silently if localStorage is full/disabled
            }
          }
        });
      }
    }
  }
  
  customElements.define('enquiry-notification', EnquiryNotification);
}
