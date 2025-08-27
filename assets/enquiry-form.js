// Enquiry Form Page JavaScript
// This file handles the display and management of enquiry items on the enquiry form page

// Debounce function to delay API calls
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Log helper function
function logDebug(message) {
  if (window.EnquirySystemHelpers && window.EnquirySystemHelpers.logDebug) {
    window.EnquirySystemHelpers.logDebug(message);
  }
}

// Postcode validation patterns by country
const postcodePatterns = {
  GB: /^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$/i,
  US: /^[0-9]{5}(-[0-9]{4})?$/,
  CA: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i,
  AU: /^[0-9]{4}$/,
  NZ: /^[0-9]{4}$/,
  IE: /^[A-Z0-9]{3}\s?[A-Z0-9]{4}$/i
};

// Validate postcode based on country
function validatePostcode(postcode, country) {
  const pattern = postcodePatterns[country];
  if (!pattern) return true; // No pattern defined for country
  return pattern.test(postcode.trim());
}

// Validate all form fields
function validateAllFields() {
  let isValid = true;
  const errors = [];
  
  // Step 1 fields (only validate if on step 1)
  const step1 = document.getElementById('step-1');
  if (step1 && step1.style.display !== 'none') {
    const emailInput = document.getElementById('enquiry-email');
    if (emailInput) {
      const fieldContainer = emailInput.closest('.enquiry-field');
      if (!emailInput.validity.valid || !emailInput.value.trim()) {
        if (fieldContainer) {
          fieldContainer.classList.add('enquiry-field--error');
          errors.push(emailInput);
        }
        isValid = false;
      } else {
        if (fieldContainer) {
          fieldContainer.classList.remove('enquiry-field--error');
        }
      }
    }
  }
  
  // Step 2 fields (only validate if on step 2)
  const step2 = document.getElementById('step-2');
  if (step2 && step2.style.display !== 'none') {
    // Required text fields
    const requiredFields = [
      'enquiry-first-name',
      'enquiry-last-name',
      'enquiry-address1',
      'enquiry-city',
      'enquiry-postcode',
      'enquiry-phone'
    ];
    
    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        const fieldContainer = field.closest('.enquiry-field');
        if (!field.value.trim()) {
          if (fieldContainer) {
            fieldContainer.classList.add('enquiry-field--error');
            errors.push(field);
          }
          isValid = false;
        } else {
          // Special validation for specific fields
          if (fieldId === 'enquiry-postcode') {
            const countrySelect = document.getElementById('enquiry-country');
            if (countrySelect && !validatePostcode(field.value, countrySelect.value)) {
              if (fieldContainer) {
                fieldContainer.classList.add('enquiry-field--error');
                if (!errors.includes(field)) {
                  errors.push(field);
                }
              }
              isValid = false;
            } else if (fieldContainer) {
              fieldContainer.classList.remove('enquiry-field--error');
            }
          } else if (fieldId === 'enquiry-phone') {
            const phoneValue = field.value.replace(/[^\d+]/g, '');
            if (phoneValue.length < 10) {
              if (fieldContainer) {
                fieldContainer.classList.add('enquiry-field--error');
                if (!errors.includes(field)) {
                  errors.push(field);
                }
              }
              isValid = false;
            } else if (fieldContainer) {
              fieldContainer.classList.remove('enquiry-field--error');
            }
          } else if (fieldContainer) {
            fieldContainer.classList.remove('enquiry-field--error');
          }
        }
      }
    });
  }
  
  return { isValid, errors };
}

// Add real-time postcode validation
function setupPostcodeValidation() {
  const postcodeInput = document.getElementById('enquiry-postcode');
  const countrySelect = document.getElementById('enquiry-country');
  
  if (!postcodeInput || !countrySelect) return;
  
  const validateField = () => {
    const postcode = postcodeInput.value;
    const country = countrySelect.value;
    const fieldContainer = postcodeInput.closest('.enquiry-field');
    
    if (postcode && !validatePostcode(postcode, country)) {
      fieldContainer.classList.add('enquiry-field--error');
    } else {
      fieldContainer.classList.remove('enquiry-field--error');
    }
  };
  
  postcodeInput.addEventListener('blur', validateField);
  countrySelect.addEventListener('change', validateField);
}

// Setup validation for all fields
function setupFieldValidation() {
  // Email validation
  const emailInput = document.getElementById('enquiry-email');
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const fieldContainer = emailInput.closest('.enquiry-field');
      if (fieldContainer) {
        if (!emailInput.validity.valid || !emailInput.value.trim()) {
          fieldContainer.classList.add('enquiry-field--error');
        } else {
          fieldContainer.classList.remove('enquiry-field--error');
        }
      }
    });
  }
  
  // Required text fields validation
  const requiredFields = [
    'enquiry-first-name',
    'enquiry-last-name',
    'enquiry-address1',
    'enquiry-city'
  ];
  
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('blur', () => {
        const fieldContainer = field.closest('.enquiry-field');
        if (fieldContainer) {
          if (!field.value.trim()) {
            fieldContainer.classList.add('enquiry-field--error');
          } else {
            fieldContainer.classList.remove('enquiry-field--error');
          }
        }
      });
    }
  });
  
  // Phone validation
  const phoneInput = document.getElementById('enquiry-phone');
  if (phoneInput) {
    phoneInput.addEventListener('blur', () => {
      const fieldContainer = phoneInput.closest('.enquiry-field');
      if (fieldContainer) {
        if (!phoneInput.value.trim()) {
          fieldContainer.classList.add('enquiry-field--error');
        } else {
          const phoneValue = phoneInput.value.replace(/[^\d+]/g, '');
          if (phoneValue.length < 10) {
            fieldContainer.classList.add('enquiry-field--error');
          } else {
            fieldContainer.classList.remove('enquiry-field--error');
          }
        }
      }
    });
  }
  
  // Postcode validation is already set up separately
  setupPostcodeValidation();
}

// Animate invalid fields
function animateInvalidFields(fields) {
  fields.forEach((field, index) => {
    const fieldContainer = field.closest('.enquiry-field');
    if (fieldContainer) {
      setTimeout(() => {
        fieldContainer.classList.add('shake');
        setTimeout(() => {
          fieldContainer.classList.remove('shake');
        }, 600);
      }, index * 100); // Stagger the animations
    }
  });
  
  // Focus the first invalid field
  if (fields.length > 0) {
    setTimeout(() => {
      fields[0].focus();
    }, 100);
  }
}

// Global variable to store uploaded file URL
let uploadedFileUrl = null;

// Set up Uploadcare widget
function setupUploadcareWidget() {
  if (typeof uploadcare === 'undefined') {
    logDebug('Uploadcare not loaded yet, retrying...');
    setTimeout(setupUploadcareWidget, 100);
    return;
  }
  
  const widget = uploadcare.Widget('[role=uploadcare-uploader]');
  const preview = document.querySelector('.file-upload__preview');
  const filenameSpan = document.querySelector('.file-upload__filename');
  const removeButton = document.querySelector('.file-upload__remove');
  
  if (!widget) {
    logDebug('Uploadcare widget not found');
    return;
  }
  
  // Handle successful upload
  widget.onUploadComplete(function(fileInfo) {
    logDebug('File uploaded successfully:', fileInfo);
    uploadedFileUrl = fileInfo.cdnUrl;
    
    // Show preview with filename
    if (preview && filenameSpan) {
      filenameSpan.textContent = fileInfo.name;
      preview.style.display = 'block';
    }
  });
  
  // Handle upload dialog open
  widget.onDialogOpen(function(dialog) {
    logDebug('Upload dialog opened');
  });
  
  // Handle remove button
  if (removeButton) {
    removeButton.addEventListener('click', function() {
      uploadedFileUrl = null;
      widget.value(null);
      if (preview) {
        preview.style.display = 'none';
      }
      // Reset status text
      const statusElement = document.querySelector('.file-upload__status');
      if (statusElement) {
        statusElement.textContent = 'No file chosen';
      }
      logDebug('File removed');
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded - enquiry-form.js initializing');
  
  // Try to load enquiry items from the API
  loadAndDisplayEnquiryItems();
  
  // Set up field validation
  setupFieldValidation();
  
  // Initialize Uploadcare widget
  setupUploadcareWidget();
  
  // Handle form submission
  const form = document.getElementById('enquiry-contact-form');
  if (form) {
    console.log('Form found, attaching submit event listener');
    console.log('Form element:', form);
    console.log('Form action:', form.action);
    console.log('Form method:', form.method);
    form.addEventListener('submit', async function(event) {
      console.log('Form submit event triggered');
      event.preventDefault();
      console.log('Default form submission prevented');
      
      try {
        // Check if we're on step 2 (where the submit button is)
        const step2 = document.getElementById('step-2');
        if (!step2 || step2.style.display === 'none') {
          console.error('Form submitted while not on step 2');
          return false;
        }
        
        // Validate all fields
        const validation = validateAllFields();
        
        if (!validation.isValid) {
          // Animate invalid fields
          animateInvalidFields(validation.errors);
          
          // Remove loading state from form
          form.classList.remove('form-loading');
          
          // Re-enable submit button
          const submitButton = event.target.querySelector('button[type="submit"]');
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = submitButton.dataset.originalText || 'Send Enquiry';
          }
          return false;
        }
        
        // Store original button text
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton && !submitButton.dataset.originalText) {
          submitButton.dataset.originalText = submitButton.textContent;
        }
        
        await submitEnquiry();
      } catch (error) {
        console.error('Error in form submission handler:', error);
        console.error('Error stack:', error.stack);
        alert('There was an error processing your request. Please try again.');
        
        // Re-enable submit button
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitButton.dataset.originalText || 'Send Enquiry';
        }
      }
      
      // Extra safety to prevent form submission
      return false;
    });
  }
  
  // Handle step navigation
  const nextButton = document.getElementById('next-button');
  const backButton = document.getElementById('back-button');
  
  if (nextButton) {
    nextButton.addEventListener('click', async function() {
      // Validate step 1 fields
      const validation = validateAllFields();
      
      if (!validation.isValid) {
        animateInvalidFields(validation.errors);
        return;
      }
      
      // Update draft order with email to capture it early
      const emailInput = document.getElementById('enquiry-email');
      const email = emailInput ? emailInput.value : '';
      const draftOrderId = window.EnquirySystemHelpers.getCookie('enquiryDraftId');
      const token = window.EnquirySystemHelpers.getCookie('enquiryDraftToken');
      
      if (draftOrderId && email) {
        try {
          const response = await fetch(
            `${window.EnquirySystemConfig.apiUrl}/api/enquiry/update-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                draftOrderId,
                token,
                email
              })
            }
          );
          
          const data = await response.json();
          if (data.success) {
            logDebug('Email captured successfully');
          } else {
            logDebug('Failed to capture email: ' + data.error);
          }
        } catch (error) {
          logDebug('Error capturing email: ' + error.message);
          // Continue anyway - don't block form progression
        }
      }
      
      // Show step 2
      document.getElementById('step-1').style.display = 'none';
      document.getElementById('step-2').style.display = 'block';
      
      // Update progress bar
      const progressFill = document.querySelector('.form-progress__fill');
      const progressText = document.querySelector('.current-step');
      if (progressFill) {
        progressFill.setAttribute('data-step', '2');
      }
      if (progressText) {
        progressText.textContent = 'Step 2';
      }
      
      // Focus on first name field
      document.getElementById('enquiry-first-name').focus();
    });
  }
  
  if (backButton) {
    backButton.addEventListener('click', function() {
      // Show step 1
      document.getElementById('step-2').style.display = 'none';
      document.getElementById('step-1').style.display = 'block';
      
      // Update progress bar
      const progressFill = document.querySelector('.form-progress__fill');
      const progressText = document.querySelector('.current-step');
      if (progressFill) {
        progressFill.setAttribute('data-step', '1');
      }
      if (progressText) {
        progressText.textContent = 'Step 1';
      }
    });
  }
});

// Define the EnquiryItems custom element
class EnquiryItems extends HTMLElement {
  constructor() {
    super();
    
    // Add a single event listener for changes (non-debounced for direct input)
    this.addEventListener('change', this.onChange.bind(this));
  }
  
  onChange(event) {
    // Only handle enquiry quantity inputs
    if (!event.target.classList.contains('enquiry-quantity__input')) return;
    
    // Skip if this change was triggered by a button click
    if (this.isButtonTriggeredChange) {
      logDebug('Skipping onChange event triggered by button click');
      return;
    }
    
    const input = event.target;
    const variantId = input.dataset.variantId;
    let quantity = parseInt(input.value);
    
    // Validate quantity
    if (isNaN(quantity) || quantity < 1) {
      quantity = 1;
      input.value = 1;
    }
    
    logDebug(`Quantity changed for variant ${variantId} to ${quantity}`);
    
    // Update the quantity
    this.enableLoading(variantId);
    updateEnquiryItemQuantity(variantId, quantity)
      .finally(() => {
        this.disableLoading(variantId);
      });
  }
  
  // Flag to prevent duplicate events
  isButtonTriggeredChange = false;
  
  // Add click event delegation with debouncing for rapid clicks
  connectedCallback() {
    // Store pending updates by variant ID
    this.pendingUpdates = {};
    this.updateTimers = {};
    
    this.addEventListener('click', (event) => {
      // Handle enquiry quantity buttons
      if (event.target.closest('.enquiry-quantity__button')) {
        const button = event.target.closest('.enquiry-quantity__button');
        const variantId = button.dataset.variantId;
        const action = button.dataset.action;
        
        // Find the associated input
        const input = this.querySelector(`.enquiry-quantity__input[data-variant-id="${variantId}"]`);
        if (!input) {
          logDebug(`Could not find quantity input for variant ${variantId}`);
          return;
        }
        
        // Get current quantity
        let quantity = parseInt(input.value);
        if (isNaN(quantity)) quantity = 1;
        
        // Update quantity based on action
        if (action === 'increase') {
          quantity += 1;
        } else if (action === 'decrease') {
          quantity = Math.max(1, quantity - 1);
        }
        
        // Set flag to prevent duplicate events
        this.isButtonTriggeredChange = true;
        
        // Update input value immediately for responsive UI
        input.value = quantity;
        
        logDebug(`Quantity ${action}d for variant ${variantId} to ${quantity}`);
        
        // Clear any existing timer for this variant
        if (this.updateTimers[variantId]) {
          clearTimeout(this.updateTimers[variantId]);
        }
        
        // Store the pending quantity
        this.pendingUpdates[variantId] = quantity;
        
        // Set a new timer to update after user stops clicking
        this.updateTimers[variantId] = setTimeout(() => {
          const finalQuantity = this.pendingUpdates[variantId];
          delete this.pendingUpdates[variantId];
          delete this.updateTimers[variantId];
          
          // Show loading state only when actually updating
          this.enableLoading(variantId);
          
          // Update the quantity
          updateEnquiryItemQuantity(variantId, finalQuantity)
            .finally(() => {
              this.disableLoading(variantId);
              
              // Reset flag after a short delay
              setTimeout(() => {
                this.isButtonTriggeredChange = false;
              }, 100);
            });
        }, 1000); // Wait 1000ms (1 second) after last click before updating
      }
      
      // Handle remove buttons
      if (event.target.closest('.enquiry-item-remove-button')) {
        event.preventDefault();
        const button = event.target.closest('.enquiry-item-remove-button');
        const variantId = button.dataset.variantId;
        if (variantId) {
          removeFromEnquiry(variantId);
        }
      }
    });
  }
  
  enableLoading(variantId) {
    // Only disable the specific item's quantity controls, not the entire container
    const quantityWrapper = this.querySelector(`.enquiry-quantity__input[data-variant-id="${variantId}"]`)?.closest('.cart-item__quantity-wrapper');
    if (quantityWrapper) {
      quantityWrapper.classList.add('loading');
      // Disable only this item's buttons
      const buttons = quantityWrapper.querySelectorAll('.enquiry-quantity__button');
      buttons.forEach(btn => btn.disabled = true);
    }
  }
  
  disableLoading(variantId) {
    const quantityWrapper = this.querySelector(`.enquiry-quantity__input[data-variant-id="${variantId}"]`)?.closest('.cart-item__quantity-wrapper');
    if (quantityWrapper) {
      quantityWrapper.classList.remove('loading');
      // Re-enable this item's buttons
      const buttons = quantityWrapper.querySelectorAll('.enquiry-quantity__button');
      buttons.forEach(btn => btn.disabled = false);
    }
  }
}

// Register the custom element
customElements.define('enquiry-items', EnquiryItems);

// Define the EnquiryRemoveButton custom element
class EnquiryRemoveButton extends HTMLElement {
  constructor() {
    super();
  }
  
  connectedCallback() {
    this.addEventListener('click', (event) => {
      event.preventDefault();
      const variantId = this.dataset.variantId;
      if (variantId) {
        removeFromEnquiry(variantId);
      }
    });
  }
}

// Register the custom element
customElements.define('enquiry-remove-button', EnquiryRemoveButton);

// Load and display enquiry items from API
async function loadAndDisplayEnquiryItems() {
  logDebug('Attempting to load enquiry items from API');
  
  try {
    const helpers = window.EnquirySystemHelpers;
    const config = window.EnquirySystemConfig;
    
    if (!helpers || !config) {
      logDebug('Enquiry system configuration not found');
      showEmptyMessage();
      return;
    }
    
    // Get draft order ID and token from cookies
    const draftOrderId = helpers.getCookie('enquiryDraftId');
    const token = helpers.getCookie('enquiryDraftToken');
    
    logDebug(`Cookie values - draftOrderId: ${draftOrderId}, token: ${token}`);
    
    if (!draftOrderId || !token) {
      logDebug('No draft order ID or token found in cookies');
      showEmptyMessage();
      return;
    }
    
    // Call API to get draft order details
    const apiUrl = `${config.apiUrl}/api/enquiry/get-draft?id=${draftOrderId}&token=${token}`;
    logDebug(`Fetching from API: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    logDebug(`API response status: ${response.status}`);
    
    // Get the response text first to log it
    const responseText = await response.text();
    logDebug(`API response text: ${responseText.substring(0, 200)}...`);
    
    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      logDebug(`Error parsing JSON response: ${parseError.message}`);
      showEmptyMessage();
      return;
    }
    
    if (data.success) {
      logDebug(`Retrieved ${data.items ? data.items.length : 0} items from API`);
      
      if (!data.items || data.items.length === 0) {
        logDebug('No items in the response');
        showEmptyMessage();
        return;
      }
      
      // Log the first item for debugging
      if (data.items.length > 0) {
        logDebug(`First item: ${JSON.stringify(data.items[0])}`);
      }
      
      // Get cache
      let cache = {};
      try {
        cache = JSON.parse(localStorage.getItem('enquiry_product_cache') || '{}');
        logDebug(`Found ${Object.keys(cache).length} items in cache`);
      } catch (e) {
        logDebug('Error reading cache, using empty cache');
      }
      
      // Merge cached data with items for instant display
      const itemsWithCache = data.items.map(item => {
        const cached = cache[item.variant_id];
        if (cached) {
          logDebug(`Using cached data for variant ${item.variant_id}`);
          return { ...item, image: cached.image, vendor: cached.vendor };
        }
        return item;
      });
      
      // Display immediately with cached data (no visual jarring)
      displayEnquiryItems(itemsWithCache);
      
      // Still enrich to update cache for next load
      logDebug('Enriching items with product data from Shopify');
      enrichProductData(data.items).then(enrichedItems => {
        // Update cache with fresh data
        enrichedItems.forEach(item => {
          if (item.variant_id && item.image) {
            cache[item.variant_id] = {
              image: item.image,
              vendor: item.vendor || ''
            };
          }
        });
        
        // Save updated cache
        try {
          localStorage.setItem('enquiry_product_cache', JSON.stringify(cache));
          logDebug('Cache updated with fresh data');
        } catch (e) {
          logDebug('Error saving cache');
        }
        
        // Update the href attributes in the DOM with fresh URLs
        logDebug('Updating product links with fresh URLs');
        enrichedItems.forEach(item => {
          if (item.variant_id && item.url) {
            // Find all links for this variant and update their hrefs
            const links = document.querySelectorAll(
              `.cart-item[data-variant-id="${item.variant_id}"] .cart-item__link, 
               .cart-item[data-variant-id="${item.variant_id}"] .cart-item__name`
            );
            
            links.forEach(link => {
              if (link.href && link.href.endsWith('#')) {
                link.href = item.url;
                logDebug(`Updated link for ${item.title} to ${item.url}`);
              }
            });
          }
        });
      });
    } else {
      logDebug(`Error retrieving enquiry items: ${data.error}`);
      
      // If there's a token validation error, try to clear cookies and reload
      if (data.error && data.error.includes('token')) {
        logDebug('Token validation error detected, clearing cookies');
        helpers.removeCookie('enquiryDraftId');
        helpers.removeCookie('enquiryDraftToken');
      }
      
      showEmptyMessage();
    }
  } catch (e) {
    logDebug(`Error loading enquiry items: ${e.message}`);
    showEmptyMessage();
  }
}

// Enrich product data by fetching additional details from Shopify Admin API
async function enrichProductData(items) {
  logDebug('Starting product data enrichment via Admin API');
  
  const config = window.EnquirySystemConfig;
  if (!config || !config.apiUrl) {
    logDebug('API configuration not available, skipping enrichment');
    return items;
  }
  
  try {
    // Extract unique product GIDs
    const productGids = [...new Set(items.map(item => item.product_gid).filter(Boolean))];
    
    if (productGids.length === 0) {
      logDebug('No product GIDs found, skipping enrichment');
      return items;
    }
    
    logDebug(`Fetching data for ${productGids.length} products`);
    
    // Call the Admin API endpoint
    const response = await fetch(`${config.apiUrl}/api/enquiry/enrich-products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productGids })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.products) {
      logDebug('No product data returned from API');
      return items;
    }
    
    // The API returns products already mapped by GID
    const productMap = data.products;
    
    // Enrich items with the fetched data
    const enrichedItems = items.map(item => {
      const enrichedItem = { ...item };
      
      if (item.product_gid && productMap[item.product_gid]) {
        const productData = productMap[item.product_gid];
        
        // Add basic product data
        enrichedItem.vendor = productData.vendor;
        enrichedItem.handle = productData.handle;
        enrichedItem.url = `/products/${productData.handle}`;
        
        // Add image data
        if (productData.image) {
          enrichedItem.image = productData.image;
          enrichedItem.imageAlt = productData.imageAlt || item.title;
          logDebug(`Using product image for ${item.title}`);
        }
      }
      
      return enrichedItem;
    });
    
    // Log enrichment results
    const itemsWithVendor = enrichedItems.filter(item => item.vendor).length;
    const itemsWithImages = enrichedItems.filter(item => item.image).length;
    logDebug(`Enrichment complete: ${itemsWithVendor}/${enrichedItems.length} have vendor, ${itemsWithImages}/${enrichedItems.length} have images`);
    
    return enrichedItems;
  } catch (error) {
    logDebug(`Error in enrichProductData: ${error.message}`);
    return items; // Return original items if enrichment fails
  }
}

// Display enquiry items - Enhanced version with Dawn-style cart layout
function displayEnquiryItems(items) {
  try {
    logDebug('Displaying enquiry items - Dawn-style cart layout');
    
    // Validate items parameter
    if (!items) {
      logDebug('Items parameter is undefined or null, defaulting to empty array');
      items = [];
    }
    
    if (!Array.isArray(items)) {
      logDebug('Items parameter is not an array, converting to array');
      items = [items];
    }
    
    logDebug('Number of items to display: ' + items.length);
    
    // Get containers with additional error handling
    const emptyMessage = document.getElementById('enquiry-empty-message');
    const itemsContainer = document.getElementById('enquiry-items-container');
    const skeletonLoader = document.getElementById('enquiry-skeleton-loader');
    
    if (!emptyMessage || !itemsContainer) {
      logDebug('ERROR: One or more required container elements not found');
      console.error('Could not find required container elements in the DOM');
      return;
    }
    
    // Hide skeleton loader
    if (skeletonLoader) {
      skeletonLoader.classList.add('hide');
    }
    
    // Show/hide empty message based on items
    if (!items || items.length === 0) {
      logDebug('No items to display, showing empty message');
      emptyMessage.style.display = 'block';
      itemsContainer.style.display = 'none';
      
      // Update hidden field
      const enquiryItemsData = document.getElementById('enquiry-items-data');
      if (enquiryItemsData) {
        enquiryItemsData.value = JSON.stringify([]);
      }
      return;
    }
    
    // Hide empty message if we have items
    emptyMessage.style.display = 'none';
    itemsContainer.style.display = 'block';
    
    // Show the enquiry form when we have items
    const enquiryForm = document.querySelector('.enquiry-checkout-form');
    if (enquiryForm) {
      enquiryForm.style.display = 'block';
    }
    
    logDebug('Processing ' + items.length + ' items');
    
    // Create or get the enquiry-items element
    let enquiryItemsElement = document.querySelector('enquiry-items');
    if (!enquiryItemsElement) {
      enquiryItemsElement = document.createElement('enquiry-items');
      itemsContainer.appendChild(enquiryItemsElement);
    }
    
    // Clear the enquiry items element
    enquiryItemsElement.innerHTML = '';
    
    // Add items to the container using Dawn's cart item structure
    items.forEach((item, index) => {
      if (!item) {
        logDebug('Skipping undefined item at index ' + index);
        return;
      }
      
      logDebug('Creating element for item ' + index + ': ' + (item.title || 'Unknown'));
      
      try {
        // Create item element
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.setAttribute('data-variant-id', item.variant_id);
        itemElement.id = `EnquiryItem-${index + 1}`;
        
        // Create a unique ID for the image container
        const imageContainerId = `enquiry-item-image-${item.variant_id || index}`;
        
        // Build HTML using Dawn's cart item structure - EXACTLY matching the cart page
        itemElement.innerHTML = `
          <div class="cart-item__media">
            <a href="${item.url || '#'}" class="cart-item__link" aria-hidden="true" tabindex="-1"> </a>
            <div class="cart-item__image-container gradient global-media-settings" id="${imageContainerId}">
              ${item.image ? 
                `<img
                  src="${item.image}"
                  class="cart-item__image"
                  alt="${item.title || 'Product'}"
                  loading="lazy"
                  width="150"
                  height="150"
                  onerror="console.error('Image failed to load:', this.src); this.src='/assets/icon-cart.svg';"
                >` : 
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="cart-item__image" style="padding: 20%; opacity: 0.3;">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>`
              }
            </div>
          </div>
          <div class="cart-item__details-info">
            <div class="cart-item__details">
              <a href="${item.url || '#'}" class="cart-item__name h4 break">
                ${item.title || 'Unknown Product'}
              </a>
              
              ${item.vendor ? `
                <div class="cart-item__vendor" style="font-size: 0.9em; color: #666; margin-top: 0.25rem;">
                  by ${item.vendor}
                </div>
              ` : ''}
              
              ${item.variant_title ? `
                <dl>
                  <div class="product-option">
                    <dt>Options:</dt>
                    <dd>${item.variant_title}</dd>
                  </div>
                </dl>
              ` : ''}
              
              ${item.leadTime ? `
                <div class="cart-item__lead-time" style="font-size: 0.85em; color: #333; margin-top: 0.5rem; padding: 0.25rem 0.5rem; background-color: #f5f5f5; border-radius: 4px; display: inline-block;">
                  <strong>Lead Time:</strong> ${item.leadTime}
                </div>
              ` : ''}
              
              ${item.availabilityStatus && item.availabilityStatus === 'poa' ? `
                <div class="cart-item__availability" style="font-size: 0.85em; color: #d35400; margin-top: 0.25rem; font-weight: 500;">
                  Price on Application
                </div>
              ` : ''}
            </div>
            
            <div class="cart-item__quantity">
              <quantity-popover>
                <div class="cart-item__quantity-wrapper quantity-popover-wrapper">
                  <label class="visually-hidden" for="Quantity-${index + 1}">
                    Quantity
                  </label>
                  <div class="quantity-popover-container">
                    <div class="enquiry-quantity">
                      <button class="quantity__button enquiry-quantity__button" name="minus" type="button" data-variant-id="${item.variant_id}" data-action="decrease" data-enquiry-specific="true">
                        <span class="visually-hidden">Decrease quantity</span>
                        <span class="svg-wrapper">
                          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-minus" fill="none" viewBox="0 0 10 2">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 110 1H1A.5.5 0 01.5 1z" fill="currentColor">
                          </path></svg>
                        </span>
                      </button>
                      <input
                        class="quantity__input enquiry-quantity__input"
                        type="number"
                        name="enquiry-quantity"
                        data-variant-id="${item.variant_id}"
                        value="${item.quantity || 1}"
                        min="1"
                        aria-label="Quantity"
                        id="Quantity-${index + 1}"
                        data-enquiry-specific="true"
                      >
                      <button class="quantity__button enquiry-quantity__button" name="plus" type="button" data-variant-id="${item.variant_id}" data-action="increase" data-enquiry-specific="true">
                        <span class="visually-hidden">Increase quantity</span>
                        <span class="svg-wrapper">
                          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-plus" fill="none" viewBox="0 0 10 10">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M1 4.51a.5.5 0 000 1h3.5l.01 3.5a.5.5 0 001-.01V5.5l3.5-.01a.5.5 0 00-.01-1H5.5L5.49.99a.5.5 0 00-1 .01v3.5l-3.5.01H1z" fill="currentColor">
                          </path></svg>
                        </span>
                      </button>
                    </div>
                  </div>
                  <enquiry-remove-button
                    id="Remove-${index + 1}"
                    data-index="${index + 1}"
                    data-variant-id="${item.variant_id}"
                  >
                    <a
                      href="#"
                      class="button button--tertiary cart-item__remove enquiry-item-remove-button"
                      aria-label="Remove ${item.title || 'item'}"
                    >
                      <span class="svg-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true" focusable="false" class="icon icon-remove">
                          <path d="M14 3h-3.53a3.07 3.07 0 00-.6-1.65C9.44.82 8.8.5 8 .5s-1.44.32-1.87.85A3.06 3.06 0 005.53 3H2a.5.5 0 000 1h1.25v10c0 .28.22.5.5.5h8.5a.5.5 0 00.5-.5V4H14a.5.5 0 000-1zM6.91 1.98c.23-.29.58-.48 1.09-.48s.85.19 1.09.48c.2.24.3.6.36 1.02h-2.9c.05-.42.17-.78.36-1.02zm4.84 11.52h-7.5V4h7.5v9.5z" fill="currentColor"/>
                          <path d="M6.55 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5zM9.45 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5z" fill="currentColor"/>
                        </svg>
                      </span>
                    </a>
                  </enquiry-remove-button>
                </div>
                <div
                  class="cart-item__error"
                  id="Line-item-error-${index + 1}"
                  role="alert"
                >
                  <small class="cart-item__error-text"></small>
                  <span class="svg-wrapper">
                    <svg aria-hidden="true" focusable="false" class="icon icon-error" viewBox="0 0 13 13">
                      <circle cx="6.5" cy="6.50049" r="5.5" stroke="white" stroke-width="2"/>
                      <circle cx="6.5" cy="6.5" r="5.5" fill="#EB001B" stroke="#EB001B" stroke-width="0.7"/>
                      <path d="M5.87413 3.52832L5.97439 7.57216H7.02713L7.12739 3.52832H5.87413ZM6.50076 9.66091C6.88091 9.66091 7.18169 9.37267 7.18169 9.00504C7.18169 8.63742 6.88091 8.34917 6.50076 8.34917C6.12061 8.34917 5.81982 8.63742 5.81982 9.00504C5.81982 9.37267 6.12061 9.66091 6.50076 9.66091Z" fill="white"/>
                      <path d="M5.87413 3.17832H5.51535L5.52424 3.537L5.6245 7.58083L5.63296 7.92216H5.97439H7.02713H7.36856L7.37702 7.58083L7.47728 3.537L7.48617 3.17832H7.12739H5.87413ZM6.50076 10.0109C7.06121 10.0109 7.5317 9.57872 7.5317 9.00504C7.5317 8.43137 7.06121 7.99918 6.50076 7.99918C5.94031 7.99918 5.46982 8.43137 5.46982 9.00504C5.46982 9.57872 5.94031 10.0109 6.50076 10.0109Z" fill="white" stroke="#EB001B" stroke-width="0.7">
                    </svg>
                  </span>
                </div>
              </quantity-popover>
            </div>
          </div>
        `;
        
        // Add to container
        enquiryItemsElement.appendChild(itemElement);
      } catch (itemError) {
        logDebug('Error creating item element: ' + itemError.message);
      }
    });
    
    // Update hidden field with enquiry items data
    const enquiryItemsData = document.getElementById('enquiry-items-data');
    if (enquiryItemsData) {
      enquiryItemsData.value = JSON.stringify(items);
    }
    
    // Log basic item info
    const itemsWithImages = items.filter(item => item.image).length;
    logDebug(`Items with images: ${itemsWithImages} of ${items.length}`);
    
    logDebug('Finished displaying enquiry items');
  } catch (e) {
    logDebug('Error in displayEnquiryItems: ' + e.message);
    try {
      // Fallback empty message display
      const emptyMessage = document.getElementById('enquiry-empty-message');
      if (emptyMessage) {
        emptyMessage.style.display = 'block';
      }
      
      const itemsContainer = document.getElementById('enquiry-items-container');
      if (itemsContainer) {
        itemsContainer.style.display = 'none';
      }
      
      const enquiryItemsData = document.getElementById('enquiry-items-data');
      if (enquiryItemsData) {
        enquiryItemsData.value = JSON.stringify([]);
      }
    } catch (fallbackError) {
      console.error('Critical error in displayEnquiryItems fallback:', fallbackError);
    }
  }
}

// Update enquiry items display with enriched data
function updateEnquiryItemsDisplay(enrichedItems) {
  logDebug('Updating display with enriched data');
  
  // Simply re-display the items with the enriched data
  displayEnquiryItems(enrichedItems);
}

// Update enquiry item quantity
async function updateEnquiryItemQuantity(variantId, quantity) {
  logDebug(`Updating quantity for variant ${variantId} to ${quantity}`);
  
  try {
    const helpers = window.EnquirySystemHelpers;
    const config = window.EnquirySystemConfig;
    
    if (!helpers || !config) {
      logDebug('Enquiry system configuration not found');
      return false;
    }
    
    // Get draft order ID and token from cookies
    const draftOrderId = helpers.getCookie('enquiryDraftId');
    const token = helpers.getCookie('enquiryDraftToken');
    
    if (!draftOrderId || !token) {
      logDebug('No draft order ID or token found in cookies');
      return false;
    }
    
    // Get current items
    const response = await fetch(
      `${config.apiUrl}/api/enquiry/get-draft?id=${draftOrderId}&token=${token}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Update the quantity of the specified item
      const updatedItems = data.items.map(item => 
        item.variant_id === variantId 
          ? { ...item, quantity: quantity }
          : item
      );
      
      // Update the draft order
      const updateResponse = await fetch(`${config.apiUrl}/api/enquiry/update-draft`, {
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
      
      const updateData = await updateResponse.json();
      
      if (updateData.success) {
        logDebug(`Updated quantity of item ${variantId} to ${quantity}`);
        
        // Update count in header
        updateEnquiryCountInHeader();
        return true;
      } else {
        logDebug('Error updating enquiry item quantity: ' + updateData.error);
        return false;
      }
    } else {
      logDebug('Error retrieving enquiry items: ' + data.error);
      return false;
    }
  } catch (e) {
    logDebug('Error updating enquiry item quantity: ' + e.message);
    return false;
  }
}

// Update enquiry count in header
function updateEnquiryCountInHeader() {
  try {
    const helpers = window.EnquirySystemHelpers;
    const config = window.EnquirySystemConfig;
    
    if (!helpers || !config) {
      logDebug('Enquiry system configuration not found');
      updateCountElements(0);
      return;
    }
    
    // Get draft order ID and token from cookies
    const draftOrderId = helpers.getCookie('enquiryDraftId');
    const token = helpers.getCookie('enquiryDraftToken');
    
    if (!draftOrderId || !token) {
      logDebug('No draft order ID or token found in cookies');
      updateCountElements(0);
      return;
    }
    
    // Call API to get draft order details
    fetch(`${config.apiUrl}/api/enquiry/get-draft?id=${draftOrderId}&token=${token}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          const count = data.items.reduce((total, item) => total + item.quantity, 0);
          updateCountElements(count);
        } else {
          logDebug('Error retrieving enquiry items: ' + data.error);
          updateCountElements(0);
        }
      })
      .catch(e => {
        logDebug('Error updating enquiry count: ' + e.message);
        updateCountElements(0);
      });
  } catch (e) {
    logDebug('Error updating enquiry count: ' + e.message);
    updateCountElements(0);
  }
}

// Submit the enquiry
async function submitEnquiry() {
  logDebug('Starting submitEnquiry function');
  
  try {
    const helpers = window.EnquirySystemHelpers;
    const config = window.EnquirySystemConfig;
    
    if (!helpers || !config) {
      console.error('Enquiry system configuration not found');
      alert('There was an error submitting your enquiry. Please try again.');
      return;
    }
    
    logDebug('Enquiry system configuration found');
    
    // Get draft order ID and token from cookies
    const draftOrderId = helpers.getCookie('enquiryDraftId');
    const token = helpers.getCookie('enquiryDraftToken');
    
    logDebug(`Draft order ID: ${draftOrderId}, Token: ${token}`);
    
    if (!draftOrderId || !token) {
      alert('No enquiry items found. Please add items to your enquiry first.');
      return;
    }
    
    logDebug('Gathering form data...');
    
    // Gather form data - with safe access to elements
    const formData = {
      email: document.getElementById('enquiry-email')?.value || '',
      firstName: document.getElementById('enquiry-first-name')?.value || '',
      lastName: document.getElementById('enquiry-last-name')?.value || '',
      company: document.getElementById('enquiry-company')?.value || '',
      address1: document.getElementById('enquiry-address1')?.value || '',
      address2: document.getElementById('enquiry-address2')?.value || '',
      city: document.getElementById('enquiry-city')?.value || '',
      postcode: document.getElementById('enquiry-postcode')?.value || '',
      country: document.getElementById('enquiry-country')?.value || 'GB',
      phone: document.getElementById('enquiry-phone')?.value || '',
      message: document.getElementById('enquiry-message')?.value || '',
      acceptsMarketing: false,
      acceptsSmsMarketing: false
    };
    
    logDebug('Form data gathered:', JSON.stringify(formData));
    
    // Format phone number for API
    let formattedPhone = formData.phone;
    if (formattedPhone) {
      // Remove all non-numeric characters except +
      formattedPhone = formattedPhone.replace(/[^\d+]/g, '');
      
      // If it's a UK number without country code, add +44
      if (formData.country === 'GB' && formattedPhone.match(/^0/)) {
        formattedPhone = '+44' + formattedPhone.substring(1);
      }
      // If it's a US/CA number without country code, add the prefix
      else if ((formData.country === 'US' || formData.country === 'CA') && formattedPhone.match(/^\d{10}$/)) {
        formattedPhone = '+1' + formattedPhone;
      }
      // If no + at start and it looks like a full number, add it
      else if (!formattedPhone.startsWith('+') && formattedPhone.length > 9) {
        formattedPhone = '+' + formattedPhone;
      }
      
      logDebug('Formatted phone: ' + formattedPhone);
    }
    
    // Get file upload URL from Uploadcare widget
    const fileUploadUrl = uploadedFileUrl || '';
    
    logDebug('File upload URL: ' + fileUploadUrl);
    
    // Show loading state
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
    }
    
    // Prepare request data
    const requestData = {
      draftOrderId,
      token,
      customerInfo: {
        ...formData,
        phone: formattedPhone || formData.phone,  // Use formatted phone
        // Explicitly ensure address fields are included
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        postcode: formData.postcode,
        country: formData.country
      },
      // Add shippingAddress object that backend expects
      shippingAddress: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        zip: formData.postcode,  // Backend expects 'zip' not 'postcode'
        countryCode: formData.country,  // Backend expects 'countryCode' not 'country'
        phone: formattedPhone || formData.phone
      },
      comments: formData.message,  // Send message as comments for metafield
      companyName: formData.company,
      fileUploadUrl: fileUploadUrl,
      sendEmail: true
    };
    
    logDebug('Submitting enquiry with data:', JSON.stringify(requestData));
    
    // Submit the enquiry
    const apiEndpoint = `${config.apiUrl}/api/enquiry/submit`;
    logDebug('API endpoint:', apiEndpoint);
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    logDebug('API response status:', response.status);
    
    const data = await response.json();
    logDebug('API response data:', JSON.stringify(data));
    
    if (data.success) {
      // Clear cookies
      helpers.removeCookie('enquiryDraftId');
      helpers.removeCookie('enquiryDraftToken');
      
      // Clear product cache
      localStorage.removeItem('enquiry_product_cache');
      
      // Show success message
      alert('Thank you for your enquiry! We will get back to you soon.');
      
      // Redirect to home or success page
      window.location.href = '/';
    } else {
      console.error('Error submitting enquiry:', data.error);
      alert('There was an error submitting your enquiry. Please try again.');
      
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Send Enquiry';
      }
    }
  } catch (e) {
    console.error('Error submitting enquiry:', e);
    console.error('Error stack:', e.stack);
    logDebug('Error in submitEnquiry: ' + e.message);
    alert('There was an error submitting your enquiry. Please try again. Check console for details.');
    
    // Re-enable submit button
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Send Enquiry';
    }
  }
}

// Update count elements in the header
function updateCountElements(count) {
  const countBubble = document.getElementById('enquiry-count-bubble');
  const countElement = document.getElementById('enquiry-count');
  
  if (countElement) {
    countElement.textContent = count;
    logDebug('Updated count element to: ' + count);
  }
  
  if (countBubble) {
    countBubble.style.display = count > 0 ? 'flex' : 'none';
    logDebug('Updated count bubble visibility');
  }
  
  // Store count in localStorage to prevent flash on page reload
  try {
    localStorage.setItem('enquiryCount', count.toString());
  } catch (storageError) {
    // Fail silently if localStorage is not available
  }
}

// Show empty message
function showEmptyMessage() {
  const emptyMessage = document.getElementById('enquiry-empty-message');
  if (emptyMessage) {
    emptyMessage.style.display = 'block';
  }
  
  // Hide the items container
  const itemsContainer = document.getElementById('enquiry-items-container');
  if (itemsContainer) {
    itemsContainer.style.display = 'none';
  }
  
  // Hide the skeleton loader
  const skeletonLoader = document.getElementById('enquiry-skeleton-loader');
  if (skeletonLoader) {
    skeletonLoader.style.display = 'none';
  }
  
  // Hide the enquiry form when empty
  const enquiryForm = document.querySelector('.enquiry-checkout-form');
  if (enquiryForm) {
    enquiryForm.style.display = 'none';
  }
  
  const enquiryItemsData = document.getElementById('enquiry-items-data');
  if (enquiryItemsData) {
    enquiryItemsData.value = JSON.stringify([]);
  }
}


// Remove item from enquiry
async function removeFromEnquiry(variantId) {
  logDebug('Removing item with variant ID: ' + variantId);
  
  try {
    const helpers = window.EnquirySystemHelpers;
    const config = window.EnquirySystemConfig;
    
    if (!helpers || !config) {
      logDebug('Enquiry system configuration not found');
      return false;
    }
    
    // Get draft order ID and token from cookies
    const draftOrderId = helpers.getCookie('enquiryDraftId');
    const token = helpers.getCookie('enquiryDraftToken');
    
    if (!draftOrderId || !token) {
      logDebug('No draft order ID or token found in cookies');
      return false;
    }
    
    // Get current items
    const response = await fetch(
      `${config.apiUrl}/api/enquiry/get-draft?id=${draftOrderId}&token=${token}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Filter out the item to remove
      const updatedItems = data.items.filter(item => item.variant_id !== variantId);
      
      logDebug(`Filtered items from ${data.items.length} to ${updatedItems.length}`);
      
      // If the item wasn't found, just reload the current items
      if (data.items.length === updatedItems.length) {
        logDebug(`Item with variant ID ${variantId} not found in current items, reloading`);
        loadAndDisplayEnquiryItems();
        return false;
      }
      
      // If no items left, delete the draft order instead of updating
      if (updatedItems.length === 0) {
        logDebug('No items remaining, deleting draft order');
        
        const deleteResponse = await fetch(`${config.apiUrl}/api/enquiry/delete-draft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            draftOrderId,
            token
          })
        });
        
        const deleteData = await deleteResponse.json();
        
        if (deleteData.success) {
          logDebug('Draft order deleted successfully');
          
          // Clear the cookies
          helpers.removeCookie('enquiryDraftId');
          helpers.removeCookie('enquiryDraftToken');
          
          // Immediately show empty message instead of reloading
          showEmptyMessage();
          
          // Update count in header
          updateEnquiryCountInHeader();
          
          return true;
        } else {
          logDebug('Error deleting draft order: ' + deleteData.error);
          alert('There was an error removing the item. Please try again.');
          return false;
        }
      } else {
        // Update the draft order with the filtered items
        const updateResponse = await fetch(`${config.apiUrl}/api/enquiry/update-draft`, {
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
        
        const updateData = await updateResponse.json();
        
        if (updateData.success) {
          logDebug(`Successfully removed item ${variantId}`);
          
          // Remove the item from the display immediately
          // Find the item element by looking for the remove button with the variant ID
          const removeButton = document.querySelector(`[data-variant-id="${variantId}"].enquiry-item-remove-button`);
          const itemElement = removeButton ? removeButton.closest('.cart-item') : null;
          
          if (itemElement) {
            // Fade out and remove
            itemElement.style.transition = 'opacity 0.3s';
            itemElement.style.opacity = '0';
            setTimeout(() => {
              itemElement.remove();
              
              // Check if we have any items left
              const remainingItems = document.querySelectorAll('#enquiry-items-container .cart-item');
              if (remainingItems.length === 0) {
                showEmptyMessage();
              }
            }, 300);
          } else {
            // Fallback to reload if we can't find the element
            loadAndDisplayEnquiryItems();
          }
          
          // Update count in header
          updateEnquiryCountInHeader();
          
          return true;
        } else {
          logDebug('Error updating draft order: ' + updateData.error);
          alert('There was an error removing the item. Please try again.');
          return false;
        }
      }
    } else {
      logDebug('Error retrieving enquiry items: ' + data.error);
      return false;
    }
  } catch (e) {
    logDebug('Error removing item from enquiry: ' + e.message);
    return false;
  }
}
