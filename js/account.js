// ===== ACCOUNT - ACCOUNT.JS =====

document.addEventListener('DOMContentLoaded', () => {
  const authSection = document.getElementById('authSection');
  const accountSection = document.getElementById('accountSection');
  const logoutBtn = document.getElementById('logoutBtn');

  // Tabs
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');

  // ===== CHECK IF LOGGED IN =====
  function checkAuth() {
    const user = Store.getLoggedUser();
    if (user) {
      authSection.style.display = 'none';
      accountSection.style.display = '';
      logoutBtn.style.display = '';
      renderAccountInfo(user);
      renderOrders();
    } else {
      authSection.style.display = '';
      accountSection.style.display = 'none';
      logoutBtn.style.display = 'none';
    }
  }

  // ===== TABS SWITCHING =====
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll(`.auth-tab[data-tab="${tab}"]`).forEach(t => t.classList.add('active'));

      if (tab === 'login') {
        loginTab.style.display = '';
        registerTab.style.display = 'none';
      } else {
        loginTab.style.display = 'none';
        registerTab.style.display = '';
      }
      loginError.textContent = '';
      registerError.textContent = '';
    });
  });

  // ===== LOGIN =====
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;

    const result = Store.login(email, password);
    if (result.error) {
      loginError.textContent = result.error;
    } else {
      loginForm.reset();
      loginError.textContent = '';
      showToast(`Bem-vindo(a), ${result.account.name}!`);
      checkAuth();
    }
  });

  // ===== REGISTER =====
  // Phone mask
  document.getElementById('regPhone').addEventListener('input', function () {
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

  // CEP mask + ViaCEP lookup (register)
  document.getElementById('regCep').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
    this.value = v;

    if (v.replace('-', '').length === 8) {
      buscarCep(v.replace('-', ''), 'reg');
    }
  });

  function buscarCep(cep, prefix) {
    const statusEl = document.getElementById(`${prefix}CepStatus`);
    statusEl.textContent = 'Buscando...';
    statusEl.style.color = 'var(--text-light)';

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(r => r.json())
      .then(data => {
        if (data.erro) {
          statusEl.textContent = 'CEP não encontrado';
          statusEl.style.color = 'var(--danger)';
          return;
        }
        statusEl.textContent = '✓ CEP encontrado';
        statusEl.style.color = 'var(--success)';

        document.getElementById(`${prefix}Address`).value = data.logradouro || '';
        document.getElementById(`${prefix}Bairro`).value = data.bairro || '';
        document.getElementById(`${prefix}City`).value = data.localidade || '';
        document.getElementById(`${prefix}State`).value = data.uf || '';

        // Focus on number field
        const numField = document.getElementById(`${prefix}Number`);
        if (numField) numField.focus();
      })
      .catch(() => {
        statusEl.textContent = 'Erro ao buscar CEP';
        statusEl.style.color = 'var(--danger)';
      });
  }

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const accountData = {
      name: document.getElementById('regName').value.trim(),
      lastName: document.getElementById('regLastName').value.trim(),
      email: document.getElementById('regEmail').value.trim(),
      phone: document.getElementById('regPhone').value.trim(),
      address: document.getElementById('regAddress').value.trim(),
      number: document.getElementById('regNumber').value.trim(),
      bairro: document.getElementById('regBairro').value.trim(),
      city: document.getElementById('regCity').value.trim(),
      state: document.getElementById('regState').value,
      cep: document.getElementById('regCep').value.trim(),
      reference: document.getElementById('regReference').value.trim(),
      password: document.getElementById('regPass').value
    };

    const result = Store.createAccount(accountData);
    if (result.error) {
      registerError.textContent = result.error;
    } else {
      // Auto-login after register
      Store.login(accountData.email, accountData.password);
      registerForm.reset();
      registerError.textContent = '';
      showToast('Conta criada com sucesso! 🎉');
      checkAuth();
    }
  });

  // ===== LOGOUT =====
  logoutBtn.addEventListener('click', () => {
    Store.logout();
    showToast('Você saiu da conta');
    checkAuth();
  });

  // ===== RENDER ACCOUNT INFO =====
  function renderAccountInfo(user) {
    const initials = (user.name[0] + (user.lastName ? user.lastName[0] : '')).toUpperCase();
    document.getElementById('avatarInitials').textContent = initials;
    document.getElementById('accountName').textContent = `${user.name} ${user.lastName}`;
    document.getElementById('accountEmail').textContent = user.email;

    // Profile form
    document.getElementById('profName').value = user.name;
    document.getElementById('profLastName').value = user.lastName;
    document.getElementById('profEmail').value = user.email;
    document.getElementById('profPhone').value = user.phone || '';
    document.getElementById('profAddress').value = user.address || '';
    document.getElementById('profNumber').value = user.number || '';
    document.getElementById('profBairro').value = user.bairro || '';
    document.getElementById('profCity').value = user.city || '';
    document.getElementById('profState').value = user.state || '';
    document.getElementById('profCep').value = user.cep || '';
    document.getElementById('profReference').value = user.reference || '';
  }

  // ===== ACCOUNT NAV =====
  document.querySelectorAll('.account-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.account-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.account-panel').forEach(p => p.style.display = 'none');
      const panel = document.getElementById(`panel-${btn.dataset.panel}`);
      if (panel) panel.style.display = '';

      if (btn.dataset.panel === 'orders') renderOrders();
    });
  });

  // ===== PROFILE UPDATE =====
  document.getElementById('profPhone').addEventListener('input', function () {
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

  document.getElementById('profCep').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
    this.value = v;

    if (v.replace('-', '').length === 8) {
      buscarCep(v.replace('-', ''), 'prof');
    }
  });

  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = Store.getLoggedUser();
    if (!user) return;

    const updates = {
      name: document.getElementById('profName').value.trim(),
      lastName: document.getElementById('profLastName').value.trim(),
      phone: document.getElementById('profPhone').value.trim(),
      address: document.getElementById('profAddress').value.trim(),
      number: document.getElementById('profNumber').value.trim(),
      bairro: document.getElementById('profBairro').value.trim(),
      city: document.getElementById('profCity').value.trim(),
      state: document.getElementById('profState').value,
      cep: document.getElementById('profCep').value.trim(),
      reference: document.getElementById('profReference').value.trim()
    };

    const updated = Store.updateAccount(user.id, updates);
    if (updated) {
      renderAccountInfo(updated);
      showToast('Dados atualizados com sucesso!');
    }
  });

  // ===== RENDER ORDERS =====
  function renderOrders() {
    const user = Store.getLoggedUser();
    if (!user) return;

    const orders = Store.getOrdersByUser(user.id);
    const ordersList = document.getElementById('ordersList');

    if (orders.length === 0) {
      ordersList.innerHTML = `
        <div class="orders-empty">
          <div class="empty-icon">📦</div>
          <h3>Nenhum pedido ainda</h3>
          <p>Quando você fizer uma compra, seus pedidos aparecerão aqui.</p>
          <a href="index.html" class="btn btn-primary" style="margin-top:1rem;">🏪 Ir às Compras</a>
        </div>
      `;
      return;
    }

    ordersList.innerHTML = orders.map(order => {
      const date = new Date(order.createdAt);
      const dateStr = date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const statusMap = {
        'pendente': { label: 'Pendente', color: 'var(--yellow)', icon: '⏳' },
        'confirmado': { label: 'Confirmado', color: 'var(--teal)', icon: '✅' },
        'preparando': { label: 'Preparando', color: 'var(--lavender)', icon: '📦' },
        'enviado': { label: 'Enviado', color: 'var(--primary)', icon: '🚚' },
        'entregue': { label: 'Entregue', color: 'var(--success)', icon: '🎉' },
        'cancelado': { label: 'Cancelado', color: 'var(--coral)', icon: '❌' }
      };

      const status = statusMap[order.status] || statusMap['pendente'];

      return `
        <div class="order-card">
          <div class="order-card-header">
            <div>
              <span class="order-id">${sanitize(order.id)}</span>
              <span class="order-date">${dateStr}</span>
            </div>
            <span class="order-status" style="background:${status.color};">
              ${status.icon} ${status.label}
            </span>
          </div>
          <div class="order-card-items">
            ${order.items.map(item => `
              <div class="order-item">
                <span>${sanitize(item.name)} (Tam: ${sanitize(item.size)}) x${item.quantity}</span>
                <span>${formatPrice(item.price * item.quantity)}</span>
              </div>
            `).join('')}
          </div>
          <div class="order-card-footer">
            <span class="order-total">Total: ${formatPrice(order.total)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // ===== INIT =====
  checkAuth();
});
