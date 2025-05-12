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

async function moveToInProgress(bookmark) {
    console.log("moving");
    const keys = ["in_progress_id"];
    const storage_data = await chrome.storage.local.get(keys);
    
    console.log("got storage");
    const in_progress_folder_id = storage_data["in_progress_id"];
    console.log(in_progress_folder_id);
    chrome.bookmarks.move(bookmark.id, {index: 0, parentId: in_progress_folder_id}, () => {
        console.log("finished moving");
    });
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
    let num_of_articles = message.data.number_of_articles || 10;
    let load_icons = message.data.load_icons ?? false;
    
    console.log(num_of_articles);
    let article_array = await getArticleArray();
    let all_bookmarks = await getAllBookmarks();
    console.log(article_array);
    console.log(all_bookmarks);
    
    let article_set = new Set();
    for (let i = 0; i < all_bookmarks.length; i+=1) {
        article_set.add(all_bookmarks[i].url);
    }
    console.log(article_set);
    let added_articles_count = 0;
    let added_articles_list = new Array();
    for (let i = 0; i < article_array.length; i+=1) {
        let article = article_array[i];
        if (article.title.toLowerCase().includes("is hiring") && article.link.includes("ycombinator.com")) {
            continue;
        }
        if (article.title.toLowerCase().includes("ask hn:")) {
            continue;
        }
        if (article.title.toLowerCase().includes("show hn:")) {
            continue;
        }
        if (article.title.toLowerCase().includes("launch hn:")) {
            continue;
        }
        if (!article_set.has(article.link)) {
            console.log(`Article added: ${article.title}`);
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
        console.log(`parent_id: ${parent_id}`);
        const urls = added_articles_list.map(article => {
            chrome.bookmarks.create({
                title: article.title, 
                url: article.link, 
                parentId: parent_id});
                return article.link;
        });
        console.log(urls);
        if(load_icons) {
            loadFavicons(urls);
        }
    });
    console.log("Added articles");
    console.log(added_articles_list);
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
});

// Inject content script in opened articles
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    let todo_bookmarks = await getTodoBookmarks();
    let in_progress_bookmarks = await getInProgressBookmarks();
    if (info.status == "complete") {
        console.log(todo_bookmarks);
        console.log(tab.url);
        const matching_todo = todo_bookmarks.find(bookmark => bookmark.url === tab.url);
        console.log("checking matching todo");
        console.log(`Result: ${matching_todo}`);
        if (matching_todo) {
            moveToInProgress(matching_todo);
        }

        const matching_in_progress = in_progress_bookmarks.find(bookmark => bookmark.url === info.url);
        if (matching_in_progress) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["js/content.js"]
            })
        }
    }
});