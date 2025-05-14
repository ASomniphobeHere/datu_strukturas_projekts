document.addEventListener("DOMContentLoaded", () => {
    const default_values = {
        "number_of_articles": 5,
        "load_icons": false,
        "is_hiring": false,
        "ask_hn": false,
        "show_hn": false,
        "launch_hn": false
    }
    const settings = document.getElementById("settings");
    chrome.storage.local.get(default_values, (result) => {
        Object.keys(default_values).forEach((key) => {
            let input = settings.querySelector(`[id="${key}"]`);
            if (input.type == 'text') {
                input.value = result[key];
            } else if (input.type == 'checkbox') {
                input.checked = result[key];
            }
        });
    });
    Object.keys(default_values).forEach((key) => {
        let child = settings.querySelector(`[id="${key}"]`);
        child.addEventListener("input", (e) => {
            console.log("triggered listener");
            let form_values = {};
            if (child.type == "text") {
                form_values[child.id] = child.value;
            } else if(child.type == "checkbox") {
                form_values[child.id] = child.checked;
            }
            chrome.storage.local.set(form_values);
        });
    });
    let refresh_button = document.querySelector("#refresh");
    
    refresh_button.addEventListener("click", (e) => {
        console.log("Clicked");
        let form_values = {};
        Object.keys(default_values).forEach((key) => {
            let child = settings.querySelector(`[id="${key}"]`);
            if (child.type == "text") {
                form_values[child.id] = child.value;
            } else if(child.type == "checkbox") {
                form_values[child.id] = child.checked;
            }
        });
        chrome.runtime.sendMessage({
            command: "refreshNews", 
            data: form_values
        });
    });

    document.getElementById("select_all").addEventListener("click", (e) => {
        const filter_grid = document.getElementById("filter_grid");
        Array.from(filter_grid.querySelectorAll("input")).forEach((i) => {
            i.checked = true;
            i.dispatchEvent(new Event("input", {bubbles: "true"}))
        });
    });
    document.getElementById("deselect_all").addEventListener("click", (e) => {
        const filter_grid = document.getElementById("filter_grid");
        Array.from(filter_grid.querySelectorAll("input")).forEach((i) => {
            i.checked = false;
            i.dispatchEvent(new Event("input", {bubbles: "true"}))
        });
    });

    document.querySelectorAll(".filter_checkbox").forEach(container => {
        container.addEventListener("click", (e) => {
            if (e.target.tagName === "INPUT" ||
                e.target.tagName === "LABEL"
            ) return;

            const checkbox = container.querySelector("input[type='checkbox']");
            if (checkbox) {
                checkbox.click();
            }
        });
    });

    let clear_todo_button = document.querySelector("#clear_todo");
    clear_todo_button.addEventListener("click", (e) => {
        chrome.runtime.sendMessage({
            command: "clearTodo",
            data: {}
        })
    });
});
