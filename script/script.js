document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const taskDateInput = document.getElementById('taskDate');
    const taskTimeInput = document.getElementById('taskTime');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');

    // Elementos da Modal
    const confirmationModal = document.getElementById('confirmationModal');
    const closeButton = confirmationModal.querySelector('.close-button');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const taskToDeleteText = document.getElementById('taskToDeleteText');

    let tasks = []; // Array para armazenar as tarefas
    let taskIdToDelete = null; // Variável para armazenar o ID da tarefa a ser deletada

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
            if (filter === 'ignored') return task.status === 'ignored';
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
                const dateObj = new Date(`${task.date}T${task.time || '00:00'}`);
                const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const formattedTime = task.time ? ` às ${task.time}` : '';
                dateTimeString = `${formattedDate}${formattedTime}`;
            }

            // Constrói os botões de ação condicionalmente
            let actionButtonsHTML = '';
            if (task.status === 'completed') {
                // Se a tarefa está concluída, apenas editar e deletar
                actionButtonsHTML = `
                    <button class="edit-btn" title="Editar Tarefa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" title="Deletar Tarefa">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
            } else {
                // Para tarefas em andamento ou ignoradas, todas as opções
                actionButtonsHTML = `
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
                `;
            }


            listItem.innerHTML = `
                <div class="task-content">
                    <span class="task-text">${task.description}</span>
                    ${dateTimeString ? `<span class="task-datetime">${dateTimeString}</span>` : ''}
                </div>
                <div class="task-actions">
                    ${actionButtonsHTML}
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
            id: Date.now(),
            description: description,
            date: taskDate,
            time: taskTime,
            status: 'pending'
        };

        tasks.push(newTask);
        taskInput.value = '';
        taskDateInput.value = '';
        taskTimeInput.value = '';

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
        // Marcar como Ignorada
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
                renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
            } else if (newDescription !== null) {
                alert('A descrição da tarefa não pode ser vazia.');
            }
        }
        // Deletar Tarefa (agora com modal de confirmação)
        else if (target.closest('.delete-btn')) {
            taskIdToDelete = taskId; // Armazena o ID da tarefa para deletar
            const task = tasks[taskIndex];
            taskToDeleteText.textContent = task.description; // Mostra a descrição da tarefa na modal
            confirmationModal.style.display = 'flex'; // Mostra a modal
        }
    });

    // --- Lógica da Modal de Confirmação ---
    closeButton.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
        taskIdToDelete = null; // Reseta o ID da tarefa
    });

    cancelDeleteBtn.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
        taskIdToDelete = null; // Reseta o ID da tarefa
    });

    confirmDeleteBtn.addEventListener('click', () => {
        if (taskIdToDelete !== null) {
            const taskIndex = tasks.findIndex(task => task.id === taskIdToDelete);
            if (taskIndex !== -1) {
                const listItem = document.querySelector(`.task-item[data-id="${taskIdToDelete}"]`);
                if (listItem) {
                    listItem.classList.add('removing');
                    listItem.addEventListener('transitionend', () => {
                        tasks.splice(taskIndex, 1);
                        renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
                    }, { once: true });
                } else {
                    // Fallback caso a animação não possa ser aplicada (ex: item já removido por algum motivo)
                    tasks.splice(taskIndex, 1);
                    renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
                }
            }
        }
        confirmationModal.style.display = 'none';
        taskIdToDelete = null; // Reseta o ID da tarefa após a exclusão
    });

    // Fecha a modal se clicar fora dela
    window.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            confirmationModal.style.display = 'none';
            taskIdToDelete = null;
        }
    });


    // --- Filtrar Tarefas ---
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            
            const filterValue = button.dataset.filter;
            document.querySelectorAll(`.filter-btn[data-filter="${filterValue}"]`).forEach(btn => btn.classList.add('active'));

            renderTasks(filterValue);
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

    // Fecha a sidebar ao clicar fora dela (e não no menuToggle)
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });


    // --- Inicialização da Aplicação ---
    function initializeApp() {
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        } else {
            darkModeToggle.querySelector('i').classList.replace('fa-sun', 'fa-moon');
        }
        loadTasks();
    }

    initializeApp();
});