// Componente para gerenciar o armazenamento no Firebase Firestore
class Storage {
    static PEOPLE_COLLECTION = 'people';
    static ATTENDANCE_COLLECTION = 'attendance_records';
    static SETTINGS_DOC = 'app_settings';
    
    // Cache local para melhor performance
    static _peopleCache = null;
    static _attendanceCache = null;
    static _isOnline = navigator.onLine;
    
    static async initializeFirestore() {
        // Aguardar Firebase estar disponível
        while (!window.firebaseDb) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Monitorar status de conexão
        window.addEventListener('online', () => {
            this._isOnline = true;
            this.syncLocalToFirestore();
        });
        
        window.addEventListener('offline', () => {
            this._isOnline = false;
        });
        
        return window.firebaseDb;
    }
    
    static async getPeople() {
        try {
            const db = await this.initializeFirestore();
            
            if (!this._isOnline) {
                // Modo offline - usar localStorage
                const data = localStorage.getItem('attendance_people');
                return data ? JSON.parse(data) : [];
            }
            
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js');
            const querySnapshot = await getDocs(collection(db, this.PEOPLE_COLLECTION));
            
            const people = [];
            querySnapshot.forEach((doc) => {
                people.push({ id: doc.id, ...doc.data() });
            });
            
            // Cache local
            this._peopleCache = people;
            localStorage.setItem('attendance_people', JSON.stringify(people));
            
            return people;
        } catch (error) {
            console.error('Erro ao buscar pessoas:', error);
            // Fallback para localStorage
            const data = localStorage.getItem('attendance_people');
            return data ? JSON.parse(data) : [];
        }
    }
    
    static async savePeople(people) {
        try {
            // Salvar localmente primeiro
            localStorage.setItem('attendance_people', JSON.stringify(people));
            this._peopleCache = people;
            
            if (!this._isOnline) {
                return; // Será sincronizado quando voltar online
            }
            
            const db = await this.initializeFirestore();
            const { collection, doc, setDoc, deleteDoc, getDocs } = await import('https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js');
            
            // Limpar coleção existente
            const querySnapshot = await getDocs(collection(db, this.PEOPLE_COLLECTION));
            const deletePromises = [];
            querySnapshot.forEach((docSnapshot) => {
                deletePromises.push(deleteDoc(doc(db, this.PEOPLE_COLLECTION, docSnapshot.id)));
            });
            await Promise.all(deletePromises);
            
            // Adicionar novas pessoas
            const savePromises = people.map(person => {
                const docRef = doc(db, this.PEOPLE_COLLECTION, person.id);
                return setDoc(docRef, {
                    name: person.name,
                    birthdate: person.birthdate,
                    room: person.room,
                    createdAt: person.createdAt
                });
            });
            
            await Promise.all(savePromises);
        } catch (error) {
            console.error('Erro ao salvar pessoas:', error);
        }
    }
    
    static async getAttendanceRecords() {
        try {
            const db = await this.initializeFirestore();
            
            if (!this._isOnline) {
                // Modo offline - usar localStorage
                const data = localStorage.getItem('attendance_records');
                return data ? JSON.parse(data) : {};
            }
            
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js');
            const querySnapshot = await getDocs(collection(db, this.ATTENDANCE_COLLECTION));
            
            const records = {};
            querySnapshot.forEach((doc) => {
                records[doc.id] = doc.data();
            });
            
            // Cache local
            this._attendanceCache = records;
            localStorage.setItem('attendance_records', JSON.stringify(records));
            
            return records;
        } catch (error) {
            console.error('Erro ao buscar registros:', error);
            // Fallback para localStorage
            const data = localStorage.getItem('attendance_records');
            return data ? JSON.parse(data) : {};
        }
    }
    
    static async saveAttendanceRecords(records) {
        try {
            // Salvar localmente primeiro
            localStorage.setItem('attendance_records', JSON.stringify(records));
            this._attendanceCache = records;
            
            if (!this._isOnline) {
                return; // Será sincronizado quando voltar online
            }
            
            const db = await this.initializeFirestore();
            const { collection, doc, setDoc, deleteDoc, getDocs } = await import('https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js');
            
            // Limpar coleção existente
            const querySnapshot = await getDocs(collection(db, this.ATTENDANCE_COLLECTION));
            const deletePromises = [];
            querySnapshot.forEach((docSnapshot) => {
                deletePromises.push(deleteDoc(doc(db, this.ATTENDANCE_COLLECTION, docSnapshot.id)));
            });
            await Promise.all(deletePromises);
            
            // Adicionar novos registros
            const savePromises = Object.entries(records).map(([date, dayRecords]) => {
                const docRef = doc(db, this.ATTENDANCE_COLLECTION, date);
                return setDoc(docRef, dayRecords);
            });
            
            await Promise.all(savePromises);
        } catch (error) {
            console.error('Erro ao salvar registros:', error);
        }
    }
    
    static async clearAll() {
        try {
            // Limpar localStorage
            localStorage.removeItem('attendance_people');
            localStorage.removeItem('attendance_records');
            this._peopleCache = null;
            this._attendanceCache = null;
            
            if (!this._isOnline) {
                return;
            }
            
            const db = await this.initializeFirestore();
            const { collection, getDocs, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js');
            
            // Limpar Firestore
            const collections = [this.PEOPLE_COLLECTION, this.ATTENDANCE_COLLECTION];
            
            for (const collectionName of collections) {
                const querySnapshot = await getDocs(collection(db, collectionName));
                const deletePromises = [];
                querySnapshot.forEach((doc) => {
                    deletePromises.push(deleteDoc(doc.ref));
                });
                await Promise.all(deletePromises);
            }
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
        }
    }
    
    static async syncLocalToFirestore() {
        if (!this._isOnline) return;
        
        try {
            // Sincronizar pessoas
            const localPeople = localStorage.getItem('attendance_people');
            if (localPeople) {
                await this.savePeople(JSON.parse(localPeople));
            }
            
            // Sincronizar registros
            const localRecords = localStorage.getItem('attendance_records');
            if (localRecords) {
                await this.saveAttendanceRecords(JSON.parse(localRecords));
            }
        } catch (error) {
            console.error('Erro na sincronização:', error);
        }
    }
    
    // Métodos de exportação e importação (mantidos)
    static async exportData() {
        const data = {
            people: await this.getPeople(),
            attendanceRecords: await this.getAttendanceRecords(),
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
            
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validar estrutura dos dados
                    if (!this.validateImportData(data)) {
                        reject(new Error('Formato de arquivo inválido'));
                        return;
                    }
                    
                    // Fazer backup dos dados atuais
                    const currentData = {
                        people: await this.getPeople(),
                        attendanceRecords: await this.getAttendanceRecords()
                    };
                    
                    // Importar novos dados
                    await this.savePeople(data.people || []);
                    await this.saveAttendanceRecords(data.attendanceRecords || {});
                    
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
    
    static async mergeData(importedData, mergeMode = 'replace') {
        const currentPeople = await this.getPeople();
        const currentRecords = await this.getAttendanceRecords();
        
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
        
        await this.savePeople(finalPeople);
        await this.saveAttendanceRecords(finalRecords);
        
        return {
            peopleCount: finalPeople.length,
            recordsCount: Object.keys(finalRecords).length
        };
    }
}