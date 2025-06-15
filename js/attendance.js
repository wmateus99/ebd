// Componente para gerenciar presenças
class AttendanceManager {
    constructor() {
        this.records = {};
        // Remover this.loadRecords() do construtor
    }

    async loadRecords() {
        this.records = await Storage.getAttendanceRecords();
    }

    async markAttendance(personId, date, status, reason = null) {
        if (!this.records[date]) {
            this.records[date] = {};
        }
        
        this.records[date][personId] = {
            status, // 'present', 'absent', ou 'justified'
            timestamp: new Date().toISOString(),
            reason: reason // motivo da falta justificada
        };
        
        await this.save();
    }

    async revokeAttendance(personId, date) {
        if (this.records[date] && this.records[date][personId]) {
            delete this.records[date][personId];
            
            // Remove a data se não houver mais registros
            if (Object.keys(this.records[date]).length === 0) {
                delete this.records[date];
            }
            
            await this.save();
        }
    }

    getAttendanceStatus(personId, date) {
        if (this.records[date] && this.records[date][personId]) {
            return this.records[date][personId].status;
        }
        return null;
    }

    getAbsenceCount(personId) {
        let count = 0;
        
        Object.keys(this.records).forEach(date => {
            if (this.records[date][personId] && 
                this.records[date][personId].status === 'absent') {
                count++;
            }
        });
        
        return count;
    }

    getJustifiedAbsenceCount(personId) {
        let count = 0;
        
        Object.keys(this.records).forEach(date => {
            if (this.records[date][personId] && 
                this.records[date][personId].status === 'justified') {
                count++;
            }
        });
        
        return count;
    }

    getAttendanceRecord(personId, date) {
        if (this.records[date] && this.records[date][personId]) {
            return this.records[date][personId];
        }
        return null;
    }

    getPresenceCount(personId) {
        let count = 0;
        
        Object.keys(this.records).forEach(date => {
            if (this.records[date][personId] && 
                this.records[date][personId].status === 'present') {
                count++;
            }
        });
        
        return count;
    }

    async save() {
        await Storage.saveAttendanceRecords(this.records);
    }
}