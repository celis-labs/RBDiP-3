// Модуль приложения TaskApp с инкапсуляцией
const TaskApp = (() => {
    let tasks = [];
    let users = [];
    let currentUserId = null;

    // Функции для работы с localStorage
    const loadData = (key) => JSON.parse(localStorage.getItem(key)) || [];
    const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // Вспомогательные функции
    const findTaskById = (id) => tasks.find(task => task.id === id);
    const findUserById = (id) => users.find(user => user.id === id);

    // Инициализация приложения
    const initializeApp = () => {
        tasks = loadData('tasks');
        users = loadData('users');
        updateUI();
        bindEvents();
    };

    // Навешивание обработчиков событий
    const bindEvents = () => {
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            const title = document.getElementById('taskTitle').value;
            const description = document.getElementById('taskDescription').value;
            const priority = document.getElementById('taskPriority').value;
            addTask(title, description, priority);
        });

        document.getElementById('loginBtn').addEventListener('click', () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            login(username, password);
        });
    };

    // Добавление задачи
    const addTask = (title, description, priority) => {
        if (!currentUserId) {
            alert('Вы должны войти в систему!');
            return;
        }
        if (title.trim() === '') {
            alert('Название задачи не может быть пустым!');
            return;
        }
        const task = {
            id: Date.now(),
            title,
            description,
            priority,
            status: 'новая',
            createdAt: new Date(),
            userId: currentUserId,
            comments: []
        };
        tasks.push(task);
        saveData('tasks', tasks);
        clearTaskForm();
        updateUI();
    };

    // Очистка формы ввода задачи
    const clearTaskForm = () => {
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskPriority').value = 'средний';
    };

    // Отображение задач на экране
    const showTasks = () => {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
        const userTasks = currentUserId ? tasks.filter(task => task.userId === currentUserId) : [];
        if (userTasks.length === 0) {
            taskList.innerHTML = '<p>Нет задач для отображения</p>';
            return;
        }
        userTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task';
            if (task.priority === 'высокий') taskElement.classList.add('high-priority');
            if (task.priority === 'низкий') taskElement.classList.add('low-priority');
            taskElement.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <div class="task-meta">
                    <span>Приоритет: ${task.priority}</span>
                    <span>Статус: ${task.status}</span>
                    <span>Создано: ${new Date(task.createdAt).toLocaleString()}</span>
                </div>
                <div class="task-actions">
                    <button onclick="TaskApp.completeTask(${task.id})">Выполнить</button>
                    <button onclick="TaskApp.deleteTask(${task.id})">Удалить</button>
                    <button onclick="TaskApp.toggleComments(${task.id})">Комментарии (${task.comments.length})</button>
                </div>
                <div id="comments-${task.id}" class="comments-section" style="display: none;"></div>
            `;
            taskList.appendChild(taskElement);
        });
    };

    // Обновление UI в зависимости от статуса пользователя
    const updateUI = () => {
        const loginForm = document.getElementById('loginForm');
        const userInfo = document.getElementById('userInfo');
        const taskForm = document.getElementById('taskForm');
        if (currentUserId) {
            const user = findUserById(currentUserId);
            loginForm.style.display = 'none';
            userInfo.style.display = 'block';
            userInfo.innerHTML = `<p>Вы вошли как: ${user.username}</p>
                                  <button onclick="TaskApp.logout()">Выйти</button>`;
            taskForm.style.display = 'block';
        } else {
            loginForm.style.display = 'block';
            userInfo.style.display = 'none';
            taskForm.style.display = 'none';
        }
        showTasks();
    };

    // Выполнение задачи
    const completeTask = (taskId) => {
        const task = findTaskById(taskId);
        if (task) {
            task.status = 'выполнена';
            saveData('tasks', tasks);
            updateUI();
        }
    };

    // Удаление задачи
    const deleteTask = (taskId) => {
        if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;
        tasks = tasks.filter(task => task.id !== taskId);
        saveData('tasks', tasks);
        updateUI();
    };

    // Переключение отображения комментариев
    const toggleComments = (taskId) => {
        const commentsSection = document.getElementById(`comments-${taskId}`);
        if (commentsSection.style.display === 'none') {
            renderComments(taskId);
            commentsSection.style.display = 'block';
        } else {
            commentsSection.style.display = 'none';
        }
    };

    // Отрисовка комментариев для задачи
    const renderComments = (taskId) => {
        const commentsSection = document.getElementById(`comments-${taskId}`);
        commentsSection.innerHTML = '';
        const task = findTaskById(taskId);
        if (!task) return;

        // Форма для добавления нового комментария
        const commentForm = document.createElement('div');
        commentForm.className = 'comment-form';
        commentForm.innerHTML = `
            <textarea id="comment-text-${taskId}" placeholder="Введите комментарий"></textarea>
            <button onclick="TaskApp.addComment(${taskId})">Добавить комментарий</button>
        `;
        commentsSection.appendChild(commentForm);

        // Список существующих комментариев
        if (task.comments.length) {
            const commentsList = document.createElement('div');
            commentsList.className = 'comments-list';
            task.comments.forEach(comment => {
                const author = findUserById(comment.userId)?.username || 'Неизвестный';
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.innerHTML = `
                    <div class="comment-meta">
                        <span>${author}</span>
                        <span>${new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p>${comment.text}</p>
                `;
                commentsList.appendChild(commentElement);
            });
            commentsSection.appendChild(commentsList);
        } else {
            commentsSection.insertAdjacentHTML('beforeend', '<p>Нет комментариев</p>');
        }
    };

    // Добавление комментария
    const addComment = (taskId) => {
        if (!currentUserId) {
            alert('Вы должны войти в систему!');
            return;
        }
        const commentText = document.getElementById(`comment-text-${taskId}`).value;
        if (commentText.trim() === '') {
            alert('Текст комментария не может быть пустым!');
            return;
        }
        const task = findTaskById(taskId);
        if (!task) return;
        const comment = {
            id: Date.now(),
            text: commentText,
            createdAt: new Date(),
            userId: currentUserId
        };
        task.comments.push(comment);
        saveData('tasks', tasks);
        toggleComments(taskId);
    };

    // Регистрация пользователя
    const register = (username, password, email) => {
        if (!username.trim() || !password.trim() || !email.trim()) {
            alert('Все поля должны быть заполнены!');
            return;
        }
        if (users.some(user => user.username === username)) {
            alert('Пользователь с таким именем уже существует!');
            return;
        }
        const user = {
            id: Date.now(),
            username,
            password, // В реальном проекте пароль необходимо шифровать
            email,
            createdAt: new Date()
        };
        users.push(user);
        saveData('users', users);
        currentUserId = user.id;
        updateUI();
    };

    // Вход пользователя
    const login = (username, password) => {
        if (!username.trim() || !password.trim()) {
            alert('Имя пользователя и пароль должны быть заполнены!');
            return;
        }
        const user = users.find(user => user.username === username && user.password === password);
        if (!user) {
            alert('Неверное имя пользователя или пароль!');
            return;
        }
        currentUserId = user.id;
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        updateUI();
    };

    // Выход пользователя
    const logout = () => {
        currentUserId = null;
        updateUI();
    };

    // Публичный API модуля
    return {
        initializeApp,
        completeTask,
        deleteTask,
        toggleComments,
        addComment,
        register,
        login,
        logout
    };
})();

// Инициализация приложения при загрузке страницы
window.onload = TaskApp.initializeApp;
