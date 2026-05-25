function formatJSON(data) {
    return JSON.stringify(data, null, 2);
}

async function requestJSON(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Request gagal");
    }

    return data;
}

function renderSuhuRows(items) {
    const tableBody = document.querySelector("#suhu-rows");

    if (!tableBody) {
        return;
    }

    if (!items.length) {
        tableBody.innerHTML = '<tr><td colspan="3">Belum ada data suhu.</td></tr>';
        return;
    }

    tableBody.innerHTML = items.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.timestamp}</td>
            <td>${item.suhu} &deg;C</td>
        </tr>
    `).join("");
}

function renderLampu(data) {
    const current = document.querySelector("#lampu-current");
    const rows = document.querySelector("#lampu-rows");
    const dot = document.querySelector(".lamp-dot");

    if (current) {
        current.textContent = data.status;
        current.className = `status-${data.status.toLowerCase()}`;
    }

    if (dot) {
        dot.className = `lamp-dot status-${data.status.toLowerCase()}`;
    }

    if (!rows) {
        return;
    }

    if (!data.history.length) {
        rows.innerHTML = '<tr><td colspan="3">Belum ada perubahan lampu.</td></tr>';
        return;
    }

    rows.innerHTML = data.history.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.timestamp}</td>
            <td>${item.status}</td>
        </tr>
    `).join("");
}

async function getSuhu() {
    const result = await requestJSON("/api/suhu");
    renderSuhuRows(result.data);
    return result;
}

async function getLampu() {
    const result = await requestJSON("/api/lampu");
    renderLampu(result.data);
    return result;
}

const suhuForm = document.querySelector("#suhu-form");
if (suhuForm) {
    suhuForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const resultBox = document.querySelector("#suhu-post-result");
        const suhu = document.querySelector("#suhu").value;

        try {
            const result = await requestJSON("/api/suhu", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ suhu })
            });

            resultBox.textContent = formatJSON(result);
            suhuForm.reset();
        } catch (error) {
            resultBox.textContent = error.message;
        }
    });
}

const lampuToggle = document.querySelector("#lampu-toggle");
const lampuLabel = document.querySelector("#lampu-label");

if (lampuToggle && lampuLabel) {
    lampuToggle.addEventListener("change", () => {
        lampuLabel.textContent = lampuToggle.checked ? "ON" : "OFF";
    });
}

const lampuForm = document.querySelector("#lampu-form");
if (lampuForm) {
    lampuForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const resultBox = document.querySelector("#lampu-post-result");
        const status = lampuToggle.checked ? "ON" : "OFF";

        try {
            const result = await requestJSON("/api/lampu", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            });

            resultBox.textContent = formatJSON(result);
        } catch (error) {
            resultBox.textContent = error.message;
        }
    });
}

const getSuhuButton = document.querySelector("#get-suhu");
if (getSuhuButton) {
    getSuhuButton.addEventListener("click", async () => {
        await getSuhu();
    });
}

const getLampuButton = document.querySelector("#get-lampu");
if (getLampuButton) {
    getLampuButton.addEventListener("click", async () => {
        await getLampu();
    });
}
