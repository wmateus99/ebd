// Componente para gerar relatórios em PDF
class PDFReportGenerator {
    constructor(personManager, attendanceManager) {
        this.personManager = personManager;
        this.attendanceManager = attendanceManager;
    }

    generateQuarterlyReport(year, quarter, room = null) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configurações do documento
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let yPosition = margin;
        
        // Obter dados do trimestre
        const quarterData = this.getQuarterData(year, quarter, room);
        
        // Cabeçalho
        yPosition = this.addHeader(doc, pageWidth, yPosition, year, quarter, room);
        
        // Resumo geral
        yPosition = this.addGeneralSummary(doc, yPosition, quarterData);
        
        // Estatísticas por sala (se não filtrado por sala específica)
        if (!room) {
            yPosition = this.addRoomStatistics(doc, yPosition, quarterData);
        }
        
        // Estatísticas individuais
        yPosition = this.addIndividualStatistics(doc, yPosition, quarterData, pageHeight, margin);
        
        // Rodapé
        this.addFooter(doc, pageHeight);
        
        // Salvar o PDF
        const fileName = `relatorio-ebd-${year}-T${quarter}${room ? '-' + room.replace(' ', '-') : ''}.pdf`;
        doc.save(fileName);
        
        return quarterData;
    }

    getQuarterData(year, quarter, room) {
        const people = room ? 
            this.personManager.getPeople().filter(p => p.room === room) : 
            this.personManager.getPeople();
        
        const quarterMonths = this.getQuarterMonths(quarter);
        const quarterDates = this.getQuarterDates(year, quarter);
        
        const data = {
            year,
            quarter,
            room,
            people: people.length,
            quarterMonths,
            quarterDates,
            totalDays: 0,
            totalPresences: 0,
            totalAbsences: 0,
            monthlyStats: {},
            roomStats: {},
            individualStats: [],
            attendanceDays: []
        };
        
        // Processar registros do trimestre
        const records = this.attendanceManager.records;
        
        Object.keys(records).forEach(date => {
            const recordDate = new Date(date);
            if (this.isDateInQuarter(recordDate, year, quarter)) {
                data.attendanceDays.push(date);
                data.totalDays++;
                
                const month = recordDate.getMonth() + 1;
                if (!data.monthlyStats[month]) {
                    data.monthlyStats[month] = { presences: 0, absences: 0, days: 0 };
                }
                data.monthlyStats[month].days++;
                
                Object.entries(records[date]).forEach(([personId, record]) => {
                    const person = people.find(p => p.id === personId);
                    if (person) {
                        if (record.status === 'present') {
                            data.totalPresences++;
                            data.monthlyStats[month].presences++;
                        } else if (record.status === 'absent') {
                            data.totalAbsences++;
                            data.monthlyStats[month].absences++;
                        }
                    }
                });
            }
        });
        
        // Estatísticas por sala
        if (!room) {
            ['Sala Adultos', 'Sala Jovens', 'Sala Crianças'].forEach(roomName => {
                const roomPeople = this.personManager.getPeople().filter(p => p.room === roomName);
                data.roomStats[roomName] = {
                    people: roomPeople.length,
                    presences: 0,
                    absences: 0
                };
                
                data.attendanceDays.forEach(date => {
                    Object.entries(records[date] || {}).forEach(([personId, record]) => {
                        const person = roomPeople.find(p => p.id === personId);
                        if (person) {
                            if (record.status === 'present') {
                                data.roomStats[roomName].presences++;
                            } else if (record.status === 'absent') {
                                data.roomStats[roomName].absences++;
                            }
                        }
                    });
                });
            });
        }
        
        // Estatísticas individuais
        // Estatísticas individuais
        // Estatísticas individuais
        people.forEach(person => {
            let presences = 0;
            let absences = 0;
            
            // Processar TODOS os registros, não apenas do trimestre
            Object.keys(records).forEach(date => {
                const record = records[date] && records[date][person.id];
                if (record) {
                    if (record.status === 'present') presences++;
                    if (record.status === 'absent') absences++;
                }
            });
            
            const total = presences + absences;
            const rate = total > 0 ? ((presences / total) * 100) : 0;
            
            data.individualStats.push({
                name: person.name,
                room: person.room,
                presences,
                absences,
                total,
                rate: Math.round(rate * 10) / 10
            });
        });
        
        // Ordenar por taxa de presença
        data.individualStats.sort((a, b) => b.rate - a.rate);
        
        return data;
    }

    getQuarterMonths(quarter) {
        const months = {
            1: ['Janeiro', 'Fevereiro', 'Março'],
            2: ['Abril', 'Maio', 'Junho'],
            3: ['Julho', 'Agosto', 'Setembro'],
            4: ['Outubro', 'Novembro', 'Dezembro']
        };
        return months[quarter];
    }

    getQuarterDates(year, quarter) {
        const startMonth = (quarter - 1) * 3;
        const endMonth = startMonth + 2;
        
        const startDate = new Date(year, startMonth, 1);
        const endDate = new Date(year, endMonth + 1, 0);
        
        return { startDate, endDate };
    }

    isDateInQuarter(date, year, quarter) {
        const { startDate, endDate } = this.getQuarterDates(year, quarter);
        return date >= startDate && date <= endDate;
    }

    addHeader(doc, pageWidth, yPosition, year, quarter, room) {
        // Título principal
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('RELATÓRIO TRIMESTRAL - EBD', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;
        
        doc.setFontSize(16);
        doc.text('Manancial de Amor', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;
        
        // Informações do período
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        const quarterText = `${quarter}º Trimestre de ${year}`;
        const monthsText = this.getQuarterMonths(quarter).join(', ');
        
        doc.text(`Período: ${quarterText}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Meses: ${monthsText}`, 20, yPosition);
        yPosition += 7;
        
        if (room) {
            doc.text(`Sala: ${room}`, 20, yPosition);
            yPosition += 7;
        }
        
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);
        yPosition += 15;
        
        // Linha separadora
        doc.setLineWidth(0.5);
        doc.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 10;
        
        return yPosition;
    }

    addGeneralSummary(doc, yPosition, data) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('RESUMO GERAL', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        
        const totalRecords = data.totalPresences + data.totalAbsences;
        const presenceRate = totalRecords > 0 ? ((data.totalPresences / totalRecords) * 100) : 0;
        
        const summaryData = [
            `Total de Pessoas: ${data.people}`,
            `Dias com Registros: ${data.totalDays}`,
            `Total de Presenças: ${data.totalPresences}`,
            `Total de Faltas: ${data.totalAbsences}`,
            `Taxa de Presença: ${Math.round(presenceRate * 10) / 10}%`
        ];
        
        summaryData.forEach(text => {
            doc.text(text, 25, yPosition);
            yPosition += 6;
        });
        
        yPosition += 10;
        return yPosition;
    }

    addRoomStatistics(doc, yPosition, data) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('ESTATÍSTICAS POR SALA', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        
        Object.entries(data.roomStats).forEach(([roomName, stats]) => {
            const total = stats.presences + stats.absences;
            const rate = total > 0 ? ((stats.presences / total) * 100) : 0;
            
            doc.setFont(undefined, 'bold');
            doc.text(roomName, 25, yPosition);
            yPosition += 6;
            
            doc.setFont(undefined, 'normal');
            doc.text(`  Pessoas: ${stats.people}`, 30, yPosition);
            yPosition += 5;
            doc.text(`  Presenças: ${stats.presences}`, 30, yPosition);
            yPosition += 5;
            doc.text(`  Faltas: ${stats.absences}`, 30, yPosition);
            yPosition += 5;
            doc.text(`  Taxa: ${Math.round(rate * 10) / 10}%`, 30, yPosition);
            yPosition += 8;
        });
        
        yPosition += 5;
        return yPosition;
    }

    addIndividualStatistics(doc, yPosition, data, pageHeight, margin) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('ESTATÍSTICAS INDIVIDUAIS', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        
        // Cabeçalho da tabela
        const headers = ['Nome', 'Sala', 'Presenças', 'Faltas', 'Taxa'];
        const colWidths = [60, 40, 25, 25, 25];
        let xPosition = 20;
        
        headers.forEach((header, index) => {
            doc.text(header, xPosition, yPosition);
            xPosition += colWidths[index];
        });
        yPosition += 5;
        
        // Linha separadora
        doc.setLineWidth(0.3);
        doc.line(20, yPosition, 175, yPosition);
        yPosition += 5;
        
        doc.setFont(undefined, 'normal');
        
        // Dados individuais
        data.individualStats.forEach(person => {
            // Verificar se precisa de nova página
            if (yPosition > pageHeight - 30) {
                doc.addPage();
                yPosition = margin;
            }
            
            xPosition = 20;
            const rowData = [
                person.name.length > 25 ? person.name.substring(0, 22) + '...' : person.name,
                person.room.replace('Sala ', ''),
                person.presences.toString(),
                person.absences.toString(),
                `${person.rate}%`
            ];
            
            rowData.forEach((data, index) => {
                doc.text(data, xPosition, yPosition);
                xPosition += colWidths[index];
            });
            yPosition += 5;
        });
        
        yPosition += 10;
        return yPosition;
    }

    addMonthlyChart(doc, yPosition, data, pageWidth, pageHeight, margin) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 80) {
            doc.addPage();
            yPosition = margin;
        }
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('FREQUÊNCIA MENSAL', 20, yPosition);
        yPosition += 15;
        
        // Gráfico simples de barras
        const chartWidth = 150;
        const chartHeight = 40;
        const chartX = 20;
        const chartY = yPosition;
        
        // Encontrar valor máximo para escala
        const maxValue = Math.max(
            ...Object.values(data.monthlyStats).map(stat => stat.presences + stat.absences)
        );
        
        if (maxValue > 0) {
            const months = this.getQuarterMonths(data.quarter);
            const barWidth = chartWidth / months.length;
            
            months.forEach((month, index) => {
                const monthNum = (data.quarter - 1) * 3 + index + 1;
                const stats = data.monthlyStats[monthNum] || { presences: 0, absences: 0 };
                const total = stats.presences + stats.absences;
                
                if (total > 0) {
                    const barHeight = (total / maxValue) * chartHeight;
                    const x = chartX + (index * barWidth);
                    
                    // Barra de presenças (verde)
                    const presenceHeight = (stats.presences / total) * barHeight;
                    doc.setFillColor(40, 167, 69); // Verde
                    doc.rect(x, chartY + chartHeight - barHeight, barWidth - 2, presenceHeight, 'F');
                    
                    // Barra de faltas (vermelho)
                    const absenceHeight = barHeight - presenceHeight;
                    doc.setFillColor(220, 53, 69); // Vermelho
                    doc.rect(x, chartY + chartHeight - barHeight, barWidth - 2, absenceHeight, 'F');
                }
                
                // Label do mês
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0);
                doc.text(month.substring(0, 3), chartX + (index * barWidth) + barWidth/2, chartY + chartHeight + 8, { align: 'center' });
            });
        }
        
        // Legenda
        yPosition = chartY + chartHeight + 20;
        doc.setFontSize(10);
        doc.setFillColor(40, 167, 69);
        doc.rect(chartX, yPosition, 5, 5, 'F');
        doc.text('Presenças', chartX + 8, yPosition + 4);
        
        doc.setFillColor(220, 53, 69);
        doc.rect(chartX + 50, yPosition, 5, 5, 'F');
        doc.text('Faltas', chartX + 58, yPosition + 4);
        
        return yPosition + 15;
    }

    addFooter(doc, pageHeight) {
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            'Relatório gerado automaticamente pelo Sistema de Presença - WM',
            105,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    getAvailableYears() {
        const records = this.attendanceManager.records;
        const years = new Set();
        
        Object.keys(records).forEach(date => {
            const year = new Date(date).getFullYear();
            years.add(year);
        });
        
        return Array.from(years).sort((a, b) => b - a);
    }
}