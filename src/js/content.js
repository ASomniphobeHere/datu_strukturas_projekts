if (typeof(style) === "undefined") {
    const style = document.createElement('style');
    style.textContent = `

        :root {
            --custom_bezier: cubic-bezier(0.33, 1, 0.68, 1);
            --custom_bezier_entry: cubic-bezier(.09,.55,.32,1);
        }
        @keyframes fade-in {
            from { opacity: 0;
                transform: translate(90px, 90px); }
            to { opacity: 1;
            transform: translate(0, 0); }
        }

        .glass_effect {
            background: rgba(120, 120, 120, 0.2);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(3px);
        }
            
        .glass_effect:hover {
            background: rgba(220, 220, 220, 0.5);
            backdrop-filter: blur(4px);
        }

        #done_reading {
            transition: transform 0.5s var(--custom_bezier), 
            background 0.5s var(--custom_bezier),
            backdrop-filter 0.5s var(--custom_bezier);
            animation: fade-in 0.8s var(--custom_bezier_entry) 1.5s backwards;
        }

        #done_reading:hover {
            transform: scale(1.1);
            cursor: pointer;
        }
        
        #done_reading_div {
            transition: transform 0.5s var(--custom_bezier_entry);
        }
        
        #done_reading_div.doneReading {
            transform: translate(100px, 100px);
        }
            
        #done_reading > span {
            all: unset;
            font-family: system-ui, sans-serif;
            color: rgb(0, 180, 0);
            transition: color 0.5s var(--custom_bezier);
        }
        #done_reading:hover > span {
            color: rgb(0, 251, 0);
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    const div = document.createElement("div");
    div.id = 'done_reading_div';

    div.style.position = 'fixed';
    div.style.width = '60px';
    div.style.height = '60px';
    div.style.right = '30px';
    div.style.bottom = '30px';
    div.style.zIndex = '9999';

    const button = document.createElement("button");
    button.id = 'done_reading';

    button.style.width = '100%';
    button.style.height = '100%';
    button.style.padding = '5px';

    button.style.display = 'flex';
    button.style.flexDirection = 'column';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';

    button.style.border = '1px solid rgb(113, 113, 113)';
    button.style.borderRadius = '5px';

    button.classList.add('glass_effect');
    button.addEventListener('click', (e) => {
        console.log(`url: ${window.location.href}`);
        chrome.runtime.sendMessage({command: "doneReading", data: {url: window.location.href}});
        div.classList.add('doneReading');
    });

    div.appendChild(button);

    const span = document.createElement("span");
    span.innerHTML = '&#10003;';
    span.style.fontSize = '48px';
    span.style.fontWeight = '800';
    
    button.appendChild(span);
    
    document.body.appendChild(div);
}