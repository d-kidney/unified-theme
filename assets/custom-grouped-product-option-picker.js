document.addEventListener('DOMContentLoaded', function() {
  // Add a function to control the loading state of the add to cart button
  function setAddToCartButtonLoading(isLoading) { 
    document.querySelectorAll('form[action="/cart/add"] button[type="submit"], .product-form__submit').forEach(button => {
      if (isLoading) {
        button.setAttribute('disabled', 'disabled');
        button.classList.add('loading');
        
        // Store the original text if not already stored
        if (!button.dataset.originalText && button.innerHTML) {
          button.dataset.originalText = button.innerHTML;
          button.innerHTML = '<span class="loading-spinner"></span> Loading...';
        }
      } else {
        button.removeAttribute('disabled');
        button.classList.remove('loading');
        
        // Restore original text if available
        if (button.dataset.originalText) {
          button.innerHTML = button.dataset.originalText;
          delete button.dataset.originalText;
        }
      }
    });
  }
  
  // Helper function to ensure the form has the correct variant ID
  function ensureFormHasCorrectVariantId(form, productId) {
    if (!productId) {
      console.error('No product ID provided to ensureFormHasCorrectVariantId');
      return false;
    }
    
    let variantInput = form.querySelector('input[name="id"]');
    
    // If the input doesn't exist, create it
    if (!variantInput) {
      variantInput = document.createElement('input');
      variantInput.type = 'hidden';
      variantInput.name = 'id';
      form.appendChild(variantInput);
    }
    
    // Set the value
    variantInput.value = productId;
    console.log('Ensured form has correct variant ID:', productId);
    
    // Also update any other variant-related inputs
    const variantInputs = form.querySelectorAll('input[name="variant_id"], input.variant-id');
    variantInputs.forEach(input => {
      input.value = productId;
    });
    
    return true;
  }
  
  // Direct form interception - add a global click handler for add to cart buttons
  document.addEventListener('click', function(event) {
    // Check if the clicked element is an add to cart button
    const addToCartButton = event.target.closest('button[name="add"], .product-form__submit');
    if (!addToCartButton) return;
    
    const form = addToCartButton.closest('form[action="/cart/add"]');
    if (!form) return;
    
    // Prevent the default click behavior
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Intercepted add to cart button click');
    
    // Get the currently selected option
    const selectedOption3 = option3Fieldset ? option3Fieldset.querySelector('input[type="radio"]:checked') : null;
    const selectedOption2 = option2Fieldset ? option2Fieldset.querySelector('input[type="radio"]:checked') : null;
    const selectedOption1 = option1Fieldset ? option1Fieldset.querySelector('input[type="radio"]:checked') : null;
    
    let productId = null;
    let variantId = null;
    
    // Find the most specific selected option (option3 > option2 > option1)
    if (selectedOption3 && selectedOption3.dataset.optionValueId) {
      productId = selectedOption3.dataset.optionValueId;
      variantId = selectedOption3.dataset.variantId;
    } else if (selectedOption2 && selectedOption2.dataset.optionValueId) {
      productId = selectedOption2.dataset.optionValueId;
      variantId = selectedOption2.dataset.variantId;
    } else if (selectedOption1 && selectedOption1.dataset.optionValueId) {
      productId = selectedOption1.dataset.optionValueId;
      variantId = selectedOption1.dataset.variantId;
    }
    
    if (!productId) {
      console.error('No product ID found from selected options');
      
      // Show an error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'product-form__error-message';
      errorMessage.textContent = 'Please select all options before adding to cart.';
      form.querySelector('.product-form__buttons')?.appendChild(errorMessage);
      
      // Remove the error message after 5 seconds
      setTimeout(() => errorMessage.remove(), 5000);
      return;
    }
    
    // Use the variant ID if available, otherwise use the product ID
    const idToUse = variantId || productId;
    console.log('Using ID for cart submission:', idToUse, '(variant ID:', variantId, ', product ID:', productId, ')');
    
    // Ensure the form has the correct variant ID
    ensureFormHasCorrectVariantId(form, idToUse);
    
    // Use fetch to submit the form instead of traditional form submission
    // This allows us to show the cart drawer/notification
    const formData = new FormData(form);
    
    // Show loading state
    setAddToCartButtonLoading(true);
    
    // Log the form data for debugging
    console.log('Form data being submitted from direct form interception:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    
    // Get cart components
    const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
    
    // Prepare form data with sections
    if (cart) {
      // Add sections to the form data
      const sections = cart.getSectionsToRender().map((section) => section.id);
      formData.append('sections', sections);
      formData.append('sections_url', window.location.pathname);
    }
    
    // Use fetch to submit the form using the standard cart endpoint
    fetch(`${routes.cart_add_url}`, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      },
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Product added to cart:', data);
      
      // Handle the response using the standard approach
      if (!cart) {
        // If no cart notification/drawer exists, redirect to cart page
        window.location.href = window.routes.cart_url;
        return;
      }
      
      // Let the cart component handle the rendering
      cart.renderContents(data);
    })
    .catch(error => {
      console.error('Error adding product to cart:', error);
      
      // Show an error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'product-form__error-message';
      errorMessage.textContent = 'Error adding product to cart. Please try again.';
      form.querySelector('.product-form__buttons')?.appendChild(errorMessage);
      
      // Remove the error message after 5 seconds
      setTimeout(() => errorMessage.remove(), 5000);
    })
    .finally(() => {
      // Re-enable add to cart button
      setAddToCartButtonLoading(false);
    });
  }, true); // Use capture phase to intercept before other handlers
  
  // Define PUB_SUB_EVENTS if it doesn't exist (copied from Dawn theme)
  if (typeof window.PUB_SUB_EVENTS !== 'object') {
    window.PUB_SUB_EVENTS = {
      cartUpdate: 'cart-update',
      quantityUpdate: 'quantity-update',
      variantChange: 'variant-change',
      cartError: 'cart-error',
      productRecommendationsLoad: 'product-recommendations-load',
      optionValueSelectionChange: 'option-value-selection-change'
    };
  }

  // Define publish function if it doesn't exist (copied from Dawn theme)
  if (typeof window.publish !== 'function') {
    window.publish = function(eventName, data) {
      const event = new CustomEvent(eventName, {
        detail: data,
        bubbles: true,
        cancelable: true,
        composed: true
      });
      document.dispatchEvent(event);
    };
  }

  const variantSelects = document.querySelector('variant-selects.custom-grouped-product');
  if (!variantSelects) return;
  
  // Immediately set data-update-url to false on the product-info element to prevent URL updates
  // This is still needed to prevent URL updates during initialization
  const productInfoElement = document.querySelector('product-info');
  if (productInfoElement) {
    productInfoElement.dataset.updateUrl = 'false';
    
    // Also set a flag to prevent any URL updates from the default Dawn theme behavior
    productInfoElement.dataset.preventDefaultNavigation = 'true';
    console.log('Set data-update-url and data-prevent-default-navigation to false on product-info element');
    
    // Override the updateURL method if it exists to prevent any URL updates
    if (productInfoElement.updateURL) {
      const originalUpdateURL = productInfoElement.updateURL;
      productInfoElement.updateURL = function(url) {
        // Check if we should prevent default navigation
        if (variantSelects.dataset.preventDefaultNavigation === 'true') {
          console.log('Prevented default URL update:', url);
          return;
        }
        return originalUpdateURL.call(this, url);
      };
    }
  }
  
  // Add event listeners to accessible product links to prevent default behavior when JS is enabled
  // Use capture phase to ensure we intercept the event before any other handlers
  document.addEventListener('click', function(event) {
    // Check if the clicked element is an accessible product link
    const link = event.target.closest('.accessible-product-link');
    if (!link) return;
    
    // Prevent the default navigation behavior
    event.preventDefault();
    event.stopImmediatePropagation();
    
    console.log('Intercepted accessible product link click');
    
    // Find the associated radio input
    const label = link.closest('label');
    if (label) {
      const inputId = label.getAttribute('for');
      const input = document.getElementById(inputId);
      if (input && input.dataset.productUrl) {
        input.checked = true;
        
        // Use fetchAndUpdateProduct directly instead of triggering change event
        // This ensures we bypass any default behavior
        fetchAndUpdateProduct(input.dataset.productUrl, input.dataset.optionValueId);
      }
    }
  }, true); // Use capture phase to intercept before other handlers
  
  // Get all fieldsets
  const option1Fieldset = variantSelects.querySelector('fieldset:nth-child(1)');
  const option2Fieldset = variantSelects.querySelector('.option2-fieldset');
  const option3Fieldset = variantSelects.querySelector('.option3-fieldset');
  
  // Get the prompts
  const option2Prompt = option2Fieldset ? option2Fieldset.querySelector('.option-prompt') : null;
  const option3Prompt = option3Fieldset ? option3Fieldset.querySelector('.option-prompt') : null;
  
  const hasOption2 = option2Fieldset !== null;
  const hasOption3 = option3Fieldset !== null;
  
  // Cache DOM elements that will be updated
  const productMedia = document.querySelector('.product__media-wrapper');
  const productInfo = document.querySelector('.product__info-wrapper');
  const productTitle = document.querySelector('.product__title h1');
  const productPrice = document.querySelector(`#price-${variantSelects.dataset.section}`);
  const productSku = document.querySelector(`#Sku-${variantSelects.dataset.section}`);
  const productInventory = document.querySelector(`#Inventory-${variantSelects.dataset.section}`);
  const productDescription = document.querySelector('.product__description');
  const buyButtons = document.querySelector('.product-form__buttons');
  
  // Loading state elements
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading__spinner';
  loadingOverlay.innerHTML = '<svg aria-hidden="true" focusable="false" role="presentation" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle></svg>';
  
  function clearDependentSelections(optionLevel) {
    // Clear option 2 and 3 when option 1 changes
    if (optionLevel === 1) {
      if (option2Fieldset) {
        option2Fieldset.querySelectorAll('input[type="radio"]').forEach(radio => {
          radio.checked = false;
        });
      }
      
      if (option3Fieldset) {
        option3Fieldset.querySelectorAll('input[type="radio"]').forEach(radio => {
          radio.checked = false;
        });
      }
    }
    // Clear option 3 when option 2 changes
    else if (optionLevel === 2) {
      if (option3Fieldset) {
        option3Fieldset.querySelectorAll('input[type="radio"]').forEach(radio => {
          radio.checked = false;
        });
      }
    }
  }
  
  function updateAvailableOptions(selectedOption1Value, selectedOption2Value) {
    if (hasOption2 && option2Fieldset && option2Prompt) {
      if (selectedOption1Value) {
        option2Fieldset.style.display = 'block';
        option2Prompt.style.display = 'none';
        
        // Get all available combinations for the selected option1
        const availableCombinations = {};
        
        // Build a map of available combinations
        if (option1Fieldset) {
          // Find all child products that match this option1 value
          const childProductsWithOption1 = Array.from(document.querySelectorAll(`input[data-option1-value="${selectedOption1Value}"]`));
          
          // Extract the option2 values that are available with this option1
          childProductsWithOption1.forEach(input => {
            if (input.dataset.option2Value) {
              availableCombinations[input.dataset.option2Value] = true;
            }
          });
          
          console.log('Available option2 values for', selectedOption1Value, ':', Object.keys(availableCombinations));
        }
        
        // For option2, use different approaches based on whether it's the final option or not
        const isFinalOption = !hasOption3;
        
        option2Fieldset.querySelectorAll('input[type="radio"]').forEach(radio => {
          const isAvailable = availableCombinations[radio.value];
          const label = document.querySelector(`label[for="${radio.id}"]`);
          
          if (label) {
            if (isFinalOption) {
              // For final option, hide unavailable options completely
              radio.style.display = isAvailable ? '' : 'none';
              label.style.display = isAvailable ? '' : 'none';
              // Always remove disabled class when showing
              radio.classList.remove('disabled');
            } else {
              // For intermediate options, show all but grey out unavailable ones
              radio.style.display = '';
              label.style.display = '';
              
              // Mark it as disabled if it's not available with the selected option1
              if (!isAvailable) {
                radio.classList.add('disabled');
              } else {
                radio.classList.remove('disabled');
              }
            }
          }
        });
      } else {
        option2Fieldset.style.display = 'none';
        option2Prompt.style.display = 'block';
        
        // Reset all option2 radios to not disabled when no option1 is selected
        option2Fieldset.querySelectorAll('input[type="radio"]').forEach(radio => {
          radio.classList.remove('disabled');
        });
      }
    }
    
    if (hasOption3 && option3Fieldset && option3Prompt) {
      if (selectedOption2Value) {
        option3Fieldset.style.display = 'block';
        option3Prompt.style.display = 'none';
        
        // Get all available combinations for the selected option1 and option2
        const availableCombinations = {};
        
        // Build a map of available combinations
        if (option1Fieldset && option2Fieldset) {
          const selectedOption1 = option1Fieldset.querySelector('input[type="radio"]:checked');
          const selectedOption1Value = selectedOption1 ? selectedOption1.value : null;
          
          // Find all child products that match this option1 and option2 value
          const childProductsWithOptions = Array.from(document.querySelectorAll(
            `input[data-option1-value="${selectedOption1Value}"][data-option2-value="${selectedOption2Value}"]`
          ));
          
          // Extract the option3 values that are available with these options
          childProductsWithOptions.forEach(input => {
            if (input.value) {
              availableCombinations[input.value] = true;
            }
          });
          
          console.log('Available option3 values for', selectedOption1Value, selectedOption2Value, ':', Object.keys(availableCombinations));
        }
        
        // Option3 is always the final option, so hide unavailable options completely
          
        // Get all option3 inputs
        const option3Inputs = option3Fieldset.querySelectorAll('input[type="radio"]');
        console.log('Total option3 inputs:', option3Inputs.length);
        
        // Track which values we've already shown to avoid duplicates
        const shownValues = new Set();
        
        option3Inputs.forEach(radio => {
          // Check if this option3 value is available with the selected option1 and option2
          // We need to check if this specific radio button's option1 and option2 values match the selected ones
          const radioOption1Value = radio.dataset.option1Value;
          const radioOption2Value = radio.dataset.option2Value;
          
          // An option is available if:
          // 1. It has the correct option1 and option2 values matching our selection
          // 2. We haven't already shown this value (to avoid duplicates)
          const matchesSelectedOptions = radioOption1Value === selectedOption1Value && 
                                        radioOption2Value === selectedOption2Value;
          
          const label = document.querySelector(`label[for="${radio.id}"]`);
          
          if (label) {
            if (matchesSelectedOptions && !shownValues.has(radio.value)) {
              // This is a valid option for the selected combination and we haven't shown it yet
              radio.style.display = '';
              label.style.display = '';
              radio.classList.remove('disabled');
              
              // Remember that we've shown this value
              shownValues.add(radio.value);
              console.log('Showing option3:', radio.value, 'for', selectedOption1Value, '+', selectedOption2Value);
            } else {
              // Hide this option
              radio.style.display = 'none';
              label.style.display = 'none';
              console.log('Hiding option3:', radio.value, 'with option1:', radioOption1Value, 'option2:', radioOption2Value);
            }
          }
        });
      } else {
        option3Fieldset.style.display = 'none';
        option3Prompt.style.display = 'block';
        
        // Reset all option3 radios to not disabled when no option2 is selected
        option3Fieldset.querySelectorAll('input[type="radio"]').forEach(radio => {
          radio.classList.remove('disabled');
        });
      }
    }
  }
  
  function updateFormAndEnableButton(productId, variantId) {
    if (!productId) {
      console.error('No product ID provided to updateFormAndEnableButton');
      return false; // Return false to indicate failure
    }
    
    // Use the variant ID if provided, otherwise use the product ID
    const idToUse = variantId || productId;
    
    console.log('Updating form with product ID:', productId, 'and variant ID:', variantId);
    
    let allFormsUpdated = true;
    
    // Find all forms on the page and update the product ID
    document.querySelectorAll('form[action="/cart/add"]').forEach(form => {
      const input = form.querySelector('input[name="id"]');
      if (input) {
        input.value = idToUse;
        console.log('Updated form input[name="id"] value to:', idToUse);
        
        // Dispatch a change event to ensure other listeners are notified
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        console.error('Could not find input[name="id"] in form', form);
        allFormsUpdated = false;
      }
      
      // Also update any hidden variant inputs that might exist
      const variantInputs = form.querySelectorAll('input[name="variant_id"], input.variant-id');
      variantInputs.forEach(variantInput => {
        variantInput.value = idToUse;
        console.log('Updated variant input value to:', idToUse);
      });
    });
    
    return allFormsUpdated; // Return success status
  }
  
  async function fetchAndUpdateProduct(url, productId) {
    // Prevent any ongoing navigation
    if (window._isUpdatingProduct) {
      console.log('Already updating product, ignoring additional request');
      return;
    }
    
    window._isUpdatingProduct = true;
    
    try {
      // Remove any variant parameter from the URL but keep the product URL
      const cleanUrl = url.split('?')[0];
      
      // Show loading state
      setAddToCartButtonLoading(true); // Disable add to cart button during loading
      
      if (productMedia) {
        productMedia.classList.add('loading');
        productMedia.appendChild(loadingOverlay.cloneNode(true));
      }
      
      console.log('Updating product with URL:', cleanUrl, 'and ID:', productId);
      
      // Get the selected options to pass to the event
      const selectedOption1 = option1Fieldset ? option1Fieldset.querySelector('input[type="radio"]:checked') : null;
      const selectedOption1Value = selectedOption1 ? selectedOption1.value : null;
      
      const selectedOption2 = option2Fieldset ? option2Fieldset.querySelector('input[type="radio"]:checked') : null;
      const selectedOption2Value = selectedOption2 ? selectedOption2.value : null;
      
      const selectedOption3 = option3Fieldset ? option3Fieldset.querySelector('input[type="radio"]:checked') : null;
      const selectedOption3Value = selectedOption3 ? selectedOption3.value : null;
      
      // Collect all selected option values
      const selectedOptionValues = [
        selectedOption1Value, 
        selectedOption2Value, 
        selectedOption3Value
      ].filter(Boolean); // Remove any null/undefined values
      
      // Find the target input element that has the product URL
      const targetInput = document.querySelector(`input[data-option-value-id="${productId}"]`);
      
      if (targetInput) {
        // Update URL in browser history - ensure no variant parameter
        // Use replaceState instead of pushState to avoid creating multiple history entries
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
        
        try {
          // Fetch the product page to get updated content
          const response = await fetch(`${cleanUrl}?section_id=${variantSelects.dataset.section}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch product content: ${response.status} ${response.statusText}`);
          }
          
          const responseText = await response.text();
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          
          // Update product content
          updateProductContent(html, productId);
          
          // Dispatch the optionValueSelectionChange event that product-info.js listens for
          window.publish(window.PUB_SUB_EVENTS.optionValueSelectionChange, {
            data: {
              event: new Event('change'),
              target: targetInput,
              selectedOptionValues: selectedOptionValues
            }
          });
          
          // Also dispatch the variantChange event to ensure all components update
          window.publish(window.PUB_SUB_EVENTS.variantChange, {
            data: {
              sectionId: variantSelects.dataset.section,
              html: html,
              variant: {
                id: productId
              }
            }
          });
          
          // Get the variant ID from the input element
          const variantId = targetInput.dataset.variantId;
          
          // Update the form with the product ID and variant ID
          const formUpdated = updateFormAndEnableButton(productId, variantId);
          
          if (!formUpdated) {
            console.error('Failed to update form with product ID:', productId);
            // Show an error message to the user
            const errorMessage = document.createElement('div');
            errorMessage.className = 'product-form__error-message';
            errorMessage.textContent = 'Error updating product. Please try again.';
            document.querySelector('.product-form__buttons')?.appendChild(errorMessage);
            
            // Remove the error message after 5 seconds
            setTimeout(() => errorMessage.remove(), 5000);
          }
          
          console.log('Successfully updated product content via AJAX');
        } catch (fetchError) {
          console.error('Error fetching product content:', fetchError);
          throw fetchError; // Re-throw to be caught by the outer try/catch
        }
      } else {
        console.error('Could not find input element for product ID:', productId);
        throw new Error('Could not find input element for product ID');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      
      // Only navigate if we're still on the page (user hasn't navigated away)
      if (document.querySelector('variant-selects.custom-grouped-product')) {
        console.log('Falling back to traditional navigation');
        window.location.href = url.split('?')[0];
        return; // Return early to avoid cleanup
      }
    } finally {
      // Clean up loading state
      if (productMedia) {
        productMedia.classList.remove('loading');
        const loadingElement = productMedia.querySelector('.loading__spinner');
        if (loadingElement) {
          loadingElement.remove();
        }
      }
      
      // Re-enable add to cart button
      setAddToCartButtonLoading(false);
      
      // Reset the updating flag
      window._isUpdatingProduct = false;
    }
  }
  
  // Function to safely update media gallery with error handling
  function updateMediaGallery(html, featuredMediaId) {
    if (!featuredMediaId) return;
    console.log('Updating media gallery with featured media ID:', featuredMediaId);
    
    try {
      const mediaGallerySource = document.querySelector('media-gallery ul');
      const mediaGalleryDestination = html.querySelector('media-gallery ul');
      
      if (!mediaGallerySource || !mediaGalleryDestination) {
        console.log('Media gallery elements not found, using simple update method');
        // Fallback to simple update if we can't find the elements
        const sourceMedia = html.querySelector('.product__media-wrapper');
        const destMedia = document.querySelector('.product__media-wrapper');
        if (sourceMedia && destMedia) {
          destMedia.innerHTML = sourceMedia.innerHTML;
          console.log('Updated product media using simple method');
          
          // Add safety wrapper for onSlideChanged
          setTimeout(() => {
            const mediaGallery = document.querySelector('media-gallery');
            if (mediaGallery) {
              // Add a safety wrapper around the onSlideChanged method
              const originalOnSlideChanged = mediaGallery.onSlideChanged;
              if (originalOnSlideChanged && !mediaGallery._safeOnSlideChangedApplied) {
                mediaGallery.onSlideChanged = function(event) {
                  try {
                    // Check if the event has the required properties
                    if (!event || !event.detail || !event.detail.currentElement || !event.detail.currentElement.dataset) {
                      console.log('Prevented media gallery error - missing event data');
                      return;
                    }
                    
                    return originalOnSlideChanged.call(this, event);
                  } catch (error) {
                    console.error('Caught error in onSlideChanged:', error);
                    return;
                  }
                };
                
                mediaGallery._safeOnSlideChangedApplied = true;
              }
            }
            
            // Re-initialize sliders
            const sliders = document.querySelectorAll('slider-component');
            sliders.forEach(slider => {
              if (slider.initPages && typeof slider.initPages === 'function') {
                try {
                  slider.initPages();
                  console.log('Safely re-initialized slider component');
                } catch (error) {
                  console.error('Error re-initializing slider:', error);
                }
              }
            });
          }, 100);
          
          return;
        }
      }
      
      // Get all current media items
      let mediaGallerySourceItems = Array.from(mediaGallerySource.querySelectorAll('li[data-media-id]'));
      let sourceSet = new Set(mediaGallerySourceItems.map(item => item.dataset.mediaId));
      let sourceMap = new Map(
        mediaGallerySourceItems.map((item, index) => [item.dataset.mediaId, { item, index }])
      );
      
      // Get all new media items
      const mediaGalleryDestinationItems = Array.from(
        mediaGalleryDestination.querySelectorAll('li[data-media-id]')
      );
      const destinationSet = new Set(mediaGalleryDestinationItems.map(({ dataset }) => dataset.mediaId));
      
      let shouldRefresh = false;
      
      // Add items from new data not present in DOM
      for (let i = mediaGalleryDestinationItems.length - 1; i >= 0; i--) {
        if (!sourceSet.has(mediaGalleryDestinationItems[i].dataset.mediaId)) {
          mediaGallerySource.prepend(mediaGalleryDestinationItems[i].cloneNode(true));
          shouldRefresh = true;
        }
      }
      
      // Remove items from DOM not present in new data
      for (let i = 0; i < mediaGallerySourceItems.length; i++) {
        if (!destinationSet.has(mediaGallerySourceItems[i].dataset.mediaId)) {
          mediaGallerySourceItems[i].remove();
          shouldRefresh = true;
        }
      }
      
      // Refresh source data if needed
      if (shouldRefresh) {
        mediaGallerySourceItems = Array.from(mediaGallerySource.querySelectorAll('li[data-media-id]'));
        sourceSet = new Set(mediaGallerySourceItems.map(item => item.dataset.mediaId));
        sourceMap = new Map(
          mediaGallerySourceItems.map((item, index) => [item.dataset.mediaId, { item, index }])
        );
      }
      
      // Sort to match new data order
      mediaGalleryDestinationItems.forEach((destinationItem, destinationIndex) => {
        const sourceData = sourceMap.get(destinationItem.dataset.mediaId);
        
        if (sourceData && sourceData.index !== destinationIndex) {
          mediaGallerySource.insertBefore(
            sourceData.item,
            mediaGallerySource.querySelector(`li:nth-of-type(${destinationIndex + 1})`)
          );
        }
      });
      
      // Set featured media as active
      const mediaGalleryComponent = document.querySelector('media-gallery');
      if (mediaGalleryComponent && typeof mediaGalleryComponent.setActiveMedia === 'function') {
        setTimeout(() => {
          try {
            mediaGalleryComponent.setActiveMedia(
              `${variantSelects.dataset.section}-${featuredMediaId}`,
              true
            );
            console.log('Set active media:', `${variantSelects.dataset.section}-${featuredMediaId}`);
          } catch (error) {
            console.error('Error setting active media:', error);
          }
        }, 100);
      }
      
      // Add safety wrapper for onSlideChanged
      setTimeout(() => {
        const mediaGallery = document.querySelector('media-gallery');
        if (mediaGallery) {
          // Add a safety wrapper around the onSlideChanged method
          const originalOnSlideChanged = mediaGallery.onSlideChanged;
          if (originalOnSlideChanged && !mediaGallery._safeOnSlideChangedApplied) {
            mediaGallery.onSlideChanged = function(event) {
              try {
                // Check if the event has the required properties
                if (!event || !event.detail || !event.detail.currentElement || !event.detail.currentElement.dataset) {
                  console.log('Prevented media gallery error - missing event data');
                  return;
                }
                
                return originalOnSlideChanged.call(this, event);
              } catch (error) {
                console.error('Caught error in onSlideChanged:', error);
                return;
              }
            };
            
            mediaGallery._safeOnSlideChangedApplied = true;
          }
        }
      }, 100);
    } catch (error) {
      console.error('Error in updateMediaGallery:', error);
      
      // Fallback to simple update if something goes wrong
      const sourceMedia = html.querySelector('.product__media-wrapper');
      const destMedia = document.querySelector('.product__media-wrapper');
      if (sourceMedia && destMedia) {
        destMedia.innerHTML = sourceMedia.innerHTML;
        console.log('Updated product media using fallback method');
      }
    }
  }
  
  // Function to update product content from fetched HTML
  function updateProductContent(html, productId) {
    console.log('Updating product content with ID:', productId);
    
    // Get the featured media ID from the HTML
    const mediaGallery = html.querySelector('media-gallery');
    const featuredMediaId = mediaGallery?.querySelector('[data-media-id]')?.dataset?.mediaId?.split('-').pop();
    
    // Update media gallery using a similar approach to product-info.js
    updateMediaGallery(html, featuredMediaId);
    
    // Update product title
    const sourceTitle = html.querySelector('.product__title h1');
    const destTitle = document.querySelector('.product__title h1');
    if (sourceTitle && destTitle) {
      destTitle.innerHTML = sourceTitle.innerHTML;
      console.log('Updated product title');
    }
    
    // Update product price
    const sourcePrice = html.querySelector(`#price-${variantSelects.dataset.section}`);
    const destPrice = document.querySelector(`#price-${variantSelects.dataset.section}`);
    if (sourcePrice && destPrice) {
      destPrice.innerHTML = sourcePrice.innerHTML;
      destPrice.classList.add('custom_group_prices')
      destPrice.classList.remove('hidden');
      console.log('Updated product price');
    }
    
    // Update product SKU
    const sourceSku = html.querySelector(`#Sku-${variantSelects.dataset.section}`);
    const destSku = document.querySelector(`#Sku-${variantSelects.dataset.section}`);
    if (sourceSku && destSku) {
      destSku.innerHTML = sourceSku.innerHTML;
      destSku.classList.toggle('hidden', sourceSku.classList.contains('hidden'));
      console.log('Updated product SKU');
    }
    
    // Update product inventory
    const sourceInventory = html.querySelector(`#Inventory-${variantSelects.dataset.section}`);
    const destInventory = document.querySelector(`#Inventory-${variantSelects.dataset.section}`);
    if (sourceInventory && destInventory) {
      destInventory.innerHTML = sourceInventory.innerHTML;
      destInventory.classList.toggle('hidden', sourceInventory.innerText === '');
      console.log('Updated product inventory');
    }
    
    // Update product description
    const sourceDesc = html.querySelector('.product__description');
    const destDesc = document.querySelector('.product__description');
    if (sourceDesc && destDesc) {
      destDesc.innerHTML = sourceDesc.innerHTML;
      console.log('Updated product description');
    }
    
    // Update buy buttons
    const sourceButtons = html.querySelector('product-form');
    const destButtons = document.querySelector('product-form');
    if (sourceButtons && destButtons) {
      destButtons.innerHTML = sourceButtons.innerHTML;
      console.log('Updated buy buttons');
      
      // Re-initialize the product form
      if (typeof destButtons.connectedCallback === 'function') {
        destButtons.connectedCallback();
      }
      
      // Re-initialize Shop Pay buttons
      if (window?.Shopify?.PaymentButton?.init) {
        window.Shopify.PaymentButton.init();
      }
    }
  }
  
  // Use a single global event handler for all radio inputs to ensure we catch all events
  document.addEventListener('change', function(event) {
    // Check if the changed element is a radio input in our variant selects
    const radio = event.target;
    if (!radio.matches('variant-selects.custom-grouped-product input[type="radio"]')) return;
    
    // Prevent any default behavior
    event.stopPropagation();
    
    console.log('Intercepted radio change event for option', radio.dataset.optionPosition);
    
    // Determine which option was changed
    const optionPosition = parseInt(radio.dataset.optionPosition, 10);
    
    // Clear dependent selections based on which option changed
    clearDependentSelections(optionPosition);
    
    // Get selected values
    const selectedOption1 = option1Fieldset ? option1Fieldset.querySelector('input[type="radio"]:checked') : null;
    const selectedOption1Value = selectedOption1 ? selectedOption1.value : null;
    
    const selectedOption2 = option2Fieldset ? option2Fieldset.querySelector('input[type="radio"]:checked') : null;
    const selectedOption2Value = selectedOption2 ? selectedOption2.value : null;
    
    const selectedOption3 = option3Fieldset ? option3Fieldset.querySelector('input[type="radio"]:checked') : null;
    const selectedOption3Value = selectedOption3 ? selectedOption3.value : null;
    
    // Update available options based on which option changed
    if (optionPosition === 1) {
      updateAvailableOptions(selectedOption1Value, null);
    } else if (optionPosition === 2) {
      updateAvailableOptions(selectedOption1Value, selectedOption2Value);
    }
    
    // If this option has a product URL, use AJAX to update the product
    if (radio.dataset.productUrl) {
      console.log(`Option ${optionPosition} selected with product URL:`, radio.dataset.productUrl);
      
      // Use fetchAndUpdateProduct to update via AJAX
      fetchAndUpdateProduct(radio.dataset.productUrl, radio.dataset.optionValueId);
    } else {
      // If this is not a final option, just dispatch the event to update the UI
      const selectedOptionValues = [
        selectedOption1Value,
        selectedOption2Value,
        selectedOption3Value
      ].filter(Boolean).slice(0, optionPosition);
      
      window.publish(window.PUB_SUB_EVENTS.optionValueSelectionChange, {
        data: {
          event: new Event('change'),
          target: radio,
          selectedOptionValues: selectedOptionValues
        }
      });
    }
  }, true); // Use capture phase to intercept before other handlers
  
  // Function to safely submit the form with the correct variant ID
  function safelySubmitForm(form, productId) {
    if (!form || !productId) {
      console.error('Cannot safely submit form: missing form or productId');
      return false;
    }
    
    try {
      // Try to get the variant ID from the selected option
      let variantId = null;
      
      // Find the most specific selected option (option3 > option2 > option1)
      const selectedOption3 = option3Fieldset ? option3Fieldset.querySelector('input[type="radio"]:checked') : null;
      const selectedOption2 = option2Fieldset ? option2Fieldset.querySelector('input[type="radio"]:checked') : null;
      const selectedOption1 = option1Fieldset ? option1Fieldset.querySelector('input[type="radio"]:checked') : null;
      
      if (selectedOption3 && selectedOption3.dataset.variantId) {
        variantId = selectedOption3.dataset.variantId;
      } else if (selectedOption2 && selectedOption2.dataset.variantId) {
        variantId = selectedOption2.dataset.variantId;
      } else if (selectedOption1 && selectedOption1.dataset.variantId) {
        variantId = selectedOption1.dataset.variantId;
      }
      
      // Use the variant ID if available, otherwise use the product ID
      const idToUse = variantId || productId;
      console.log('Using ID for cart submission:', idToUse, '(variant ID:', variantId, ', product ID:', productId, ')');
      
      // Ensure the form has the correct variant ID
      ensureFormHasCorrectVariantId(form, idToUse);
      
      // Create a FormData object from the form
      const formData = new FormData(form);
      
      // Double-check that the ID is set correctly
      if (!formData.get('id')) {
        formData.set('id', productId);
      }
      
      // Show loading state
      setAddToCartButtonLoading(true);
      
      // Log the form data for debugging
      console.log('Form data being submitted:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      // Get cart components
      const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
      
      // Prepare form data with sections
      if (cart) {
        // Add sections to the form data
        const sections = cart.getSectionsToRender().map((section) => section.id);
        formData.append('sections', sections);
        formData.append('sections_url', window.location.pathname);
      }
      
      // Use fetch to submit the form using the standard cart endpoint
      fetch(`${routes.cart_add_url}`, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Product added to cart:', data);
        
        // Handle the response using the standard approach
        if (!cart) {
          // If no cart notification/drawer exists, redirect to cart page
          window.location.href = window.routes.cart_url;
          return;
        }
        
        // Let the cart component handle the rendering
        cart.renderContents(data);
      })
      .catch(error => {
        console.error('Error adding product to cart:', error);
        
        // Show an error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'product-form__error-message';
        errorMessage.textContent = 'Error adding product to cart. Please try again.';
        form.querySelector('.product-form__buttons')?.appendChild(errorMessage);
        
        // Remove the error message after 5 seconds
        setTimeout(() => errorMessage.remove(), 5000);
      })
      .finally(() => {
        // Re-enable add to cart button
        setAddToCartButtonLoading(false);
      });
      
      return true;
    } catch (error) {
      console.error('Error in safelySubmitForm:', error);
      
      // Re-enable add to cart button
      setAddToCartButtonLoading(false);
      
      // Fallback to traditional form submission
      try {
        ensureFormHasCorrectVariantId(form, productId);
        form.submit();
      } catch (submitError) {
        console.error('Error in fallback form submission:', submitError);
        return false;
      }
      
      return true;
    }
  }
  
  // Replace the existing form submission validation with this improved version
  document.querySelectorAll('form[action="/cart/add"]').forEach(form => {
    // Remove any existing event listeners to prevent duplicates
    const newForm = form.cloneNode(true);
    if (form.parentNode) {
      form.parentNode.replaceChild(newForm, form);
    }
    
    newForm.addEventListener('submit', function(event) {
      // Always prevent the default submission
      event.preventDefault();
      
      // Get all potential variant ID inputs
      const variantInput = this.querySelector('input[name="id"]');
      const variantInputs = this.querySelectorAll('input[name="variant_id"], input.variant-id');
      
      // Check if any variant input has a value
      let productId = variantInput ? variantInput.value : null;
      
      if (!productId) {
        // Check other variant inputs
        variantInputs.forEach(input => {
          if (input.value) {
            productId = input.value;
          }
        });
      }
      
      // If we still don't have a product ID, try to get it from the selected options
      if (!productId) {
        // Try to recover by finding the currently selected option
        const selectedOption3 = option3Fieldset ? option3Fieldset.querySelector('input[type="radio"]:checked') : null;
        const selectedOption2 = option2Fieldset ? option2Fieldset.querySelector('input[type="radio"]:checked') : null;
        const selectedOption1 = option1Fieldset ? option1Fieldset.querySelector('input[type="radio"]:checked') : null;
        
        // Find the most specific selected option (option3 > option2 > option1)
        if (selectedOption3 && selectedOption3.dataset.optionValueId) {
          productId = selectedOption3.dataset.optionValueId;
        } else if (selectedOption2 && selectedOption2.dataset.optionValueId) {
          productId = selectedOption2.dataset.optionValueId;
        } else if (selectedOption1 && selectedOption1.dataset.optionValueId) {
          productId = selectedOption1.dataset.optionValueId;
        }
      }
      
      if (!productId) {
        console.error('Prevented form submission: No variant ID found');
        
        // Show an error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'product-form__error-message';
        errorMessage.textContent = 'Please select all options before adding to cart.';
        this.querySelector('.product-form__buttons')?.appendChild(errorMessage);
        
        // Remove the error message after 5 seconds
        setTimeout(() => errorMessage.remove(), 5000);
        
        return false;
      } else {
        // Try to get the variant ID from the selected option
        let variantId = null;
        
        if (selectedOption3 && selectedOption3.dataset.variantId) {
          variantId = selectedOption3.dataset.variantId;
        } else if (selectedOption2 && selectedOption2.dataset.variantId) {
          variantId = selectedOption2.dataset.variantId;
        } else if (selectedOption1 && selectedOption1.dataset.variantId) {
          variantId = selectedOption1.dataset.variantId;
        }
        
        // Use the variant ID if available, otherwise use the product ID
        const idToUse = variantId || productId;
        console.log('Form submission with ID:', idToUse, '(variant ID:', variantId, ', product ID:', productId, ')');
        
        // Use our safe submission method
        return safelySubmitForm(this, idToUse);
      }
    });
  });

  // Initialize state based on current product
  const productElement = document.querySelector('product-info');
  const productId = productElement ? productElement.dataset.productId : null;
  const parentProductId = document.querySelector('input[data-option-position="1"]') ? 
                          document.querySelector('input[data-option-position="1"]').form.id.split('__')[1] : 
                          null;
  
  const isChildProduct = productId && parentProductId && productId !== parentProductId;
  
  if (isChildProduct) {
    // Get current option values from the selected inputs
    const currentOption1 = option1Fieldset ? option1Fieldset.querySelector('input[type="radio"]:checked') : null;
    const currentOption1Value = currentOption1 ? currentOption1.value : null;
    
    const currentOption2 = option2Fieldset ? option2Fieldset.querySelector('input[type="radio"]:checked') : null;
    const currentOption2Value = currentOption2 ? currentOption2.value : null;
    
    // Set initial state for dependent options
    updateAvailableOptions(currentOption1Value, currentOption2Value);
    
    // If we're on a child product page, ensure the button is enabled immediately
    console.log('On child product page, ensuring button is enabled with product ID:', productId);
    
    // Update the form with the current product ID - use a small delay to ensure DOM is ready
    setTimeout(() => {
      // Try to get the variant ID from the selected option
      let variantId = null;
      
      // Find the currently selected input that has the variant ID
      const selectedInput = document.querySelector(`input[data-option-value-id="${productId}"]`);
      if (selectedInput && selectedInput.dataset.variantId) {
        variantId = selectedInput.dataset.variantId;
      }
      
      // Use the variant ID if available, otherwise use the product ID
      const idToUse = variantId || productId;
      console.log('Initializing form with ID:', idToUse, '(variant ID:', variantId, ', product ID:', productId, ')');
      
      // Update all forms on the page
      document.querySelectorAll('form[action="/cart/add"]').forEach(form => {
        ensureFormHasCorrectVariantId(form, idToUse);
      });
      
      // Also try the traditional button enabling approach as a fallback
      const selectors = [
        '.product-form__submit',
        'button[name="add"]',
        'button[type="submit"]',
        'input[type="submit"]'
      ];
      
      // Find all possible submit buttons
      let submitButtons = [];
      if (buyButtons) {
        selectors.forEach(selector => {
          const buttons = buyButtons.querySelectorAll(selector);
          if (buttons.length) {
            submitButtons = [...submitButtons, ...Array.from(buttons)];
          }
        });
      }
      
      // Also try to find buttons in the entire product form
      const productForm = document.querySelector('product-info form');
      if (productForm) {
        selectors.forEach(selector => {
          const buttons = productForm.querySelectorAll(selector);
          if (buttons.length) {
            submitButtons = [...submitButtons, ...Array.from(buttons)];
          }
        });
      }
      
      // Enable all found buttons
      if (submitButtons.length) {
        console.log('Found submit buttons on child product page:', submitButtons.length);
        submitButtons.forEach(button => {
          // Remove disabled attribute
          button.removeAttribute('disabled');
          // Also set the disabled property to false
          button.disabled = false;
          console.log('Enabled button on child product page:', button);
        });
      }
    }, 300); // Shorter delay but still enough to ensure DOM is ready
  }
  
  // Handle browser back/forward navigation
  window.addEventListener('popstate', function(event) {
    if (event.state && event.state.path) {
      // We don't have the product ID here, but the fetchAndUpdateProduct function
      // will extract it from the fetched page
      fetchAndUpdateProduct(event.state.path, null);
    }
  });
});
