// Componente para gerenciar a interface do usuário
class UIManager {
    constructor(personManager, attendanceManager) {
        this.personManager = personManager;
        this.attendanceManager = attendanceManager;
        this.currentDate = new Date().toISOString().split('T')[0];
        this.dashboardSearchQuery = '';
        
        this.initializeElements();
        this.bindEvents();
        this.setCurrentDate();
        this.initializeTheme();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.roomFilter = document.getElementById('roomFilter');
        this.dateInput = document.getElementById('dateInput');
        this.peopleList = document.getElementById('peopleList');
        this.modal = document.getElementById('addPersonModal');
        this.addPersonForm = document.getElementById('addPersonForm');
        this.dashboardModal = document.getElementById('dashboardModal');
        this.themeToggle = document.getElementById('themeToggle');
        this.dashboardSearchInput = document.getElementById('dashboardSearchInput');
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        const body = document.body;
        const themeIcon = document.querySelector('.theme-icon');
        
        if (theme === 'light') {
            body.setAttribute('data-theme', 'light');
            themeIcon.textContent = '☀️';
        } else {
            body.removeAttribute('data-theme');
            themeIcon.textContent = '🌙';
        }
        
        localStorage.setItem('theme', theme);
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    bindEvents() {
        // Pesquisa
        this.searchInput.addEventListener('input', () => this.renderPeopleList());
        
        // Filtro por sala
        this.roomFilter.addEventListener('change', () => this.renderPeopleList());
        
        // Mudança de data
        this.dateInput.addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.renderPeopleList();
        });
        
        // Toggle de tema
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Botões do menu
        document.getElementById('addPersonBtn').addEventListener('click', () => this.openModal());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('dashboardBtn').addEventListener('click', () => this.openDashboard());
        
        // Modal cadastro
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        this.addPersonForm.addEventListener('submit', (e) => this.handleAddPerson(e));
        
        // Modal dashboard
        document.getElementById('dashboardClose').addEventListener('click', () => this.closeDashboard());
        document.getElementById('dashboardRoomFilter').addEventListener('change', () => this.updateIndividualStats());
        
        // Pesquisa no dashboard
        this.dashboardSearchInput.addEventListener('input', (e) => {
            this.dashboardSearchQuery = e.target.value;
            this.updateIndividualStats();
        });
        
        // Fechar modal clicando fora
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
            if (e.target === this.dashboardModal) {
                this.closeDashboard();
            }
        });
    }

    setCurrentDate() {
        this.dateInput.value = this.currentDate;
    }

    openModal() {
        this.modal.style.display = 'block';
        document.getElementById('personName').focus();
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.addPersonForm.reset();
    }

    openDashboard() {
        this.dashboardModal.style.display = 'block';
        this.dashboardSearchQuery = '';
        this.dashboardSearchInput.value = '';
        this.updateDashboard();
    }

    closeDashboard() {
        this.dashboardModal.style.display = 'none';
    }

    updateDashboard() {
        this.updateGeneralStats();
        this.updateRoomStats();
        this.updateIndividualStats();
    }

    updateGeneralStats() {
        const people = this.personManager.getPeople();
        const records = this.attendanceManager.records;
        
        let totalPresences = 0;
        let totalAbsences = 0;
        let totalDays = Object.keys(records).length;
        let activePeople = people.length;
        
        Object.values(records).forEach(dayRecords => {
            Object.values(dayRecords).forEach(record => {
                if (record.status === 'present') totalPresences++;
                if (record.status === 'absent') totalAbsences++;
            });
        });
        
        const totalRecords = totalPresences + totalAbsences;
        const presenceRate = totalRecords > 0 ? ((totalPresences / totalRecords) * 100).toFixed(1) : 0;
        
        document.getElementById('generalStats').innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total de Pessoas:</span>
                <span class="stat-value neutral">${activePeople}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Dias com Registros:</span>
                <span class="stat-value neutral">${totalDays}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total de Presenças:</span>
                <span class="stat-value positive">${totalPresences}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total de Faltas:</span>
                <span class="stat-value negative">${totalAbsences}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Taxa de Presença:</span>
                <span class="stat-value ${presenceRate >= 80 ? 'positive' : presenceRate >= 60 ? 'neutral' : 'negative'}">${presenceRate}%</span>
            </div>
        `;
    }

    updateRoomStats() {
        const people = this.personManager.getPeople();
        const records = this.attendanceManager.records;
        
        const roomStats = {
            'Sala Adultos': { people: 0, presences: 0, absences: 0 },
            'Sala Jovens': { people: 0, presences: 0, absences: 0 }
        };
        
        // Contar pessoas por sala
        people.forEach(person => {
            if (roomStats[person.room]) {
                roomStats[person.room].people++;
            }
        });
        
        // Contar presenças e faltas por sala
        Object.values(records).forEach(dayRecords => {
            Object.entries(dayRecords).forEach(([personId, record]) => {
                const person = people.find(p => p.id === personId);
                if (person && roomStats[person.room]) {
                    if (record.status === 'present') {
                        roomStats[person.room].presences++;
                    } else if (record.status === 'absent') {
                        roomStats[person.room].absences++;
                    }
                }
            });
        });
        
        let roomStatsHTML = '';
        Object.entries(roomStats).forEach(([room, stats]) => {
            const total = stats.presences + stats.absences;
            const rate = total > 0 ? ((stats.presences / total) * 100).toFixed(1) : 0;
            
            roomStatsHTML += `
                <div class="individual-person">
                    <div class="person-name">${room}</div>
                    <div class="person-stats">
                        <div class="mini-stat">
                            <div class="mini-stat-label">Pessoas</div>
                            <div class="mini-stat-value neutral">${stats.people}</div>
                        </div>
                        <div class="mini-stat">
                            <div class="mini-stat-label">Presenças</div>
                            <div class="mini-stat-value positive">${stats.presences}</div>
                        </div>
                        <div class="mini-stat">
                            <div class="mini-stat-label">Faltas</div>
                            <div class="mini-stat-value negative">${stats.absences}</div>
                        </div>
                        <div class="mini-stat">
                            <div class="mini-stat-label">Taxa</div>
                            <div class="mini-stat-value ${rate >= 80 ? 'positive' : rate >= 60 ? 'neutral' : 'negative'}">${rate}%</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        document.getElementById('roomStats').innerHTML = roomStatsHTML;
    }

    updateIndividualStats() {
        const people = this.personManager.getPeople();
        const roomFilter = document.getElementById('dashboardRoomFilter').value;
        
        let filteredPeople = people;
        
        // Aplicar filtro por sala
        if (roomFilter) {
            filteredPeople = people.filter(person => person.room === roomFilter);
        }
        
        // Aplicar pesquisa por nome
        if (this.dashboardSearchQuery) {
            const searchTerm = this.dashboardSearchQuery.toLowerCase();
            filteredPeople = filteredPeople.filter(person => 
                person.name.toLowerCase().includes(searchTerm)
            );
        }
        
        let individualStatsHTML = '';
        
        filteredPeople.forEach(person => {
            const presences = this.attendanceManager.getPresenceCount(person.id);
            const absences = this.attendanceManager.getAbsenceCount(person.id);
            const total = presences + absences;
            const rate = total > 0 ? ((presences / total) * 100).toFixed(1) : 0;
            
            individualStatsHTML += `
                <div class="individual-person">
                    <div class="person-name">${person.name}</div>
                    <div class="person-room">${person.room}</div>
                    <div class="person-stats">
                        <div class="mini-stat">
                            <div class="mini-stat-label">Presenças</div>
                            <div class="mini-stat-value positive">${presences}</div>
                        </div>
                        <div class="mini-stat">
                            <div class="mini-stat-label">Faltas</div>
                            <div class="mini-stat-value negative">${absences}</div>
                        </div>
                        <div class="mini-stat">
                            <div class="mini-stat-label">Total</div>
                            <div class="mini-stat-value neutral">${total}</div>
                        </div>
                        <div class="mini-stat">
                            <div class="mini-stat-label">Taxa</div>
                            <div class="mini-stat-value ${rate >= 80 ? 'positive' : rate >= 60 ? 'neutral' : 'negative'}">${rate}%</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        if (individualStatsHTML === '') {
            individualStatsHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhuma pessoa encontrada.</p>';
        }
        
        document.getElementById('individualStats').innerHTML = individualStatsHTML;
    }

    handleAddPerson(e) {
        e.preventDefault();
        
        const name = document.getElementById('personName').value;
        const birthdate = document.getElementById('personBirthdate').value;
        const room = document.getElementById('personRoom').value;
        
        if (name && birthdate && room) {
            this.personManager.addPerson(name, birthdate, room);
            this.closeModal();
            this.renderPeopleList();
        }
    }

    renderPeopleList() {
        let people = this.personManager.getPeople();
        
        // Aplicar pesquisa
        const searchQuery = this.searchInput.value;
        if (searchQuery) {
            people = this.personManager.searchPeople(searchQuery);
        }
        
        // Aplicar filtro por sala
        const roomFilter = this.roomFilter.value;
        if (roomFilter) {
            people = people.filter(person => person.room === roomFilter);
        }
        
        this.peopleList.innerHTML = '';
        
        if (people.length === 0) {
            this.peopleList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Nenhuma pessoa encontrada.</p>';
            return;
        }
        
        people.forEach(person => {
            const personCard = this.createPersonCard(person);
            this.peopleList.appendChild(personCard);
        });
    }

    createPersonCard(person) {
        const card = document.createElement('div');
        card.className = 'person-card';
        
        const attendanceStatus = this.attendanceManager.getAttendanceStatus(person.id, this.currentDate);
        const absenceCount = this.attendanceManager.getAbsenceCount(person.id);
        
        let statusDisplay = '';
        if (attendanceStatus === 'present') {
            statusDisplay = '<span class="status-present">✓ Presente</span>';
        } else if (attendanceStatus === 'absent') {
            statusDisplay = '<span class="status-absent">✗ Falta</span>';
        }
        
        card.innerHTML = `
            <div class="person-header">
                <div class="person-info">
                    <h3>${person.name}</h3>
                    <p>${person.room} • Nascimento: ${new Date(person.birthdate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div class="person-actions">
                    ${absenceCount > 0 ? `<span class="absence-count">${absenceCount} faltas</span>` : ''}
                    <button class="btn btn-delete" onclick="app.deletePerson('${person.id}')">Excluir</button>
                </div>
            </div>
            <div class="attendance-controls">
                <button class="btn btn-present" onclick="app.markAttendance('${person.id}', 'present')">Presente</button>
                <button class="btn btn-absent" onclick="app.markAttendance('${person.id}', 'absent')">Falta</button>
                ${attendanceStatus ? `<button class="btn btn-revoke" onclick="app.revokeAttendance('${person.id}')">Revogar</button>` : ''}
            </div>
            <div class="attendance-status">
                ${statusDisplay}
            </div>
        `;
        
        return card;
    }

    clearAll() {
        if (confirm('Tem certeza que deseja excluir todas as pessoas e registros? Esta ação não pode ser desfeita.')) {
            this.personManager.clearAll();
            this.renderPeopleList();
        }
    }
}