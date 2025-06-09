// Gerenciador de Aniversariantes
class BirthdayManager {
    constructor(personManager) {
        this.personManager = personManager;
        this.modal = document.getElementById('birthdayModal');
        this.monthSelect = document.getElementById('birthdayMonth');
        this.birthdayList = document.getElementById('birthdayList');
        
        this.initializeEvents();
        this.setCurrentMonth();
    }
    
    initializeEvents() {
        // Abrir modal
        document.getElementById('birthdayBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showModal();
        });
        
        // Fechar modal
        document.getElementById('birthdayClose').addEventListener('click', () => {
            this.hideModal();
        });
        
        // Fechar modal clicando fora
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
        
        // Mudança de mês
        this.monthSelect.addEventListener('change', () => {
            this.updateBirthdayList();
        });
    }
    
    setCurrentMonth() {
        const currentMonth = new Date().getMonth();
        this.monthSelect.value = currentMonth;
    }
    
    showModal() {
        this.modal.style.display = 'block';
        this.updateBirthdayList();
    }
    
    hideModal() {
        this.modal.style.display = 'none';
    }
    
    updateBirthdayList() {
        const selectedMonth = parseInt(this.monthSelect.value);
        const birthdays = this.getBirthdaysForMonth(selectedMonth);
        
        if (birthdays.length === 0) {
            this.birthdayList.innerHTML = '<p class="no-birthdays">Nenhum aniversariante neste mês.</p>';
            return;
        }
        
        // Ordenar por dia
        birthdays.sort((a, b) => a.day - b.day);
        
        let html = '<div class="birthday-items">';
        birthdays.forEach(birthday => {
            const age = this.calculateAge(birthday.person.birthdate);
            html += `
                <div class="birthday-item">
                    <div class="birthday-info">
                        <h4>${birthday.person.name}</h4>
                        <p>${birthday.person.room}</p>
                        <p class="birthday-date">📅 ${birthday.day}/${selectedMonth + 1} (${age} anos)</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        this.birthdayList.innerHTML = html;
    }
    
    getBirthdaysForMonth(month) {
        const people = this.personManager.getPeople();
        const birthdays = [];
        
        people.forEach(person => {
            if (person.birthdate) {
                const birthDate = new Date(person.birthdate + 'T12:00:00'); // Evitar problema de fuso horário
                if (birthDate.getMonth() === month) {
                    birthdays.push({
                        person: person,
                        day: birthDate.getDate()
                    });
                }
            }
        });
        
        return birthdays;
    }
    
    calculateAge(birthdate) {
        const today = new Date();
        const birth = new Date(birthdate + 'T12:00:00');
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar a inicialização do app
    setTimeout(() => {
        if (app && app.personManager) {
            window.birthdayManager = new BirthdayManager(app.personManager);
        }
    }, 100);
});