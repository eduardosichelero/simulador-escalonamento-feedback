# Trabalho G2 - Simulador de Escalonamento com Feedback Multinível

**Link para o Vídeo da Apresentação:**

## Integrantes do Grupo
* Bernardo Ferrari
* Eduardo da Silva Sichelero
* Enzo Schultz
* Rafael Augusto
* Vitor Quadros

## 1. Descrição do Projeto

Este projeto consiste em uma aplicação web interativa que simula o funcionamento do algoritmo de escalonamento de processos **Filas com Feedback Multinível (Multilevel Feedback Queue - MLFQ)**. A ferramenta permite ao usuário configurar parâmetros do escalonador, adicionar processos com diferentes características e visualizar passo a passo a execução, o estado das filas, uma linha do tempo (Gráfico de Gantt) e as métricas de desempenho resultantes.

O objetivo é fornecer uma compreensão clara e visual de como o MLFQ gerencia processos para otimizar o tempo de resposta e o throughput do sistema, equilibrando as necessidades de processos curtos (interativos) e longos (batch).

## 2. O Algoritmo: Escalonamento com Feedback Multinível (MLFQ)

### Como funciona
O MLFQ é um algoritmo de escalonamento que utiliza múltiplas filas, cada uma com um nível de prioridade diferente. Os processos podem mover-se entre as filas com base em seu comportamento de execução.

As regras fundamentais do MLFQ são:
1.  **Regra 1:** Se a Prioridade(A) > Prioridade(B), A executa e B não.
2.  **Regra 2:** Se a Prioridade(A) = Prioridade(B), A e B executam em modo Round-Robin.
3.  **Regra 3:** Processos novos entram na fila de maior prioridade.
4.  **Regra 4:** Um processo é rebaixado para uma fila de prioridade inferior se usar todo o seu *quantum* (fatia de tempo) naquela fila.
5.  **Regra 5 (Opcional, mas comum):** Periodicamente, todos os processos do sistema são movidos para a fila de maior prioridade para evitar inanição (*starvation*).

Nossa simulação implementa as regras 1, 2, 3 e 4, utilizando três filas:
* **Fila 0 (Prioridade Alta):** Usa Round-Robin (RR) com um *quantum* curto. Ideal para processos novos ou interativos.
* **Fila 1 (Prioridade Média):** Usa RR com um *quantum* maior. Acomoda processos que já executaram um pouco.
* **Fila 2 (Prioridade Baixa):** Usa o algoritmo FCFS (First-Come, First-Served). Destinada a processos longos e intensivos em CPU.

### Características
* **Adaptativo:** Ajusta a prioridade de um processo com base em seu comportamento. Processos que usam muito a CPU são "punidos" (rebaixados), enquanto processos que liberam a CPU rapidamente (ex: I/O-bound) permanecem com alta prioridade.
* **Complexo:** A sua configuração (número de filas, valor dos *quantums*, política de promoção/rebaixamento) é um desafio e afeta diretamente o desempenho.
* **Preemptivo:** Sim, o MLFQ é preemptivo. Um processo pode ser interrompido por duas razões: (1) um processo de maior prioridade chega à fila de prontos; ou (2) ele esgota sua fatia de tempo (*quantum*) na fila atual.

### Onde é Aplicado
Variações do MLFQ são alguns dos algoritmos de escalonamento mais comuns em sistemas operacionais modernos, incluindo:
* **Windows:** Utiliza um escalonador multinível com prioridades que variam de 0 a 31.
* **macOS e Linux:** Também utilizam mecanismos sofisticados de escalonamento com prioridades dinâmicas que se assemelham ao MLFQ, como o CFS (Completely Fair Scheduler) no Linux, que embora não seja um MLFQ clássico, compartilha o objetivo de balancear interatividade e justiça.

### Vantagens e Desvantagens

**Vantagens:**
* **Excelente Tempo de Resposta:** Favorece processos curtos e interativos, mantendo-os nas filas de alta prioridade.
* **Previne Inanição (Starvation):** A política de "envelhecimento" ou "impulso de prioridade" (Regra 5) pode garantir que processos de baixa prioridade eventualmente executem.
* **Equilíbrio:** Consegue um bom balanço entre as necessidades de processos I/O-bound (que precisam de resposta rápida) e CPU-bound (que precisam de processamento contínuo).

**Desvantagens:**
* **Complexidade de Implementação e Sintonia:** Definir os parâmetros ideais é difícil e depende da carga de trabalho típica do sistema.
* **Potencial para "Enganar" o Escalonador:** Um processo poderia, teoricamente, realizar uma operação de I/O pouco antes de seu *quantum* expirar para se manter em uma fila de alta prioridade.

### Deadlock
O algoritmo MLFQ, por si só, **não causa deadlock**. Deadlock é um fenômeno relacionado à contenção de recursos (como arquivos, impressoras, etc.), onde processos esperam uns pelos outros em um ciclo vicioso. O MLFQ lida exclusivamente com a alocação de tempo de CPU, que é um recurso preemptivo e gerenciado pelo escalonador. Portanto, ele não cria as condições necessárias para um deadlock.

## 3. Simulação Desenvolvida

### Linguagem Utilizada
O simulador foi desenvolvido utilizando tecnologias web padrão:
* **HTML:** Para a estrutura da página e dos elementos de visualização.
* **CSS:** Para a estilização, layout e apelo visual da interface.
* **JavaScript (Vanilla):** Para toda a lógica da simulação, manipulação do DOM e interatividade.

### Como Funciona a Entrada de Dados
A entrada de dados é realizada através de uma interface gráfica intuitiva:
1.  **Configuração das Filas:** O usuário pode definir o valor do *quantum* para as filas de alta (Fila 0) e média (Fila 1) prioridade. A Fila 2 é sempre FCFS.
2.  **Adicionar Processo:** O usuário pode adicionar processos individualmente, especificando:
    * **Nome:** Um identificador para o processo (ex: P1).
    * **Tempo de Chegada:** O instante de tempo em que o processo entra no sistema.
    * **Tempo de CPU:** O tempo total que o processo precisa da CPU para ser concluído.
3.  **Carregar Exemplo:** Um botão permite carregar um conjunto pré-definido de processos a partir de um arquivo `exemplos.json`, facilitando testes rápidos.

### Visualização e Resultados Gerados
A simulação fornece feedback visual em tempo real através de vários componentes:
* **Grid de Processos:** Mostra todos os processos adicionados e seu estado atual.
* **Visualização das Filas:** Exibe os processos presentes em cada uma das três filas em qualquer instante de tempo.
* **Timeline de Execução (Gráfico de Gantt):** Uma barra de tempo colorida que mostra qual processo esteve em execução em cada unidade de tempo.
* **Log da Simulação:** Um registro textual detalhado de todos os eventos importantes (chegada, execução, rebaixamento, conclusão).

### Métricas Avaliadas
Ao final da simulação, o sistema calcula e exibe as seguintes métricas de desempenho:
* **Tempo Médio de Espera:** O tempo médio que um processo passa na fila de prontos, aguardando para ser executado.
    * $Tempo\,de\,Espera = Tempo\,de\,Retorno - Tempo\,de\,CPU$
* **Tempo Médio de Retorno (Turnaround Time):** O tempo médio total desde a chegada de um processo até sua conclusão.
    * $Tempo\,de\,Retorno = Tempo\,de\,Conclusão - Tempo\,de\,Chegada$
* **Tempo Médio de Resposta:** O tempo médio entre a chegada de um processo e a *primeira vez* que ele é executado.
* **Taxa de Processamento (Throughput):** O número de processos concluídos por unidade de tempo.
    * $Throughput = \frac{Nº\,Total\,de\,Processos}{Tempo\,Total\,da\,Simulação}$

## 4. Como Executar o Projeto
Existem duas maneiras simples de executar a simulação:

**Opção 1: Abrindo o Arquivo Localmente**
1.  Faça o clone ou download deste repositório.
2.  Navegue até a pasta do projeto.
3.  Abra o arquivo `index.html` diretamente em um navegador web moderno (Google Chrome, Firefox, etc.).

**Opção 2: Usando um Servidor Local (Recomendado)**
Para garantir que o carregamento do arquivo `data/exemplos.json` funcione corretamente sem problemas de política de segurança (CORS), é recomendado usar um servidor local.
1.  Se você tem o Python instalado, navegue até a pasta do projeto via terminal e execute:
    ```bash
    # Para Python 3
    python -m http.server
    ```
2.  Abra seu navegador e acesse `http://localhost:8000`.

## 5. Análise dos Resultados

Utilizando o conjunto de dados de exemplo (`data/exemplos.json`), podemos observar o comportamento característico do MLFQ.

**Dados de Exemplo:**
| Processo | Chegada | Tempo CPU |
|----------|---------|-----------|
| P1       | 0       | 8         |
| P2       | 1       | 4         |
| P3       | 2       | 9         |
| P4       | 3       | 5         |
| P5       | 4       | 2         |

**Comportamento Observado (Quantum Q0=2, Q1=4):**
1.  **P1** chega em T=0, entra na Fila 0 e executa por 2 unidades. É rebaixado para a Fila 1.
2.  **P2** chega em T=1. Em T=2, P1 é preemptado e P2 (agora na Fila 0) começa a executar.
3.  **P5**, sendo um processo muito curto (CPU=2), chega em T=4, entra na Fila 0, executa por 2 unidades e termina rapidamente, demonstrando o bom tempo de resposta do algoritmo para tarefas pequenas.
4.  **P1**, **P3** e **P4**, sendo processos mais longos, são eventualmente rebaixados para a Fila 1 e, posteriormente, para a Fila 2 (FCFS), onde aguardam sua vez de executar até o fim sem mais interrupções por *quantum*.

Esta análise confirma que o algoritmo prioriza processos novos e curtos (como P5), garantindo alta interatividade, enquanto processos longos e intensivos em CPU (como P3) são isolados nas filas de baixa prioridade, impedindo que monopolizem o sistema.

## 6. Referências
* Arpaci-Dusseau, R. H., & Arpaci-Dusseau, A. C. (2018). *Operating Systems: Three Easy Pieces (Chapters on Scheduling)*. Arpaci-Dusseau Books. Disponível em: [https://pages.cs.wisc.edu/~remzi/OSTEP/](https://pages.cs.wisc.edu/~remzi/OSTEP/)
* Silberschatz, A., Galvin, P. B., & Gagne, G. (2018). *Operating System Concepts*. Wiley.
* Wikipedia. (2024). *Multilevel feedback queue*. Disponível em: [https://en.wikipedia.org/wiki/Multilevel_feedback_queue](https://en.wikipedia.org/wiki/Multilevel_feedback_queue)
