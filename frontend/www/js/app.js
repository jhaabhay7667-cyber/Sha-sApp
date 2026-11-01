
"use strict";

/* ==================================================
   SHA'SAPP - DATABASE CONNECTED FRONTEND
   Text messaging + media sharing + voice recording
================================================== */

const API_BASE_URL = "https://sha-sapp.onrender.com";
const TOKEN_KEY = "shasapp_access_token";

const $ = (selector) => document.querySelector(selector);

const authScreen = $("#authScreen");
const appScreen = $("#appScreen");
const authForm = $("#authForm");
const authTitle = $("#authTitle");
const authDescription = $("#authDescription");
const authSubmit = $("#authSubmit");
const authSwitch = $("#authSwitch");
const authSwitchText = $("#authSwitchText");
const authError = $("#authError");
const nameField = $("#nameField");
const fullNameInput = $("#fullName");
const emailInput = $("#email");
const passwordInput = $("#password");

let authMode = "login";
let activeConversationId = null;
let activeFilter = "all";
let messageSearchTerm = "";
let currentUser = null;
let conversations = [];

let activeSocket = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let typingTimer = null;
let isTypingSent = false;
let manuallyClosedSocket = false;

// Media state
let selectedMediaFile = null;
let selectedMediaType = null;
let uploadRequest = null;
let mediaObjectURLs = new Map();
let mediaLoadingPromises = new Map();
let selectedPreviewURL = null;

// Voice recording state
let mediaRecorder = null;
let recordingStream = null;
let recordedChunks = [];
let recordingStartedAt = 0;
let recordingTimer = null;
let isRecordingCancelled = false;
let recordingConversationId = null;

const avatarColors = [
    "linear-gradient(140deg,#6d8cff,#4454ba)",
    "linear-gradient(140deg,#f59ac2,#b45ad7)",
    "linear-gradient(140deg,#48c6a8,#258a9b)",
    "linear-gradient(140deg,#ffb86b,#e77750)",
    "linear-gradient(140deg,#9b8cff,#6252bd)"
];

/* ==================================================
   GENERAL HELPERS
================================================== */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getInitials(name) {
    return String(name || "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("")
        .toUpperCase() || "?";
}

function formatTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat([], {
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function getColor(id) {
    return avatarColors[
        Math.abs(Number(id) || 0) % avatarColors.length
    ];
}

function formatFileSize(bytes) {
    const size = Number(bytes || 0);

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getMessagePreview(message) {
    if (!message) return "No messages yet";

    switch (message.messageType) {
        case "image":
            return "📷 Photo";
        case "video":
            return "🎬 Video";
        case "audio":
            return "🎤 Voice message";
        case "file":
            return "📎 File";
        default:
            return message.text || "Message";
    }
}

function normalizeMessage(message) {
    return {
        id: message.id,
        text: message.content ?? message.text ?? "",
        messageType:
            message.message_type || message.messageType || "text",
        mediaUrl: message.media_url || message.mediaUrl || null,
        mediaMimeType:
            message.media_mime_type || message.mediaMimeType || null,
        mediaFileName:
            message.media_file_name || message.mediaFileName || null,
        mediaSizeBytes:
            message.media_size_bytes ?? message.mediaSizeBytes ?? 0,
        durationSeconds:
            message.duration_seconds ?? message.durationSeconds ?? null,
        status: message.status || "sent",
        deliveredAt: message.delivered_at || message.deliveredAt || null,
        outgoing:
            Number(message.sender_id ?? message.senderId) ===
            Number(currentUser?.id),
        senderId: message.sender_id ?? message.senderId,
        time: formatTime(message.created_at || message.createdAt),
        createdAt: message.created_at || message.createdAt
    };
}

function addMessageToConversation(conversation, messageData) {
    if (!conversation || !messageData?.id) return false;

    const exists = conversation.messages.some(
        (message) => Number(message.id) === Number(messageData.id)
    );

    if (exists) return false;

    conversation.messages.push(normalizeMessage(messageData));

    conversation.messages.sort((a, b) => {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

    return true;
}

/* ==================================================
   API REQUEST HELPER
================================================== */

async function apiRequest(path, options = {}) {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const headers = { ...(options.headers || {}) };

    const isFormData = options.body instanceof FormData;

    if (
        !isFormData &&
        options.body !== undefined &&
        !headers["Content-Type"]
    ) {
        headers["Content-Type"] = "application/json";
    }

    if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers
        });
    } catch {
        throw new Error(
            "Cannot connect to the Sha'sapp server. Please check your internet connection and try again."
        );
    }

    const responseText = await response.text();
    let data = {};

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error("The server returned an invalid response.");
        }
    }

    if (!response.ok) {
        let detail = data.detail;

        if (Array.isArray(detail)) {
            detail = detail
                .map((item) => item.msg || "Invalid input")
                .join(", ");
        }

        if (response.status === 401) {
            sessionStorage.removeItem(TOKEN_KEY);
        }

        throw new Error(
            typeof detail === "string"
                ? detail
                : `Request failed with status ${response.status}.`
        );
    }

    return data;
}

/* ==================================================
   THEME
================================================== */

function setTheme(theme) {
    const isLight = theme === "light";

    document.body.classList.toggle("light-theme", isLight);

    $("#themeToggle").textContent = isLight ? "☀" : "☾";

    $("#themeToggle").setAttribute(
        "aria-label",
        isLight ? "Switch to dark theme" : "Switch to light theme"
    );

    try {
        localStorage.setItem("sha-app-theme", theme);
    } catch {
        // Theme still works without localStorage.
    }
}

function initializeTheme() {
    let savedTheme = null;

    try {
        savedTheme = localStorage.getItem("sha-app-theme");
    } catch {
        // Use default theme.
    }

    setTheme(savedTheme || "dark");
}

$("#themeToggle").addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("light-theme")
        ? "dark"
        : "light";

    setTheme(nextTheme);
});

/* ==================================================
   AUTHENTICATION UI
================================================== */

function setAuthMode(mode) {
    authMode = mode;

    const registering = mode === "register";

    authTitle.textContent = registering
        ? "Create your account."
        : "Welcome back.";

    authDescription.textContent = registering
        ? "Join Sha'sapp and start connecting."
        : "Sign in to continue your conversations.";

    nameField.classList.toggle("hidden", !registering);
    fullNameInput.required = registering;

    passwordInput.autocomplete = registering
        ? "new-password"
        : "current-password";

    authSubmit.innerHTML = registering
        ? 'Create account <span>→</span>'
        : 'Sign in <span>→</span>';

    authSwitchText.textContent = registering
        ? "Already have an account?"
        : "New to Sha'sapp?";

    authSwitch.textContent = registering
        ? "Sign in"
        : "Create account";

    authError.textContent = "";
}

authSwitch.addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "register" : "login");
});

$("#togglePassword").addEventListener("click", () => {
    const currentlyHidden = passwordInput.type === "password";

    passwordInput.type = currentlyHidden ? "text" : "password";

    $("#togglePassword").textContent = currentlyHidden
        ? "Hide"
        : "Show";
});

/* ==================================================
   SHOW APPLICATION
================================================== */

async function showAuthenticatedApp(user) {
    currentUser = user;

    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");

    const displayName = user.full_name || "Sha'sapp User";

    $("#myName").textContent = displayName;
    $("#myAvatar").textContent = getInitials(displayName);
    $("#myEmail").textContent = user.email || "";
    $("#connectionText").textContent = "Loading conversations...";

    // Start friend request checking automatically after login
    window.startFriendRequestPolling?.();

    try {
        await loadConversations();

        $("#connectionText").textContent = "Connected";

        if (conversations.length > 0) {
            $("#emptyState").classList.add("hidden");
            $("#chatPanel").classList.add("hidden");
        } else {
            $("#emptyState").classList.remove("hidden");
            $("#chatPanel").classList.add("hidden");
        }
    } catch (error) {
        $("#connectionText").textContent = "Connection error";

        $("#conversationList").innerHTML =
            `<div class="no-conversations">${escapeHTML(error.message)}</div>`;

        $("#chatCount").textContent = "0";
        $("#emptyState").classList.remove("hidden");
        $("#chatPanel").classList.add("hidden");
    }
}

/* ==================================================
   REGISTER AND LOGIN
================================================== */

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    authError.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const registering = authMode === "register";

    if (registering && !fullNameInput.value.trim()) {
        authError.textContent = "Please enter your full name.";
        return;
    }

    authSubmit.disabled = true;

    authSubmit.textContent = registering
        ? "Creating account..."
        : "Signing in...";

    try {
        if (registering) {
            await apiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    full_name: fullNameInput.value.trim(),
                    email,
                    password
                })
            });

            setAuthMode("login");

            emailInput.value = email;
            passwordInput.value = "";

            authError.textContent =
                "Account created successfully! Please sign in.";

            return;
        }

        const loginData = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        if (!loginData.access_token) {
            throw new Error("The server did not return an access token.");
        }

        sessionStorage.setItem(TOKEN_KEY, loginData.access_token);

        try {
            const user = await apiRequest("/auth/me");
            await showAuthenticatedApp(user);
        } catch (error) {
            sessionStorage.removeItem(TOKEN_KEY);
            throw error;
        }

    } catch (error) {
        authError.textContent =
            error.message || "Authentication failed. Please try again.";

    } finally {
        authSubmit.disabled = false;

        authSubmit.innerHTML = authMode === "register"
            ? 'Create account <span>→</span>'
            : 'Sign in <span>→</span>';
    }
});

/* ==================================================
   LOAD REAL CONVERSATIONS FROM DATABASE
================================================== */

async function loadConversations() {
    const [conversationData, contacts] = await Promise.all([
        apiRequest("/messages/conversations"),
        apiRequest("/contacts/")
    ]);

    conversations = await Promise.all(
        conversationData.map(async (item) => {
            const otherMemberId = item.member_ids.find(
                (id) => Number(id) !== Number(currentUser.id)
            );

            const contact = contacts.find(
                (person) => Number(person.id) === Number(otherMemberId)
            );

            const name = item.is_group
                ? (item.title || "Group conversation")
                : (contact?.full_name || "Unknown contact");

            let messages = [];

            try {
                const history = await apiRequest(
                    `/messages/conversations/${item.id}/messages?limit=100&offset=0`
                );

                messages = history.map(normalizeMessage);
            } catch (error) {
                console.error(
                    `Could not load messages for conversation ${item.id}:`,
                    error
                );
            }

            return {
                id: Number(item.id),
                name,
                about: item.is_group
                    ? "Sha'sapp group conversation."
                    : `Conversation with ${name}.`,
                color: getColor(otherMemberId || item.id),
                online: false,
                group: Boolean(item.is_group),
                unread: 0,
                messages,
                memberIds: item.member_ids,
                contactId: otherMemberId
            };
        })
    );

    conversations.sort((a, b) => {
        const aDate = new Date(
            a.messages.at(-1)?.createdAt || 0
        ).getTime();

        const bDate = new Date(
            b.messages.at(-1)?.createdAt || 0
        ).getTime();

        return bDate - aDate;
    });

    $("#previewButton").classList.add("hidden");

    renderConversations();
}

/* ==================================================
   RENDER CONVERSATION LIST
================================================== */

function renderConversations() {
    const query = $("#searchInput").value.trim().toLowerCase();

    const filtered = conversations.filter((conversation) => {
        const lastMessage = conversation.messages.at(-1);

        const matchesSearch =
            conversation.name.toLowerCase().includes(query) ||
            getMessagePreview(lastMessage).toLowerCase().includes(query);

        const matchesFilter =
            activeFilter === "all" ||
            (activeFilter === "unread" && conversation.unread > 0) ||
            (activeFilter === "groups" && conversation.group);

        return matchesSearch && matchesFilter;
    });

    $("#chatCount").textContent = String(conversations.length);

    if (filtered.length === 0) {
        $("#conversationList").innerHTML =
            '<div class="no-conversations">No conversations found.</div>';
        return;
    }

    $("#conversationList").innerHTML = filtered.map((conversation) => {
        const lastMessage = conversation.messages.at(-1);

        const preview = lastMessage
            ? `${lastMessage.outgoing ? "You: " : ""}${getMessagePreview(lastMessage)}`
            : "No messages yet";

        const isActive =
            Number(conversation.id) === Number(activeConversationId);

        return `
            <button
                type="button"
                class="conversation-item ${isActive ? "active" : ""}"
                data-conversation-id="${conversation.id}"
            >
                <span
                    class="avatar"
                    style="background:${conversation.color}"
                >${escapeHTML(getInitials(conversation.name))}</span>

                <span class="conversation-details">
                    <span class="conversation-top">
                        <strong>${escapeHTML(conversation.name)}</strong>
                        <time>${escapeHTML(lastMessage?.time || "")}</time>
                    </span>

                    <span class="conversation-bottom">
                        <span>${escapeHTML(preview)}</span>
                        ${
                            conversation.unread > 0
                                ? `<span class="unread-badge">${conversation.unread}</span>`
                                : ""
                        }
                    </span>
                </span>
            </button>
        `;
    }).join("");

    $("#conversationList")
        .querySelectorAll("[data-conversation-id]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                selectConversation(Number(button.dataset.conversationId));
            });
        });
}

/* ==================================================
   REAL-TIME WEBSOCKET CONNECTION
================================================== */

function disconnectWebSocket() {
    manuallyClosedSocket = true;

    clearTimeout(reconnectTimer);
    clearTimeout(typingTimer);

    reconnectTimer = null;
    typingTimer = null;

    isTypingSent = false;

    if (activeSocket) {
        const socket = activeSocket;
        activeSocket = null;
        socket.close(1000, "Conversation changed");
    }
}

function connectWebSocket(conversationId) {
    disconnectWebSocket();
    manuallyClosedSocket = false;
    reconnectAttempts = 0;

    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) return;

    const wsProtocol = API_BASE_URL.startsWith("https:")
    ? "wss:"
    : "ws:";

const socketUrl =
    `${wsProtocol}//${new URL(API_BASE_URL).host}/ws/${conversationId}?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(socketUrl);

    activeSocket = socket;

    socket.onopen = () => {
        if (activeSocket !== socket) return;

        reconnectAttempts = 0;

        $("#connectionText").textContent = "Connected";
        $("#chatStatus").textContent = "Connected";

        console.log("WebSocket connected:", conversationId);
    };

    socket.onmessage = (event) => {
        if (activeSocket !== socket) return;

        let data;

        try {
            data = JSON.parse(event.data);
        } catch {
            console.error("Invalid WebSocket event:", event.data);
            return;
        }

        handleRealtimeEvent(data, conversationId);
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
        if (activeSocket !== socket) return;

        activeSocket = null;

        $("#chatStatus").textContent = "Reconnecting...";
        $("#connectionText").textContent = "Reconnecting...";

        if (
            manuallyClosedSocket ||
            Number(activeConversationId) !== Number(conversationId)
        ) {
            return;
        }

        reconnectAttempts++;

        const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts - 1),
            15000
        );

        reconnectTimer = setTimeout(() => {
            if (
                Number(activeConversationId) === Number(conversationId) &&
                !manuallyClosedSocket
            ) {
                connectWebSocket(conversationId);
            }
        }, delay);
    };
}

/* ==================================================
   HANDLE REAL-TIME EVENTS
================================================== */

function handleRealtimeEvent(data, conversationId) {
    const conversation = conversations.find(
        (item) => Number(item.id) === Number(conversationId)
    );

    if (!conversation) return;

    switch (data.type) {
        case "connected":
            $("#chatStatus").textContent = "Connected";
            break;

        // Both normal text messages and uploaded media messages.
        case "message":
        case "media_message": {
            const added = addMessageToConversation(
                conversation,
                data
            );

            if (!added) break;

            if (
                Number(activeConversationId) === Number(conversationId)
            ) {
                renderMessages();
            } else if (
                Number(data.sender_id) !== Number(currentUser?.id)
            ) {
                conversation.unread =
                    (conversation.unread || 0) + 1;
            }

            renderConversations();
            break;
        }

        case "typing":
            if (Number(data.user_id) === Number(currentUser.id)) {
                break;
            }

            $("#typingIndicator").textContent =
                data.is_typing ? `${conversation.name} is typing...` : "";

            $("#typingIndicator").classList.toggle(
                "hidden",
                !data.is_typing
            );
            break;

        case "presence":
            if (Number(data.user_id) === Number(currentUser.id)) {
                break;
            }

            conversation.online = data.status === "online";

            $("#chatStatus").textContent =
                conversation.online ? "Online" : "Offline";

            renderConversations();
            break;

        case "error":
            console.error("WebSocket server:", data.message);
            break;

        default:
            console.log("Unknown WebSocket event:", data);
    }
}

/* ==================================================
   SEND TYPING STATUS
================================================== */

function sendTypingStatus(isTyping) {
    if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN) {
        return;
    }

    if (isTypingSent === isTyping) return;

    isTypingSent = isTyping;

    activeSocket.send(JSON.stringify({
        type: "typing",
        is_typing: isTyping
    }));
}

/* ==================================================
   SELECT AND OPEN A REAL CONVERSATION
================================================== */

async function selectConversation(id) {
    const conversation = conversations.find(
        (item) => Number(item.id) === Number(id)
    );

    if (!conversation) return;

    activeConversationId = conversation.id;
    conversation.unread = 0;
    messageSearchTerm = "";

    $("#messageSearch").classList.add("hidden");
    $("#messageSearchInput").value = "";

    $("#emptyState").classList.add("hidden");
    $("#chatPanel").classList.remove("hidden");
    $("#infoPanel").classList.add("hidden");

    $("#chatAvatar").textContent = getInitials(conversation.name);
    $("#chatAvatar").style.background = conversation.color;
    $("#chatName").textContent = conversation.name;
    $("#chatStatus").textContent = "Conversation";

    $("#infoAvatar").textContent = getInitials(conversation.name);
    $("#infoAvatar").style.background = conversation.color;
    $("#infoName").textContent = conversation.name;
    $("#infoStatus").textContent = "Sha'sapp contact";
    $("#infoAbout").textContent = conversation.about;

    $("#messageList").innerHTML =
        '<p class="no-conversations">Loading messages...</p>';

    appScreen.classList.add("mobile-chat-open");
    connectWebSocket(conversation.id);

    renderConversations();

    try {
        const history = await apiRequest(
            `/messages/conversations/${conversation.id}/messages?limit=100&offset=0`
        );

        // Do not overwrite messages received through WebSocket
        // while the history request was still running.
        const latestMessages = history.map(normalizeMessage);
        const latestIds = new Set(
            latestMessages.map((message) => String(message.id))
        );

        const socketMessages = conversation.messages.filter(
            (message) => !latestIds.has(String(message.id))
        );

        conversation.messages = [
            ...latestMessages,
            ...socketMessages
        ].sort((a, b) => {
            return new Date(a.createdAt || 0) -
                new Date(b.createdAt || 0);
        });

        if (Number(activeConversationId) === Number(conversation.id)) {
            renderMessages();
            renderConversations();
        }

    } catch (error) {
        if (Number(activeConversationId) === Number(conversation.id)) {
            $("#messageList").innerHTML =
                `<p class="no-conversations">${escapeHTML(error.message)}</p>`;
        }
    }

    $("#messageInput").focus();
}

/* ==================================================
   AUTHENTICATED MEDIA PREVIEW
================================================== */

function clearMediaObjectURLs() {
    for (const url of mediaObjectURLs.values()) {
        URL.revokeObjectURL(url);
    }

    mediaObjectURLs.clear();
    mediaLoadingPromises.clear();
}

async function getAuthenticatedMediaURL(messageId) {
    if (mediaObjectURLs.has(messageId)) {
        return mediaObjectURLs.get(messageId);
    }

    if (mediaLoadingPromises.has(messageId)) {
        return mediaLoadingPromises.get(messageId);
    }

    const promise = (async () => {
        const token = sessionStorage.getItem(TOKEN_KEY);

        const response = await fetch(
            `${API_BASE_URL}/media/${encodeURIComponent(messageId)}`,
            {
                headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : {}
            }
        );

        if (!response.ok) {
            throw new Error(
                response.status === 404
                    ? "Media file not found."
                    : "Could not load media."
            );
        }

        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);

        mediaObjectURLs.set(messageId, objectURL);

        return objectURL;
    })();

    mediaLoadingPromises.set(messageId, promise);

    try {
        return await promise;
    } finally {
        mediaLoadingPromises.delete(messageId);
    }
}

async function loadMediaPreview(message, container) {
    if (!container || !message.id) return;

    try {
        container.textContent = "Loading media...";

        const objectURL = await getAuthenticatedMediaURL(message.id);

        if (!container.isConnected) return;

        container.replaceChildren();

        let mediaElement;

        if (message.messageType === "image") {
            mediaElement = document.createElement("img");
            mediaElement.alt = message.mediaFileName || "Shared photo";
            mediaElement.className = "message-media";
            mediaElement.src = objectURL;

        } else if (message.messageType === "video") {
            mediaElement = document.createElement("video");
            mediaElement.className = "message-media";
            mediaElement.src = objectURL;
            mediaElement.controls = true;
            mediaElement.preload = "metadata";
            mediaElement.playsInline = true;

        } else if (message.messageType === "audio") {
            mediaElement = document.createElement("audio");
            mediaElement.src = objectURL;
            mediaElement.controls = true;
            mediaElement.preload = "metadata";
            mediaElement.style.maxWidth = "100%";

        } else {
            const link = document.createElement("a");
            link.href = objectURL;
            link.download = message.mediaFileName || "download";
            link.textContent =
                `Download ${message.mediaFileName || "file"}`;

            container.replaceChildren(link);
            return;
        }

        container.appendChild(mediaElement);

        const details = document.createElement("div");
        details.className = "media-file-details";
        details.textContent =
            `${message.mediaFileName || "Media"} · ${formatFileSize(message.mediaSizeBytes)}`;

        container.appendChild(details);

    } catch (error) {
        if (container.isConnected) {
            container.textContent = error.message;
        }
    }
}

/* ==================================================
   DISPLAY REAL MESSAGES
================================================== */

function renderMessages() {
    const conversation = conversations.find(
        (item) => Number(item.id) === Number(activeConversationId)
    );

    if (!conversation) return;

    const filteredMessages = conversation.messages.filter((message) => {
        const searchableText = [
            message.text,
            message.mediaFileName,
            getMessagePreview(message)
        ].join(" ").toLowerCase();

        return searchableText.includes(messageSearchTerm);
    });

    const messagesHTML = filteredMessages.map((message) => {
        let contentHTML = "";

        if (message.messageType === "text") {
            contentHTML =
                `<div class="message-bubble">${escapeHTML(message.text)}</div>`;
        } else {
            contentHTML = `
                <div class="message-bubble">
                    <div
                        class="media-preview-content"
                        data-media-message-id="${escapeHTML(message.id)}"
                    >Loading media...</div>
                </div>
            `;
        }

        const statusLabel =
            message.status === "read"
                ? "Read"
                : message.status === "delivered"
                    ? "Delivered"
                    : "Sent";

        return `
            <div class="message-row ${message.outgoing ? "outgoing" : ""}">
                ${contentHTML}

                <div class="message-meta">
                    <time>${escapeHTML(message.time)}</time>

                    ${
                        message.outgoing
                            ? `<span class="message-status" title="${statusLabel}">✓</span>`
                            : ""
                    }
                </div>
            </div>
        `;
    }).join("");

    const noResults = filteredMessages.length === 0
        ? '<p class="no-conversations">No messages found.</p>'
        : "";

    $("#messageList").innerHTML = `
        <div class="date-divider">
            <span>Messages</span>
        </div>

        ${messagesHTML}
        ${noResults}
    `;

    $("#messageList")
        .querySelectorAll("[data-media-message-id]")
        .forEach((container) => {
            const message = filteredMessages.find(
                (item) =>
                    String(item.id) === container.dataset.mediaMessageId
            );

            if (message) {
                loadMediaPreview(message, container);
            }
        });

    $("#messageList").scrollTop = $("#messageList").scrollHeight;

    $("#infoMessageCount").textContent =
        `${conversation.messages.length} messages`;
}

/* ==================================================
   SEND REAL-TIME TEXT MESSAGE
================================================== */

$("#messageForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const input = $("#messageInput");
    const text = input.value.trim();

    if (!text || activeConversationId === null) return;

    const conversation = conversations.find(
        (item) => Number(item.id) === Number(activeConversationId)
    );

    if (!conversation) return;

    const sendButton = $("#sendButton");
    sendButton.disabled = true;

    try {
        if (
            activeSocket &&
            activeSocket.readyState === WebSocket.OPEN
        ) {
            sendTypingStatus(false);

            activeSocket.send(JSON.stringify({
                type: "message",
                content: text
            }));

            input.value = "";

        } else {
            const message = await apiRequest(
                `/messages/conversations/${conversation.id}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify({ content: text })
                }
            );

            addMessageToConversation(conversation, message);

            input.value = "";

            renderMessages();
            renderConversations();
        }

    } catch (error) {
        alert(`Message could not be sent: ${error.message}`);
    } finally {
        sendButton.disabled = false;
        input.focus();
    }
});

/* ==================================================
   MEDIA FILE SELECTION AND PREVIEW
================================================== */

function revokeSelectedPreviewURL() {
    if (selectedPreviewURL) {
        URL.revokeObjectURL(selectedPreviewURL);
        selectedPreviewURL = null;
    }
}

function showMediaPreview(file, type) {
    revokeSelectedPreviewURL();

    selectedMediaFile = file;
    selectedMediaType = type;

    const preview = $("#mediaPreview");
    const content = $("#mediaPreviewContent");

    preview.classList.remove("hidden");
    content.replaceChildren();

    const details = document.createElement("p");
    details.textContent =
        `${file.name} · ${formatFileSize(file.size)}`;

    content.appendChild(details);

    if (type === "image" || type === "video") {
        selectedPreviewURL = URL.createObjectURL(file);

        if (type === "image") {
            const image = document.createElement("img");
            image.src = selectedPreviewURL;
            image.alt = "Selected image preview";
            image.style.maxWidth = "180px";
            image.style.maxHeight = "150px";
            image.style.objectFit = "contain";

            content.prepend(image);

        } else {
            const video = document.createElement("video");
            video.src = selectedPreviewURL;
            video.controls = true;
            video.style.maxWidth = "180px";
            video.style.maxHeight = "150px";

            content.prepend(video);
        }
    }

    $("#mediaPreviewName").textContent = file.name;
}

function clearSelectedMedia() {
    revokeSelectedPreviewURL();

    selectedMediaFile = null;
    selectedMediaType = null;

    $("#mediaPreview").classList.add("hidden");
    $("#mediaPreviewContent").replaceChildren();
    $("#mediaPreviewName").textContent = "";

    $("#galleryInput").value = "";
    $("#cameraInput").value = "";
    $("#audioFileInput").value = "";
}

function detectMediaType(file) {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";

    return null;
}

function selectMediaFile(file) {
    if (!file) return;

    const type = detectMediaType(file);

    if (!type) {
        alert("Please select a supported image, video, or audio file.");
        return;
    }

    const maxSizes = {
        image: 25 * 1024 * 1024,
        video: 100 * 1024 * 1024,
        audio: 20 * 1024 * 1024
    };

    if (file.size > maxSizes[type]) {
        alert(`This ${type} file is too large.`);
        return;
    }

    showMediaPreview(file, type);
}

/* ==================================================
   UPLOAD PROGRESS
================================================== */

function showUploadProgress(percent, text) {
    $("#uploadProgress").classList.remove("hidden");

    $("#uploadProgressText").textContent = text;
    $("#uploadProgressPercent").textContent = `${percent}%`;
    $("#uploadProgressBar").style.width = `${percent}%`;
}

function hideUploadProgress() {
    $("#uploadProgress").classList.add("hidden");

    $("#uploadProgressBar").style.width = "0%";
    $("#uploadProgressText").textContent = "";
    $("#uploadProgressPercent").textContent = "0%";
}

function uploadMedia(
    file,
    type,
    durationSeconds = null,
    conversationId = activeConversationId
) {
    return new Promise((resolve, reject) => {
        if (conversationId === null) {
            reject(new Error("Please open a conversation first."));
            return;
        }

        const token = sessionStorage.getItem(TOKEN_KEY);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("message_type", type);

        if (durationSeconds !== null) {
            formData.append(
                "duration_seconds",
                String(durationSeconds)
            );
        }

        const xhr = new XMLHttpRequest();
        uploadRequest = xhr;

        xhr.open(
            "POST",
            `${API_BASE_URL}/media/conversations/${conversationId}`
        );

        if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.upload.addEventListener("progress", (event) => {
            if (!event.lengthComputable) return;

            const percent = Math.round(
                (event.loaded / event.total) * 100
            );

            showUploadProgress(percent, "Uploading media...");
        });

        xhr.onload = () => {
            if (uploadRequest === xhr) {
                uploadRequest = null;
            }

            let data = {};

            try {
                data = xhr.responseText
                    ? JSON.parse(xhr.responseText)
                    : {};
            } catch {
                reject(new Error("The server returned an invalid response."));
                return;
            }

            if (xhr.status < 200 || xhr.status >= 300) {
                reject(
                    new Error(
                        data.detail || `Upload failed (${xhr.status}).`
                    )
                );
                return;
            }

            resolve(data);
        };

        xhr.onerror = () => {
            if (uploadRequest === xhr) {
                uploadRequest = null;
            }

            reject(new Error("Network error while uploading media."));
        };

        xhr.onabort = () => {
            if (uploadRequest === xhr) {
                uploadRequest = null;
            }

            reject(new Error("Upload cancelled."));
        };

        showUploadProgress(0, "Starting upload...");
        xhr.send(formData);
    });
}

async function sendSelectedMedia() {
    if (!selectedMediaFile || !selectedMediaType) return;

    const file = selectedMediaFile;
    const type = selectedMediaType;
    const conversationId = activeConversationId;

    const sendButton = $("#sendButton");
    sendButton.disabled = true;

    try {
        const messageData = await uploadMedia(
            file,
            type,
            null,
            conversationId
        );

        const conversation = conversations.find(
            (item) => Number(item.id) === Number(conversationId)
        );

        if (conversation) {
            const added = addMessageToConversation(
                conversation,
                messageData
            );

            if (
                added &&
                Number(activeConversationId) === Number(conversationId)
            ) {
                renderMessages();
            }

            renderConversations();
        }

        clearSelectedMedia();
        hideUploadProgress();

    } catch (error) {
        alert(error.message);
        hideUploadProgress();

    } finally {
        sendButton.disabled = false;
        uploadRequest = null;
    }
}

/* ==================================================
   ATTACHMENT MENU
================================================== */

$("#attachButton").addEventListener("click", () => {
    $("#attachmentMenu").classList.toggle("hidden");
});

$("#chooseGalleryButton").addEventListener("click", () => {
    $("#attachmentMenu").classList.add("hidden");
    $("#galleryInput").click();
});

$("#openCameraButton").addEventListener("click", () => {
    $("#attachmentMenu").classList.add("hidden");
    $("#cameraInput").click();
});

$("#chooseAudioButton").addEventListener("click", () => {
    $("#attachmentMenu").classList.add("hidden");
    $("#audioFileInput").click();
});

$("#galleryInput").addEventListener("change", (event) => {
    selectMediaFile(event.target.files[0]);
});

$("#cameraInput").addEventListener("change", (event) => {
    selectMediaFile(event.target.files[0]);
});

$("#audioFileInput").addEventListener("change", (event) => {
    selectMediaFile(event.target.files[0]);
});

$("#removeMediaButton").addEventListener("click", clearSelectedMedia);

$("#cancelUploadButton").addEventListener("click", () => {
    if (uploadRequest) {
        uploadRequest.abort();
    }
});

$("#sendButton").addEventListener("click", (event) => {
    if (!selectedMediaFile) return;

    event.preventDefault();
    sendSelectedMedia();
});

/* ==================================================
   VOICE RECORDING
================================================== */

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function stopRecordingTracks() {
    if (recordingStream) {
        recordingStream.getTracks().forEach((track) => track.stop());
        recordingStream = null;
    }

    clearInterval(recordingTimer);
    recordingTimer = null;
}

async function startVoiceRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        alert("Voice recording is not supported in this browser.");
        return;
    }

    if (activeConversationId === null) {
        alert("Please open a conversation before recording.");
        return;
    }

    recordingConversationId = activeConversationId;

    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        recordedChunks = [];
        isRecordingCancelled = false;

        const options = {};

        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            options.mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
            options.mimeType = "audio/mp4";
        }

        mediaRecorder = new MediaRecorder(recordingStream, options);

        mediaRecorder.addEventListener("dataavailable", (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        });

        mediaRecorder.addEventListener("stop", async () => {
            stopRecordingTracks();

            $("#recordingPanel").classList.add("hidden");
            $("#recordButton").classList.remove("recording");

            if (isRecordingCancelled || recordedChunks.length === 0) {
                recordedChunks = [];
                recordingConversationId = null;
                return;
            }

            const targetConversationId = recordingConversationId;
            recordingConversationId = null;

            const mimeType =
                mediaRecorder.mimeType || "audio/webm";

            const extension = mimeType.includes("mp4")
                ? "m4a"
                : "webm";

            const audioBlob = new Blob(recordedChunks, {
                type: mimeType
            });

            const durationSeconds = Math.min(
                3600,
                Math.max(
                    1,
                    Math.round(
                        (Date.now() - recordingStartedAt) / 1000
                    )
                )
            );

            const audioFile = new File(
                [audioBlob],
                `voice-message-${Date.now()}.${extension}`,
                { type: mimeType }
            );

            recordedChunks = [];

            if (audioFile.size === 0) {
                alert("The recording is empty.");
                return;
            }

            try {
                showUploadProgress(0, "Sending voice message...");

                const messageData = await uploadMedia(
                    audioFile,
                    "audio",
                    durationSeconds,
                    targetConversationId
                );

                const conversation = conversations.find(
                    (item) =>
                        Number(item.id) === Number(targetConversationId)
                );

                if (conversation) {
                    const added = addMessageToConversation(
                        conversation,
                        messageData
                    );

                    if (
                        added &&
                        Number(activeConversationId) ===
                        Number(targetConversationId)
                    ) {
                        renderMessages();
                    }

                    renderConversations();
                }

                hideUploadProgress();

            } catch (error) {
                hideUploadProgress();
                alert(
                    `Voice message could not be sent: ${error.message}`
                );
            }
        });

        mediaRecorder.start();

        recordingStartedAt = Date.now();

        $("#recordingPanel").classList.remove("hidden");
        $("#recordButton").classList.add("recording");
        $("#recordingTimer").textContent = "00:00";

        recordingTimer = setInterval(() => {
            const seconds = Math.floor(
                (Date.now() - recordingStartedAt) / 1000
            );

            $("#recordingTimer").textContent =
                formatDuration(seconds);
        }, 1000);

    } catch (error) {
        stopRecordingTracks();

        alert(
            error.name === "NotAllowedError"
                ? "Please allow microphone access to record voice messages."
                : `Could not start recording: ${error.message}`
        );
    }
}

function stopVoiceRecording(cancel = false) {
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;

    isRecordingCancelled = cancel;

    mediaRecorder.stop();
}

$("#recordButton").addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        stopVoiceRecording(false);
    } else {
        startVoiceRecording();
    }
});

$("#stopRecordingButton").addEventListener("click", () => {
    stopVoiceRecording(false);
});

$("#cancelRecordingButton").addEventListener("click", () => {
    stopVoiceRecording(true);
});

/* ==================================================
   SEARCH CONVERSATIONS
================================================== */

$("#searchInput").addEventListener("input", renderConversations);

/* ==================================================
   REAL-TIME TYPING DETECTION
================================================== */

$("#messageInput").addEventListener("input", () => {
    if (!$("#messageInput").value.trim()) {
        clearTimeout(typingTimer);
        sendTypingStatus(false);
        return;
    }

    sendTypingStatus(true);

    clearTimeout(typingTimer);

    typingTimer = setTimeout(() => {
        sendTypingStatus(false);
    }, 1000);
});

/* ==================================================
   CONVERSATION FILTERS
================================================== */

document.querySelectorAll(".filter-tab").forEach((button) => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;

        document.querySelectorAll(".filter-tab").forEach((tab) => {
            tab.classList.toggle("active", tab === button);
        });

        renderConversations();
    });
});

/* ==================================================
   SEARCH MESSAGES
================================================== */

$("#searchMessagesButton").addEventListener("click", () => {
    $("#messageSearch").classList.remove("hidden");
    $("#messageSearchInput").focus();
});

$("#closeMessageSearch").addEventListener("click", () => {
    $("#messageSearch").classList.add("hidden");
    $("#messageSearchInput").value = "";

    messageSearchTerm = "";

    renderMessages();
});

$("#messageSearchInput").addEventListener("input", (event) => {
    messageSearchTerm = event.target.value.trim().toLowerCase();
    renderMessages();
});

/* ==================================================
   CHAT INFORMATION PANEL
================================================== */

$("#chatInfoButton").addEventListener("click", () => {
    $("#infoPanel").classList.remove("hidden");
});

$("#closeInfoButton").addEventListener("click", () => {
    $("#infoPanel").classList.add("hidden");
});

/* ==================================================
   MOBILE BACK BUTTON
================================================== */

$("#backButton").addEventListener("click", () => {
    appScreen.classList.remove("mobile-chat-open");
    $("#infoPanel").classList.add("hidden");
});

/* ==================================================
   PREVIEW BUTTON
================================================== */

$("#previewButton").addEventListener("click", () => {
    if (conversations.length > 0) {
        selectConversation(conversations[0].id);
    }
});

/* ==================================================
   EMOJI BUTTON
================================================== */

$("#emojiButton").addEventListener("click", () => {
    const input = $("#messageInput");

    input.value += " 😊";
    input.focus();
});

/* ==================================================
   LOGOUT
================================================== */

$("#logoutButton").addEventListener("click", () => {
    if (uploadRequest) {
        uploadRequest.abort();
    }

    if (mediaRecorder && mediaRecorder.state === "recording") {
        stopVoiceRecording(true);
    }

    sessionStorage.removeItem(TOKEN_KEY);

    activeConversationId = null;
    activeFilter = "all";
    messageSearchTerm = "";
    conversations = [];
    currentUser = null;

    appScreen.classList.remove("mobile-chat-open");

    clearMediaObjectURLs();
    clearSelectedMedia();
    hideUploadProgress();

    showAuthenticationScreen();
});

/* ==================================================
   INITIALIZATION
================================================== */

initializeTheme();
setAuthMode("login");
showAuthenticationScreen();


/* ==================================================
   SHA'SAPP - SELECT PHONE CONTACTS
================================================== */

(() => {
    const selectButton = document.querySelector(
        "#selectPhoneContactsButton"
    );

    const resultsContainer = document.querySelector(
        "#phoneContactsResults"
    );

    if (!selectButton || !resultsContainer) {
        return;
    }

    function showContactMessage(message) {
        resultsContainer.classList.remove("hidden");
        resultsContainer.replaceChildren();

        const paragraph = document.createElement("p");
        paragraph.className = "phone-contacts-message";
        paragraph.textContent = message;

        resultsContainer.appendChild(paragraph);
    }

    function createContactCard(name, description) {
        const card = document.createElement("div");
        card.className = "phone-contact-result";

        const title = document.createElement("div");
        title.className = "phone-contact-name";
        title.textContent = name;

        const detail = document.createElement("div");
        detail.className = "phone-contact-description";
        detail.textContent = description;

        card.append(title, detail);
        resultsContainer.appendChild(card);

        return card;
    }

    function addActionButton(card, label, callback) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "phone-contact-action";
        button.textContent = label;

        button.addEventListener("click", callback);

        card.appendChild(button);

        return button;
    }

    async function inviteContact(name) {
        const invitation = {
            title: "Join Sha'sapp",
            text: `Hi ${name || "there"}! Join me on Sha'sapp so we can chat.`
        };

        if (navigator.share) {
            await navigator.share(invitation);
            return;
        }

        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(invitation.text);
            alert("Invitation message copied. You can now share it!");
            return;
        }

        alert(invitation.text);
    }

    async function displayMatches(contactName, response) {
        const matches = Array.isArray(response)
            ? response
            : response.matches || [];

        if (matches.length === 0) {
            const card = createContactCard(
                contactName,
                "This number is not registered as a verified Sha'sapp account."
            );

            addActionButton(card, "Invite", async (event) => {
                const button = event.currentTarget;
                button.disabled = true;

                try {
                    await inviteContact(contactName);
                } catch (error) {
                    if (error.name !== "AbortError") {
                        alert(`Could not share invitation: ${error.message}`);
                    }
                } finally {
                    button.disabled = false;
                }
            });

            return;
        }

        for (const person of matches) {
            const name = person.full_name || contactName;

            const card = createContactCard(
                name,
                person.email || "Sha'sapp user"
            );

            if (person.relationship === "contact") {
                const detail = document.createElement("p");
                detail.className = "phone-contacts-message";
                detail.textContent = "Already in your contacts.";
                card.appendChild(detail);
            } else if (person.relationship === "pending") {
                const detail = document.createElement("p");
                detail.className = "phone-contacts-message";
                detail.textContent = "Contact request already pending.";
                card.appendChild(detail);
            } else {
                addActionButton(card, "Add Contact", async (event) => {
                    const button = event.currentTarget;
                    button.disabled = true;
                    button.textContent = "Sending...";

                    try {
                        await apiRequest(
                            `/contacts/${encodeURIComponent(person.id)}/request`,
                            {
                                method: "POST"
                            }
                        );

                        button.textContent = "Request Sent";

                        alert(`Contact request sent to ${name}.`);
                    } catch (error) {
                        button.disabled = false;
                        button.textContent = "Add Contact";

                        alert(`Could not send request: ${error.message}`);
                    }
                });
            }
        }
    }

    async function selectPhoneContact() {
        if (!window.ShaCapacitor?.isNativePlatform()) {
            showContactMessage(
                "Select from Phone is available in the Android app, not the desktop browser."
            );
            return;
        }

        if (!window.ShaContacts?.pickContact) {
            showContactMessage(
                "Contacts plugin is unavailable. Please rebuild and sync the Android app."
            );
            return;
        }

        selectButton.disabled = true;
        selectButton.textContent = "Opening contacts...";

        try {
            const result = await window.ShaContacts.pickContact({
                projection: {
                    name: true,
                    phones: true
                }
            });

            const contact = result?.contact;

            if (!contact) {
                showContactMessage("No contact was selected.");
                return;
            }

            const contactName =
                contact.name?.display ||
                contact.name?.given ||
                "Phone contact";

            const phoneNumbers = (contact.phones || [])
                .map((phone) => phone.number)
                .filter((number) => typeof number === "string" && number.trim())
                .map((number) => number.trim());

            if (phoneNumbers.length === 0) {
                showContactMessage(
                    `${contactName} does not have a phone number saved.`
                );
                return;
            }

            resultsContainer.classList.remove("hidden");
            resultsContainer.replaceChildren();

            showContactMessage(`Checking ${contactName}...`);

            const response = await apiRequest("/contacts/match-phone", {
                method: "POST",
                body: JSON.stringify({
                    contacts: phoneNumbers.map((phone_number) => ({
                        name: contactName,
                        phone_number
                    }))
                })
            });

            resultsContainer.replaceChildren();

            await displayMatches(contactName, response);

        } catch (error) {
            if (
                error.message?.toLowerCase().includes("cancel") ||
                error.message?.toLowerCase().includes("canceled") ||
                error.message?.toLowerCase().includes("cancelled")
            ) {
                return;
            }

            showContactMessage(
                `Could not check contact: ${error.message}`
            );

        } finally {
            selectButton.disabled = false;
            selectButton.innerHTML = "<span>＋</span><span>Select from Phone</span>";
        }
    }
    /* FIND PEOPLE BY NAME OR EMAIL */

    const findPeopleInput = document.querySelector("#findPeopleInput");
    const findPeopleButton = document.querySelector("#findPeopleButton");

    async function searchPeople() {
        const query = findPeopleInput.value.trim();

        if (query.length < 2) {
            showContactMessage("Please enter at least 2 characters.");
            return;
        }

        findPeopleButton.disabled = true;
        findPeopleButton.textContent = "Searching...";

        showContactMessage("Searching for Sha'sapp users...");

        try {
            const response = await apiRequest(
                `/contacts/search?q=${encodeURIComponent(query)}`
            );

            resultsContainer.replaceChildren();

            if (!Array.isArray(response) || response.length === 0) {
                showContactMessage(
                    "No Sha'sapp account found. Check the name or email."
                );
                return;
            }

            await displayMatches(query, response);

        } catch (error) {
            showContactMessage(
                `Search failed: ${error.message}`
            );
        } finally {
            findPeopleButton.disabled = false;
            findPeopleButton.textContent = "Search";
        }
    }

    if (findPeopleButton && findPeopleInput) {
        findPeopleButton.addEventListener("click", searchPeople);

        findPeopleInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                searchPeople();
            }
        });
    }

    selectButton.addEventListener("click", selectPhoneContact);
})();

/* ==================================================
   SHA'SAPP - FRIEND REQUEST POPUP
================================================== */

(() => {
    const modal = document.querySelector("#friendRequestModal");
    const message = document.querySelector("#friendRequestMessage");
    const acceptButton = document.querySelector("#acceptFriendRequestButton");
    const declineButton = document.querySelector("#declineFriendRequestButton");

    if (!modal || !message || !acceptButton || !declineButton) {
        console.error("Friend request popup HTML is missing.");
        return;
    }

    let pollingTimer = null;
    let requestQueue = [];
    let activeRequest = null;
    let isProcessing = false;
    const seenRequestIds = new Set();

    function showNextRequest() {
        if (activeRequest || requestQueue.length === 0) return;

        activeRequest = requestQueue.shift();

        const senderName =
            activeRequest.sender?.full_name ||
            activeRequest.sender?.email ||
            "Someone";

        message.textContent =
            `${senderName} wants to connect with you on Sha'sapp.`;

        acceptButton.disabled = false;
        declineButton.disabled = false;
        acceptButton.textContent = "Accept";
        declineButton.textContent = "Decline";

        modal.classList.remove("hidden");
    }

    async function checkIncomingRequests() {
        if (!currentUser || !sessionStorage.getItem(TOKEN_KEY)) return;

        try {
            const requests = await apiRequest(
                "/contacts/requests/incoming"
            );

            if (!Array.isArray(requests)) return;

            requests.forEach((request) => {
                const requestId = Number(request.id);

                if (
                    request.status === "pending" &&
                    !seenRequestIds.has(requestId)
                ) {
                    seenRequestIds.add(requestId);
                    requestQueue.push(request);
                }
            });

            showNextRequest();
        } catch (error) {
            console.error("Friend request check failed:", error);
        }
    }

    async function respondToRequest(action) {
        if (!activeRequest || isProcessing) return;

        isProcessing = true;
        acceptButton.disabled = true;
        declineButton.disabled = true;

        const selectedButton =
            action === "accept" ? acceptButton : declineButton;

        selectedButton.textContent =
            action === "accept" ? "Accepting..." : "Declining...";

        try {
            await apiRequest(
                `/contacts/requests/${encodeURIComponent(activeRequest.id)}/${action}`,
                { method: "POST" }
            );

            modal.classList.add("hidden");
            activeRequest = null;

            await checkIncomingRequests();
        } catch (error) {
            message.textContent = error.message ||
                "Something went wrong. Please try again.";

            acceptButton.disabled = false;
            declineButton.disabled = false;
            acceptButton.textContent = "Accept";
            declineButton.textContent = "Decline";
        } finally {
            isProcessing = false;
        }
    }

    function startFriendRequestPolling() {
        stopFriendRequestPolling();

        requestQueue = [];
        activeRequest = null;
        seenRequestIds.clear();

        checkIncomingRequests();

        pollingTimer = setInterval(
            checkIncomingRequests,
            10000
        );
    }

    function stopFriendRequestPolling() {
        if (pollingTimer) {
            clearInterval(pollingTimer);
            pollingTimer = null;
        }

        requestQueue = [];
        activeRequest = null;
        seenRequestIds.clear();
        isProcessing = false;

        modal.classList.add("hidden");
    }

    acceptButton.addEventListener("click", () => {
        respondToRequest("accept");
    });

    declineButton.addEventListener("click", () => {
        respondToRequest("reject");
    });

    // Connect these functions to the existing login/logout flow.
    window.startFriendRequestPolling = startFriendRequestPolling;
    window.stopFriendRequestPolling = stopFriendRequestPolling;
})();


