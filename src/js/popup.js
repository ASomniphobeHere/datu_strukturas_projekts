document.addEventListener("DOMContentLoaded", () => {
    console.log("Loaded");
    let refresh_button = document.querySelector("#refresh");
    refresh_button.innerText = "New content";
    
    refresh_button.addEventListener("click", (e) => {
        let num_of = document.getElementById("number_of_articles").value;
        let load_icons = document.getElementById("load_icons").checked;
        console.log("Clicked");
        chrome.runtime.sendMessage({
            command: "refreshNews", 
            data: { number_of_articles: num_of,
                load_icons: load_icons
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
