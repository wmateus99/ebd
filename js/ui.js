// Componente para gerenciar a interface do usuário
class UIManager {
    constructor(personManager, attendanceManager) {
        this.personManager = personManager;
        this.attendanceManager = attendanceManager;
        this.currentDate = new Date().toISOString().split('T')[0];
        this.dashboardSearchQuery = '';
        this.pdfGenerator = new PDFReportGenerator(personManager, attendanceManager);
        
        this.initializeElements();
        this.bindEvents();
        this.setCurrentDate();
        this.populateYearOptions();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.roomFilter = document.getElementById('roomFilter');
        this.dateInput = document.getElementById('dateInput');
        this.peopleList = document.getElementById('peopleList');
        this.modal = document.getElementById('addPersonModal');
        this.addPersonForm = document.getElementById('addPersonForm');
        this.dashboardModal = document.getElementById('dashboardModal');
        this.dashboardSearchInput = document.getElementById('dashboardSearchInput');
        this.pdfReportModal = document.getElementById('pdfReportModal');
        this.pdfReportForm = document.getElementById('pdfReportForm');
    }



    bindEvents() {
        // Dropdown menu toggle
        const dropdownBtn = document.querySelector('.dropdown-btn');
        const dropdown = document.querySelector('.dropdown');
        
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
        
        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
        // Fechar dropdown ao clicar em um item
        const dropdownItems = document.querySelectorAll('.dropdown-content a');
        dropdownItems.forEach(item => {
            item.addEventListener('click', () => {
                dropdown.classList.remove('active');
            });
        });
        
        // Pesquisa
        this.searchInput.addEventListener('input', () => this.renderPeopleList());
        
        // Filtro por sala
        this.roomFilter.addEventListener('change', () => this.renderPeopleList());
        
        // Mudança de data
        this.dateInput.addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.renderPeopleList();
        });
        

        
        // Botões do menu
        document.getElementById('addPersonBtn').addEventListener('click', () => this.openModal());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('dashboardBtn').addEventListener('click', () => this.openDashboard());
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importDataBtn').addEventListener('click', () => this.importData());
        document.getElementById('exportPdfBtn').addEventListener('click', () => this.openPdfReportModal());
        
        // Input de arquivo para importação
        document.getElementById('importFileInput').addEventListener('change', (e) => this.handleFileImport(e));
        
        // Modal cadastro
        document.getElementById('addPersonClose').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        this.addPersonForm.addEventListener('submit', (e) => this.handleAddPerson(e));
        
        // Modal dashboard
        document.getElementById('dashboardClose').addEventListener('click', () => this.closeDashboard());
        document.getElementById('dashboardRoomFilter').addEventListener('change', () => this.updateIndividualStats());
        
        // Modal PDF Report
        document.getElementById('pdfReportClose').addEventListener('click', () => this.closePdfReportModal());
        document.getElementById('cancelPdfBtn').addEventListener('click', () => this.closePdfReportModal());
        this.pdfReportForm.addEventListener('submit', (e) => this.handlePdfReportGeneration(e));
        
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
            if (e.target === this.pdfReportModal) {
                this.closePdfReportModal();
            }
        });
    }

    setCurrentDate() {
        this.dateInput.value = this.currentDate;
    }

    openModal() {
        this.modal.classList.add('show');
        document.getElementById('personName').focus();
    }

    closeModal() {
        this.modal.classList.remove('show');
        this.addPersonForm.reset();
    }

    openDashboard() {
        this.dashboardModal.classList.add('show');
        this.dashboardSearchQuery = '';
        this.dashboardSearchInput.value = '';
        this.updateDashboard();
    }

    closeDashboard() {
        this.dashboardModal.classList.remove('show');
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
        let totalJustified = 0;
        let totalDays = Object.keys(records).length;
        let activePeople = people.length;
        
        Object.values(records).forEach(dayRecords => {
            Object.values(dayRecords).forEach(record => {
                if (record.status === 'present') totalPresences++;
                if (record.status === 'absent') totalAbsences++;
                if (record.status === 'justified') totalJustified++;
            });
        });
        
        const totalRecords = totalPresences + totalAbsences + totalJustified;
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
                <span class="stat-label">Faltas Justificadas:</span>
                <span class="stat-value warning">${totalJustified}</span>
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
            'Sala Jovens': { people: 0, presences: 0, absences: 0 },
            'Sala Crianças': { people: 0, presences: 0, absences: 0 }
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
            const justified = this.attendanceManager.getJustifiedAbsenceCount(person.id);
            const total = presences + absences + justified;
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
                            <div class="mini-stat-label">Justificadas</div>
                            <div class="mini-stat-value warning">${justified}</div>
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
        
        // Ordenar alfabeticamente por nome
        people.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
        
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
        const attendanceRecord = this.attendanceManager.getAttendanceRecord(person.id, this.currentDate);
        const absenceCount = this.attendanceManager.getAbsenceCount(person.id);
        const justifiedCount = this.attendanceManager.getJustifiedAbsenceCount(person.id);
        
        let statusDisplay = '';
        if (attendanceStatus === 'present') {
            statusDisplay = '<span class="status-present">✓ Presente</span>';
        } else if (attendanceStatus === 'absent') {
            statusDisplay = '<span class="status-absent">✗ Falta</span>';
        } else if (attendanceStatus === 'justified') {
            const reason = attendanceRecord && attendanceRecord.reason ? attendanceRecord.reason : 'Sem motivo especificado';
            statusDisplay = `<span class="status-justified">⚠ Falta Justificada</span><div class="justified-reason">Motivo: ${reason}</div>`;
        }
        
        // Contador de faltas
        let absenceDisplay = '';
        if (absenceCount > 0 || justifiedCount > 0) {
            const parts = [];
            if (absenceCount > 0) parts.push(`${absenceCount} faltas`);
            if (justifiedCount > 0) parts.push(`${justifiedCount} justificadas`);
            absenceDisplay = `<span class="absence-count">${parts.join(' • ')}</span>`;
        }
        
        card.innerHTML = `
            <div class="person-header">
                <div class="person-info">
                    <h3>${person.name}</h3>
                    <p>${person.room} • Nascimento: ${new Date(person.birthdate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
                <div class="person-actions">
                    ${absenceDisplay}
                    <button class="btn btn-delete" onclick="app.deletePerson('${person.id}')" title="Excluir"><i class="ri-delete-bin-line"></i></button>
                </div>
            </div>
            <div class="attendance-controls">
                <button class="btn btn-present" onclick="app.markAttendance('${person.id}', 'present')">Presente</button>
                <button class="btn btn-absent" onclick="app.markAttendance('${person.id}', 'absent')">Falta</button>
                <button class="btn btn-justified" onclick="app.markJustifiedAbsence('${person.id}')">Falta Justificada</button>
                ${attendanceStatus ? `<button class="btn btn-revoke" onclick="app.revokeAttendance('${person.id}')">Revogar</button>` : ''}
            </div>
            <div class="attendance-status">
                ${statusDisplay}
            </div>
        `;
        
        return card;
    }

async clearAll() {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Deseja excluir todas as pessoas e registros? Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir tudo!',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        this.personManager.clearAll();
        this.renderPeopleList();

        // Alerta de sucesso opcional
        Swal.fire(
            'Excluído!',
            'Todos os registros foram apagados.',
            'success'
        );
    }
}


    async exportData() {
        try {
            const exportedData = await Storage.exportData();
            
            // Mostrar mensagem de sucesso
            this.showNotification(
                `Dados exportados com sucesso!\n` +
                `Pessoas: ${exportedData.people.length}\n` +
                `Registros: ${Object.keys(exportedData.attendanceRecords).length} dias`,
                'success'
            );
            
        } catch (error) {
            this.showNotification('Erro ao exportar dados: ' + error.message, 'error');
        }
    }

    importData() {
        document.getElementById('importFileInput').click();
    }

    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const result = await Storage.importData(file);
            
            const message = 
                `Dados importados com sucesso!\n` +
                `Pessoas: ${result.stats.peopleCount}\n` +
                `Registros: ${result.stats.recordsCount} dias`;
            
            this.showNotification(message, 'success');
            
            // Atualizar a interface
            this.renderPeopleList();
            
        } catch (error) {
            this.showNotification('Erro ao importar dados: ' + error.message, 'error');
        }
        
        // Limpar o input
        event.target.value = '';
    }

    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            white-space: pre-line;
        `;
        
        // Definir cor baseada no tipo
        switch (type) {
            case 'success':
                notification.style.backgroundColor = 'var(--success-color)';
                break;
            case 'error':
                notification.style.backgroundColor = 'var(--danger-color)';
                break;
            default:
                notification.style.backgroundColor = 'var(--accent-color)';
        }
        
        notification.textContent = message;
        
        // Adicionar ao DOM
        document.body.appendChild(notification);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Permitir fechar clicando
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    openPdfReportModal() {
        this.pdfReportModal.classList.add('show');
        this.populateYearOptions();
    }

    closePdfReportModal() {
        this.pdfReportModal.classList.remove('show');
        this.pdfReportForm.reset();
    }

    populateYearOptions() {
        const yearSelect = document.getElementById('reportYear');
        const availableYears = this.pdfGenerator.getAvailableYears();
        
        yearSelect.innerHTML = '';
        
        if (availableYears.length === 0) {
            yearSelect.innerHTML = '<option value="">Nenhum registro encontrado</option>';
            return;
        }
        
        availableYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
        
        // Selecionar o ano atual por padrão
        const currentYear = new Date().getFullYear();
        if (availableYears.includes(currentYear)) {
            yearSelect.value = currentYear;
        }
    }

    handlePdfReportGeneration(e) {
        e.preventDefault();
        
        const year = parseInt(document.getElementById('reportYear').value);
        const quarter = parseInt(document.getElementById('reportQuarter').value);
        const room = document.getElementById('reportRoom').value || null;
        
        if (!year || !quarter) {
            this.showNotification('Por favor, selecione o ano e trimestre.', 'error');
            return;
        }
        
        try {
            const reportData = this.pdfGenerator.generateQuarterlyReport(year, quarter, room);
            
            this.showNotification(
                `Relatório PDF gerado com sucesso!\n` +
                `Período: ${quarter}º Trimestre de ${year}\n` +
                `Pessoas: ${reportData.people}\n` +
                `Dias com registros: ${reportData.totalDays}`,
                'success'
            );
            
            this.closePdfReportModal();
            
        } catch (error) {
            this.showNotification('Erro ao gerar relatório PDF: ' + error.message, 'error');
        }
    }
}