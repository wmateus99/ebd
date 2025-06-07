// Aplicação principal
class App {
    constructor() {
        this.personManager = new PersonManager();
        this.attendanceManager = new AttendanceManager();
        this.uiManager = new UIManager(this.personManager, this.attendanceManager);
        
        this.init();
    }

    init() {
        this.uiManager.renderPeopleList();
    }

    markAttendance(personId, status) {
        this.attendanceManager.markAttendance(personId, this.uiManager.currentDate, status);
        this.uiManager.renderPeopleList();
    }

    revokeAttendance(personId) {
        this.attendanceManager.revokeAttendance(personId, this.uiManager.currentDate);
        this.uiManager.renderPeopleList();
    }

    deletePerson(personId) {
        const person = this.personManager.getPersonById(personId);
        if (person && confirm(`Tem certeza que deseja excluir ${person.name}?`)) {
            this.personManager.deletePerson(personId);
            this.uiManager.renderPeopleList();
        }
    }
}

// Inicializar a aplicação quando a página carregar
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});