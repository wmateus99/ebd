// Aplicação principal
class App {
    constructor() {
        this.showLoading();
        this.init();
    }

    showLoading() {
        const peopleList = document.getElementById('peopleList');
        peopleList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">🔄 Carregando dados...</p>';
    }

    async init() {
        try {
            // Inicializar managers
            this.personManager = new PersonManager();
            this.attendanceManager = new AttendanceManager();
            
            // Aguardar carregamento dos dados
            await this.personManager.loadPeople();
            await this.attendanceManager.loadRecords();
            
            // Inicializar UI após dados carregados
            this.uiManager = new UIManager(this.personManager, this.attendanceManager);
            this.uiManager.renderPeopleList();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            const peopleList = document.getElementById('peopleList');
            peopleList.innerHTML = '<p style="text-align: center; color: var(--danger-color); padding: 40px;">❌ Erro ao carregar dados. Verifique sua conexão.</p>';
        }
    }

    async markAttendance(personId, status) {
        await this.attendanceManager.markAttendance(personId, this.uiManager.currentDate, status);
        this.uiManager.renderPeopleList();
    }

    async revokeAttendance(personId) {
        await this.attendanceManager.revokeAttendance(personId, this.uiManager.currentDate);
        this.uiManager.renderPeopleList();
    }

    async deletePerson(personId) {
        const person = this.personManager.getPersonById(personId);
        if (person && confirm(`Tem certeza que deseja excluir ${person.name}?`)) {
            await this.personManager.deletePerson(personId);
            this.uiManager.renderPeopleList();
        }
    }
}

// Inicializar a aplicação quando a página carregar
let app;
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação primeiro
    if (!window.authManager) {
        window.authManager = new AuthManager();
    }
    
    // Verificar se o usuário está logado
    const currentUser = window.authManager.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    // Atualizar interface com informações do usuário
    updateUserInterface(currentUser);
    
    // Inicializar aplicação
    app = new App();
    window.app = app; // Tornar disponível globalmente
});

// Função para atualizar a interface com informações do usuário
function updateUserInterface(user) {
    const userWelcome = document.getElementById('userWelcome');
    if (userWelcome) {
        userWelcome.textContent = `Olá, ${user.name.split(' ')[0]}`;
    }
    
    // Mostrar opções de admin se necessário
    if (user.role === 'admin') {
        const manageUsersBtn = document.getElementById('manageUsersBtn');
        if (manageUsersBtn) {
            manageUsersBtn.style.display = 'block';
        }
    }
    
    // Adicionar evento de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                window.authManager.logout();
            }
        });
    }
    
    // Adicionar evento para gerenciar usuários (admin)
    const manageUsersBtn = document.getElementById('manageUsersBtn');
    if (manageUsersBtn && user.role === 'admin') {
        manageUsersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'manage-users.html';
        });
    }
    
    // Adicionar evento para notificações
    const notificationsBtn = document.getElementById('notificationsBtn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'notifications.html';
        });
        
        // Atualizar badge de notificações
        updateNotificationBadge(user.id);
        
        // Atualizar badge a cada 30 segundos
        setInterval(() => {
            updateNotificationBadge(user.id);
        }, 30000);
    }
}

// Função para atualizar o badge de notificações
function updateNotificationBadge(userId) {
    const badge = document.getElementById('notificationBadge');
    if (badge && window.authManager) {
        const unreadCount = window.authManager.getUnreadNotificationsCount(userId);
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}