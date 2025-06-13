class NotificationManager {
    constructor() {
        this.currentUser = null;
        this.notifications = [];
        this.init();
    }

    init() {
        // Verificar autenticação
        this.currentUser = window.authManager.getCurrentUser();
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        this.initializeEvents();
        this.loadNotifications();
    }

    initializeEvents() {
        // Botão voltar
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Botão logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            window.authManager.logout();
        });

        // Marcar todas como lidas
        document.getElementById('markAllReadBtn').addEventListener('click', () => {
            this.markAllAsRead();
        });

        // Limpar todas as notificações
        document.getElementById('clearAllNotificationsBtn').addEventListener('click', () => {
            this.showConfirmModal(
                'Tem certeza que deseja limpar todas as notificações? Esta ação não pode ser desfeita.',
                () => this.clearAllNotifications()
            );
        });

        // Modal de confirmação
        document.getElementById('confirmYes').addEventListener('click', () => {
            this.hideConfirmModal();
            if (this.confirmCallback) {
                this.confirmCallback();
            }
        });

        document.getElementById('confirmNo').addEventListener('click', () => {
            this.hideConfirmModal();
        });
    }

    loadNotifications() {
        this.notifications = window.authManager.getUserNotifications(this.currentUser.id);
        this.renderNotifications();
    }

    renderNotifications() {
        const notificationsList = document.getElementById('notificationsList');
        const noNotifications = document.getElementById('noNotifications');

        if (this.notifications.length === 0) {
            notificationsList.style.display = 'none';
            noNotifications.style.display = 'block';
            return;
        }

        notificationsList.style.display = 'block';
        noNotifications.style.display = 'none';

        notificationsList.innerHTML = this.notifications.map(notification => {
            const isUnread = !notification.read;
            const priorityClass = this.getPriorityClass(notification.priority);
            const timeAgo = this.getTimeAgo(notification.timestamp);

            return `
                <div class="notification-item ${isUnread ? 'unread' : ''} ${priorityClass}" data-id="${notification.id}">
                    <div class="notification-header">
                        <div class="notification-priority">
                            <i class="${this.getPriorityIcon(notification.priority)}"></i>
                            <span class="priority-text">${this.getPriorityText(notification.priority)}</span>
                        </div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    <div class="notification-content">
                        <h4 class="notification-title">${notification.title}</h4>
                        <p class="notification-message">${notification.message}</p>
                        <div class="notification-sender">
                            <i class="ri-user-line"></i>
                            Enviado por: ${notification.senderName}
                        </div>
                    </div>
                    <div class="notification-actions">
                        ${isUnread ? `
                            <button class="btn btn-sm btn-primary" onclick="notificationManager.markAsRead('${notification.id}')">
                                <i class="ri-check-line"></i> Marcar como Lida
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger" onclick="notificationManager.deleteNotification('${notification.id}')">
                            <i class="ri-delete-bin-line"></i> Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getPriorityClass(priority) {
        switch (priority) {
            case 'high': return 'priority-high';
            case 'medium': return 'priority-medium';
            case 'low': return 'priority-low';
            default: return 'priority-medium';
        }
    }

    getPriorityIcon(priority) {
        switch (priority) {
            case 'high': return 'ri-error-warning-line';
            case 'medium': return 'ri-information-line';
            case 'low': return 'ri-chat-3-line';
            default: return 'ri-information-line';
        }
    }

    getPriorityText(priority) {
        switch (priority) {
            case 'high': return 'Alta';
            case 'medium': return 'Média';
            case 'low': return 'Baixa';
            default: return 'Média';
        }
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'Agora mesmo';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} min atrás`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours}h atrás`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `${days}d atrás`;
        }
    }

    markAsRead(notificationId) {
        if (window.authManager.markNotificationAsRead(notificationId)) {
            this.showSuccess('Notificação marcada como lida');
            this.loadNotifications();
        } else {
            this.showError('Erro ao marcar notificação como lida');
        }
    }

    markAllAsRead() {
        const unreadNotifications = this.notifications.filter(n => !n.read);
        
        if (unreadNotifications.length === 0) {
            this.showError('Não há notificações não lidas');
            return;
        }

        let success = true;
        unreadNotifications.forEach(notification => {
            if (!window.authManager.markNotificationAsRead(notification.id)) {
                success = false;
            }
        });

        if (success) {
            this.showSuccess('Todas as notificações foram marcadas como lidas');
            this.loadNotifications();
        } else {
            this.showError('Erro ao marcar algumas notificações como lidas');
        }
    }

    deleteNotification(notificationId) {
        this.showConfirmModal(
            'Tem certeza que deseja excluir esta notificação?',
            () => {
                if (window.authManager.deleteNotification(notificationId)) {
                    this.showSuccess('Notificação excluída com sucesso');
                    this.loadNotifications();
                } else {
                    this.showError('Erro ao excluir notificação');
                }
            }
        );
    }

    clearAllNotifications() {
        let success = true;
        this.notifications.forEach(notification => {
            if (!window.authManager.deleteNotification(notification.id)) {
                success = false;
            }
        });

        if (success) {
            this.showSuccess('Todas as notificações foram removidas');
            this.loadNotifications();
        } else {
            this.showError('Erro ao remover algumas notificações');
        }
    }

    showConfirmModal(message, callback) {
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'block';
        this.confirmCallback = callback;
    }

    hideConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
        this.confirmCallback = null;
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }
}

// Inicializar o gerenciador de notificações
const notificationManager = new NotificationManager();