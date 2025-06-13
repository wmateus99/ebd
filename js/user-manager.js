class UserManager {
    constructor() {
        this.users = [];
        this.modal = document.getElementById('userManagerModal');
        this.usersList = document.getElementById('usersList');
        this.loadUsers();
        this.initializeEvents();
    }

    initializeEvents() {
        // Abrir modal
        const manageUsersBtn = document.getElementById('manageUsersBtn');
        if (manageUsersBtn) {
            manageUsersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal();
            });
        }

        // Fechar modal
        const closeBtn = document.getElementById('userManagerClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }

        // Fechar modal clicando fora
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        // Criar usuário
        const createUserForm = document.getElementById('createUserForm');
        if (createUserForm) {
            createUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createUser();
            });
        }
    }

    loadUsers() {
        if (window.authManager) {
            this.users = window.authManager.loadUsers();
        }
    }

    showModal() {
        this.renderUsersList();
        if (this.modal) {
            this.modal.style.display = 'block';
        }
    }

    hideModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    renderUsersList() {
        if (!this.usersList) return;

        this.usersList.innerHTML = '';

        if (this.users.length === 0) {
            this.usersList.innerHTML = '<p>Nenhum usuário cadastrado.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'users-table';
        
        // Cabeçalho
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Ações</th>
            </tr>
        `;
        table.appendChild(thead);

        // Corpo da tabela
        const tbody = document.createElement('tbody');
        this.users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.code}</td>
                <td>${user.name}</td>
                <td>${user.role === 'admin' ? 'Administrador' : 'Usuário'}</td>
                <td>
                    <button class="btn-edit" data-id="${user.id}" title="Editar"><i class="ri-edit-line"></i></button>
                    <button class="btn-delete" data-id="${user.id}" title="Excluir"><i class="ri-delete-bin-line"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        this.usersList.appendChild(table);

        // Adicionar eventos aos botões
        this.usersList.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-id');
                this.editUser(userId);
            });
        });

        this.usersList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-id');
                this.deleteUser(userId);
            });
        });
    }

    createUser() {
        const newUserCode = document.getElementById('newUserCode').value.trim();
        const newUserName = document.getElementById('newUserName').value.trim();
        const newUserPassword = document.getElementById('newUserPassword').value;
        const newUserRole = document.getElementById('newUserRole').value;

        // Verificar se o código já existe
        if (this.users.find(u => u.code === newUserCode)) {
            alert('Código de usuário já existe!');
            return;
        }

        const newUser = {
            id: 'user-' + Date.now(),
            code: newUserCode,
            name: newUserName,
            password: newUserPassword,
            role: newUserRole,
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();

        // Limpar formulário
        document.getElementById('createUserForm').reset();

        // Atualizar lista
        this.renderUsersList();

        alert('Usuário criado com sucesso!');
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        // Preencher formulário de edição
        document.getElementById('editUserCode').value = user.code;
        document.getElementById('editUserName').value = user.name;
        document.getElementById('editUserPassword').value = '';
        document.getElementById('editUserRole').value = user.role;

        // Mostrar modal de edição
        document.getElementById('editUserModal').style.display = 'block';

        // Salvar ID do usuário sendo editado
        document.getElementById('editUserForm').setAttribute('data-user-id', userId);

        // Adicionar evento ao formulário de edição
        document.getElementById('editUserForm').onsubmit = (e) => {
            e.preventDefault();
            const editedUserId = e.target.getAttribute('data-user-id');
            this.saveEditedUser(editedUserId);
        };

        // Fechar modal
        document.getElementById('editUserClose').onclick = () => {
            document.getElementById('editUserModal').style.display = 'none';
        };

        // Fechar modal clicando fora
        window.onclick = (e) => {
            if (e.target === document.getElementById('editUserModal')) {
                document.getElementById('editUserModal').style.display = 'none';
            }
        };
    }

    saveEditedUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const editedCode = document.getElementById('editUserCode').value.trim();
        const editedName = document.getElementById('editUserName').value.trim();
        const editedPassword = document.getElementById('editUserPassword').value;
        const editedRole = document.getElementById('editUserRole').value;

        // Verificar se o código já existe (exceto para o próprio usuário)
        if (editedCode !== user.code && this.users.find(u => u.code === editedCode)) {
            alert('Código de usuário já existe!');
            return;
        }

        // Atualizar usuário
        user.code = editedCode;
        user.name = editedName;
        if (editedPassword) {
            user.password = editedPassword;
        }
        user.role = editedRole;

        this.saveUsers();

        // Fechar modal
        document.getElementById('editUserModal').style.display = 'none';

        // Atualizar lista
        this.renderUsersList();

        alert('Usuário atualizado com sucesso!');
    }

    deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        // Não permitir excluir o próprio usuário
        if (window.authManager.getCurrentUser().id === userId) {
            alert('Você não pode excluir seu próprio usuário!');
            return;
        }

        // Confirmar exclusão
        if (!confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
            return;
        }

        // Remover usuário
        this.users = this.users.filter(u => u.id !== userId);
        this.saveUsers();

        // Atualizar lista
        this.renderUsersList();

        alert('Usuário excluído com sucesso!');
    }

    saveUsers() {
        if (window.authManager) {
            window.authManager.users = this.users;
            window.authManager.saveUsers();
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se é admin
    if (window.authManager && window.authManager.isAdmin()) {
        window.userManager = new UserManager();
    }
});