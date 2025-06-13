class UserManager {
    constructor() {
        this.currentEditingUserId = null;
        this.initializeEvents();
        this.checkAdminAccess();
        this.loadUsers();
    }

    initializeEvents() {
        // Botões principais
        document.getElementById('backToMain').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
            window.authManager.logout();
        });
        
        document.getElementById('createUserBtn').addEventListener('click', () => {
            this.showCreateUserModal();
        });
        
        document.getElementById('sendNotificationBtn').addEventListener('click', () => {
            this.showNotificationModal();
        });

        // Modal de criação de usuário
        document.getElementById('createUserClose').addEventListener('click', () => {
            this.hideCreateUserModal();
        });
        
        document.getElementById('cancelCreateUser').addEventListener('click', () => {
            this.hideCreateUserModal();
        });
        
        document.getElementById('createUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateUser();
        });

        // Modal de edição de usuário
        document.getElementById('editUserClose').addEventListener('click', () => {
            this.hideEditUserModal();
        });
        
        document.getElementById('cancelEditUser').addEventListener('click', () => {
            this.hideEditUserModal();
        });
        
        document.getElementById('editUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditUser();
        });

        // Modal de notificações
        document.getElementById('notificationClose').addEventListener('click', () => {
            this.hideNotificationModal();
        });
        
        document.getElementById('cancelNotification').addEventListener('click', () => {
            this.hideNotificationModal();
        });
        
        document.getElementById('notificationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendNotification();
        });
        
        document.getElementById('notificationTarget').addEventListener('change', (e) => {
            this.toggleUserSelection(e.target.value);
        });

        // Fechar modais clicando fora
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    checkAdminAccess() {
        if (!window.authManager.isAdmin()) {
            window.location.href = 'index.html';
            return;
        }
        
        const currentUser = window.authManager.getCurrentUser();
        document.getElementById('currentUserName').textContent = currentUser.name;
    }

    loadUsers() {
        const users = window.authManager.users;
        const usersGrid = document.getElementById('usersGrid');
        
        // Atualizar estatísticas do dashboard
        this.updateDashboardStats(users);
        
        // Limpar e recarregar grid de usuários
        usersGrid.innerHTML = '';
        
        users.forEach(user => {
            const userCard = this.createUserCard(user);
            usersGrid.appendChild(userCard);
        });
        
        // Adicionar funcionalidade de busca
        this.initializeSearch(users);
    }

    updateDashboardStats(users) {
        const totalUsers = users.length;
        const totalAdmins = users.filter(user => user.role === 'admin').length;
        const activeUsers = users.filter(user => user.status === 'active').length;
        
        // Atualizar elementos do DOM com animação
        this.animateCounter('totalUsers', totalUsers);
        this.animateCounter('totalAdmins', totalAdmins);
        this.animateCounter('activeUsers', activeUsers);
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const currentValue = parseInt(element.textContent) || 0;
        const increment = targetValue > currentValue ? 1 : -1;
        const duration = 1000; // 1 segundo
        const steps = Math.abs(targetValue - currentValue);
        const stepDuration = steps > 0 ? duration / steps : 0;
        
        if (steps === 0) return;
        
        let current = currentValue;
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            
            if (current === targetValue) {
                clearInterval(timer);
            }
        }, stepDuration);
    }

    initializeSearch(users) {
        const searchInput = document.getElementById('searchUsers');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            this.filterUsers(users, searchTerm);
        });
    }

    filterUsers(users, searchTerm) {
        const usersGrid = document.getElementById('usersGrid');
        usersGrid.innerHTML = '';
        
        const filteredUsers = users.filter(user => {
            return user.name.toLowerCase().includes(searchTerm) ||
                   user.code.toLowerCase().includes(searchTerm) ||
                   user.role.toLowerCase().includes(searchTerm);
        });
        
        filteredUsers.forEach(user => {
            const userCard = this.createUserCard(user);
            usersGrid.appendChild(userCard);
        });
        
        // Mostrar mensagem se não encontrar usuários
        if (filteredUsers.length === 0 && searchTerm) {
            usersGrid.innerHTML = `
                <div class="no-users-found">
                    <i class="ri-search-line"></i>
                    <h3>Nenhum usuário encontrado</h3>
                    <p>Tente buscar por nome, código ou tipo de usuário</p>
                </div>
            `;
        }
    }

    createUserCard(user) {
        const card = document.createElement('div');
        card.className = 'user-card';
        
        const statusClass = user.status === 'active' ? 'status-active' : 'status-blocked';
        const statusText = user.status === 'active' ? 'Ativo' : 'Bloqueado';
        const statusIcon = user.status === 'active' ? 'ri-check-circle-line' : 'ri-close-circle-line';
        
        const roleText = user.role === 'admin' ? 'Administrador' : 'Usuário';
        const roleIcon = user.role === 'admin' ? 'ri-shield-user-line' : 'ri-user-line';
        
        const currentUser = window.authManager.getCurrentUser();
        const isCurrentUser = user.id === currentUser.id;
        
        card.innerHTML = `
            <!-- Seção 1: Nome (100% da largura) -->
            <div class="user-name-section">
                <h3>${user.name}</h3>
            </div>
            
            <!-- Seção 2: Dados do usuário -->
            <div class="user-data-section">
                <div class="user-badges">
                    <span class="badge badge-role">
                        <i class="${roleIcon}"></i>
                        ${roleText}
                    </span>
                    <span class="badge badge-status ${statusClass}">
                        <i class="${statusIcon}"></i>
                        ${statusText}
                    </span>
                </div>
                
                <div class="user-details">
                    <div class="detail-item">
                        <span class="detail-label">Código:</span>
                        <span class="detail-value">${user.code}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Título:</span>
                        <span class="detail-value">${user.title || 'Sistema de Presença - WM'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Criado em:</span>
                        <span class="detail-value">${new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
            </div>
            
            <!-- Seção 3: Botões de ação -->
            <div class="user-actions-section">
                <button class="btn-icon btn-edit" onclick="userManager.editUser('${user.id}')" title="Editar Usuário">
                    <i class="ri-edit-line"></i>
                </button>
                
                ${!isCurrentUser ? `
                    <button class="btn-icon ${user.status === 'active' ? 'btn-warning' : 'btn-success'}" 
                            onclick="userManager.toggleUserStatus('${user.id}')" 
                            title="${user.status === 'active' ? 'Bloquear' : 'Desbloquear'} Usuário">
                        <i class="${user.status === 'active' ? 'ri-lock-line' : 'ri-lock-unlock-line'}"></i>
                    </button>
                    
                    <button class="btn-icon btn-danger" 
                            onclick="userManager.deleteUser('${user.id}')" 
                            title="Excluir Usuário">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                ` : `
                    <span class="current-user-label">
                        <i class="ri-user-star-line"></i>
                        Você
                    </span>
                `}
            </div>
        `;
        
        return card;
    }

    showCreateUserModal() {
        document.getElementById('createUserModal').style.display = 'block';
        document.getElementById('createUserForm').reset();
        document.getElementById('newUserTitle').value = 'Sistema de Presença - WM';
    }

    hideCreateUserModal() {
        document.getElementById('createUserModal').style.display = 'none';
    }

    handleCreateUser() {
        const newUserCode = document.getElementById('newUserCode').value.trim();
        const newUserName = document.getElementById('newUserName').value.trim();
        const newUserPassword = document.getElementById('newUserPassword').value;
        const newUserRole = document.getElementById('newUserRole').value;
        const newUserTitle = document.getElementById('newUserTitle').value.trim() || 'Sistema de Presença - WM';

        // Validar campos
        if (!newUserCode || !newUserName || !newUserPassword) {
            this.showError('Todos os campos são obrigatórios');
            return;
        }

        // Verificar se o código já existe
        if (window.authManager.users.find(user => user.code === newUserCode)) {
            this.showError('Este código de usuário já existe');
            return;
        }

        // Criar novo usuário
        const newUser = {
            id: 'user-' + Date.now(),
            code: newUserCode,
            name: newUserName,
            password: newUserPassword,
            role: newUserRole,
            title: newUserTitle,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        window.authManager.users.push(newUser);
        window.authManager.saveUsers();

        this.showSuccess('Usuário criado com sucesso!');
        this.hideCreateUserModal();
        this.loadUsers();
    }

    editUser(userId) {
        const user = window.authManager.users.find(u => u.id === userId);
        if (!user) return;
        
        this.currentEditingUserId = userId;
        document.getElementById('editUserName').value = user.name;
        document.getElementById('editUserPassword').value = ''; // Deixar em branco
        document.getElementById('editUserTitle').value = user.title || 'Sistema de Presença - WM';
        document.getElementById('editUserModal').style.display = 'block';
    }

    hideEditUserModal() {
        document.getElementById('editUserModal').style.display = 'none';
        this.currentEditingUserId = null;
    }

    handleEditUser() {
        if (!this.currentEditingUserId) return;
        
        const newName = document.getElementById('editUserName').value.trim();
        const newPassword = document.getElementById('editUserPassword').value;
        const newTitle = document.getElementById('editUserTitle').value.trim();
        
        // Validar campos obrigatórios
        if (!newName) {
            this.showError('O nome do usuário não pode estar vazio');
            return;
        }
        
        if (!newTitle) {
            this.showError('O título não pode estar vazio');
            return;
        }
        
        // Atualizar usuário
        const updateData = {
            name: newName,
            title: newTitle
        };
        
        // Só incluir senha se foi fornecida
        if (newPassword.trim()) {
            updateData.password = newPassword;
        }
        
        if (window.authManager.updateUser(this.currentEditingUserId, updateData)) {
            this.showSuccess('Usuário atualizado com sucesso!');
            this.hideEditUserModal();
            this.loadUsers();
        } else {
            this.showError('Erro ao atualizar o usuário');
        }
    }

    toggleUserStatus(userId) {
        const user = window.authManager.users.find(u => u.id === userId);
        if (!user) return;
        
        const action = user.status === 'active' ? 'bloquear' : 'desbloquear';
        
        if (confirm(`Tem certeza que deseja ${action} o usuário ${user.name}?`)) {
            const newStatus = window.authManager.toggleUserStatus(userId);
            if (newStatus) {
                const statusText = newStatus === 'active' ? 'desbloqueado' : 'bloqueado';
                this.showSuccess(`Usuário ${statusText} com sucesso!`);
                this.loadUsers();
            } else {
                this.showError('Erro ao alterar status do usuário');
            }
        }
    }

    deleteUser(userId) {
        const user = window.authManager.users.find(u => u.id === userId);
        if (!user) return;
        
        if (confirm(`Tem certeza que deseja excluir o usuário ${user.name}?\n\nEsta ação não pode ser desfeita.`)) {
            if (window.authManager.deleteUser(userId)) {
                this.showSuccess('Usuário excluído com sucesso!');
                this.loadUsers();
            } else {
                this.showError('Erro ao excluir usuário');
            }
        }
    }

    // Métodos de Notificação
    showNotificationModal() {
        this.loadUsersForNotification();
        document.getElementById('notificationModal').style.display = 'block';
        document.getElementById('notificationForm').reset();
        document.getElementById('notificationTarget').value = 'all';
        this.toggleUserSelection('all');
    }

    hideNotificationModal() {
        document.getElementById('notificationModal').style.display = 'none';
    }

    loadUsersForNotification() {
        const targetUserSelect = document.getElementById('targetUser');
        targetUserSelect.innerHTML = '';
        
        const users = window.authManager.users.filter(user => user.status === 'active');
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (${user.code})`;
            targetUserSelect.appendChild(option);
        });
    }

    toggleUserSelection(target) {
        const userSelectGroup = document.getElementById('userSelectGroup');
        const targetUser = document.getElementById('targetUser');
        
        if (target === 'individual') {
            userSelectGroup.style.display = 'block';
            targetUser.required = true;
        } else {
            userSelectGroup.style.display = 'none';
            targetUser.required = false;
        }
    }

    handleSendNotification() {
        const target = document.getElementById('notificationTarget').value;
        const targetUserId = document.getElementById('targetUser').value;
        const title = document.getElementById('notificationTitle').value.trim();
        const message = document.getElementById('notificationMessage').value.trim();
        const priority = document.getElementById('notificationPriority').value;
        
        if (!title || !message) {
            this.showError('Título e mensagem são obrigatórios');
            return;
        }
        
        const notification = {
            id: 'notif-' + Date.now(),
            title: title,
            message: message,
            priority: priority,
            target: target,
            targetUserId: target === 'individual' ? targetUserId : null,
            senderId: window.authManager.getCurrentUser().id,
            senderName: window.authManager.getCurrentUser().name,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        if (window.authManager.sendNotification(notification)) {
            const targetText = target === 'all' ? 'todos os usuários' : 
                             window.authManager.users.find(u => u.id === targetUserId)?.name || 'usuário selecionado';
            this.showSuccess(`Aviso enviado para ${targetText} com sucesso!`);
            this.hideNotificationModal();
        } else {
            this.showError('Erro ao enviar aviso');
        }
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }
}

// Inicializar o gerenciador de usuários
const userManager = new UserManager();