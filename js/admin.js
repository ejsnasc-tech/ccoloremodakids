// ===== ADMIN - ADMIN.JS =====

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loginPage = document.getElementById('loginPage');
  const adminPanel = document.getElementById('adminPanel');
  const loginForm = document.getElementById('loginForm');
  const loginPassword = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');

  const productFormModal = document.getElementById('productFormModal');
  const productForm = document.getElementById('productForm');
  const formTitle = document.getElementById('formTitle');
  const addProductBtn = document.getElementById('addProductBtn');
  const cancelForm = document.getElementById('cancelForm');
  const sizeManager = document.getElementById('sizeManager');
  const addSizeBtn = document.getElementById('addSizeBtn');

  // Session check
  const SESSION_KEY = 'ccolore_admin_session';

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  }

  function login() {
    sessionStorage.setItem(SESSION_KEY, 'true');
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    loginPage.style.display = '';
    adminPanel.style.display = 'none';
  }

  // Show admin if already logged
  if (isLoggedIn()) {
    loginPage.style.display = 'none';
    adminPanel.style.display = 'flex';
    initAdmin();
  }

  // ===== LOGIN =====
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = loginPassword.value;

    if (password === Store.ADMIN_PASSWORD) {
      login();
      loginPage.style.display = 'none';
      adminPanel.style.display = 'flex';
      loginError.style.display = 'none';
      loginPassword.value = '';
      initAdmin();
    } else {
      loginError.style.display = 'block';
      loginPassword.value = '';
      loginPassword.focus();
    }
  });

  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });

  // ===== NAVIGATION =====
  document.querySelectorAll('.admin-nav a[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;

      // Update active
      document.querySelectorAll('.admin-nav a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Show section
      document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
      const target = document.getElementById(`section-${section}`);
      if (target) target.style.display = '';

      // Refresh data
      if (section === 'dashboard') renderDashboard();
      if (section === 'products') renderProductsTable();
      if (section === 'orders') renderAdminOrders();
    });
  });

  // ===== INIT =====
  function initAdmin() {
    Store.seedDemoData();
    renderDashboard();
    renderProductsTable();
  }

  // ===== DASHBOARD =====
  function renderDashboard() {
    const products = Store.getProducts();
    let totalSizes = 0;
    let totalStock = 0;
    let lowStockItems = [];

    products.forEach(product => {
      product.sizes.forEach(s => {
        totalSizes++;
        totalStock += s.stock;
        if (s.stock <= 3) {
          lowStockItems.push({
            productName: product.name,
            sizeName: s.name,
            stock: s.stock
          });
        }
      });
    });

    document.getElementById('statProducts').textContent = products.length;
    document.getElementById('statSizes').textContent = totalSizes;
    document.getElementById('statStock').textContent = totalStock;
    document.getElementById('statLowStock').textContent = lowStockItems.length;

    const lowStockTable = document.getElementById('lowStockTable');
    if (lowStockItems.length === 0) {
      lowStockTable.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-light);padding:2rem;">Nenhum produto com estoque baixo 🎉</td></tr>';
    } else {
      lowStockTable.innerHTML = lowStockItems.map(item => `
        <tr>
          <td>${sanitize(item.productName)}</td>
          <td>${sanitize(item.sizeName)}</td>
          <td style="color:${item.stock === 0 ? 'var(--danger)' : 'var(--accent)'};font-weight:700;">
            ${item.stock === 0 ? 'ESGOTADO' : item.stock}
          </td>
        </tr>
      `).join('');
    }
  }

  // ===== PRODUCTS TABLE =====
  function renderProductsTable() {
    const products = Store.getProducts();
    const tbody = document.getElementById('productsTable');

    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:2rem;">Nenhum produto cadastrado</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(product => {
      const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
      return `
        <tr>
          <td>
            ${product.image
              ? `<img src="${sanitize(product.image)}" alt="${sanitize(product.name)}" class="product-thumb">`
              : '<div class="product-thumb placeholder-img" style="display:flex;width:50px;height:50px;font-size:1.5rem;border-radius:8px;">👕</div>'
            }
          </td>
          <td><strong>${sanitize(product.name)}</strong></td>
          <td>${sanitize(product.category)}</td>
          <td>${formatPrice(product.price)}</td>
          <td>
            <span style="color:${totalStock === 0 ? 'var(--danger)' : totalStock <= 5 ? 'var(--accent)' : 'var(--success)'};font-weight:700;">
              ${totalStock}
            </span>
          </td>
          <td>
            <div class="actions">
              <button class="btn btn-sm btn-secondary edit-product-btn" data-id="${sanitize(product.id)}" title="Editar">✏️</button>
              <button class="btn btn-sm btn-danger delete-product-btn" data-id="${sanitize(product.id)}" title="Excluir">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Category suggestions
    const datalist = document.getElementById('categorySuggestions');
    const categories = Store.getCategories().filter(c => c !== 'Todos');
    datalist.innerHTML = categories.map(c => `<option value="${sanitize(c)}">`).join('');

    // Edit buttons
    tbody.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditForm(btn.dataset.id));
    });

    // Delete buttons
    tbody.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = Store.getProductById(btn.dataset.id);
        if (product && confirm(`Deseja excluir "${product.name}"?`)) {
          Store.deleteProduct(btn.dataset.id);
          renderProductsTable();
          renderDashboard();
          showToast('Produto excluído!');
        }
      });
    });
  }

  // ===== PRODUCT FORM =====
  addProductBtn.addEventListener('click', () => openAddForm());

  function openAddForm() {
    formTitle.textContent = 'Novo Produto';
    productForm.reset();
    document.getElementById('productId').value = '';

    // Reset size manager to one row
    sizeManager.innerHTML = createSizeRow(0);

    productFormModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function openEditForm(id) {
    const product = Store.getProductById(id);
    if (!product) return;

    formTitle.textContent = 'Editar Produto';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productBadge').value = product.badge || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productOldPrice').value = product.oldPrice || '';
    document.getElementById('productImage').value = product.image || '';

    // Sizes
    sizeManager.innerHTML = product.sizes.map((s, i) => createSizeRow(i, s.name, s.stock)).join('');

    productFormModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeForm() {
    productFormModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  cancelForm.addEventListener('click', closeForm);
  productFormModal.addEventListener('click', (e) => {
    if (e.target === productFormModal) closeForm();
  });

  // Size management
  function createSizeRow(index, name = '', stock = '') {
    return `
      <div class="size-row" data-index="${index}">
        <input type="text" placeholder="Tamanho (ex: P, M, 2, 4)" class="size-name" value="${sanitize(String(name))}" maxlength="10" required>
        <input type="number" placeholder="Estoque" class="size-stock" value="${stock}" min="0" required>
        <button type="button" class="remove-size" title="Remover">✕</button>
      </div>
    `;
  }

  addSizeBtn.addEventListener('click', () => {
    const rows = sizeManager.querySelectorAll('.size-row');
    const newIndex = rows.length;
    sizeManager.insertAdjacentHTML('beforeend', createSizeRow(newIndex));
  });

  sizeManager.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-size')) {
      const rows = sizeManager.querySelectorAll('.size-row');
      if (rows.length > 1) {
        e.target.closest('.size-row').remove();
      } else {
        showToast('Precisa ter pelo menos um tamanho!', 'error');
      }
    }
  });

  // Save product
  productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Collect sizes
    const sizeRows = sizeManager.querySelectorAll('.size-row');
    const sizes = [];

    for (const row of sizeRows) {
      const name = row.querySelector('.size-name').value.trim();
      const stock = parseInt(row.querySelector('.size-stock').value) || 0;
      if (!name) {
        showToast('Preencha todos os tamanhos!', 'error');
        return;
      }
      sizes.push({ name, stock });
    }

    if (sizes.length === 0) {
      showToast('Adicione pelo menos um tamanho!', 'error');
      return;
    }

    // Check for duplicate sizes
    const sizeNames = sizes.map(s => s.name.toUpperCase());
    if (new Set(sizeNames).size !== sizeNames.length) {
      showToast('Tamanhos duplicados encontrados!', 'error');
      return;
    }

    const productData = {
      name: document.getElementById('productName').value.trim(),
      category: document.getElementById('productCategory').value.trim(),
      badge: document.getElementById('productBadge').value,
      description: document.getElementById('productDescription').value.trim(),
      price: parseFloat(document.getElementById('productPrice').value),
      oldPrice: parseFloat(document.getElementById('productOldPrice').value) || null,
      image: document.getElementById('productImage').value.trim(),
      sizes
    };

    const id = document.getElementById('productId').value;

    if (id) {
      // Update
      Store.updateProduct(id, productData);
      showToast('Produto atualizado com sucesso!');
    } else {
      // Create
      Store.addProduct(productData);
      showToast('Produto cadastrado com sucesso!');
    }

    closeForm();
    renderProductsTable();
    renderDashboard();
  });

  // ===== KEYBOARD =====
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeForm();
    }
  });

  // ===== ORDERS MANAGEMENT =====
  let ordersFilterStatus = 'todos';

  // Filter buttons
  document.querySelectorAll('.order-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.order-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ordersFilterStatus = btn.dataset.status;
      renderAdminOrders();
    });
  });

  function renderAdminOrders() {
    const orders = Store.getOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const container = document.getElementById('adminOrdersList');

    const filtered = ordersFilterStatus === 'todos'
      ? orders
      : orders.filter(o => o.status === ordersFilterStatus);

    if (filtered.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-light);">Nenhum pedido encontrado</div>';
      return;
    }

    const statusOptions = ['pendente', 'confirmado', 'preparando', 'enviado', 'entregue', 'cancelado'];
    const statusMap = {
      'pendente': { label: 'Pendente', color: 'var(--yellow)', icon: '⏳' },
      'confirmado': { label: 'Confirmado', color: 'var(--teal)', icon: '✅' },
      'preparando': { label: 'Preparando', color: 'var(--lavender)', icon: '📦' },
      'enviado': { label: 'Enviado', color: 'var(--primary)', icon: '🚚' },
      'entregue': { label: 'Entregue', color: 'var(--success)', icon: '🎉' },
      'cancelado': { label: 'Cancelado', color: 'var(--coral)', icon: '❌' }
    };

    container.innerHTML = filtered.map(order => {
      const date = new Date(order.createdAt);
      const dateStr = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const st = statusMap[order.status] || statusMap['pendente'];

      return `
        <div class="admin-order-card">
          <div class="admin-order-header">
            <div>
              <strong>${sanitize(order.id)}</strong>
              <span class="order-date">${dateStr}</span>
            </div>
            <span class="order-status" style="background:${st.color};">${st.icon} ${st.label}</span>
          </div>
          <div class="admin-order-customer">
            <span>👤 ${sanitize(order.customer.name)}</span>
            <span>📱 ${sanitize(order.customer.phone)}</span>
            <span>📧 ${sanitize(order.customer.email || '-')}</span>
            <span>📍 ${sanitize(order.customer.address)} - CEP: ${sanitize(order.customer.cep)}</span>
          </div>
          <div class="admin-order-items">
            ${order.items.map(item => `
              <div class="order-item">
                <span>${sanitize(item.name)} (${sanitize(item.size)}) x${item.quantity}</span>
                <span>${formatPrice(item.price * item.quantity)}</span>
              </div>
            `).join('')}
          </div>
          <div class="admin-order-footer">
            <span class="order-total">Total: ${formatPrice(order.total)}</span>
            <div class="order-status-change">
              <label>Alterar status:</label>
              <select class="order-status-select" data-order-id="${sanitize(order.id)}">
                ${statusOptions.map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${statusMap[s].icon} ${statusMap[s].label}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Status change handlers
    container.querySelectorAll('.order-status-select').forEach(select => {
      select.addEventListener('change', () => {
        Store.updateOrderStatus(select.dataset.orderId, select.value);
        showToast('Status atualizado!');
        renderAdminOrders();
      });
    });
  }
});
