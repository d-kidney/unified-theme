class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener("click", (event) => {
      event.preventDefault();
      const cartItems =
        this.closest("cart-items") || this.closest("cart-drawer-items");
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define("cart-remove-button", CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById("shopping-cart-line-item-status") ||
      document.getElementById("CartDrawer-LineItemStatus");
    getSelectedVariant()
    estDeliveryDate();
    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener("change", debouncedOnChange.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.cartUpdate,
      (event) => {
        if (event.source === "cart-items") {
          return;
        }
        this.onCartUpdate();
      }
    );
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute("value");
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;
    let message = "";

    if (inputValue < event.target.dataset.min) {
      message = window.quickOrderListStrings.min_error.replace(
        "[min]",
        event.target.dataset.min
      );
    } else if (inputValue > parseInt(event.target.max)) {
      message = window.quickOrderListStrings.max_error.replace(
        "[max]",
        event.target.max
      );
    } else if (inputValue % parseInt(event.target.step) !== 0) {
      message = window.quickOrderListStrings.step_error.replace(
        "[step]",
        event.target.step
      );
    }

    if (message) {
      this.setValidity(event, index, message);
    } else {
      event.target.setCustomValidity("");
      event.target.reportValidity();
      this.updateQuantity(
        index,
        inputValue,
        document.activeElement.getAttribute("name"),
        event.target.dataset.quantityVariantId
      );
    }
  }

  onChange(event) {
    this.validateQuantity(event);
  }

  onCartUpdate() {
    if (this.tagName === "CART-DRAWER-ITEMS") {
      fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(
            responseText,
            "text/html"
          );
          const selectors = ["cart-drawer-items", ".cart-drawer__footer"];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(
            responseText,
            "text/html"
          );
          const sourceQty = html.querySelector("cart-items");
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    return [
      {
        id: "main-cart-items",
        section: document.getElementById("main-cart-items").dataset.id,
        selector: ".js-contents",
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section",
      },
      {
        id: "cart-live-region-text",
        section: "cart-live-region-text",
        selector: ".shopify-section",
      },
      {
        id: "main-cart-footer",
        section: document.getElementById("main-cart-footer").dataset.id,
        selector: ".js-contents",
      },
    ];
  }

  updateQuantity(line, quantity, name, variantId) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        const quantityElement =
          document.getElementById(`Quantity-${line}`) ||
          document.getElementById(`Drawer-quantity-${line}`);
        const items = document.querySelectorAll(".cart-item");

        if (parsedState.errors) {
          quantityElement.value = quantityElement.getAttribute("value");
          this.updateLiveRegions(line, parsedState.errors);
          return;
        }

        this.classList.toggle("is-empty", parsedState.item_count === 0);
        const cartDrawerWrapper = document.querySelector("cart-drawer");
        const cartFooter = document.getElementById("main-cart-footer");

        if (cartFooter)
          cartFooter.classList.toggle("is-empty", parsedState.item_count === 0);
        if (cartDrawerWrapper)
          cartDrawerWrapper.classList.toggle(
            "is-empty",
            parsedState.item_count === 0
          );

        this.getSectionsToRender().forEach((section) => {
          const elementToReplace =
            document
              .getElementById(section.id)
              .querySelector(section.selector) ||
            document.getElementById(section.id);
          elementToReplace.innerHTML = this.getSectionInnerHTML(
            parsedState.sections[section.section],
            section.selector
          );
        });
        const updatedValue = parsedState.items[line - 1]
          ? parsedState.items[line - 1].quantity
          : undefined;
        let message = "";
        if (
          items.length === parsedState.items.length &&
          updatedValue !== parseInt(quantityElement.value)
        ) {
          if (typeof updatedValue === "undefined") {
            message = window.cartStrings.error;
          } else {
            message = window.cartStrings.quantityError.replace(
              "[quantity]",
              updatedValue
            );
          }
        }
        this.updateLiveRegions(line, message);

        const lineItem =
          document.getElementById(`CartItem-${line}`) ||
          document.getElementById(`CartDrawer-Item-${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
          cartDrawerWrapper
            ? trapFocus(
                cartDrawerWrapper,
                lineItem.querySelector(`[name="${name}"]`)
              )
            : lineItem.querySelector(`[name="${name}"]`).focus();
        } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
          trapFocus(
            cartDrawerWrapper.querySelector(".drawer__inner-empty"),
            cartDrawerWrapper.querySelector("a")
          );
        } else if (document.querySelector(".cart-item") && cartDrawerWrapper) {
          trapFocus(
            cartDrawerWrapper,
            document.querySelector(".cart-item__name")
          );
        }

        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: "cart-items",
          cartData: parsedState,
          variantId: variantId,
        });
        estDeliveryDate()
        getSelectedVariant()
      })
      .catch(() => {
        this.querySelectorAll(".loading__spinner").forEach((overlay) =>
          overlay.classList.add("hidden")
        );
        const errors =
          document.getElementById("cart-errors") ||
          document.getElementById("CartDrawer-CartErrors");
        errors.textContent = window.cartStrings.error;
      })
      .finally(() => {
        this.disableLoading(line);
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) ||
      document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError)
      lineItemError.querySelector(".cart-item__error-text").textContent =
        message;

    this.lineItemStatusElement.setAttribute("aria-hidden", true);

    const cartStatus =
      document.getElementById("cart-live-region-text") ||
      document.getElementById("CartDrawer-LiveRegionText");
    cartStatus.setAttribute("aria-hidden", false);

    setTimeout(() => {
      cartStatus.setAttribute("aria-hidden", true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems =
      document.getElementById("main-cart-items") ||
      document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.add("cart__items--disabled");

    const cartItemElements = this.querySelectorAll(
      `#CartItem-${line} .loading__spinner`
    );
    const cartDrawerItemElements = this.querySelectorAll(
      `#CartDrawer-Item-${line} .loading__spinner`
    );

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) =>
      overlay.classList.remove("hidden")
    );

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute("aria-hidden", false);
  }

  disableLoading(line) {
    const mainCartItems =
      document.getElementById("main-cart-items") ||
      document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.remove("cart__items--disabled");

    const cartItemElements = this.querySelectorAll(
      `#CartItem-${line} .loading__spinner`
    );
    const cartDrawerItemElements = this.querySelectorAll(
      `#CartDrawer-Item-${line} .loading__spinner`
    );

    cartItemElements.forEach((overlay) => overlay.classList.add("hidden"));
    cartDrawerItemElements.forEach((overlay) =>
      overlay.classList.add("hidden")
    );
  }
}

customElements.define("cart-items", CartItems);

if (!customElements.get("cart-note")) {
  customElements.define(
    "cart-note",
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          "input",
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, {
              ...fetchConfig(),
              ...{ body },
            });
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }
    }
  );
}

// accept alternative + offload confimration

document.addEventListener("DOMContentLoaded", function () {
  const cartForm = document.querySelector('form[action="/cart"]');
  if (!cartForm) return;

  function setupRadioValidation(groupName, wrapperClass) {
    const wrapper = document.querySelector(`.${wrapperClass}`);
    if (!wrapper) return null;

    const radioButtons = wrapper.querySelectorAll(`input[name="${groupName}"]`);
    if (!radioButtons.length) return null;

    let errorSpan = wrapper.querySelector(".error-message");
    if (!errorSpan) {
      errorSpan = document.createElement("span");
      errorSpan.classList.add("error-message");
      errorSpan.style.color = "red";
      errorSpan.style.marginLeft = "10px";
      errorSpan.style.fontSize = "0.9em";
      errorSpan.textContent = "Please select an option";
      errorSpan.style.display = "none";

      const spans = wrapper.querySelectorAll("span");
      if (spans.length > 0) {
        spans[spans.length - 1].insertAdjacentElement("afterend", errorSpan);
      } else {
        wrapper.appendChild(errorSpan);
      }
    }

    return {
      validate: function () {
        const isSelected = Array.from(radioButtons).some((rb) => rb.checked);
        if (!isSelected) {
          errorSpan.style.display = "inline";
          wrapper.style.border = "2px solid red";
          wrapper.style.borderRadius = "5px";
          radioButtons[0].focus();
          return false;
        } else {
          errorSpan.style.display = "none";
          wrapper.style.border = "none";
          return true;
        }
      },
      getSelectedValue: function () {
        const selected = wrapper.querySelector(
          `input[name="${groupName}"]:checked`
        );
        return selected ? selected.value : null;
      },
      groupName: groupName,
    };
  }

  // Setup validation and attribute collection for each group
  const altValidation = setupRadioValidation(
    "attributes[accept_alt]",
    "accept_alt"
  );
  const offloadValidation = setupRadioValidation(
    "attributes[offload_confirmation]",
    "offload_confirmation"
  );

  cartForm.addEventListener("submit", function (e) {
    let isFormValid = true;

    if (altValidation && !altValidation.validate()) isFormValid = false;
    if (offloadValidation && !offloadValidation.validate()) isFormValid = false;

    if (!isFormValid) {
      e.preventDefault();
      return;
    }

    // Remove existing attribute inputs to avoid duplicates
    const existingInputs = cartForm.querySelectorAll(
      'input[name^="attributes["]'
    );
    existingInputs.forEach((input) => input.remove());

    // Add selected values as hidden inputs
    [altValidation, offloadValidation].forEach((validationObj) => {
      if (validationObj) {
        const val = validationObj.getSelectedValue();
        if (val) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = validationObj.groupName; // already has attributes[...] format
          input.value = val;
          cartForm.appendChild(input);
        }
      }
    });
  });

  // Fast Checkout compatiblity (no validation)
function getSelectedValue(groupName) {
  const input = document.querySelector(`input[name="${groupName}"]:checked`);
  return input ? input.value : null;
}

function updateCartAttributes(attributes) {
  return fetch('/cart/update.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ attributes })
  });
}

function handleFastCheckoutClick(event) {
  const acceptAlt = getSelectedValue('attributes[accept_alt]');
  const offloadConf = getSelectedValue('attributes[offload_confirmation]');

  const attrs = {};
  if (acceptAlt) attrs['accept_alt'] = acceptAlt;
  if (offloadConf) attrs['offload_confirmation'] = offloadConf;

  if (Object.keys(attrs).length === 0) return; // nothing to save

  event.preventDefault(); // try to delay the fast checkout

  updateCartAttributes(attrs).finally(() => {
    event.target.click(); // re-trigger the original button after update
  });
}

function observeFastCheckoutButtons() {
  const alreadyHandled = new WeakSet();

  const tryAttachHandlers = () => {
    const buttons = document.querySelectorAll(
      '[data-shopify-button="shop-pay-button"], .shopify-payment-button__button, #dynamic-checkout-cart button'
    );

    buttons.forEach(button => {
      if (!alreadyHandled.has(button)) {
        alreadyHandled.add(button);
        button.addEventListener('click', handleFastCheckoutClick, { once: true });
      }
    });
  };

  tryAttachHandlers();

  // Watch for dynamic changes (e.g. fast checkout button appears later)
  const observer = new MutationObserver(() => {
    tryAttachHandlers();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

observeFastCheckoutButtons();
});

// Auto Shipping protection 
var selectvariant;
function isShopPayRedirectEnabled() {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const shopPayCookie = cookies.find(cookie => cookie.startsWith('shopify_pay_redirect='));
    if (shopPayCookie) {
      const cookieValue = shopPayCookie.split('=')[1];
      return cookieValue === 'true';
    }
    return false;
}
isShopPayRedirectEnabled()
$(document).on('click', '.cart__blocks .cart__ctas .cart__checkout-button:not(.cart__checkout-button-original)', function () {
    $(this).addClass('loading')
    var shipping_protection = $('.cart-item-group').find('.cart-item .cart-item__details-info .cart-item__name[href*="shipping-protection"]').attr('href')
    
    if (shipping_protection) {
      shipping_protection = shipping_protection.split('?variant=')[1];
    }
    // Check if shipping protection is different from selected variant or if it doesn't exist
    if(!isShopPayRedirectEnabled()) { 
      if ((shipping_protection !== selectvariant) && !shipping_protection && selectvariant) {
        console.log('add new')
        $.ajax({
          type: 'POST',
          url: '/cart/add.js',
          data: {
            quantity: 1,
            id: selectvariant
          },
          dataType: 'json',
          success: function () {
            $('.cart__checkout-button.cart__checkout-button-original').trigger('click');
          }
        });
      } else if ((shipping_protection !== selectvariant) && selectvariant && shipping_protection) {
        // Remove existing shipping protection item and add new one
        $.ajax({
          type: 'POST',
          url: '/cart/change.js',
          data: {
            quantity: 0,
            id: shipping_protection
          },
          dataType: 'json',
          success: function () {
            $.ajax({
              type: 'POST',
              url: '/cart/add.js',
              data: {
                quantity: 1,
                id: selectvariant
              },
              dataType: 'json',
              success: function () {
                $('.cart__checkout-button.cart__checkout-button-original').trigger('click');
              }
            });
          }
        });
      } else{
        $('.cart__checkout-button.cart__checkout-button-original').trigger('click');
      }
    } else {
      if ((shipping_protection !== selectvariant) && selectvariant && shipping_protection) {
        $.ajax({
          type: 'POST',
          url: '/cart/change.js',
          data: {
            quantity: 0,
            id: shipping_protection
          },
          dataType: 'json',
          success: function () {
            $('.cart__checkout-button.cart__checkout-button-original').trigger('click');
          }
        });
      } else{
        $('.cart__checkout-button.cart__checkout-button-original').trigger('click');
      }
    }
});

function getSelectedVariant() {
  var Total_Price = $('.cart__footer').find('.totals').find('.totals__total-value').text()
  var Subtotal = Total_Price;
  if ($('.cart-item-group').find('.cart-item .cart-item__details-info .cart-item__name[href*="shipping-protection"]').length) {
    var shipping_protection_items = [];
    shipping_protection_items.push(parseFloat($('.cart-items').find('.cart-item.shipping_protection').find('.cart-item__price-wrapper .price').text().replace('$', '').replace(',', '')))
    var shipping_protect = shipping_protection_items.reduce((partialSum, a) => partialSum + a, 0);
    Subtotal = parseFloat((parseFloat(Total_Price.replace('$', '').replace(',', '')) - shipping_protect).toFixed(2));
  } else {
    Subtotal = parseFloat(Subtotal.replace('$', '').replace(',', ''));
  }

  var TotalPercantage = (Subtotal) !== "undefined" ? ((Subtotal) * .03).toFixed(2) : "";
  var SP_prices_Array = [0.98, 1.15, 1.35, 1.55, 1.75, 1.95, 2.15, 2.35, 2.55, 2.75, 2.95, 3.15, 3.35, 3.55, 3.75, 3.95, 4.15, 4.35, 4.55, 4.75, 4.95, 5.15, 5.35, 5.55, 5.75, 5.95, 6.15, 6.35, 6.55, 6.75, 6.95, 7.15, 7.35, 7.55, 7.75, 7.95, 8.15, 8.35, 8.55, 8.75, 8.95, 9.38, 10.03, 10.68, 11.33, 11.98, 12.63, 13.28, 13.93, 14.58, 15.23, 15.88, 16.53, 17.18, 17.83, 18.48, 19.13, 19.78, 20.43, 24.38, 31.63, 38.88, 46.13, 53.38, 60.63, 67.88, 75.13, 82.38, 89.63, 96.88, 104.13, 111.38, 118.63, 125.88, 133.13, 140.38, 147.63, 154.88, 162.13, 169.38, 176.63, 186.78, 196.93, 207.08, 217.23, 227.38, 237.53, 247.68, 257.83, 267.98, 278.13, 292.08, 306.03, 319.98, 333.93, 347.88, 361.83, 375.78, 389.73, 403.68];
  var SP_Variant_Array = ["39358028185649-0.98", "39358028218417-1.15", "39358028251185-1.35", "39358028283953-1.55", "39358028316721-1.75", "39358028349489-1.95", "39358028382257-2.15", "39358028415025-2.35", "39358028447793-2.55", "39358028480561-2.75", "39358028513329-2.95", "39358028546097-3.15", "39358028578865-3.35", "39358028611633-3.55", "39358028644401-3.75", "39358028677169-3.95", "39358028709937-4.15", "39358028742705-4.35", "39358028775473-4.55", "39358028808241-4.75", "39358028841009-4.95", "39358028873777-5.15", "39358028906545-5.35", "39358028939313-5.55", "39358028972081-5.75", "39358029004849-5.95", "39358029037617-6.15", "39358029070385-6.35", "39358029103153-6.55", "39358029135921-6.75", "39358029168689-6.95", "39358029201457-7.15", "39358029234225-7.35", "39358029266993-7.55", "39358029299761-7.75", "39358029332529-7.95", "39358029365297-8.15", "39358029398065-8.35", "39358029430833-8.55", "39358029463601-8.75", "39358029496369-8.95", "39358029529137-9.38", "39358029561905-10.03", "39358029594673-10.68", "39358029627441-11.33", "39358029660209-11.98", "39358029692977-12.63", "39358029725745-13.28", "39358029758513-13.93", "39358029791281-14.58", "39358029824049-15.23", "39358029856817-15.88", "39358029889585-16.53", "39358029922353-17.18", "39358029955121-17.83", "39358029987889-18.48", "39358030020657-19.13", "39358030053425-19.78", "39358030086193-20.43", "39358030118961-24.38", "39358030151729-31.63", "39358030184497-38.88", "39358030217265-46.13", "39358030250033-53.38", "39358030282801-60.63", "39358030315569-67.88", "39358030348337-75.13", "39358030381105-82.38", "39358030413873-89.63", "39358030446641-96.88", "39358030479409-104.13", "39358030512177-111.38", "39358030544945-118.63", "39358030577713-125.88", "39358030610481-133.13", "39358030643249-140.38", "39430907166769-147.63", "39430907199537-154.88", "39430907330609-162.13", "39430907363377-169.38", "39430907396145-176.63", "39430907428913-186.78", "39430907494449-196.93", "39430907527217-207.08", "39430907559985-217.23", "39430907592753-227.38", "39430907625521-237.53", "39430907658289-247.68", "39430907691057-257.83", "39430907756593-267.98", "39430907822129-278.13", "39430907854897-292.08", "39430907887665-306.03", "39430907920433-319.98", "39430907985969-333.93", "39430908051505-347.88", "39430908149809-361.83", "39430908215345-375.78", "39430908313649-389.73", "39430908379185-403.68"];
  var selectvariantIndex;
  var closestNumber;
  if (TotalPercantage !== "undefined") {
    closestNumber = SP_prices_Array.reduce((a, b) => {
      return Math.abs(b - TotalPercantage) < Math.abs(a - TotalPercantage) ? b : a;
    });
    for (var i = 0; i < SP_Variant_Array.length; i++) {
      if (SP_Variant_Array[i].includes('-' + closestNumber)) {
        selectvariantIndex = SP_Variant_Array[i];
        selectvariant = SP_Variant_Array[i].split('-')[0];
      }
    }
  }
}

// disable scroll wheel from altering numerical input values
document.addEventListener('wheel', function(e) {
  if (document.activeElement.type === 'number') {
    document.activeElement.blur();
  }
}, { passive: false });