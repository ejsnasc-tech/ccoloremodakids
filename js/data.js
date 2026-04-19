// ===== DATA STORE (localStorage) =====

const Store = {
  PRODUCTS_KEY: 'ccolore_products',
  CART_KEY: 'ccolore_cart',
  ADMIN_PASSWORD: 'ccolore2024',

  // --- Products ---
  getProducts() {
    const data = localStorage.getItem(this.PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveProducts(products) {
    localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
  },

  addProduct(product) {
    const products = this.getProducts();
    product.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    product.createdAt = new Date().toISOString();
    products.push(product);
    this.saveProducts(products);
    return product;
  },

  updateProduct(id, updates) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      this.saveProducts(products);
      return products[index];
    }
    return null;
  },

  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(products);
    // Remove from any carts
    this.removeFromCartByProductId(id);
  },

  getProductById(id) {
    return this.getProducts().find(p => p.id === id) || null;
  },

  getCategories() {
    const products = this.getProducts();
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['Todos', ...Array.from(cats)];
  },

  // --- Cart ---
  getCart() {
    const data = localStorage.getItem(this.CART_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveCart(cart) {
    localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
  },

  addToCart(productId, size, quantity = 1) {
    const cart = this.getCart();
    const existing = cart.find(item => item.productId === productId && item.size === size);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId, size, quantity });
    }

    this.saveCart(cart);
    return cart;
  },

  updateCartItemQty(productId, size, quantity) {
    const cart = this.getCart();
    const item = cart.find(i => i.productId === productId && i.size === size);
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.saveCart(cart);
    }
    return this.getCart();
  },

  removeFromCart(productId, size) {
    const cart = this.getCart().filter(i => !(i.productId === productId && i.size === size));
    this.saveCart(cart);
    return cart;
  },

  removeFromCartByProductId(productId) {
    const cart = this.getCart().filter(i => i.productId !== productId);
    this.saveCart(cart);
  },

  clearCart() {
    this.saveCart([]);
  },

  getCartTotal() {
    const cart = this.getCart();
    const products = this.getProducts();
    let total = 0;
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        total += product.price * item.quantity;
      }
    });
    return total;
  },

  getCartCount() {
    return this.getCart().reduce((sum, item) => sum + item.quantity, 0);
  },

  // --- Stock ---
  checkStock(productId, size) {
    const product = this.getProductById(productId);
    if (!product) return 0;
    const sizeInfo = product.sizes.find(s => s.name === size);
    return sizeInfo ? sizeInfo.stock : 0;
  },

  decrementStock(productId, size, qty = 1) {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      const sizeInfo = product.sizes.find(s => s.name === size);
      if (sizeInfo) {
        sizeInfo.stock = Math.max(0, sizeInfo.stock - qty);
        this.saveProducts(products);
      }
    }
  },

  // --- Seed demo data ---
  seedDemoData() {
    if (this.getProducts().length > 0) return;

    const demoProducts = [
      {
        name: 'Vestido Floral Primavera',
        category: 'Vestidos',
        description: 'Lindo vestido floral para sua princesa. Tecido leve e confortável.',
        price: 89.90,
        oldPrice: 119.90,
        image: '',
        badge: 'Promoção',
        sizes: [
          { name: '2', stock: 5 },
          { name: '4', stock: 3 },
          { name: '6', stock: 7 },
          { name: '8', stock: 0 },
        ]
      },
      {
        name: 'Conjunto Moletom Ursinhos',
        category: 'Conjuntos',
        description: 'Conjunto quentinho de moletom com estampa de ursinhos.',
        price: 129.90,
        oldPrice: null,
        image: '',
        badge: 'Novo',
        sizes: [
          { name: '1', stock: 4 },
          { name: '2', stock: 6 },
          { name: '3', stock: 2 },
          { name: '4', stock: 8 },
        ]
      },
      {
        name: 'Camiseta Dinossauro',
        category: 'Camisetas',
        description: 'Camiseta divertida com estampa de dinossauro. 100% algodão.',
        price: 49.90,
        oldPrice: null,
        image: '',
        badge: '',
        sizes: [
          { name: '2', stock: 10 },
          { name: '4', stock: 8 },
          { name: '6', stock: 5 },
          { name: '8', stock: 3 },
          { name: '10', stock: 2 },
        ]
      },
      {
        name: 'Shorts Jeans Estrelas',
        category: 'Shorts',
        description: 'Shorts jeans com detalhes de estrelas bordadas.',
        price: 69.90,
        oldPrice: 89.90,
        image: '',
        badge: 'Promoção',
        sizes: [
          { name: '4', stock: 3 },
          { name: '6', stock: 5 },
          { name: '8', stock: 4 },
          { name: '10', stock: 0 },
        ]
      },
      {
        name: 'Jaqueta Corta Vento Rosa',
        category: 'Jaquetas',
        description: 'Jaqueta leve corta vento na cor rosa. Ideal para meia estação.',
        price: 159.90,
        oldPrice: null,
        image: '',
        badge: 'Novo',
        sizes: [
          { name: '4', stock: 2 },
          { name: '6', stock: 4 },
          { name: '8', stock: 3 },
          { name: '10', stock: 1 },
        ]
      },
      {
        name: 'Macacão Jeans Baby',
        category: 'Macacões',
        description: 'Macacão jeans super fofo para bebês.',
        price: 99.90,
        oldPrice: null,
        image: '',
        badge: '',
        sizes: [
          { name: 'P', stock: 6 },
          { name: 'M', stock: 4 },
          { name: 'G', stock: 3 },
        ]
      },
      {
        name: 'Vestido Festa Laço',
        category: 'Vestidos',
        description: 'Vestido de festa com laço nas costas. Perfeito para ocasiões especiais.',
        price: 149.90,
        oldPrice: 189.90,
        image: '',
        badge: 'Promoção',
        sizes: [
          { name: '2', stock: 2 },
          { name: '4', stock: 3 },
          { name: '6', stock: 1 },
          { name: '8', stock: 4 },
        ]
      },
      {
        name: 'Pijama Nuvens',
        category: 'Pijamas',
        description: 'Pijama quentinho com estampa de nuvens. Super macio!',
        price: 79.90,
        oldPrice: null,
        image: '',
        badge: '',
        sizes: [
          { name: '2', stock: 7 },
          { name: '4', stock: 5 },
          { name: '6', stock: 3 },
          { name: '8', stock: 6 },
        ]
      },
    ];

    demoProducts.forEach(p => this.addProduct(p));
  },

  // --- Accounts ---
  ACCOUNTS_KEY: 'ccolore_accounts',
  LOGGED_USER_KEY: 'ccolore_logged_user',
  ORDERS_KEY: 'ccolore_orders',

  getAccounts() {
    const data = localStorage.getItem(this.ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveAccounts(accounts) {
    localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
  },

  createAccount(accountData) {
    const accounts = this.getAccounts();
    // Check duplicate email
    if (accounts.find(a => a.email.toLowerCase() === accountData.email.toLowerCase())) {
      return { error: 'E-mail já cadastrado!' };
    }
    const account = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: accountData.name,
      lastName: accountData.lastName,
      email: accountData.email,
      phone: accountData.phone,
      address: accountData.address || '',
      number: accountData.number || '',
      bairro: accountData.bairro || '',
      city: accountData.city || '',
      state: accountData.state || '',
      cep: accountData.cep || '',
      reference: accountData.reference || '',
      password: accountData.password,
      createdAt: new Date().toISOString()
    };
    accounts.push(account);
    this.saveAccounts(accounts);
    return { success: true, account };
  },

  login(email, password) {
    const accounts = this.getAccounts();
    const account = accounts.find(
      a => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );
    if (account) {
      const safeAccount = { ...account };
      delete safeAccount.password;
      sessionStorage.setItem(this.LOGGED_USER_KEY, JSON.stringify(safeAccount));
      return { success: true, account: safeAccount };
    }
    return { error: 'E-mail ou senha incorretos!' };
  },

  logout() {
    sessionStorage.removeItem(this.LOGGED_USER_KEY);
  },

  getLoggedUser() {
    const data = sessionStorage.getItem(this.LOGGED_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  updateAccount(id, updates) {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(a => a.id === id);
    if (index !== -1) {
      // Don't allow changing password through this method
      const { password, ...safeUpdates } = updates;
      accounts[index] = { ...accounts[index], ...safeUpdates };
      this.saveAccounts(accounts);
      // Update session
      const safeAccount = { ...accounts[index] };
      delete safeAccount.password;
      sessionStorage.setItem(this.LOGGED_USER_KEY, JSON.stringify(safeAccount));
      return safeAccount;
    }
    return null;
  },

  // --- Orders ---
  getOrders() {
    const data = localStorage.getItem(this.ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveOrders(orders) {
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
  },

  createOrder(orderData) {
    const orders = this.getOrders();
    const order = {
      id: 'PED-' + Date.now().toString(36).toUpperCase(),
      userId: orderData.userId || null,
      customer: orderData.customer,
      items: orderData.items,
      total: orderData.total,
      status: 'pendente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    orders.push(order);
    this.saveOrders(orders);
    return order;
  },

  getOrdersByUser(userId) {
    return this.getOrders().filter(o => o.userId === userId).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  },

  updateOrderStatus(orderId, status) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      this.saveOrders(orders);
      return order;
    }
    return null;
  },

  getOrderById(orderId) {
    return this.getOrders().find(o => o.id === orderId) || null;
  },

  // --- Shipping / Frete ---
  ORIGIN_CEP: '49200000', // Estância/SE
  ORIGIN_CITY: 'estância',
  LOCAL_SHIPPING: 5.00,

  // Tabela fallback caso API dos Correios falhe
  SHIPPING_TABLE: {
    'SE': 12.00, 'BA': 18.00, 'AL': 18.00, 'PE': 22.00,
    'PB': 25.00, 'RN': 25.00, 'CE': 28.00, 'PI': 28.00,
    'MA': 30.00, 'MG': 30.00, 'ES': 28.00, 'RJ': 32.00,
    'SP': 32.00, 'GO': 30.00, 'DF': 30.00, 'MT': 35.00,
    'MS': 35.00, 'TO': 30.00, 'PA': 35.00, 'AP': 38.00,
    'AM': 42.00, 'RR': 42.00, 'AC': 45.00, 'RO': 40.00,
    'PR': 32.00, 'SC': 35.00, 'RS': 38.00
  },

  // Consulta API dos Correios (PAC e SEDEX) via proxy CORS
  async calcShippingAPI(cepDestino) {
    const cepDest = cepDestino.replace(/\D/g, '');
    if (cepDest.length !== 8) return null;

    // Peso estimado para roupas infantis (0.5kg por padrão)
    const params = new URLSearchParams({
      nCdEmpresa: '',
      sDsSenha: '',
      nCdServico: '04510,04014', // PAC + SEDEX
      sCepOrigem: this.ORIGIN_CEP,
      sCepDestino: cepDest,
      nVlPeso: '0.5',
      nCdFormato: '1',
      nVlComprimento: '25',
      nVlAltura: '10',
      nVlLargura: '20',
      nVlDiametro: '0',
      sCdMaoPropria: 'N',
      nVlValorDeclarado: '0',
      sCdAvisoRecebimento: 'N',
      StrRetorno: 'xml'
    });

    const correiosUrl = `http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx?${params}`;

    // Tenta múltiplos proxies CORS para confiabilidade
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(correiosUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(correiosUrl)}`
    ];

    for (const proxyUrl of proxies) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) continue;

        const xml = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        const servicos = doc.querySelectorAll('cServico');

        const results = [];
        servicos.forEach(servico => {
          const codigo = servico.querySelector('Codigo')?.textContent;
          const valor = servico.querySelector('Valor')?.textContent;
          const prazo = servico.querySelector('PrazoEntrega')?.textContent;
          const erro = servico.querySelector('Erro')?.textContent;

          if (valor && erro === '0') {
            const price = parseFloat(valor.replace('.', '').replace(',', '.'));
            const days = parseInt(prazo);
            const nome = codigo === '04510' ? 'PAC' : codigo === '04014' ? 'SEDEX' : 'Correios';
            results.push({
              code: codigo,
              name: nome,
              value: price,
              days: days,
              label: `${nome} (${days} dias úteis)`
            });
          }
        });

        if (results.length > 0) {
          return results.sort((a, b) => a.value - b.value); // Mais barato primeiro
        }
      } catch (e) {
        continue; // Tenta próximo proxy
      }
    }

    return null; // Fallback para tabela
  },

  // Cálculo local (fallback)
  calcShippingLocal(city, state) {
    if (!city || !state) return null;
    if (city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() ===
        this.ORIGIN_CITY.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) {
      return [{ code: 'LOCAL', name: 'Local', value: this.LOCAL_SHIPPING, days: 1, label: 'Entrega local (Estância) - 1 dia' }];
    }
    const uf = state.toUpperCase().trim();
    const rate = this.SHIPPING_TABLE[uf];
    if (rate !== undefined) {
      return [
        { code: 'PAC', name: 'PAC', value: rate, days: null, label: `PAC para ${uf} (estimativa)` },
        { code: 'SEDEX', name: 'SEDEX', value: rate * 1.8, days: null, label: `SEDEX para ${uf} (estimativa)` }
      ];
    }
    return null;
  }
};

// ===== UTILITY FUNCTIONS =====

function formatPrice(value) {
  return 'R$ ' + value.toFixed(2).replace('.', ',');
}

function showToast(message, type = 'success') {
  const container = document.querySelector('.toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
