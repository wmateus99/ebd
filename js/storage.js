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
}