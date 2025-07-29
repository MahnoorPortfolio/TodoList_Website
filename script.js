document.addEventListener('DOMContentLoaded', () => {
    // Sidebar and Menu Toggle
    const menuToggleBtn = document.querySelector('.menu-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    const closeBtn = document.querySelector('.close-btn');

    // To-Do List Elements
    const taskInput = document.getElementById('task-input');
    const dueDateInput = document.getElementById('due-date-input');
    const dueTimeInput = document.getElementById('due-time-input');
    const priorityInput = document.getElementById('priority-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const tasksLeftSpan = document.getElementById('tasks-left');
    const clearTasksBtn = document.getElementById('clear-tasks-btn');
    const filterLinks = document.querySelectorAll('.sidebar-link');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const mainHeaderTitle = document.getElementById('main-header-title');
    const taskLabel = document.getElementById('task-label');

    // Modal Elements
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'add';
    let taskToDelete = null;
    let taskToEditId = null;

    // --- Local Storage --- //
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    // --- UI Rendering --- //
    const updateTasksLeft = () => {
        const activeTasks = tasks.filter(task => !task.completed).length;
        tasksLeftSpan.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} left`;
    };

    const createTaskElement = (task) => {
        const li = document.createElement('li');
        li.dataset.id = task.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;

        const taskContentDiv = document.createElement('div');
        taskContentDiv.className = 'task-content';

        const taskTextSpan = document.createElement('span');
        taskTextSpan.className = 'task-text';
        taskTextSpan.textContent = task.text;

        const dueDateSpan = document.createElement('span');
        dueDateSpan.className = 'due-date';
        if (task.dueDate) {
            let dueString = `Due: ${task.dueDate}`;
            if (task.dueTime) {
                dueString += ` at ${task.dueTime}`;
            }
            if (task.priority) {
                dueString += ` | Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`;
            }
            dueDateSpan.textContent = dueString;
        }

        taskContentDiv.appendChild(taskTextSpan);
        taskContentDiv.appendChild(dueDateSpan);

        const priorityClass = `priority-${task.priority || 'medium'}`;
        li.classList.add(priorityClass);
        if (task.completed) {
            li.classList.add('completed');
        }

        const taskActionsDiv = document.createElement('div');
        taskActionsDiv.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.innerHTML = '&#9998;'; // Pencil icon
        editBtn.className = 'edit-btn';
        // Event listener for edit button is now in the main taskList listener

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&#128465;'; // Trash icon
        deleteBtn.className = 'delete-btn';
        // Event listener for delete button is now in the main taskList listener

        taskActionsDiv.appendChild(editBtn);
        taskActionsDiv.appendChild(deleteBtn);

        li.appendChild(checkbox);
        li.appendChild(taskContentDiv);
        li.appendChild(taskActionsDiv);
        return li;
    };

    const renderTasks = () => {
        const inputContainer = document.querySelector('.input-container');
        const taskInfo = document.querySelector('.task-info');

        if (currentFilter === 'add') {
            inputContainer.style.display = '';
            if (taskInfo) taskInfo.style.display = 'none';
        } else {
            inputContainer.style.display = 'none';
            if (taskInfo) taskInfo.style.display = '';
        }

        if (clearTasksBtn) {
            clearTasksBtn.style.display = 'block';
            switch (currentFilter) {
                case 'add':
                case 'all':
                    clearTasksBtn.textContent = 'Clear All Tasks';
                    break;
                case 'active':
                    clearTasksBtn.textContent = 'Clear Active Tasks';
                    break;
                case 'completed':
                    clearTasksBtn.textContent = 'Clear Completed';
                    break;
                case 'due-tasks':
                    clearTasksBtn.textContent = 'Clear Due Tasks';
                    break;
            }
        }

        taskList.innerHTML = '';
        const now = new Date();

        // Helper function to check if a task is overdue
        const isTaskOverdue = (task) => {
            if (!task.dueDate) return false;
            const dueDateTime = new Date(`${task.dueDate}T${task.dueTime || '23:59:59'}`);
            return dueDateTime < now;
        };

        // Always categorize tasks, but filter which categories are shown
        const activeTasks = tasks.filter(t => !t.completed && !isTaskOverdue(t));
        const dueTasks = tasks.filter(t => !t.completed && isTaskOverdue(t));
        const completedTasks = tasks.filter(t => t.completed);

        const createCategory = (title, taskArray) => {
            if (taskArray.length === 0) return;

            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'task-category open'; // Default to open

            const header = document.createElement('div');
            header.className = 'category-header';
            header.innerHTML = `<h3>${title}</h3><span class="toggle-icon">&#9660;</span>`;
            header.onclick = () => categoryDiv.classList.toggle('open');

            const sublist = document.createElement('ul');
            sublist.className = 'task-sublist';
            taskArray.forEach(task => sublist.appendChild(createTaskElement(task)));

            categoryDiv.appendChild(header);
            categoryDiv.appendChild(sublist);
            taskList.appendChild(categoryDiv);
        };

        // Display categories based on the current filter
        if (currentFilter === 'all' || currentFilter === 'add') {
            createCategory('Active Tasks', activeTasks);
            createCategory('Due Tasks', dueTasks);
            createCategory('Completed Tasks', completedTasks);
        } else if (currentFilter === 'active') {
            createCategory('Active Tasks', activeTasks);
        } else if (currentFilter === 'due-tasks') {
            createCategory('Due Tasks', dueTasks);
        } else if (currentFilter === 'completed') {
            createCategory('Completed Tasks', completedTasks);
        }

        updateTasksLeft();
    };

    // --- Task Operations --- //
    const handleAddOrUpdate = () => {
        const text = taskInput.value.trim();
        const dueDate = dueDateInput.value;
        const dueTime = dueTimeInput.value;
        const priority = priorityInput.value;

        if (!text) return;

        if (taskToEditId !== null) {
            // Update existing task
            const task = tasks.find(t => t.id === taskToEditId);
            if (task) {
                task.text = text;
                task.dueDate = dueDate;
                task.dueTime = dueTime;
                task.priority = priority;
                saveTasks();
            }
            taskToEditId = null;
            addTaskBtn.textContent = 'Add';
            taskLabel.textContent = 'Task'; // Reset label
        } else {
            // Add new task
            tasks.push({ id: Date.now(), text, completed: false, dueDate, dueTime, priority });
            saveTasks();
        }

        // Reset form and re-render
        taskInput.value = '';
        dueDateInput.value = '';
        dueTimeInput.value = '';
        priorityInput.value = 'medium';
        renderTasks();
    };

    const toggleTask = (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        }
    };

    function deleteTask(id) {
        taskToDelete = id;
        deleteModal.classList.add('show');
    };

    const editTask = (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            taskInput.value = task.text;
            dueDateInput.value = task.dueDate || '';
            dueTimeInput.value = task.dueTime || '';
            priorityInput.value = task.priority || 'medium';
            taskLabel.textContent = 'Edit Task';
            addTaskBtn.textContent = 'Update';
            taskToEditId = id;
            taskInput.focus();
        }
    };



    // --- Event Listeners --- //
    menuToggleBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
    });

    closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    addTaskBtn.addEventListener('click', handleAddOrUpdate);
    taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleAddOrUpdate());

    clearTasksBtn.addEventListener('click', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (currentFilter) {
            case 'add':
            case 'all':
                tasks = [];
                break;
            case 'active':
                tasks = tasks.filter(task => task.completed);
                break;
            case 'completed':
                tasks = tasks.filter(task => !task.completed);
                break;
            case 'due-tasks':
                tasks = tasks.filter(task => {
                    const isTaskOverdue = (t) => {
                        if (!t.dueDate) return false;
                        const dueDateTime = new Date(`${t.dueDate}T${t.dueTime || '23:59:59'}`);
                        return dueDateTime < now;
                    };
                    return task.completed || !isTaskOverdue(task);
                });
                break;
        }
        saveTasks();
        renderTasks();
    });

    taskList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        const id = Number(li.dataset.id);

        if (e.target.classList.contains('task-checkbox')) {
            toggleTask(id);
        } else if (e.target.classList.contains('delete-btn')) {
            deleteTask(id);
        } else if (e.target.classList.contains('edit-btn')) {
            editTask(id);
        } else if (e.target.closest('.task-content')) {
            toggleTask(id);
        }
    });

    filterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const newFilter = link.dataset.filter;

            // Update header with animation
            mainHeaderTitle.style.opacity = '0';
            mainHeaderTitle.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                switch (newFilter) {
                    case 'add':
                        mainHeaderTitle.textContent = 'Add Task';
                        break;
                    case 'all':
                        mainHeaderTitle.textContent = 'All Tasks';
                        break;
                    case 'active':
                        mainHeaderTitle.textContent = 'Active Tasks';
                        break;
                    case 'completed':
                        mainHeaderTitle.textContent = 'Completed Tasks';
                        break;
                    case 'due-tasks':
                        mainHeaderTitle.textContent = 'Due Tasks';
                        break;
                    default:
                        mainHeaderTitle.textContent = 'Add Task';
                }
                mainHeaderTitle.style.opacity = '1';
                mainHeaderTitle.style.transform = 'translateY(0)';
            }, 200); // Should be less than the CSS transition duration

            filterLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentFilter = newFilter;
            renderTasks();

            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });

    // --- Theme Toggle --- //
    const applyTheme = (theme) => {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        themeToggleBtn.innerHTML = theme === 'dark' ? '&#9728;' : '&#127769;'; // Sun/Moon icon
        localStorage.setItem('theme', theme);
    };

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // --- Initial Load --- //
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    renderTasks();

    // --- Modal Event Listeners ---
    confirmDeleteBtn.addEventListener('click', () => {
        if (taskToDelete !== null) {
            const taskElement = document.querySelector(`[data-id='${taskToDelete}']`);
            if (taskElement) {
                taskElement.classList.add('fade-out');
                setTimeout(() => {
                    tasks = tasks.filter(task => task.id !== taskToDelete);
                    saveTasks();
                    renderTasks();
                    taskToDelete = null;
                }, 400);
            }
        }
        deleteModal.classList.remove('show');
    });

    cancelDeleteBtn.addEventListener('click', () => {
        taskToDelete = null;
        deleteModal.classList.remove('show');
    });

    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            taskToDelete = null;
            deleteModal.classList.remove('show');
        }
    });
});
