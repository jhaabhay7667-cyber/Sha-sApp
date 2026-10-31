"use strict";

const API_BASE_URL = "http://127.0.0.1:8000";
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
let conversationSequence = 100;

/* --------------------------------------------------
   PREVIEW CONVERSATIONS
   These messages are currently sample data.
-------------------------------------------------- */

const conversations = [
    {
        id: "preview-1",
        name: "Aarav Sharma",
        about: "Always here for a good conversation.",
        color: "linear-gradient(140deg,#6d8cff,#4454ba)",
        online: true,
        group: false,
        unread: 2,
        messages: [
            {
                id: 1,
                text: "Hey! How are you doing?",
                outgoing: false,
                time: "10:24 AM"
            },
            {
                id: 2,
                text: "I'm doing great! How about you?",
                outgoing: true,
                time: "10:25 AM"
            },
            {
                id: 3,
                text: "Pretty good. Have you checked out the new project?",
                outgoing: false,
                time: "10:26 AM"
            }
        ]
    },
    {
        id: "preview-2",
        name: "Priya Verma",
        about: "Dream big. Work hard. Stay kind.",
        color: "linear-gradient(140deg,#f59ac2,#b45ad7)",
        online: true,
        group: false,
        unread: 0,
        messages: [
            {
                id: 4,
                text: "Hi! Hope your day is going well.",
                outgoing: false,
                time: "09:45 AM"
            },
            {
                id: 5,
                text: "Thank you! Hope yours is going well too.",
                outgoing: true,
                time: "09:47 AM"
            }
        ]
    },
    {
        id: "preview-3",
        name: "College Friends 🎓",
        about: "Friends sharing college updates.",
        color: "linear-gradient(140deg,#48c6a8,#258a9b)",
        online: false,
        group: true,
        unread: 5,
        messages: [
            {
                id: 6,
                text: "Anyone ready for tomorrow's class?",
                outgoing: false,
                time: "Yesterday"
            },
            {
                id: 7,
                text: "Yes! Let's prepare together.",
                outgoing: true,
                time: "Yesterday"
            }
        ]
    },
    {
        id: "preview-4",
        name: "Rohan Das",
        about: "Music, technology, and creativity.",
        color: "linear-gradient(140deg,#ffb86b,#e77750)",
        online: false,
        group: false,
        unread: 0,
        messages: [
            {
                id: 8,
                text: "That sounds like a great idea!",
                outgoing: false,
                time: "Yesterday"
            }
        ]
    }
];

/* --------------------------------------------------
   GENERAL HELPERS
-------------------------------------------------- */

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getInitials(name) {
    return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("")
        .toUpperCase() || "?";
}

function currentTime() {
    return new Intl.DateTimeFormat([], {
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date());
}

/* --------------------------------------------------
   THEME
-------------------------------------------------- */

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
        // Theme still works if browser storage is unavailable.
    }
}

function initializeTheme() {
    let savedTheme = null;

    try {
        savedTheme = localStorage.getItem("sha-app-theme");
    } catch {
        // Use the default theme.
    }

    setTheme(savedTheme || "dark");
}

$("#themeToggle").addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("light-theme")
        ? "dark"
        : "light";

    setTheme(nextTheme);
});

/* --------------------------------------------------
   AUTHENTICATION UI
-------------------------------------------------- */

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

/* --------------------------------------------------
   BACKEND API REQUEST HELPER
-------------------------------------------------- */

async function authApiRequest(path, options = {}) {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
    } catch {
        throw new Error(
            "Cannot connect to the backend. Make sure FastAPI is running at http://127.0.0.1:8000."
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

        throw new Error(
            typeof detail === "string"
                ? detail
                : `Request failed with status ${response.status}.`
        );
    }

    return data;
}

/* --------------------------------------------------
   SHOW APPLICATION AFTER LOGIN
-------------------------------------------------- */

function showAuthenticatedApp(user) {
    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");

    const displayName = user.full_name || "Sha'sapp User";

    $("#myName").textContent = displayName;
    $("#myAvatar").textContent = getInitials(displayName);
    $("#myEmail").textContent = user.email || "";
    $("#connectionText").textContent = "Connected";

    renderConversations();

    if (activeConversationId) {
        selectConversation(activeConversationId);
    } else {
        $("#emptyState").classList.remove("hidden");
        $("#chatPanel").classList.add("hidden");
    }
}

function showAuthenticationScreen() {
    appScreen.classList.add("hidden");
    authScreen.classList.remove("hidden");

    authForm.reset();

    $("#togglePassword").textContent = "Show";
    passwordInput.type = "password";

    setAuthMode("login");
}

/* --------------------------------------------------
   REGISTER AND LOGIN
-------------------------------------------------- */

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

    const originalButtonText = authSubmit.innerHTML;

    authSubmit.disabled = true;

    authSubmit.textContent = registering
        ? "Creating account..."
        : "Signing in...";

    try {
        /* REGISTER */

        if (registering) {
            await authApiRequest("/auth/register", {
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

        /* LOGIN */

        const loginData = await authApiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            })
        });

        if (!loginData.access_token) {
            throw new Error(
                "The server did not return an access token."
            );
        }

        sessionStorage.setItem(
            TOKEN_KEY,
            loginData.access_token
        );

        try {
            const user = await authApiRequest("/auth/me", {
                headers: {
                    Authorization: `Bearer ${loginData.access_token}`
                }
            });

            showAuthenticatedApp(user);
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

/* --------------------------------------------------
   CONVERSATION LIST
-------------------------------------------------- */

function renderConversations() {
    const query = $("#searchInput").value.trim().toLowerCase();

    const filtered = conversations.filter((conversation) => {
        const matchesSearch =
            conversation.name.toLowerCase().includes(query) ||
            (conversation.messages.at(-1)?.text || "")
                .toLowerCase()
                .includes(query);

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
            ? `${lastMessage.outgoing ? "You: " : ""}${lastMessage.text}`
            : "No messages yet";

        const isActive = conversation.id === activeConversationId;

        return `
            <button
                type="button"
                class="conversation-item ${isActive ? "active" : ""}"
                data-conversation-id="${escapeHTML(conversation.id)}"
            >
                <span
                    class="avatar ${conversation.online ? "online" : ""}"
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
                selectConversation(button.dataset.conversationId);
            });
        });
}

/* --------------------------------------------------
   SELECT CONVERSATION
-------------------------------------------------- */

function selectConversation(id) {
    const conversation = conversations.find(
        (item) => item.id === id
    );

    if (!conversation) return;

    activeConversationId = id;
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

    $("#chatStatus").textContent = conversation.online
        ? "Online · Preview"
        : "Offline · Preview";

    $("#infoAvatar").textContent = getInitials(conversation.name);
    $("#infoAvatar").style.background = conversation.color;

    $("#infoName").textContent = conversation.name;

    $("#infoStatus").textContent = conversation.online
        ? "Online · Preview"
        : "Offline · Preview";

    $("#infoAbout").textContent = conversation.about;

    $("#infoMessageCount").textContent =
        `${conversation.messages.length} preview messages`;

    appScreen.classList.add("mobile-chat-open");

    renderConversations();
    renderMessages();

    $("#messageInput").focus();
}

/* --------------------------------------------------
   DISPLAY MESSAGES
-------------------------------------------------- */

function renderMessages() {
    const conversation = conversations.find(
        (item) => item.id === activeConversationId
    );

    if (!conversation) return;

    const filteredMessages = conversation.messages.filter((message) =>
        message.text.toLowerCase().includes(messageSearchTerm)
    );

    const messagesHTML = filteredMessages.map((message) => `
        <div class="message-row ${message.outgoing ? "outgoing" : ""}">
            <div class="message-bubble">${escapeHTML(message.text)}</div>

            <div class="message-meta">
                <time>${escapeHTML(message.time)}</time>

                ${
                    message.outgoing
                        ? '<span class="message-status" title="Preview status">✓</span>'
                        : ""
                }
            </div>
        </div>
    `).join("");

    const noResults = filteredMessages.length === 0
        ? '<p class="no-conversations">No matching messages.</p>'
        : "";

    $("#messageList").innerHTML = `
        <div class="date-divider">
            <span>Preview conversation</span>
        </div>

        ${messagesHTML}
        ${noResults}
    `;

    $("#messageList").scrollTop = $("#messageList").scrollHeight;

    $("#infoMessageCount").textContent =
        `${conversation.messages.length} preview messages`;
}

/* --------------------------------------------------
   MESSAGE COMPOSER - PREVIEW ONLY
-------------------------------------------------- */

$("#messageForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const input = $("#messageInput");
    const text = input.value.trim();

    if (!text || !activeConversationId) return;

    const conversation = conversations.find(
        (item) => item.id === activeConversationId
    );

    if (!conversation) return;

    conversation.messages.push({
        id: ++conversationSequence,
        text,
        outgoing: true,
        time: currentTime()
    });

    input.value = "";

    renderMessages();
    renderConversations();
});

/* --------------------------------------------------
   SEARCH CONVERSATIONS
-------------------------------------------------- */

$("#searchInput").addEventListener("input", renderConversations);

/* --------------------------------------------------
   CONVERSATION FILTERS
-------------------------------------------------- */

document.querySelectorAll(".filter-tab").forEach((button) => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;

        document.querySelectorAll(".filter-tab").forEach((tab) => {
            tab.classList.toggle("active", tab === button);
        });

        renderConversations();
    });
});

/* --------------------------------------------------
   SEARCH MESSAGES
-------------------------------------------------- */

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

/* --------------------------------------------------
   CHAT INFORMATION PANEL
-------------------------------------------------- */

$("#chatInfoButton").addEventListener("click", () => {
    $("#infoPanel").classList.remove("hidden");
});

$("#closeInfoButton").addEventListener("click", () => {
    $("#infoPanel").classList.add("hidden");
});

/* --------------------------------------------------
   MOBILE BACK BUTTON
-------------------------------------------------- */

$("#backButton").addEventListener("click", () => {
    appScreen.classList.remove("mobile-chat-open");

    $("#infoPanel").classList.add("hidden");
});

/* --------------------------------------------------
   PREVIEW CONVERSATION BUTTON
-------------------------------------------------- */

$("#previewButton").addEventListener("click", () => {
    selectConversation(conversations[0].id);
});

/* --------------------------------------------------
   EMOJI BUTTON
-------------------------------------------------- */

$("#emojiButton").addEventListener("click", () => {
    const input = $("#messageInput");

    input.value += " 😊";
    input.focus();
});

/* --------------------------------------------------
   FILE ATTACHMENT BUTTON
-------------------------------------------------- */

$("#attachButton").addEventListener("click", () => {
    alert(
        "File sharing will be implemented after the backend and secure file storage are connected."
    );
});

/* --------------------------------------------------
   LOGOUT
-------------------------------------------------- */

$("#logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem(TOKEN_KEY);

    activeConversationId = null;
    activeFilter = "all";
    messageSearchTerm = "";

    appScreen.classList.remove("mobile-chat-open");

    showAuthenticationScreen();
});

/* --------------------------------------------------
   INITIALIZATION
-------------------------------------------------- */

initializeTheme();
setAuthMode("login");
showAuthenticationScreen();