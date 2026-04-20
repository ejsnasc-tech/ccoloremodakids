// ===== LOJA - APP.JS =====

document.addEventListener('DOMContentLoaded', () => {
  // Seed demo data on first visit
  Store.seedDemoData();

  // State
  let currentCategory = 'Todos';
  let searchQuery = '';

  // Elements
  const productsGrid = document.getElementById('productsGrid');
  const categoriesBar = document.getElementById('categoriesBar');
  const productCount = document.getElementById('productCount');
  const searchInput = document.getElementById('searchInput');
  const cartBtn = document.getElementById('cartBtn');
  const cartCount = document.getElementById('cartCount');
  const cartSidebar = document.getElementById('cartSidebar');
  const cartOverlay = document.getElementById('cartOverlay');
  const closeCart = document.getElementById('closeCart');
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const productModal = document.getElementById('productModal');
  const modalContent = document.getElementById('modalContent');
  const modalClose = document.getElementById('modalClose');

  // ===== RENDER CATEGORIES =====
  function renderCategories() {
    const categories = Store.getCategories();
    categoriesBar.innerHTML = '';

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `category-btn ${cat === currentCategory ? 'active' : ''}`;
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        currentCategory = cat;
        renderCategories();
        renderProducts();
      });
      categoriesBar.appendChild(btn);
    });
  }

  // ===== RENDER PRODUCTS =====
  function renderProducts() {
    const products = Store.getProducts();
    let filtered = products;

    // Filter by category
    if (currentCategory !== 'Todos') {
      filtered = filtered.filter(p => p.category === currentCategory);
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    productCount.textContent = `${filtered.length} produto${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Nenhum produto encontrado</h3>
          <p>Tente buscar por outro termo ou categoria.</p>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = filtered.map(product => {
      const availableSizes = product.sizes.filter(s => s.stock > 0);
      const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);

      return `
        <div class="product-card" data-id="${sanitize(product.id)}">
          <div class="product-image">
            ${product.image
              ? `<img src="${sanitize(product.image)}" alt="${sanitize(product.name)}" loading="lazy">`
              : `<div class="placeholder-img">👕</div>`
            }
            ${product.badge
              ? `<span class="product-badge ${product.badge === 'Novo' ? 'new' : ''}">${sanitize(product.badge)}</span>`
              : ''
            }
          </div>
          <div class="product-info">
            <div class="product-name">${sanitize(product.name)}</div>
            <div class="product-category-label">${sanitize(product.category)}</div>
            <div class="product-sizes">
              ${product.sizes.map(s => `
                <span class="size-tag ${s.stock === 0 ? 'out-of-stock' : ''}">${sanitize(s.name)}</span>
              `).join('')}
            </div>
            <div class="product-price">
              <span class="price-current">${formatPrice(product.price)}</span>
              ${product.oldPrice ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>` : ''}
            </div>
            ${totalStock === 0 ? '<div style="color:var(--danger);font-size:0.8rem;font-weight:700;margin-top:0.3rem;">Esgotado</div>' : ''}
          </div>
        </div>
      `;
    }).join('');

    // Add click listeners
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        openProductModal(card.dataset.id);
      });
    });
  }

  // ===== PRODUCT MODAL =====
  function openProductModal(productId) {
    const product = Store.getProductById(productId);
    if (!product) return;

    let selectedSize = null;
    let quantity = 1;

    function renderModal() {
      const sizeStock = selectedSize
        ? product.sizes.find(s => s.name === selectedSize)?.stock || 0
        : 0;

      modalContent.innerHTML = `
        <div class="modal-product-image">
          ${product.image
            ? `<img src="${sanitize(product.image)}" alt="${sanitize(product.name)}">`
            : `<div class="placeholder-img" style="font-size:5rem;">👕</div>`
          }
        </div>
        <div class="modal-product-info">
          <div class="product-category-label">${sanitize(product.category)}</div>
          <h2>${sanitize(product.name)}</h2>
          <p style="color:var(--text-light);font-size:0.9rem;">${sanitize(product.description || '')}</p>
          <div class="product-price">
            <span class="price-current">${formatPrice(product.price)}</span>
            ${product.oldPrice ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>` : ''}
          </div>

          <div class="size-selector">
            <label>Tamanho:</label>
            <div class="size-options">
              ${product.sizes.map(s => `
                <button class="size-option ${s.stock === 0 ? 'disabled' : ''} ${selectedSize === s.name ? 'selected' : ''}"
                        data-size="${sanitize(s.name)}" ${s.stock === 0 ? 'disabled' : ''}>
                  ${sanitize(s.name)}
                </button>
              `).join('')}
            </div>
            ${selectedSize
              ? `<span class="stock-info ${sizeStock <= 3 ? 'low' : ''}">${sizeStock} unidade${sizeStock !== 1 ? 's' : ''} em estoque</span>`
              : '<span class="stock-info">Selecione um tamanho</span>'
            }
          </div>

          <div class="quantity-selector">
            <label>Quantidade:</label>
            <div class="qty-controls">
              <button class="qty-minus">−</button>
              <span>${quantity}</span>
              <button class="qty-plus">+</button>
            </div>
          </div>

          <button class="btn-add-cart" ${!selectedSize ? 'disabled' : ''}>
            🛒 Adicionar ao Carrinho
          </button>
        </div>
      `;

      // Size buttons
      modalContent.querySelectorAll('.size-option:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedSize = btn.dataset.size;
          quantity = 1;
          renderModal();
        });
      });

      // Quantity
      const minusBtn = modalContent.querySelector('.qty-minus');
      const plusBtn = modalContent.querySelector('.qty-plus');

      minusBtn.addEventListener('click', () => {
        if (quantity > 1) {
          quantity--;
          renderModal();
        }
      });

      plusBtn.addEventListener('click', () => {
        if (selectedSize && quantity < sizeStock) {
          quantity++;
          renderModal();
        }
      });

      // Add to cart
      const addBtn = modalContent.querySelector('.btn-add-cart');
      addBtn.addEventListener('click', () => {
        if (!selectedSize) return;

        const currentInCart = Store.getCart().find(
          i => i.productId === productId && i.size === selectedSize
        );
        const currentQtyInCart = currentInCart ? currentInCart.quantity : 0;

        if (currentQtyInCart + quantity > sizeStock) {
          showToast('Estoque insuficiente!', 'error');
          return;
        }

        Store.addToCart(productId, selectedSize, quantity);
        showToast(`${product.name} (Tam. ${selectedSize}) adicionado ao carrinho!`);
        updateCartCount();
        closeProductModal();
        openCart();
      });
    }

    renderModal();
    productModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    productModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeProductModal);
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) closeProductModal();
  });

  // ===== CART =====
  function openCart() {
    renderCart();
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCartPanel() {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateCartCount() {
    const count = Store.getCartCount();
    if (cartCount) {
      cartCount.textContent = count;
      cartCount.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  function renderCart() {
    const cart = Store.getCart();
    const products = Store.getProducts();

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <div class="empty-icon">🛒</div>
          <p>Seu carrinho está vazio</p>
        </div>
      `;
      cartTotal.textContent = 'R$ 0,00';
      return;
    }

    cartItems.innerHTML = cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return '';

      return `
        <div class="cart-item">
          <div class="cart-item-image">
            ${product.image
              ? `<img src="${sanitize(product.image)}" alt="${sanitize(product.name)}">`
              : `<div class="placeholder-img" style="font-size:1.5rem;">👕</div>`
            }
          </div>
          <div class="cart-item-details">
            <div class="cart-item-name">${sanitize(product.name)}</div>
            <div class="cart-item-size">Tam: ${sanitize(item.size)}</div>
            <div class="cart-item-price">${formatPrice(product.price * item.quantity)}</div>
            <div class="cart-item-qty">
              <button data-action="minus" data-product="${sanitize(product.id)}" data-size="${sanitize(item.size)}">−</button>
              <span>${item.quantity}</span>
              <button data-action="plus" data-product="${sanitize(product.id)}" data-size="${sanitize(item.size)}">+</button>
            </div>
          </div>
          <button class="cart-item-remove" data-product="${sanitize(product.id)}" data-size="${sanitize(item.size)}" title="Remover">✕</button>
        </div>
      `;
    }).join('');

    cartTotal.textContent = formatPrice(Store.getCartTotal());

    // Qty buttons
    cartItems.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.dataset.product;
        const size = btn.dataset.size;
        const cartItem = Store.getCart().find(i => i.productId === productId && i.size === size);
        if (!cartItem) return;

        if (btn.dataset.action === 'minus') {
          if (cartItem.quantity <= 1) {
            Store.removeFromCart(productId, size);
          } else {
            Store.updateCartItemQty(productId, size, cartItem.quantity - 1);
          }
        } else {
          const stock = Store.checkStock(productId, size);
          if (cartItem.quantity < stock) {
            Store.updateCartItemQty(productId, size, cartItem.quantity + 1);
          } else {
            showToast('Estoque máximo atingido!', 'error');
          }
        }
        renderCart();
        updateCartCount();
      });
    });

    // Remove buttons
    cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        Store.removeFromCart(btn.dataset.product, btn.dataset.size);
        renderCart();
        updateCartCount();
        showToast('Item removido do carrinho');
      });
    });
  }

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (closeCart) closeCart.addEventListener('click', closeCartPanel);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartPanel);

  const continueShoppingBtn = document.getElementById('continueShoppingBtn');
  if (continueShoppingBtn) continueShoppingBtn.addEventListener('click', closeCartPanel);

  // ===== CHECKOUT =====
  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutClose = document.getElementById('checkoutClose');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutSummary = document.getElementById('checkoutSummary');

  function openCheckout() {
    const cart = Store.getCart();
    if (cart.length === 0) {
      showToast('Seu carrinho está vazio!', 'error');
      return;
    }

    // Auto-fill if logged in
    const user = Store.getLoggedUser();
    if (user) {
      document.getElementById('clientName').value = user.name || '';
      document.getElementById('clientLastName').value = user.lastName || '';
      document.getElementById('clientAddress').value = user.address || '';
      document.getElementById('clientNumber').value = user.number || '';
      document.getElementById('clientBairro').value = user.bairro || '';
      document.getElementById('clientCity').value = user.city || '';
      document.getElementById('clientState').value = user.state || '';
      document.getElementById('clientCep').value = user.cep || '';
      document.getElementById('clientPhone').value = user.phone || '';
      document.getElementById('clientEmail').value = user.email || '';
      document.getElementById('clientReference').value = user.reference || '';
      // Calc shipping if address available
      if (user.cep || (user.city && user.state)) {
        updateShipping(user.cep || '', user.city, user.state);
      }
    } else {
      currentShipping = null;
      shippingOptions = [];
      document.getElementById('shippingResult').style.display = 'none';
    }

    // Render summary
    const products = Store.getProducts();
    let summaryHTML = '<h4>Resumo do Pedido</h4>';

    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        summaryHTML += `
          <div class="checkout-summary-item">
            <span>${sanitize(product.name)} (${sanitize(item.size)}) x${item.quantity}</span>
            <span>${formatPrice(product.price * item.quantity)}</span>
          </div>
        `;
      }
    });

    summaryHTML += `
      <div class="checkout-summary-total">
        <span>Subtotal</span>
        <span>${formatPrice(Store.getCartTotal())}</span>
      </div>
    `;

    if (currentShipping) {
      summaryHTML += `
        <div class="checkout-summary-item shipping-line">
          <span>🚚 ${sanitize(currentShipping.label)}</span>
          <span>${formatPrice(currentShipping.value)}</span>
        </div>
        <div class="checkout-summary-total grand-total">
          <span>Total com Frete</span>
          <span>${formatPrice(Store.getCartTotal() + currentShipping.value)}</span>
        </div>
      `;
    }

    checkoutSummary.innerHTML = summaryHTML;

    // Close cart sidebar and open checkout modal
    closeCartPanel();
    checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckout() {
    checkoutModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  checkoutBtn.addEventListener('click', openCheckout);
  checkoutClose.addEventListener('click', closeCheckout);
  checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) closeCheckout();
  });

  // ===== SHIPPING STATE =====
  let currentShipping = null;
  let shippingOptions = [];

  async function updateShipping(cep, city, state) {
    const shippingResult = document.getElementById('shippingResult');
    const shippingLoading = document.getElementById('shippingLoading');
    const shippingOptionsEl = document.getElementById('shippingOptions');

    // Entrega local (Estância)
    if (city && city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() === 'estancia') {
      shippingOptions = [{ code: 'LOCAL', name: 'Entrega Local', value: 5.00, days: 1, label: 'Entrega local (Estância) - 1 dia' }];
      currentShipping = shippingOptions[0];
      renderShippingOptions();
      refreshSummary();
      return;
    }

    // Mostrar loading
    shippingResult.style.display = 'none';
    shippingLoading.style.display = '';
    currentShipping = null;
    shippingOptions = [];

    // Tentar API dos Correios
    const cleanCep = cep ? cep.replace(/\D/g, '') : '';
    let results = null;
    if (cleanCep.length === 8) {
      results = await Store.calcShippingAPI(cleanCep);
    }

    // Fallback para tabela local
    if (!results && city && state) {
      results = Store.calcShippingLocal(city, state);
    }

    shippingLoading.style.display = 'none';

    if (results && results.length > 0) {
      shippingOptions = results;
      currentShipping = results[0]; // Seleciona o mais barato por padrão
      renderShippingOptions();
    } else {
      shippingResult.style.display = 'none';
    }

    refreshSummary();
  }

  function renderShippingOptions() {
    const shippingResult = document.getElementById('shippingResult');
    const shippingOptionsEl = document.getElementById('shippingOptions');

    shippingOptionsEl.innerHTML = shippingOptions.map((opt, i) => `
      <label class="shipping-option ${currentShipping && currentShipping.code === opt.code ? 'selected' : ''}">
        <input type="radio" name="shippingChoice" value="${i}" ${currentShipping && currentShipping.code === opt.code ? 'checked' : ''}>
        <div class="shipping-option-info">
          <span class="shipping-option-name">${sanitize(opt.name)}</span>
          <span class="shipping-option-days">${opt.days ? opt.days + ' dia' + (opt.days > 1 ? 's' : '') + ' útei' + (opt.days > 1 ? 's' : 'l') : 'Prazo estimado'}</span>
        </div>
        <span class="shipping-option-price">${formatPrice(opt.value)}</span>
      </label>
    `).join('');

    // Radio change handler
    shippingOptionsEl.querySelectorAll('input[name="shippingChoice"]').forEach(radio => {
      radio.addEventListener('change', () => {
        currentShipping = shippingOptions[parseInt(radio.value)];
        // Update selected class
        shippingOptionsEl.querySelectorAll('.shipping-option').forEach(el => el.classList.remove('selected'));
        radio.closest('.shipping-option').classList.add('selected');
        refreshSummary();
      });
    });

    shippingResult.style.display = '';
  }

  function refreshSummary() {
    const cart = Store.getCart();
    const products = Store.getProducts();
    let summaryHTML = '<h4>Resumo do Pedido</h4>';
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        summaryHTML += `<div class="checkout-summary-item"><span>${sanitize(product.name)} (${sanitize(item.size)}) x${item.quantity}</span><span>${formatPrice(product.price * item.quantity)}</span></div>`;
      }
    });
    summaryHTML += `<div class="checkout-summary-total"><span>Subtotal</span><span>${formatPrice(Store.getCartTotal())}</span></div>`;
    if (currentShipping) {
      summaryHTML += `<div class="checkout-summary-item shipping-line"><span>🚚 ${sanitize(currentShipping.label)}</span><span>${formatPrice(currentShipping.value)}</span></div>`;
      summaryHTML += `<div class="checkout-summary-total grand-total"><span>Total com Frete</span><span>${formatPrice(Store.getCartTotal() + currentShipping.value)}</span></div>`;
    }
    checkoutSummary.innerHTML = summaryHTML;
  }

  // CEP mask + ViaCEP + shipping calc
  document.getElementById('clientCep').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
    this.value = v;

    if (v.replace('-', '').length === 8) {
      const statusEl = document.getElementById('clientCepStatus');
      statusEl.textContent = 'Buscando...';
      statusEl.style.color = 'var(--text-light)';

      fetch(`https://viacep.com.br/ws/${v.replace('-', '')}/json/`)
        .then(r => r.json())
        .then(data => {
          if (data.erro) {
            statusEl.textContent = 'CEP não encontrado';
            statusEl.style.color = 'var(--danger)';
            return;
          }
          statusEl.textContent = '✓ CEP encontrado';
          statusEl.style.color = 'var(--success)';

          document.getElementById('clientAddress').value = data.logradouro || '';
          document.getElementById('clientBairro').value = data.bairro || '';
          document.getElementById('clientCity').value = data.localidade || '';
          document.getElementById('clientState').value = data.uf || '';
          document.getElementById('clientNumber').focus();

          // Calculate shipping
          updateShipping(v, data.localidade, data.uf);
        })
        .catch(() => {
          statusEl.textContent = 'Erro ao buscar CEP';
          statusEl.style.color = 'var(--danger)';
        });
    }
  });

  // Also recalc shipping when city/state change manually
  document.getElementById('clientCity').addEventListener('change', function () {
    const cep = document.getElementById('clientCep').value;
    updateShipping(cep, this.value, document.getElementById('clientState').value);
  });
  document.getElementById('clientState').addEventListener('change', function () {
    const cep = document.getElementById('clientCep').value;
    updateShipping(cep, document.getElementById('clientCity').value, this.value);
  });

  // Phone mask
  document.getElementById('clientPhone').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) {
      v = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
    } else if (v.length > 2) {
      v = '(' + v.slice(0, 2) + ') ' + v.slice(2);
    } else if (v.length > 0) {
      v = '(' + v;
    }
    this.value = v;
  });

  // Submit checkout form → WhatsApp
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const clientName = document.getElementById('clientName').value.trim();
    const clientLastName = document.getElementById('clientLastName').value.trim();
    const clientAddress = document.getElementById('clientAddress').value.trim();
    const clientNumber = document.getElementById('clientNumber').value.trim();
    const clientBairro = document.getElementById('clientBairro').value.trim();
    const clientCity = document.getElementById('clientCity').value.trim();
    const clientState = document.getElementById('clientState').value;
    const clientCep = document.getElementById('clientCep').value.trim();
    const clientPhone = document.getElementById('clientPhone').value.trim();
    const clientEmail = document.getElementById('clientEmail').value.trim();
    const clientReference = document.getElementById('clientReference').value.trim();

    const cart = Store.getCart();
    const products = Store.getProducts();
    const shippingFee = currentShipping ? currentShipping.value : 0;
    const subtotal = Store.getCartTotal();
    const totalWithShipping = subtotal + shippingFee;

    let message = '🛍️ *Pedido - Coloré Moda Kids*\n\n';
    message += '👤 *Dados do Cliente*\n';
    message += `Nome: ${clientName} ${clientLastName}\n`;
    message += `Endereço: ${clientAddress}, Nº ${clientNumber}\n`;
    message += `Bairro: ${clientBairro}\n`;
    message += `Cidade: ${clientCity} - ${clientState}\n`;
    message += `CEP: ${clientCep}\n`;
    message += `Ref: ${clientReference}\n`;
    message += `Telefone: ${clientPhone}\n`;
    if (clientEmail) message += `E-mail: ${clientEmail}\n`;
    message += '\n📦 *Itens do Pedido*\n\n';

    cart.forEach((item, index) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        message += `${index + 1}. *${product.name}*\n`;
        message += `   Tamanho: ${item.size}\n`;
        message += `   Quantidade: ${item.quantity}\n`;
        message += `   Valor: ${formatPrice(product.price * item.quantity)}\n\n`;
      }
    });

    message += `\n💰 *Subtotal: ${formatPrice(subtotal)}*\n`;
    if (currentShipping) {
      message += `🚚 *Frete (${currentShipping.label}): ${formatPrice(shippingFee)}*\n`;
    }
    message += `💵 *Total: ${formatPrice(totalWithShipping)}*\n\n`;
    message += 'Por favor, confirme a disponibilidade e forma de pagamento. Obrigado! 😊';

    const phoneNumber = '5579996294751';
    const whatsappUrl = `https://wa.me/${encodeURIComponent(phoneNumber)}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Save order
    const user = Store.getLoggedUser();
    const orderItems = cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        name: product ? product.name : 'Produto',
        size: item.size,
        quantity: item.quantity,
        price: product ? product.price : 0
      };
    });

    Store.createOrder({
      userId: user ? user.id : null,
      customer: {
        name: clientName + ' ' + clientLastName,
        address: clientAddress + ', Nº ' + clientNumber,
        bairro: clientBairro,
        city: clientCity,
        state: clientState,
        cep: clientCep,
        reference: clientReference,
        phone: clientPhone,
        email: clientEmail
      },
      items: orderItems,
      shipping: currentShipping ? { label: currentShipping.label, value: currentShipping.value } : null,
      total: totalWithShipping
    });

    // Decrement stock
    cart.forEach(item => {
      Store.decrementStock(item.productId, item.size, item.quantity);
    });

    // Clear form and cart
    Store.clearCart();
    checkoutForm.reset();
    closeCheckout();
    renderProducts();
    updateCartCount();
    renderCartItems();

    if (user) {
      showToast('Pedido enviado! Acompanhe em Minha Conta 📦');
    } else {
      showToast('Pedido enviado pelo WhatsApp! Crie uma conta para acompanhar seus pedidos 😊');
    }
  });

  // ===== SEARCH =====
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      renderProducts();
    }, 300);
  });

  // ===== KEYBOARD =====
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProductModal();
      closeCartPanel();
      closeCheckout();
    }
  });

  // ===== INIT =====
  renderCategories();
  renderProducts();
  updateCartCount();

  // Update account button
  const user = Store.getLoggedUser();
  const accountLabel = document.getElementById('accountLabel');
  if (user && accountLabel) {
    accountLabel.textContent = user.name;
  }
});
