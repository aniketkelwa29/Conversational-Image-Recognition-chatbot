document.addEventListener('DOMContentLoaded', () => {

    /* ---------------------------------------------------------------
       THEME (Dark / Light Mode)
    --------------------------------------------------------------- */
    const htmlEl = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    const storedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme === 'dark' || (!storedTheme && systemDark)) {
        htmlEl.classList.add('dark');
    } else {
        htmlEl.classList.remove('dark');
    }
    syncThemeIcon();

    themeToggleBtn?.addEventListener('click', () => {
        htmlEl.classList.toggle('dark');
        const isDark = htmlEl.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        syncThemeIcon();
    });

    function syncThemeIcon() {
        if (!themeIcon) return;
        const isDark = htmlEl.classList.contains('dark');
        themeIcon.className = isDark ? 'ph ph-sun text-xl' : 'ph ph-moon text-xl';
    }


    /* ---------------------------------------------------------------
       SUGGESTION PILLS — click to fill input
    --------------------------------------------------------------- */
    const messageInput = document.getElementById('message-input');

    document.querySelectorAll('.suggestion-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const cleaned = pill.textContent.replace(/^"|"$/g, '').trim();
            messageInput.value = cleaned;
            messageInput.dispatchEvent(new Event('input'));
            messageInput.focus();
        });
    });

    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', () => {
            messageInput.focus();
        });
    });

    /* ---------------------------------------------------------------
       CLEAR CHAT
    --------------------------------------------------------------- */
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const chatMessagesContainer = document.getElementById('chat-messages-container');
    const welcomeScreen = document.getElementById('welcome-screen');

    clearChatBtn?.addEventListener('click', () => {
        // Remove all but the welcome screen
        const messages = chatMessagesContainer.querySelectorAll('.chat-message');
        messages.forEach(m => m.remove());
        // Show welcome screen again
        if (welcomeScreen) {
            welcomeScreen.classList.remove('hidden');
            welcomeScreen.style.display = '';
        }
        // Reset input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        currentImageDataUrl = null;
        toggleSendButton();
        document.getElementById('image-preview-container').classList.add('hidden');
        document.getElementById('image-upload').value = '';
    });

    /* ---------------------------------------------------------------
       INPUT HANDLING
    --------------------------------------------------------------- */
    const sendBtn = document.getElementById('send-btn');
    const imageUpload = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image');

    let currentImageDataUrl = null;
    let currentImageFile = null;

    // Auto-grow textarea
    messageInput?.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 144) + 'px';
        toggleSendButton();
    });

    function toggleSendButton() {
        if (sendBtn) {
            sendBtn.disabled = !messageInput?.value.trim() && !currentImageDataUrl;
        }
    }

    // Image upload
    imageUpload?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        currentImageFile = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
            currentImageDataUrl = ev.target.result;
            imagePreview.src = currentImageDataUrl;
            imagePreviewContainer.classList.remove('hidden');
            toggleSendButton();
            messageInput?.focus();
        };
        reader.readAsDataURL(file);
    });

    // Remove image
    removeImageBtn?.addEventListener('click', () => {
        currentImageDataUrl = null;
        currentImageFile = null;
        imagePreview.src = '';
        imagePreviewContainer.classList.add('hidden');
        imageUpload.value = '';
        toggleSendButton();
    });

    // Keyboard shortcut
    messageInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled) sendMessage();
        }
    });

    sendBtn?.addEventListener('click', sendMessage);

    /* ---------------------------------------------------------------
       SEND MESSAGE
    --------------------------------------------------------------- */
    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text && !currentImageDataUrl) return;

        // Collapse welcome screen
        if (welcomeScreen && !welcomeScreen.classList.contains('hidden')) {
            welcomeScreen.style.display = 'none';
        }

        const imgUrl = currentImageDataUrl;
        appendMessage('user', text, imgUrl);

        // Reset inputs
        messageInput.value = '';
        messageInput.style.height = 'auto';
        currentImageDataUrl = null;
        currentImageFile = null;
        imagePreviewContainer.classList.add('hidden');
        imageUpload.value = '';
        toggleSendButton();

        showTypingIndicator();

        /* ============================================================
           TODO: Replace simulation with actual SpringBoot fetch call!
           ============================================================
           const formData = new FormData();
           formData.append('prompt', text);
           if (file) formData.append('image', file);

           const res = await fetch('http://localhost:8080/api/vision/analyze', {
               method: 'POST', body: formData
           });
           const { reply } = await res.json();
           removeTypingIndicator();
           appendMessage('ai', reply);
           ============================================================ */

        setTimeout(() => {
            removeTypingIndicator();
            const aiReply = imgUrl
                ? `✅ Image received! Once your **SpringBoot** endpoint at \`/api/vision/analyze\` is live, I'll process it with Python's **OpenCV** and **Pillow** libraries and give you full analysis based on: "${text || 'Describe the image'}"`
                : `Great question! Once your backend is connected, I'll run this through the AI pipeline and respond here in real-time.`;
            appendMessage('ai', aiReply);
        }, 1800);
    }

    /* ---------------------------------------------------------------
       RENDER MESSAGES
    --------------------------------------------------------------- */
    function appendMessage(sender, text, imgData = null) {
        const isUser = sender === 'user';
        const wrapper = document.createElement('div');
        wrapper.className = `chat-message flex gap-3 w-full msg-anim ${isUser ? 'flex-row-reverse' : 'flex-row'}`;

        const avatarClass = isUser
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25';
        const icon = isUser ? 'ph-user' : 'ph-aperture';

        const imgHtml = imgData
            ? `<img src="${imgData}" alt="Uploaded" class="max-w-[260px] rounded-xl mb-2 border border-gray-200 dark:border-gray-700 shadow-sm">`
            : '';

        // Simple markdown: **bold**
        const formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-600 dark:text-indigo-400">$1</code>')
            .replace(/\n/g, '<br>');

        const bubbleClass = isUser
            ? 'bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tr-md px-4 py-3 max-w-[80%]'
            : 'px-1 py-1 max-w-[85%]';

        wrapper.innerHTML = `
            <div class="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${avatarClass}">
                <i class="ph-fill ${icon} text-sm"></i>
            </div>
            <div class="${bubbleClass}">
                ${imgHtml}
                ${text ? `<p class="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">${formattedText}</p>` : ''}
            </div>
        `;

        chatMessagesContainer.appendChild(wrapper);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.className = 'chat-message flex gap-3 w-full msg-anim';
        div.innerHTML = `
            <div class="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25">
                <i class="ph-fill ph-aperture text-sm"></i>
            </div>
            <div class="flex items-center gap-1.5 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-md">
                <span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot"></span>
                <span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot"></span>
                <span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot"></span>
            </div>
        `;
        chatMessagesContainer.appendChild(div);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        document.getElementById('typing-indicator')?.remove();
    }

    function scrollToBottom() {
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
    }
});
