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
    app = new App();
    window.app = app; // Tornar disponível globalmente
});