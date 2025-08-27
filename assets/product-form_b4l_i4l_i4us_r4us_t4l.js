
if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();
 
        this.form = this.querySelector('form');
        if (this.form) {
          if (this.variantIdInput) {
            this.variantIdInput.disabled = false;
          }
          this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        }
        
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        if (this.submitButton) {
          this.submitButtonText = this.submitButton.querySelector('span');
          
          if (document.querySelector('cart-drawer')) {
            this.submitButton.setAttribute('aria-haspopup', 'dialog');
          }
        }

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      connectedCallback() {
        // Refresh the cart reference when the component is connected or reconnected
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        
        // Ensure the form has the submit event listener
        this.form = this.querySelector('form');
        if (this.form) {
          // Remove any existing listeners to prevent duplicates
          const newForm = this.form.cloneNode(true);
          if (this.form.parentNode) {
            this.form.parentNode.replaceChild(newForm, this.form);
          }
          this.form = newForm;
          
          // Add the listener again
          this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
          
          // Re-enable the variant ID input
          if (this.variantIdInput) {
            this.variantIdInput.disabled = false;
          }
        }
        
        // Refresh other important references
        this.submitButton = this.querySelector('[type="submit"]');
        if (this.submitButton) {
          this.submitButtonText = this.submitButton.querySelector('span');
          
          if (document.querySelector('cart-drawer')) {
            this.submitButton.setAttribute('aria-haspopup', 'dialog');
          }
        }
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (!this.submitButton || this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        
        const loadingSpinner = this.querySelector('.loading__spinner');
        if (loadingSpinner) {
          loadingSpinner.classList.remove('hidden');
        }

        if (!this.form) {
          console.error('Form not found in product-form component');
          return;
        }

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            // if(response?.title.includes('Sample')){
            //  jQuery('.product__info-container .product-form .product-form__buttons .product-form__submit').addClass('disabled')
             // jQuery('.product__info-container .product-form .product-form__buttons .product-form__submit span').text('Sample added to cart')
            //  }
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              if (this.submitButton) {
                const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
                if (soldOutMessage) {
                  this.submitButton.setAttribute('aria-disabled', true);
                  if (this.submitButtonText) {
                    this.submitButtonText.classList.add('hidden');
                  }
                  soldOutMessage.classList.remove('hidden');
                  this.error = true;
                }
              }
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              }).then(() => {
                // Wait for all subscribers to complete before rendering cart
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            if (this.submitButton) {
              this.submitButton.classList.remove('loading');
              if (!this.error) {
                this.submitButton.removeAttribute('aria-disabled');
              }
            }
            
            if (this.cart && this.cart.classList.contains('is-empty')) {
              this.cart.classList.remove('is-empty');
            }
            
            const loadingSpinner = this.querySelector('.loading__spinner');
            if (loadingSpinner) {
              loadingSpinner.classList.add('hidden');
            }
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');
        if (!this.errorMessage) return;

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (!this.submitButton) return;
        
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text && this.submitButtonText) {
            this.submitButtonText.textContent = text;
          }
        } else {
          this.submitButton.removeAttribute('disabled');
          if (this.submitButtonText) {
            this.submitButtonText.textContent = window.variantStrings.addToCart;
          }
        }
      }
 
      get variantIdInput() {
        return this.form ? this.form.querySelector('[name=id]') : null;
      }
    }
  );
}
