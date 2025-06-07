// Componente para gerenciar pessoas
class PersonManager {
    constructor() {
        this.people = [];
        // Remover this.loadPeople() do construtor
    }

    async loadPeople() {
        this.people = await Storage.getPeople();
    }

    async addPerson(name, birthdate, room) {
        const person = {
            id: Date.now().toString(),
            name: name.trim(),
            birthdate,
            room,
            createdAt: new Date().toISOString()
        };

        this.people.push(person);
        await this.save();
        return person;
    }

    async deletePerson(id) {
        this.people = this.people.filter(person => person.id !== id);
        await this.save();
        
        // Também remove os registros de presença desta pessoa
        const attendanceRecords = await Storage.getAttendanceRecords();
        Object.keys(attendanceRecords).forEach(date => {
            if (attendanceRecords[date][id]) {
                delete attendanceRecords[date][id];
            }
        });
        await Storage.saveAttendanceRecords(attendanceRecords);
    }

    getPeople() {
        return this.people;
    }

    getPersonById(id) {
        return this.people.find(person => person.id === id);
    }

    searchPeople(query) {
        if (!query) return this.people;
        
        const searchTerm = query.toLowerCase();
        return this.people.filter(person => 
            person.name.toLowerCase().includes(searchTerm)
        );
    }

    filterByRoom(room) {
        if (!room) return this.people;
        return this.people.filter(person => person.room === room);
    }

    async clearAll() {
        this.people = [];
        await this.save();
        await Storage.clearAll();
    }

    async save() {
        await Storage.savePeople(this.people);
    }
}