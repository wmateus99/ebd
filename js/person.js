// Componente para gerenciar pessoas
class PersonManager {
    constructor() {
        this.people = Storage.getPeople();
    }

    addPerson(name, birthdate, room) {
        const person = {
            id: Date.now().toString(),
            name: name.trim(),
            birthdate,
            room,
            createdAt: new Date().toISOString()
        };

        this.people.push(person);
        this.save();
        return person;
    }

    deletePerson(id) {
        this.people = this.people.filter(person => person.id !== id);
        this.save();
        
        // Também remove os registros de presença desta pessoa
        const attendanceRecords = Storage.getAttendanceRecords();
        Object.keys(attendanceRecords).forEach(date => {
            if (attendanceRecords[date][id]) {
                delete attendanceRecords[date][id];
            }
        });
        Storage.saveAttendanceRecords(attendanceRecords);
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

    clearAll() {
        this.people = [];
        this.save();
        Storage.clearAll();
    }

    save() {
        Storage.savePeople(this.people);
    }
}