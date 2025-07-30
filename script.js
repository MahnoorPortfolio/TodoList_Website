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
    const customModal = document.getElementById('custom-modal');
    const modalIcon = customModal.querySelector('.modal-icon');
    const modalTitle = customModal.querySelector('.modal-title');
    const modalMessage = customModal.querySelector('.modal-message');
    const modalActions = customModal.querySelector('.modal-actions');

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

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&#128465;'; // Trash icon
        deleteBtn.className = 'delete-btn';

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

        const isTaskOverdue = (task) => {
            if (!task.dueDate) return false;
            const dueDateTime = new Date(`${task.dueDate}T${task.dueTime || '23:59:59'}`);
            return dueDateTime < now;
        };

        const activeTasks = tasks.filter(t => !t.completed && !isTaskOverdue(t));
        const dueTasks = tasks.filter(t => !t.completed && isTaskOverdue(t));
        const completedTasks = tasks.filter(t => t.completed);

        const createCategory = (title, taskArray) => {
            if (taskArray.length === 0) return;

            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'task-category open';

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

        if (!text) {
            showModal({
                icon: '&#9888;',
                iconClass: 'icon-warning',
                title: 'Oops!',
                message: 'Task description cannot be empty. Please enter some text.',
                buttons: [
                    { text: 'OK', class: 'btn-primary', action: hideModal }
                ]
            });
            return;
        }

        if (taskToEditId !== null) {
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
            taskLabel.textContent = 'Task';
        } else {
            tasks.push({ id: Date.now(), text, completed: false, dueDate, dueTime, priority });
            saveTasks();
        }

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
        showModal({
            icon: '&#128465;',
            iconClass: 'icon-danger',
            title: 'Confirm Deletion',
            message: 'Are you sure you want to delete this task? This action cannot be undone.',
            buttons: [
                { text: 'Cancel', class: 'btn-secondary', action: hideModal },
                { text: 'Delete', class: 'btn-danger', action: confirmDelete }
            ]
        });
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
                tasks = tasks.filter(task => task.completed || !isTaskOverdue(task));
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
            }, 200);

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
        themeToggleBtn.innerHTML = theme === 'dark' ? '&#9728;' : '&#127769;';
        localStorage.setItem('theme', theme);
    };

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // --- Modal Logic ---
    const showModal = ({ icon, iconClass, title, message, buttons }) => {
        modalIcon.innerHTML = icon;
        modalIcon.className = `modal-icon ${iconClass}`;
        modalTitle.textContent = title;
        modalMessage.textContent = message;

        modalActions.innerHTML = ''; // Clear previous buttons
        buttons.forEach(btnInfo => {
            const button = document.createElement('button');
            button.textContent = btnInfo.text;
            button.className = btnInfo.class;
            button.addEventListener('click', btnInfo.action);
            modalActions.appendChild(button);
        });

        customModal.classList.add('show');
    };

    const hideModal = () => {
        customModal.classList.remove('show');
    };

    const confirmDelete = () => {
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
        hideModal();
    };

    customModal.addEventListener('click', (e) => {
        if (e.target === customModal) {
            hideModal();
        }
    });

    // --- Initial Load ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    renderTasks();
});
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    renderTasks();
