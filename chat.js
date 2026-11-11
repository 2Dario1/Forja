(() => {
    const history = [];
    const elements = {};
    let busy = false;
    let lastFocusedElement = null;

    function setStatus(message, state) {
        elements.status.textContent = message;
        elements.status.dataset.state = state;
    }

    function addMessage(text, sender, extraClass = "") {
        const message = document.createElement("div");
        message.className = `forja-chat__message forja-chat__message--${sender}${extraClass ? ` ${extraClass}` : ""}`;
        message.textContent = text;
        elements.messages.append(message);
        elements.messages.scrollTop = elements.messages.scrollHeight;
        return message;
    }

    function resetConversation() {
        history.length = 0;
        elements.messages.replaceChildren();
        addMessage(
            "¡Hola! Soy FORJA AI, tu asesor de impresión 3D. Puedo ayudarte a elegir productos del catálogo, comparar materiales y resolver dudas técnicas. ¿Qué te gustaría construir?",
            "assistant"
        );
        elements.input.focus();
    }

    function getCatalogContext() {
        if (!Array.isArray(window.FORJA_PRODUCTS)) {
            return [];
        }

        return window.FORJA_PRODUCTS.map((product) => ({
            id: product.id,
            sku: product.sku,
            name: product.name,
            category: product.category,
            price: product.price,
            description: product.description,
            tags: product.tags,
            specs: product.specs
        }));
    }

    function setBusy(isBusy) {
        busy = isBusy;
        elements.send.disabled = isBusy;
        elements.input.disabled = isBusy;
        elements.quickActions.querySelectorAll("button").forEach((button) => {
            button.disabled = isBusy;
        });
    }

    async function sendMessage(text) {
        const userMessage = text.trim();
        if (!userMessage || busy) {
            return;
        }

        elements.input.value = "";
        elements.input.style.height = "auto";
        addMessage(userMessage, "user");
        history.push({ role: "user", text: userMessage });
        setBusy(true);

        const typing = document.createElement("div");
        typing.className = "forja-chat__typing";
        typing.setAttribute("role", "status");
        typing.setAttribute("aria-label", "FORJA AI está escribiendo");
        typing.innerHTML = "<span></span><span></span><span></span>";
        elements.messages.append(typing);
        elements.messages.scrollTop = elements.messages.scrollHeight;

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: history.slice(-10),
                    catalog: getCatalogContext()
                }),
                signal: AbortSignal.timeout(30000)
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result.error || "No fue posible obtener una respuesta.");
            }
            if (typeof result.reply !== "string" || !result.reply.trim()) {
                throw new Error("FORJA AI no devolvió una respuesta válida.");
            }

            history.push({ role: "model", text: result.reply });
            addMessage(result.reply, "assistant");
        } catch (error) {
            const message = error.name === "TimeoutError" || error.name === "AbortError"
                ? "La respuesta tardó demasiado. Intenta de nuevo."
                : error.message === "Failed to fetch"
                    ? "No se pudo conectar al servidor de FORJA. Inicia la aplicación con npm start."
                    : error.message;
            addMessage(message, "assistant", "forja-chat__message--error");
            setStatus("No se pudo completar la solicitud", "error");
        } finally {
            typing.remove();
            setBusy(false);
            elements.input.focus();
        }
    }

    async function checkConfiguration() {
        try {
            const response = await fetch("/api/health", { signal: AbortSignal.timeout(5000) });
            const health = await response.json();
            const configured = response.ok && health.configured === true;
            setStatus(
                configured ? "Gemini configurado · respuestas en español" : "Falta configurar GEMINI_API_KEY",
                configured ? "ready" : "error"
            );
        } catch {
            setStatus("Servidor de IA no disponible", "error");
        }
    }

    function openChat() {
        lastFocusedElement = document.activeElement;
        elements.panel.hidden = false;
        elements.panel.setAttribute("aria-hidden", "false");
        elements.toggle.setAttribute("aria-expanded", "true");
        elements.input.focus();
    }

    function closeChat() {
        elements.panel.hidden = true;
        elements.panel.setAttribute("aria-hidden", "true");
        elements.toggle.setAttribute("aria-expanded", "false");
        if (lastFocusedElement instanceof HTMLElement) {
            lastFocusedElement.focus();
        } else {
            elements.toggle.focus();
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        elements.panel = document.querySelector("#forja-chat-panel");
        elements.toggle = document.querySelector("#forja-chat-toggle");
        elements.close = document.querySelector("#forja-chat-close");
        elements.reset = document.querySelector("#forja-chat-reset");
        elements.status = document.querySelector("#forja-chat-status");
        elements.messages = document.querySelector("#forja-chat-messages");
        elements.quickActions = document.querySelector("#forja-chat-quick-actions");
        elements.form = document.querySelector("#forja-chat-form");
        elements.input = document.querySelector("#forja-chat-input");
        elements.send = document.querySelector("#forja-chat-send");

        elements.toggle.addEventListener("click", () => {
            if (elements.panel.hidden) {
                openChat();
            } else {
                closeChat();
            }
        });
        elements.close.addEventListener("click", closeChat);
        elements.reset.addEventListener("click", resetConversation);
        elements.form.addEventListener("submit", (event) => {
            event.preventDefault();
            sendMessage(elements.input.value);
        });
        elements.input.addEventListener("input", () => {
            elements.input.style.height = "auto";
            elements.input.style.height = `${Math.min(elements.input.scrollHeight, 100)}px`;
        });
        elements.input.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                elements.form.requestSubmit();
            }
        });
        elements.quickActions.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-prompt]");
            if (button) {
                sendMessage(button.dataset.prompt);
            }
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !elements.panel.hidden) {
                closeChat();
            }
        });
        resetConversation();
        checkConfiguration();
    });
})();
