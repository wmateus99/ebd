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

async markJustifiedAbsence(personId) {
    const { value: reason } = await Swal.fire({
        title: 'Justificar Falta',
        input: 'text',
        inputLabel: 'Digite o motivo da falta justificada:',
        inputPlaceholder: 'Ex: Estava doente',
        showCancelButton: true,
        confirmButtonText: 'Justificar',
        cancelButtonText: 'Cancelar'
    });

    if (reason && reason.trim()) {
        await this.attendanceManager.markAttendance(personId, this.uiManager.currentDate, 'justified', reason.trim());
        this.uiManager.renderPeopleList();
    }
}


    async revokeAttendance(personId) {
        await this.attendanceManager.revokeAttendance(personId, this.uiManager.currentDate);
        this.uiManager.renderPeopleList();
    }

async deletePerson(personId) {
    const person = this.personManager.getPersonById(personId);
    if (!person) return;

    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: `Deseja excluir ${person.name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
        await this.personManager.deletePerson(personId);
        this.uiManager.renderPeopleList();

        // Alerta de sucesso opcional
        await Swal.fire({
            icon: 'success',
            title: 'Excluído!',
            text: `${person.name} foi removido com sucesso.`
        });
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
    logoutBtn.addEventListener('click', async () => {
        const result = await Swal.fire({
            title: 'Deseja sair?',
            text: 'Tem certeza que deseja sair da conta?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, sair',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6'
        });

        if (result.isConfirmed) {
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
}