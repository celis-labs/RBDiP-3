// Глобальные переменные
var tasks = [];
var users = [];
var currentUserId = null;

// Функция инициализации
function init() {
    // Загрузка задач из локального хранилища
    var tasksData = localStorage.getItem('tasks');
    if (tasksData) {
        tasks = JSON.parse(tasksData);
    }

    // Загрузка пользователей из локального хранилища
    var usersData = localStorage.getItem('users');
    if (usersData) {
        users = JSON.parse(usersData);
    }

    // Отображение задач
    showTasks();

    // Инициализация обработчиков событий
    document.getElementById('addTaskBtn').addEventListener('click', function() {
        var title = document.getElementById('taskTitle').value;
        var desc = document.getElementById('taskDescription').value;
        var priority = document.getElementById('taskPriority').value;
        addTask(title, desc, priority);
    });

    document.getElementById('loginBtn').addEventListener('click', function() {
        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;
        login(username, password);
    });
}

// Функция добавления задачи
function addTask(title, desc, priority) {
    // Проверка авторизации
    if (!currentUserId) {
        alert('Вы должны войти в систему!');
        return;
    }

    // Проверка заполнения полей
    if (title === '') {
        alert('Название задачи не может быть пустым!');
        return;
    }

    // Создание задачи
    var task = {
        id: Date.now(),
        title: title,
        description: desc,
        priority: priority,
        status: 'новая',
        createdAt: new Date(),
        userId: currentUserId,
        comments: []
    };

    // Добавление задачи в массив
    tasks.push(task);

    // Сохранение в локальное хранилище
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Очистка полей формы
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskPriority').value = 'средний';

    // Обновление списка задач
    showTasks();
}

// Функция отображения задач
function showTasks() {
    var taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    // Фильтрация задач по текущему пользователю
    var userTasks = tasks.filter(function(task) {
        return currentUserId && task.userId === currentUserId;
    });

    // Если нет задач или пользователь не авторизован
    if (userTasks.length === 0) {
        taskList.innerHTML = '<p>Нет задач для отображения</p>';
        return;
    }

    // Создание элементов списка для каждой задачи
    for (var i = 0; i < userTasks.length; i++) {
        var task = userTasks[i];
        var taskElement = document.createElement('div');
        taskElement.className = 'task';

        // Добавление классов в зависимости от приоритета
        if (task.priority === 'высокий') {
            taskElement.classList.add('high-priority');
        } else if (task.priority === 'низкий') {
            taskElement.classList.add('low-priority');
        }

        // Создание содержимого задачи
        taskElement.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description}</p>
      <div class="task-meta">
        <span>Приоритет: ${task.priority}</span>
        <span>Статус: ${task.status}</span>
        <span>Создано: ${task.createdAt.toLocaleString()}</span>
      </div>
      <div class="task-actions">
        <button onclick="completeTask(${task.id})">Выполнить</button>
        <button onclick="deleteTask(${task.id})">Удалить</button>
        <button onclick="showComments(${task.id})">Комментарии (${task.comments.length})</button>
      </div>
      <div id="comments-${task.id}" class="comments-section" style="display: none;"></div>
    `;

        taskList.appendChild(taskElement);
    }
}

// Функция выполнения задачи
function completeTask(taskId) {
    // Поиск задачи по id
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id === taskId) {
            tasks[i].status = 'выполнена';
            break;
        }
    }

    // Сохранение в локальное хранилище
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Обновление списка задач
    showTasks();
}

function deleteTask(taskId) {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) {
        return;
    }

    // Фильтрация массива задач
    tasks = tasks.filter(function(task) {
        return task.id !== taskId;
    });

    // Сохранение в локальное хранилище
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Обновление списка задач
    showTasks();
}

// Функция отображения комментариев
function showComments(taskId) {
    var commentsSection = document.getElementById('comments-' + taskId);

    // Переключение видимости секции комментариев
    if (commentsSection.style.display === 'none') {
        // Поиск задачи по id
        var task = null;
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id === taskId) {
                task = tasks[i];
                break;
            }
        }

        // Если задача не найдена
        if (!task) {
            return;
        }

        // Очистка секции комментариев
        commentsSection.innerHTML = '';

        // Добавление формы для нового комментария
        var commentForm = document.createElement('div');
        commentForm.className = 'comment-form';
        commentForm.innerHTML = `
      <textarea id="comment-text-${taskId}" placeholder="Введите комментарий"></textarea>
      <button onclick="addComment(${taskId})">Добавить комментарий</button>
    `;
        commentsSection.appendChild(commentForm);

        // Добавление списка существующих комментариев
        if (task.comments.length > 0) {
            var commentsList = document.createElement('div');
            commentsList.className = 'comments-list';

            for (var j = 0; j < task.comments.length; j++) {
                var comment = task.comments[j];
                var commentElement = document.createElement('div');
                commentElement.className = 'comment';

                // Поиск автора комментария
                var authorName = 'Неизвестный';
                for (var k = 0; k < users.length; k++) {
                    if (users[k].id === comment.userId) {
                        authorName = users[k].username;
                        break;
                    }
                }

                commentElement.innerHTML = `
          <div class="comment-meta">
            <span>${authorName}</span>
            <span>${comment.createdAt.toLocaleString()}</span>
          </div>
          <p>${comment.text}</p>
        `;

                commentsList.appendChild(commentElement);
            }

            commentsSection.appendChild(commentsList);
        } else {
            commentsSection.innerHTML += '<p>Нет комментариев</p>';
        }

        commentsSection.style.display = 'block';
    } else {
        commentsSection.style.display = 'none';
    }
}

// Функция добавления комментария
function addComment(taskId) {
    // Проверка авторизации
    if (!currentUserId) {
        alert('Вы должны войти в систему!');
        return;
    }

    // Получение текста комментария
    var commentText = document.getElementById('comment-text-' + taskId).value;

    // Проверка заполнения текста
    if (commentText === '') {
        alert('Текст комментария не может быть пустым!');
        return;
    }

    // Поиск задачи по id
    var task = null;
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id === taskId) {
            task = tasks[i];
            break;
        }
    }

    // Если задача не найдена
    if (!task) {
        return;
    }

    // Создание комментария
    var comment = {
        id: Date.now(),
        text: commentText,
        createdAt: new Date(),
        userId: currentUserId
    };

    // Добавление комментария к задаче
    task.comments.push(comment);

    // Сохранение в локальное хранилище
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Обновление отображения комментариев
    showComments(taskId);
}

// Функция регистрации пользователя
function register(username, password, email) {
    // Проверка заполнения полей
    if (username === '' || password === '' || email === '') {
        alert('Все поля должны быть заполнены!');
        return;
    }

    // Проверка уникальности имени пользователя
    for (var i = 0; i < users.length; i++) {
        if (users[i].username === username) {
            alert('Пользователь с таким именем уже существует!');
            return;
        }
    }

    // Создание пользователя
    var user = {
        id: Date.now(),
        username: username,
        password: password, // В реальном приложении пароль должен быть захеширован
        email: email,
        createdAt: new Date()
    };

    // Добавление пользователя в массив
    users.push(user);

    // Сохранение в локальное хранилище
    localStorage.setItem('users', JSON.stringify(users));

    // Автоматический вход
    currentUserId = user.id;

    // Обновление UI
    updateUI();
}

// Функция входа пользователя
function login(username, password) {
    // Проверка заполнения полей
    if (username === '' || password === '') {
        alert('Имя пользователя и пароль должны быть заполнены!');
        return;
    }

    // Поиск пользователя
    var user = null;
    for (var i = 0; i < users.length; i++) {
        if (users[i].username === username && users[i].password === password) {
            user = users[i];
            break;
        }
    }

    // Если пользователь не найден
    if (!user) {
        alert('Неверное имя пользователя или пароль!');
        return;
    }

    // Установка текущего пользователя
    currentUserId = user.id;

    // Очистка полей формы
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';

    // Обновление UI
    updateUI();
}

// Функция выхода пользователя
function logout() {
    currentUserId = null;

    // Обновление UI
    updateUI();
}

// Функция обновления UI
function updateUI() {
    // Получение элементов
    var loginForm = document.getElementById('loginForm');
    var userInfo = document.getElementById('userInfo');
    var taskForm = document.getElementById('taskForm');

    // Если пользователь авторизован
    if (currentUserId) {
        // Поиск пользователя по id
        var user = null;
        for (var i = 0; i < users.length; i++) {
            if (users[i].id === currentUserId) {
                user = users[i];
                break;
            }
        }

        // Отображение информации о пользователе
        loginForm.style.display = 'none';
        userInfo.style.display = 'block';
        userInfo.innerHTML = `
      <p>Вы вошли как: ${user.username}</p>
      <button onclick="logout()">Выйти</button>
    `;

        // Отображение формы добавления задачи
        taskForm.style.display = 'block';
    } else {
        // Отображение формы входа
        loginForm.style.display = 'block';
        userInfo.style.display = 'none';

        // Скрытие формы добавления задачи
        taskForm.style.display = 'none';
    }

    // Обновление списка задач
    showTasks();
}

window.onload = init;