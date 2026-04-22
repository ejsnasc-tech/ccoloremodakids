// ===== DATA STORE (localStorage) =====

const Store = {
  PRODUCTS_KEY: 'ccolore_products',
  CART_KEY: 'ccolore_cart',
  ADMIN_PASSWORD: 'Samandra1709',

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

  // Cidades de SE com entrega próxima (saindo de Estância)
  SE_CITIES: {
    'estancia':       { value: 5.00,  days: 1,  label: 'Entrega local (Estância) - até 1 dia' },
    'itabaiana':      { value: 15.00, days: 2,  label: 'Entrega - Itabaiana/SE (2 dias úteis)' },
    'aracaju':        { value: 18.00, days: 2,  label: 'Entrega - Aracaju/SE (2 dias úteis)' },
    'lagarto':        { value: 15.00, days: 2,  label: 'Entrega - Lagarto/SE (2 dias úteis)' },
    'simao dias':     { value: 18.00, days: 2,  label: 'Entrega - Simão Dias/SE (2 dias úteis)' },
    'tobias barreto': { value: 20.00, days: 2,  label: 'Entrega - Tobias Barreto/SE (2 dias úteis)' },
    'sao cristovao':  { value: 18.00, days: 2,  label: 'Entrega - São Cristóvão/SE (2 dias úteis)' },
    'umbauba':        { value: 12.00, days: 1,  label: 'Entrega - Umbaúba/SE (1 dia útil)' },
    'cristinapolis':  { value: 12.00, days: 1,  label: 'Entrega - Cristinápolis/SE (1 dia útil)' },
    'indiaroba':      { value: 10.00, days: 1,  label: 'Entrega - Indiaroba/SE (1 dia útil)' },
    'santa luzia do itanhy': { value: 10.00, days: 1, label: 'Entrega - Santa Luzia do Itanhy/SE (1 dia)' },
  },

  // Tabela por estado (PAC estimado — prazo aproximado em dias úteis)
  SHIPPING_TABLE: {
    'SE': { pac: 12.00, sedex: 22.00, days_pac: 3,  days_sedex: 1  },
    'BA': { pac: 18.00, sedex: 32.00, days_pac: 5,  days_sedex: 2  },
    'AL': { pac: 18.00, sedex: 32.00, days_pac: 5,  days_sedex: 2  },
    'PE': { pac: 22.00, sedex: 38.00, days_pac: 6,  days_sedex: 2  },
    'PB': { pac: 25.00, sedex: 42.00, days_pac: 7,  days_sedex: 3  },
    'RN': { pac: 25.00, sedex: 42.00, days_pac: 7,  days_sedex: 3  },
    'CE': { pac: 28.00, sedex: 46.00, days_pac: 8,  days_sedex: 3  },
    'PI': { pac: 28.00, sedex: 46.00, days_pac: 8,  days_sedex: 3  },
    'MA': { pac: 30.00, sedex: 50.00, days_pac: 9,  days_sedex: 4  },
    'MG': { pac: 30.00, sedex: 50.00, days_pac: 8,  days_sedex: 3  },
    'ES': { pac: 28.00, sedex: 46.00, days_pac: 7,  days_sedex: 3  },
    'RJ': { pac: 32.00, sedex: 54.00, days_pac: 8,  days_sedex: 3  },
    'SP': { pac: 32.00, sedex: 54.00, days_pac: 8,  days_sedex: 3  },
    'GO': { pac: 30.00, sedex: 50.00, days_pac: 9,  days_sedex: 4  },
    'DF': { pac: 30.00, sedex: 50.00, days_pac: 9,  days_sedex: 4  },
    'MT': { pac: 35.00, sedex: 58.00, days_pac: 11, days_sedex: 5  },
    'MS': { pac: 35.00, sedex: 58.00, days_pac: 10, days_sedex: 4  },
    'TO': { pac: 30.00, sedex: 50.00, days_pac: 10, days_sedex: 4  },
    'PA': { pac: 35.00, sedex: 58.00, days_pac: 12, days_sedex: 5  },
    'AP': { pac: 38.00, sedex: 62.00, days_pac: 14, days_sedex: 6  },
    'AM': { pac: 42.00, sedex: 68.00, days_pac: 14, days_sedex: 6  },
    'RR': { pac: 42.00, sedex: 68.00, days_pac: 15, days_sedex: 7  },
    'AC': { pac: 45.00, sedex: 72.00, days_pac: 16, days_sedex: 7  },
    'RO': { pac: 40.00, sedex: 65.00, days_pac: 14, days_sedex: 6  },
    'PR': { pac: 32.00, sedex: 54.00, days_pac: 9,  days_sedex: 4  },
    'SC': { pac: 35.00, sedex: 58.00, days_pac: 10, days_sedex: 4  },
    'RS': { pac: 38.00, sedex: 62.00, days_pac: 11, days_sedex: 5  },
  },

  // API dos Correios removida (desativada em 2023) — cálculo via tabela local
  calcShippingAPI() { return null; },

  // Cálculo local por cidade/estado
  calcShippingLocal(city, state) {
    if (!city && !state) return null;

    const normalize = str => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // Verifica cidade específica de SE primeiro
    if (city) {
      const cityKey = normalize(city);
      const cityData = this.SE_CITIES[cityKey];
      if (cityData) {
        return [{ code: 'LOCAL', name: 'Entrega', value: cityData.value, days: cityData.days, label: cityData.label }];
      }
    }

    // Por estado
    const uf = state ? state.toUpperCase().trim() : '';
    const stateData = this.SHIPPING_TABLE[uf];
    if (stateData) {
      return [
        {
          code: 'PAC',
          name: 'PAC',
          value: stateData.pac,
          days: stateData.days_pac,
          label: `PAC - até ${stateData.days_pac} dias úteis`
        },
        {
          code: 'SEDEX',
          name: 'SEDEX',
          value: stateData.sedex,
          days: stateData.days_sedex,
          label: `SEDEX - até ${stateData.days_sedex} dia${stateData.days_sedex > 1 ? 's' : ''} útil`
        }
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
