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
        <span>Subtotal dos produtos</span>
        <span>${formatPrice(Store.getCartTotal())}</span>
      </div>
      <div class="checkout-summary-shipping-notice">
        🚚 Frete calculado após confirmação via WhatsApp
      </div>
    `;

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

  // ===== SHIPPING STATE (removido) =====
  let currentShipping = null;
  let shippingOptions = [];

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
    summaryHTML += `<div class="checkout-summary-total"><span>Subtotal dos produtos</span><span>${formatPrice(Store.getCartTotal())}</span></div>`;
    summaryHTML += `<div class="checkout-summary-shipping-notice">🚚 Frete calculado após confirmação via WhatsApp</div>`;
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
        })
        .catch(() => {
          statusEl.textContent = 'Erro ao buscar CEP';
          statusEl.style.color = 'var(--danger)';
        });
    }
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
    const subtotal = Store.getCartTotal();

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

    message += `\n💰 *Subtotal dos produtos: ${formatPrice(subtotal)}*\n`;
    message += `🚚 *Frete: a calcular (você nos informa o valor)*\n`;
    message += `\nPor favor, confirme a disponibilidade e informe o valor do frete. Obrigado! 😊`;

    const phoneNumber = '5579996294751';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.location.href = whatsappUrl;

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
      shipping: null,
      total: subtotal
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
    renderCart();

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
