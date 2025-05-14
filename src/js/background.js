class SetCustom {
    constructor() {

    }
    insert(object) {
        
    }
}

function sendMessage(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

async function getArticleArray() {
    return new Promise((resolve, reject) => {
        chrome.offscreen.createDocument({
            url: chrome.runtime.getURL("html/parser.html"),
            justification: "Used to fetch YCombinator news and parse to an array",
            reasons: ["DOM_SCRAPING"]
        }, async () => {
            try {
                let article_array_json = await sendMessage({message: "scrape", "data": {}});
                let article_array = JSON.parse(article_array_json);
                resolve(article_array);
            }
            catch (err) {
                reject(err);
            }
            finally {
                chrome.offscreen.closeDocument();
            }
        });
    });
}

function initBookmarks() {
    chrome.bookmarks.getTree((bookmarkTree) => {
        const bookmarkBar = bookmarkTree[0].children.find(node => node.title === "Bookmarks bar" || node.id === "1");
        if (!bookmarkBar) {
            console.log("Bookmarks bar not found.");
            return;
        }

        const bookmarks = [
            {key: "todo_id", title: "📖 To Read"},
            {key: "in_progress_id", title: "📖 In Progress"},
            {key: "done_id", title: "📖 Done"},
        ];

        chrome.storage.local.get(bookmarks.map(b => b.key), (result) => {
            bookmarks.forEach(({key, title}, index) => {
                if (result[key] === undefined) {
                    createAndStoreBookmark();
                }
                else {
                    const existingId = result[key];
                    chrome.bookmarks.get(existingId, (bookmark) => {
                        if (!bookmark || bookmark.length == 0) {
                            createAndStoreBookmark();
                        } else {
                            updateBookmark(existingId);
                        }
                    })
                }
                function createAndStoreBookmark() {
                    chrome.bookmarks.create({
                        title: title,
                        parentId: bookmarkBar.id,
                        index: index
                    }, (bookmark) => {
                        chrome.storage.local.set({ [key]: bookmark.id});
                    });
                }
                function updateBookmark(id) {
                    chrome.bookmarks.update(
                        id, 
                        { title: title }
                    );
                }
            });
        });
    });
}

async function getBookmarks(keys) {
    const storage_data = await chrome.storage.local.get(keys);

    const all_urls = await Promise.all(
        keys.map(async (key) => {
            const folder_id = storage_data[key];

            if(!folder_id) {
                return [];
            }

            try {
                const children = await chrome.bookmarks.getChildren(folder_id);
                return children.filter(child => child.url);
            } catch (e) {
                return [];
            }
        })
    );
    return all_urls.flat();
}

async function getAllBookmarks() {
    const keys = ["todo_id", "in_progress_id", "done_id"];
    return await getBookmarks(keys);
}

async function getTodoBookmarks() {
    const keys = ["todo_id"];
    return await getBookmarks(keys);
}

async function getInProgressBookmarks() {
    const keys = ["in_progress_id"];
    return await getBookmarks(keys);
}

async function moveToFolder(bookmark, folder) {
    const folder_to_key = {"done": "done_id", "in_progress": "in_progress_id", "todo": "todo_id"};
    const folder_key = folder_to_key[folder];
    const storage_data = await chrome.storage.local.get(folder_key);
    
    const folder_id = storage_data[folder_key];
    chrome.bookmarks.move(bookmark.id, {index: 0, parentId: folder_id});
}

function loadFavicons(urls) {
    urls.forEach(url => {
        chrome.tabs.create({
            active: false,
            url: url
        }, (tab) => {
            const listener = (tabId, info) => {
                if (info.status == 'complete' && tabId == tab.id) {
                    chrome.tabs.onUpdated.removeListener(listener);
                    chrome.tabs.remove(tab.id);
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
            setTimeout(() => {
                if (chrome.tabs.onUpdated.hasListener(listener)) {
                    chrome.tabs.onUpdated.removeListener(listener);
                    chrome.tabs.remove(tab.id);
                }
            }, 10000);
        });
    })
}

async function refreshNews(message) {
    console.log(message.data);
    let num_of_articles = message.data.number_of_articles || 10;
    let load_icons = message.data.load_icons ?? false;
    let filter_is_hiring = message.data.is_hiring;
    let filter_show_hn = message.data.show_hn;
    let filter_ask_hn = message.data.ask_hn;
    let filter_launch_hn = message.data.launch_hn;
    
    let article_array = await getArticleArray();
    let all_bookmarks = await getAllBookmarks();
    
    let article_set = new Set();
    for (let i = 0; i < all_bookmarks.length; i+=1) {
        article_set.add(all_bookmarks[i].url);
    }

    let added_articles_count = 0;
    let added_articles_list = new Array();
    for (let i = 0; i < article_array.length; i+=1) {
        let article = article_array[i];
        if (article.title.toLowerCase().includes("is hiring") && !filter_is_hiring) {
            continue;
        }
        if (article.title.toLowerCase().includes("ask hn:") && !filter_ask_hn) {
            continue;
        }
        if (article.title.toLowerCase().includes("show hn:") && !filter_show_hn) {
            continue;
        }
        if (article.title.toLowerCase().includes("launch hn:") && !filter_launch_hn) {
            continue;
        }
        if (!article_set.has(article.link)) {
            added_articles_count += 1;
            added_articles_list.push(article);
            article_set.add(article.link);
        }
        if (added_articles_count >= num_of_articles) {
            break;
        }
    }
    chrome.storage.local.get('todo_id', (result) => {
        let parent_id = result['todo_id'];
        const urls = added_articles_list.map(article => {
            chrome.bookmarks.create({
                title: article.title, 
                url: article.link, 
                parentId: parent_id});
                return article.link;
        });
        if(load_icons) {
            loadFavicons(urls);
        }
    });
}

function clearTodo() {
    chrome.storage.local.get('todo_id', (result) => {
        const parent_id = result['todo_id'];
        chrome.bookmarks.getChildren(parent_id, (results) => {
            results.forEach((result) => {
                chrome.bookmarks.remove(result.id);
            });
        });
    });
}

async function doneReading(message) {
    let in_progress_bookmarks = await getInProgressBookmarks();
    const matching_in_progress = in_progress_bookmarks.find(bookmark => bookmark.url === message.data.url);

    if(matching_in_progress) {
        moveToFolder(matching_in_progress, "done");
    }
}
    
// Establish initial setup - add bookmark folders and save ids in storage
chrome.runtime.onInstalled.addListener(() => {
    initBookmarks();
});
    
// Establish comms - for refreshing bookmarks and clearing bookmark folder
chrome.runtime.onMessage.addListener(async (message) => {
    console.log("Got message");
    if (message.command == "refreshNews") {
        await refreshNews(message);
    }
    else if(message.command == "clearTodo") {
        clearTodo();
    }
    else if(message.command == "doneReading") {
        await doneReading(message);
    }
});

// Inject content script in opened articles
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    let todo_bookmarks = await getTodoBookmarks();
    let in_progress_bookmarks = await getInProgressBookmarks();
    if (info.status == "complete") {
        const matching_todo = todo_bookmarks.find(bookmark => bookmark.url === tab.url);
        if (matching_todo) {
            moveToFolder(matching_todo, "in_progress");
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["js/content.js"]
            });
        }

        const matching_in_progress = in_progress_bookmarks.find(bookmark => bookmark.url === tab.url);
        if (matching_in_progress) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["js/content.js"]
            });
        }
    }
});