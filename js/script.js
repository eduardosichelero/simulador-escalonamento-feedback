class Process {
    constructor(name, arrivalTime, burstTime) {
        this.name = name;
        this.arrivalTime = arrivalTime;
        this.burstTime = burstTime;
        this.remainingTime = burstTime;
        this.currentQueue = 0;
        this.waitingTime = 0;
        this.turnaroundTime = 0;
        this.completionTime = 0;
        this.responseTime = -1;
        this.quantumUsed = 0;
    }
}

class MultilevelFeedbackQueue {
    constructor() {
        this.processes = [];
        this.allProcesses = []; // Lista imutável de todos os processos
        this.queues = [[], [], []]; // 3 filas
        this.quantums = [2, 4, Infinity]; // Quantum para cada fila
        this.currentTime = 0;
        this.completedProcesses = [];
        this.timeline = [];
        this.isRunning = false;
        this.log = [];
    }

    addProcess(process) {
        this.processes.push(process);
        this.allProcesses.push(process); // Adiciona também na lista imutável
        this.updateProcessesDisplay();
        this.logMessage(`✅ Processo ${process.name} adicionado (Chegada: ${process.arrivalTime}, CPU: ${process.burstTime})`);
    }

    logMessage(message) {
        this.log.push(`[T=${this.currentTime}] ${message}`);
        this.updateLog();
    }

    updateLog() {
        const logElement = document.getElementById('simulationLog');
        logElement.innerHTML = this.log.slice(-50).join('\n');
        logElement.scrollTop = logElement.scrollHeight;
    }

    updateProcessesDisplay() {
        const grid = document.getElementById('processesGrid');
        grid.innerHTML = '';
        this.processes.forEach(process => {
            const card = document.createElement('div');
            card.className = 'process-card';
            card.innerHTML = `
                <h4>${process.name}</h4>
                <p>Chegada: ${process.arrivalTime}</p>
                <p>CPU: ${process.burstTime}</p>
                <p>Restante: ${process.remainingTime}</p>
                <p>Fila: ${process.currentQueue}</p>
            `;
            grid.appendChild(card);
        });
    }

    updateQueuesDisplay() {
        for (let i = 0; i < 3; i++) {
            const queueElement = document.getElementById(`queue${i}`);
            queueElement.innerHTML = '';
            // Adiciona apenas os processos que estão na fila i
            this.queues[i].forEach(process => {
                const processDiv = document.createElement('div');
                processDiv.className = 'process-in-queue';
                processDiv.textContent = `${process.name} (${process.remainingTime})`;
                queueElement.appendChild(processDiv);
            });
        }
    }

    updateTimeline() {
        const timelineBar = document.getElementById('timelineBar');
        timelineBar.innerHTML = '';
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
        ];
        this.timeline.forEach((segment, index) => {
            const segmentDiv = document.createElement('div');
            segmentDiv.className = 'timeline-segment';
            segmentDiv.style.backgroundColor = colors[this.processes.findIndex(p => p.name === segment.process) % colors.length];
            segmentDiv.style.width = `${(segment.duration / Math.max(this.currentTime, 1)) * 100}%`;
            segmentDiv.textContent = `${segment.process} (${segment.duration})`;
            segmentDiv.title = `Processo: ${segment.process}, Tempo: ${segment.startTime}-${segment.startTime + segment.duration}, Fila: ${segment.queue}`;
            timelineBar.appendChild(segmentDiv);
        });
    }

    updateStatistics() {
        if (this.completedProcesses.length === 0) return;
        const avgWaitingTime = this.completedProcesses.reduce((sum, p) => sum + p.waitingTime, 0) / this.completedProcesses.length;
        const avgTurnaroundTime = this.completedProcesses.reduce((sum, p) => sum + p.turnaroundTime, 0) / this.completedProcesses.length;
        const avgResponseTime = this.completedProcesses.reduce((sum, p) => sum + p.responseTime, 0) / this.completedProcesses.length;
        const throughput = this.completedProcesses.length / this.currentTime;
        const statsHTML = `
            <div class="stat-card">
                <div class="stat-value">${avgWaitingTime.toFixed(2)}</div>
                <div class="stat-label">Tempo Médio de Espera</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${avgTurnaroundTime.toFixed(2)}</div>
                <div class="stat-label">Tempo Médio de Retorno</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${avgResponseTime.toFixed(2)}</div>
                <div class="stat-label">Tempo Médio de Resposta</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${throughput.toFixed(3)}</div>
                <div class="stat-label">Taxa de Processamento</div>
            </div>
        `;
        document.getElementById('statistics').innerHTML = statsHTML;
    }

    checkArrivals() {
        this.processes.forEach(process => {
            if (process.arrivalTime <= this.currentTime && !this.queues.flat().includes(process) && !this.completedProcesses.includes(process)) {
                this.queues[0].push(process); // Novos processos sempre na fila 0
                this.logMessage(`🚀 Processo ${process.name} chegou e foi adicionado à Fila 0`);
            }
        });
    }

    getNextProcess() {
        for (let i = 0; i < 3; i++) {
            if (this.queues[i].length > 0) {
                return { process: this.queues[i][0], queueIndex: i };
            }
        }
        return null;
    }

    executeProcess(process, queueIndex) {
        const quantum = this.quantums[queueIndex];
        const executionTime = Math.min(process.remainingTime, quantum);
        // Tempo de resposta (primeira execução)
        if (process.responseTime === -1) {
            process.responseTime = this.currentTime - process.arrivalTime;
        }
        this.logMessage(`⚡ Executando ${process.name} da Fila ${queueIndex} por ${executionTime} unidades`);
        // Adicionar ao timeline
        this.timeline.push({
            process: process.name,
            startTime: this.currentTime,
            duration: executionTime,
            queue: queueIndex
        });
        this.currentTime += executionTime;
        process.remainingTime -= executionTime;
        process.quantumUsed += executionTime;
        // Remover da fila atual
        this.queues[queueIndex].shift();
        if (process.remainingTime === 0) {
            // Processo completado
            process.completionTime = this.currentTime;
            process.turnaroundTime = process.completionTime - process.arrivalTime;
            process.waitingTime = process.turnaroundTime - process.burstTime;
            this.completedProcesses.push(process);
            this.logMessage(`✅ Processo ${process.name} completado!`);
        } else {
            // Processo não completado
            if (queueIndex < 2 && process.quantumUsed >= quantum) {
                // Mover para fila de menor prioridade
                process.currentQueue = queueIndex + 1;
                this.queues[queueIndex + 1].push(process);
                process.quantumUsed = 0;
                this.logMessage(`⬇️ Processo ${process.name} movido para Fila ${queueIndex + 1}`);
            } else {
                // Voltar para a mesma fila (FCFS na fila 2)
                this.queues[queueIndex].push(process);
                if (queueIndex < 2) process.quantumUsed = 0;
            }
        }
        // Atualizar tempos de espera para outros processos
        this.queues.flat().forEach(p => {
            if (p !== process && p.remainingTime > 0) {
                p.waitingTime += executionTime;
            }
        });
        // Remover processos finalizados de todas as filas para evitar loop infinito
        for (let i = 0; i < 3; i++) {
            this.queues[i] = this.queues[i].filter(p => p.remainingTime > 0);
        }
        // --- CORREÇÃO: Remover processos já completados da fila de processos também ---
        this.processes = this.processes.filter(p => p.remainingTime > 0 || this.completedProcesses.includes(p));
    }

    simulateStep() {
        if (this.completedProcesses.length >= this.allProcesses.length) {
            this.logMessage(`🏁 Simulação concluída! Tempo total: ${this.currentTime}`);
            this.isRunning = false;
            return;
        }
        // Log do estado das filas
        let filasLog = this.queues.map((fila, idx) => `Fila ${idx}: [${fila.map(p => p.name + ' (' + p.remainingTime + ')').join(', ')}]`).join(' | ');
        this.logMessage(`Filas: ${filasLog}`);
        // Executa apenas UM passo por chamada
        this.checkArrivals();
        const next = this.getNextProcess();
        if (next) {
            this.logMessage(`Processo selecionado: ${next.process.name} (Fila ${next.queueIndex})`);
            this.executeProcess(next.process, next.queueIndex);
        } else {
            this.currentTime++;
            this.logMessage(`💤 CPU ociosa no tempo ${this.currentTime}`);
        }
        this.updateQueuesDisplay();
        this.updateProcessesDisplay();
        this.updateTimeline();
        this.updateStatistics();
        // Só agenda o próximo passo se ainda estiver rodando
        if (this.isRunning) {
            setTimeout(() => this.simulateStep(), 350); // Mais lento para garantir visualização
        }
    }

    simulate() {
        if (!this.isRunning) return; // Garante que não rode se não estiver ativo
        this.logMessage(`🎬 Iniciando simulação do Escalonamento com Feedback Multinível`);
        this.logMessage(`📊 Configuração: Fila 0 (Q=${this.quantums[0]}), Fila 1 (Q=${this.quantums[1]}), Fila 2 (FCFS)`);
        this.simulateStep();
    }

    reset() {
        this.processes = [];
        this.allProcesses = [];
        this.queues = [[], [], []];
        this.currentTime = 0;
        this.completedProcesses = [];
        this.timeline = [];
        this.isRunning = false;
        this.log = [];
        this.quantums = [
            parseInt(document.getElementById('quantum0').value),
            parseInt(document.getElementById('quantum1').value),
            Infinity
        ];
        this.updateProcessesDisplay();
        this.updateQueuesDisplay();
        this.updateTimeline();
        document.getElementById('statistics').innerHTML = '';
        document.getElementById('simulationLog').innerHTML = '';
        this.logMessage(`🔄 Sistema resetado`);
    }
}

// Instância global do escalonador
const scheduler = new MultilevelFeedbackQueue();

function addProcess() {
    const name = document.getElementById('processName').value;
    const arrivalTime = parseInt(document.getElementById('arrivalTime').value);
    const burstTime = parseInt(document.getElementById('burstTime').value);
    if (!name || isNaN(arrivalTime) || isNaN(burstTime) || burstTime <= 0) {
        alert('Por favor, preencha todos os campos corretamente!');
        return;
    }
    const process = new Process(name, arrivalTime, burstTime);
    scheduler.addProcess(process);
    // Limpar campos
    document.getElementById('processName').value = '';
    document.getElementById('arrivalTime').value = '0';
    document.getElementById('burstTime').value = '5';
}

function startSimulation() {
    if (scheduler.processes.length === 0) {
        alert('Adicione pelo menos um processo antes de iniciar a simulação!');
        return;
    }
    if (scheduler.isRunning) {
        alert('Simulação já está em execução!');
        return;
    }
    scheduler.isRunning = true;
    scheduler.quantums = [
        parseInt(document.getElementById('quantum0').value),
        parseInt(document.getElementById('quantum1').value),
        Infinity
    ];
    setTimeout(() => scheduler.simulate(), 100);
}

function resetSimulation() {
    scheduler.reset();
}

function addExampleProcesses() {
    scheduler.reset();
    const examples = [
        new Process('P1', 0, 8),
        new Process('P2', 1, 4),
        new Process('P3', 2, 9),
        new Process('P4', 3, 5),
        new Process('P5', 4, 2)
    ];
    examples.forEach(process => scheduler.addProcess(process));
    startSimulation(); // <-- Adicione esta linha
}

// Inicializar com exemplo
window.onload = function() {
    scheduler.logMessage(`🎯 Simulador de Escalonamento com Feedback Multinível iniciado`);
    scheduler.logMessage(`💡 Clique em "Carregar Exemplo" para ver um conjunto de processos de teste`);
};