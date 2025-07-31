document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const taskDateInput = document.getElementById('taskDate');
    const taskTimeInput = document.getElementById('taskTime');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const filterButtons = document.querySelectorAll('.filter-btn'); // Seleciona todos os botões de filtro
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');

    let tasks = []; // Array para armazenar as tarefas

    // --- Funções de Persistência (Local Storage) ---
    function loadTasks() {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
            renderTasks();
        }
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // --- Função de Renderização das Tarefas ---
    function renderTasks(filter = 'all') {
        taskList.innerHTML = ''; // Limpa a lista antes de renderizar

        const filteredTasks = tasks.filter(task => {
            if (filter === 'all') return true;
            if (filter === 'pending') return task.status === 'pending';
            if (filter === 'completed') return task.status === 'completed';
            if (filter === 'ignored') return task.status === 'ignored'; // Atualizado para 'ignored'
        });

        if (filteredTasks.length === 0) {
            const noTasksMessage = document.createElement('p');
            noTasksMessage.textContent = `Nenhuma tarefa para o status "${filter === 'all' ? 'todas' : filter === 'pending' ? 'em andamento' : filter === 'completed' ? 'concluídas' : 'ignoradas'}".`;
            noTasksMessage.style.textAlign = 'center';
            noTasksMessage.style.marginTop = '20px';
            noTasksMessage.style.opacity = '0.7';
            taskList.appendChild(noTasksMessage);
            return;
        }

        filteredTasks.forEach(task => {
            const listItem = document.createElement('li');
            listItem.classList.add('task-item', task.status);
            listItem.setAttribute('data-id', task.id);

            // Formata a data e hora para exibição
            let dateTimeString = '';
            if (task.date) {
                const dateObj = new Date(`${task.date}T${task.time || '00:00'}`); // Combina para parsear corretamente
                const formattedDate = dateObj.toLocaleDateString('pt-BR');
                const formattedTime = task.time ? ` às ${task.time}` : '';
                dateTimeString = `${formattedDate}${formattedTime}`;
            }

            listItem.innerHTML = `
                <div class="task-content">
                    <span class="task-text">${task.description}</span>
                    ${dateTimeString ? `<span class="task-datetime">${dateTimeString}</span>` : ''}
                </div>
                <div class="task-actions">
                    <button class="complete-btn" title="Marcar como Concluída">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="ignore-btn" title="Marcar como Ignorada">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="edit-btn" title="Editar Tarefa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" title="Deletar Tarefa">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            taskList.appendChild(listItem);
        });
        saveTasks();
    }

    // --- Adicionar Tarefa ---
    addTaskBtn.addEventListener('click', () => {
        const description = taskInput.value.trim();
        const taskDate = taskDateInput.value;
        const taskTime = taskTimeInput.value;

        if (description === '') {
            alert('A tarefa não pode ser vazia!');
            return;
        }

        const newTask = {
            id: Date.now(), // ID único
            description: description,
            date: taskDate, // Adiciona a data
            time: taskTime, // Adiciona a hora
            status: 'pending' // Status inicial
        };

        tasks.push(newTask);
        taskInput.value = ''; // Limpa o input principal
        taskDateInput.value = ''; // Limpa o input de data
        taskTimeInput.value = ''; // Limpa o input de hora

        // Obtém o filtro ativo para renderizar corretamente após adicionar
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        renderTasks(activeFilter);
    });

    // --- Delegar Eventos para a Lista de Tarefas (Ações) ---
    taskList.addEventListener('click', (e) => {
        const target = e.target;
        const listItem = target.closest('.task-item');
        if (!listItem) return;

        const taskId = parseInt(listItem.dataset.id);
        const taskIndex = tasks.findIndex(task => task.id === taskId);

        if (taskIndex === -1) return;

        // Marcar como Concluída
        if (target.closest('.complete-btn')) {
            tasks[taskIndex].status = 'completed';
            renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
        }
        // Marcar como Ignorada (antes "Desistência")
        else if (target.closest('.ignore-btn')) {
            tasks[taskIndex].status = 'ignored';
            renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
        }
        // Editar Tarefa
        else if (target.closest('.edit-btn')) {
            const currentTask = tasks[taskIndex];
            const newDescription = prompt('Editar tarefa:', currentTask.description);
            if (newDescription !== null && newDescription.trim() !== '') {
                currentTask.description = newDescription.trim();
                // Opcional: permitir editar data/hora aqui
                renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
            } else if (newDescription !== null) {
                alert('A descrição da tarefa não pode ser vazia.');
            }
        }
        // Deletar Tarefa
        else if (target.closest('.delete-btn')) {
            if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
                // Adiciona classe para animação de saída antes de remover
                listItem.classList.add('removing');
                listItem.addEventListener('transitionend', () => {
                    tasks.splice(taskIndex, 1);
                    renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
                }, { once: true }); // Executa o listener apenas uma vez
            }
        }
    });

    // --- Filtrar Tarefas ---
    // Atribui listeners aos botões de filtro, tanto do desktop quanto da sidebar
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe 'active' de todos os botões de filtro visíveis
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            
            // Adiciona a classe 'active' aos botões de filtro correspondentes
            const filterValue = button.dataset.filter;
            document.querySelectorAll(`.filter-btn[data-filter="${filterValue}"]`).forEach(btn => btn.classList.add('active'));

            renderTasks(filterValue);
            // Fecha a sidebar se o filtro foi clicado dentro dela
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    });

    // --- Alternar Modo Escuro ---
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            darkModeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        } else {
            localStorage.setItem('darkMode', 'disabled');
            darkModeToggle.querySelector('i').classList.replace('fa-sun', 'fa-moon');
        }
    });

    // --- Funcionalidade da Sidebar (Menu Lateral) ---
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    // Fecha a sidebar ao clicar fora dela
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });


    // --- Inicialização da Aplicação ---
    function initializeApp() {
        // Carregar preferência do modo escuro ao iniciar
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        } else {
            darkModeToggle.querySelector('i').classList.replace('fa-sun', 'fa-moon');
        }
        loadTasks(); // Carrega as tarefas ao iniciar
    }

    initializeApp();
});