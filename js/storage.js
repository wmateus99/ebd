// Componente para gerenciar o armazenamento local
class Storage {
    static PEOPLE_KEY = 'attendance_people';
    static ATTENDANCE_KEY = 'attendance_records';

    static getPeople() {
        const data = localStorage.getItem(this.PEOPLE_KEY);
        return data ? JSON.parse(data) : [];
    }

    static savePeople(people) {
        localStorage.setItem(this.PEOPLE_KEY, JSON.stringify(people));
    }

    static getAttendanceRecords() {
        const data = localStorage.getItem(this.ATTENDANCE_KEY);
        return data ? JSON.parse(data) : {};
    }

    static saveAttendanceRecords(records) {
        localStorage.setItem(this.ATTENDANCE_KEY, JSON.stringify(records));
    }

    static clearAll() {
        localStorage.removeItem(this.PEOPLE_KEY);
        localStorage.removeItem(this.ATTENDANCE_KEY);
    }

    // Métodos de exportação e importação
    static exportData() {
        const data = {
            people: this.getPeople(),
            attendanceRecords: this.getAttendanceRecords(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `ebd-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return data;
    }

    static importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validar estrutura dos dados
                    if (!this.validateImportData(data)) {
                        reject(new Error('Formato de arquivo inválido'));
                        return;
                    }
                    
                    // Fazer backup dos dados atuais
                    const currentData = {
                        people: this.getPeople(),
                        attendanceRecords: this.getAttendanceRecords()
                    };
                    
                    // Importar novos dados
                    this.savePeople(data.people || []);
                    this.saveAttendanceRecords(data.attendanceRecords || {});
                    
                    resolve({
                        imported: data,
                        backup: currentData,
                        stats: {
                            peopleCount: (data.people || []).length,
                            recordsCount: Object.keys(data.attendanceRecords || {}).length
                        }
                    });
                    
                } catch (error) {
                    reject(new Error('Erro ao processar arquivo: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Erro ao ler arquivo'));
            };
            
            reader.readAsText(file);
        });
    }

    static validateImportData(data) {
        // Verificar se tem a estrutura básica
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // Verificar se people é um array (pode estar vazio)
        if (data.people && !Array.isArray(data.people)) {
            return false;
        }
        
        // Verificar se attendanceRecords é um objeto (pode estar vazio)
        if (data.attendanceRecords && typeof data.attendanceRecords !== 'object') {
            return false;
        }
        
        // Validar estrutura das pessoas
        if (data.people) {
            for (const person of data.people) {
                if (!person.id || !person.name || !person.room || !person.birthdate) {
                    return false;
                }
            }
        }
        
        return true;
    }

    static mergeData(importedData, mergeMode = 'replace') {
        const currentPeople = this.getPeople();
        const currentRecords = this.getAttendanceRecords();
        
        let finalPeople = [];
        let finalRecords = {};
        
        if (mergeMode === 'replace') {
            finalPeople = importedData.people || [];
            finalRecords = importedData.attendanceRecords || {};
        } else if (mergeMode === 'merge') {
            // Mesclar pessoas (evitar duplicatas por ID)
            const peopleMap = new Map();
            
            // Adicionar pessoas atuais
            currentPeople.forEach(person => peopleMap.set(person.id, person));
            
            // Adicionar/sobrescrever com pessoas importadas
            (importedData.people || []).forEach(person => peopleMap.set(person.id, person));
            
            finalPeople = Array.from(peopleMap.values());
            
            // Mesclar registros de presença
            finalRecords = { ...currentRecords, ...(importedData.attendanceRecords || {}) };
        }
        
        this.savePeople(finalPeople);
        this.saveAttendanceRecords(finalRecords);
        
        return {
            peopleCount: finalPeople.length,
            recordsCount: Object.keys(finalRecords).length
        };
    }
}