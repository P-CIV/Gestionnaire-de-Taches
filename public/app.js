// Configuration de l'API
const API_URL = 'http://localhost:3000';

// Sélection des éléments du DOM
const taskForm = document.getElementById('task-form');
const titleInput = document.getElementById('title');
const descInput = document.getElementById('desc');
const deadlineInput = document.getElementById('deadline');
const statusInput = document.getElementById('status');
const taskList = document.getElementById('task-list');
const editIndexInput = document.getElementById('edit-index');
const notification = document.getElementById('notification');
const emailInput = document.getElementById('email');
const reminderTimeInput = document.getElementById('reminder-time');


let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

async function sendTaskToServer(taskData) {
    try {
        const response = await fetch(`${API_URL}/add-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: taskData.email,
                taskName: taskData.taskName,
                reminderTime: taskData.reminderTime
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        return await response.text();
    } catch (error) {
        console.error('Erreur lors de l\'envoi au serveur:', error);
        throw error;
    }
}

function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.classList.add('show');
    if (isError) notification.classList.add('error');
    setTimeout(() => {
        notification.classList.remove('show', 'error');
    }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}


function displayTasks() {
    taskList.innerHTML = '';
    if (tasks.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" style="text-align:center;">
                <i class="fas fa-tasks" style="font-size: 24px; color: #ddd; margin-bottom: 10px;"></i>
                <p style="color: #7f8c8d;">Aucune tâche pour le moment</p>
            </td>`;
        taskList.appendChild(row);
        return;
    }

    tasks.forEach((task, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.taskName}</td>
            <td>${formatDate(task.reminderTime?.split('T')[0])}</td>
            <td>${task.status}</td>
            <td>
                <button onclick="editTask(${index})" class="edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
            <td>
                <button onclick="supprimerTache(${index})" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        taskList.appendChild(row);
    });
}

function editTask(index) {
    const task = tasks[index];
    titleInput.value = task.taskName;
    descInput.value = task.description || '';
    deadlineInput.value = task.reminderTime?.split('T')[0] || '';
    statusInput.value = task.status;
    emailInput.value = task.email || '';
    reminderTimeInput.value = task.reminderTime?.split('T')[1] || '';
    editIndexInput.value = index;
    document.querySelector('button[type="submit"]').textContent = 'Modifier la tâche';
}

// SEction pour la gestion du formulaire
taskForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const email = emailInput.value.trim();
    const deadline = deadlineInput.value;
    const reminderTime = reminderTimeInput.value;
    const status = statusInput.value;
    const editIndex = parseInt(editIndexInput.value);

    try {
        
        if (!title || !email || !deadline || !reminderTime) {
            throw new Error('Veuillez remplir tous les champs obligatoires');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('L\'adresse email n\'est pas valide');
        }

        const taskData = {
            taskName: title,
            description,
            email,
            reminderTime: `${deadline}T${reminderTime}`,
            status
        };

        if (editIndex >= 0) {
            tasks[editIndex] = taskData;
            editIndexInput.value = -1;
            document.querySelector('button[type="submit"]').textContent = 'Ajouter la tâche';
        } else {
            
            tasks.push(taskData);
            await sendTaskToServer(taskData);
        }

        
        localStorage.setItem('tasks', JSON.stringify(tasks));
        displayTasks();
        
        taskForm.reset();
        showNotification('Tâche ' + (editIndex >= 0 ? 'modifiée' : 'ajoutée') + ' avec succès');

    } catch (error) {
        showNotification(error.message, true);
    }
});

displayTasks();
