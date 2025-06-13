class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.migrateExistingUsers(); // Migrar usuários existentes
        this.initializeDefaultAdmin();
        this.initializeEvents();
        this.checkAuthStatus();
    }

    initializeDefaultAdmin() {
        // Lista de usuários padrão para criar automaticamente
        const defaultUsers = [
            {
                id: 'admin-default',
                code: 'ADMIN07',
                name: 'Administrador',
                password: '123',
                role: 'admin',
                title: 'Sistema de Presença - WM',
                status: 'active'
            },
            {
                id: 'user-ebd01',
                code: 'ebd01',
                name: 'Professor(a)',
                password: '123',
                role: 'user',
                title: 'Sistema de Presença - AD Manancial do Amor',
                status: 'active'
            },
            {
                id: 'user-ebd02',
                code: 'ebd02',
                name: 'Professor(a)',
                password: '123',
                role: 'user',
                title: 'Sistema de Presença - Mateus Santos',
                status: 'active'
            }
            // Para adicionar novos usuários padrão, adicione objetos aqui seguindo o mesmo formato:
            // {
            //     id: 'user-exemplo',
            //     code: 'CODIGO',
            //     name: 'Nome do Usuário',
            //     password: 'senha123',
            //     role: 'user', // ou 'admin'
            //     title: 'Sistema de Presença - WM',
            //     status: 'active'
            // }
        ];

        // Criar usuários padrão se não existirem
        let needsSave = false;
        defaultUsers.forEach(defaultUser => {
            if (!this.users.find(user => user.code === defaultUser.code)) {
                this.users.push({
                    ...defaultUser,
                    createdAt: new Date().toISOString()
                });
                needsSave = true;
            }
        });

        if (needsSave) {
            this.saveUsers();
        }
    }

    initializeEvents() {
        const loginForm = document.getElementById('loginForm');
        const createUserForm = document.getElementById('createUserForm');
        const createUserClose = document.getElementById('createUserClose');
        const cancelCreateUser = document.getElementById('cancelCreateUser');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (createUserForm) {
            createUserForm.addEventListener('submit', (e) => this.handleCreateUser(e));
        }

        if (createUserClose) {
            createUserClose.addEventListener('click', () => this.hideCreateUserModal());
        }

        if (cancelCreateUser) {
            cancelCreateUser.addEventListener('click', () => this.hideCreateUserModal());
        }

        // Verificar se é admin após login para mostrar opção de criar usuário
        document.addEventListener('DOMContentLoaded', () => {
            if (this.currentUser && this.currentUser.role === 'admin') {
                this.showAdminOptions();
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const userCode = document.getElementById('userCode').value.trim();
        const password = document.getElementById('password').value;
        
        const user = this.users.find(u => u.code === userCode && u.password === password);
        
        if (user) {
            // Verificar se o usuário está bloqueado
            if (user.status === 'blocked') {
                this.showError('Usuário bloqueado! Entre em contato com o administrador.');
                return;
            }
            
            this.currentUser = user;
            this.saveCurrentUser();
            
            // Redirecionar para a aplicação principal
            window.location.href = 'index.html';
        } else {
            this.showError('Código ou senha incorretos!');
        }
    }

    async handleCreateUser(e) {
        e.preventDefault();
        
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            this.showError('Apenas administradores podem criar usuários!');
            return;
        }
        
        const newUserCode = document.getElementById('newUserCode').value.trim();
        const newUserName = document.getElementById('newUserName').value.trim();
        const newUserPassword = document.getElementById('newUserPassword').value;
        const newUserRole = document.getElementById('newUserRole').value;
        const newUserTitle = document.getElementById('newUserTitle')?.value.trim() || 'Sistema de Presença - WM';
        
        // Validar campos
        if (!newUserCode || !newUserName || !newUserPassword) {
            this.showError('Todos os campos são obrigatórios');
            return;
        }
        
        // Verificar se o código já existe
        if (this.users.find(u => u.code === newUserCode)) {
            this.showError('Este código de usuário já existe');
            return;
        }
        
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
        
        this.users.push(newUser);
        this.saveUsers();
        
        this.showSuccess('Usuário criado com sucesso!');
        this.hideCreateUserModal();
        
        // Limpar formulário
        document.getElementById('createUserForm').reset();
    }

    showAdminOptions() {
        // Adicionar botão para criar usuário se for admin
        const loginCard = document.querySelector('.login-card');
        if (loginCard && !document.getElementById('createUserBtn')) {
            const createUserBtn = document.createElement('button');
            createUserBtn.id = 'createUserBtn';
            createUserBtn.className = 'admin-btn';
            createUserBtn.innerHTML = '<i class="ri-user-add-line"></i> Criar Novo Usuário';
            createUserBtn.addEventListener('click', () => this.showCreateUserModal());
            loginCard.appendChild(createUserBtn);
        }
    }

    showCreateUserModal() {
        document.getElementById('createUserModal').style.display = 'block';
    }

    hideCreateUserModal() {
        document.getElementById('createUserModal').style.display = 'none';
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            
            // Atualizar o título da página com base no usuário atual
            this.updatePageTitle();
            
            // Se estiver na página de login e já estiver logado, redirecionar
            if (window.location.pathname.includes('login.html')) {
                if (this.currentUser.role === 'admin') {
                    this.showAdminOptions();
                } else {
                    window.location.href = 'index.html';
                }
            }
        } else {
            // Se não estiver logado e não estiver na página de login, redirecionar
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    getUserDataKey(key) {
        // Criar chave única para cada usuário usando o código de login
        return `${this.currentUser.code}_${key}`;
    }

    loadUsers() {
        const users = localStorage.getItem('systemUsers');
        return users ? JSON.parse(users) : [];
    }

    saveUsers() {
        localStorage.setItem('systemUsers', JSON.stringify(this.users));
    }

    saveCurrentUser() {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.className = 'error-message';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    showSuccess(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.className = 'success-message';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    }
    
    // Métodos para gerenciamento de usuários
    toggleUserStatus(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.status = user.status === 'active' ? 'blocked' : 'active';
            this.saveUsers();
            return user.status;
        }
        return null;
    }
    
    deleteUser(userId) {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            return false;
        }
        
        // Não permitir deletar o próprio usuário
        if (userId === this.currentUser.id) {
            return false;
        }
        
        this.users = this.users.filter(u => u.id !== userId);
        this.saveUsers();
        return true;
    }
    
    updateUser(userId, updateData) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            // Atualizar campos fornecidos
            if (updateData.name) {
                user.name = updateData.name;
            }
            if (updateData.password) {
                user.password = updateData.password;
            }
            if (updateData.title) {
                user.title = updateData.title;
            }
            
            this.saveUsers();
            
            // Se for o usuário atual, atualizar também o currentUser
            if (userId === this.currentUser?.id) {
                if (updateData.name) this.currentUser.name = updateData.name;
                if (updateData.password) this.currentUser.password = updateData.password;
                if (updateData.title) {
                    this.currentUser.title = updateData.title;
                    this.updatePageTitle();
                }
                this.saveCurrentUser();
            }
            return true;
        }
        return false;
    }
    
    updateUserTitle(userId, newTitle) {
        return this.updateUser(userId, { title: newTitle });
    }
    
    updatePageTitle() {
        if (this.currentUser && this.currentUser.title) {
            document.title = this.currentUser.title;
            
            // Atualizar também o h1 se existir
            const titleElement = document.querySelector('h1');
            if (titleElement) {
                titleElement.textContent = this.currentUser.title;
            }
        }
    }
    
    // Migrar usuários existentes para incluir novos campos
    migrateExistingUsers() {
        let needsSave = false;
        
        this.users.forEach(user => {
            if (!user.title) {
                user.title = 'Sistema de Presença - WM';
                needsSave = true;
            }
            if (!user.status) {
                user.status = 'active';
                needsSave = true;
            }
        });
        
        if (needsSave) {
            this.saveUsers();
        }
    }
}

// Inicializar o gerenciador de autenticação
window.authManager = new AuthManager();