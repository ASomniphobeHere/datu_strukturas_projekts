class Node {
    constructor(value, parent) {
        this.left = null;
        this.right = null;
        this.value = value;
        this.parent = parent;
        this.color = 'red';
    }
    add_child(value, direction) {
        let node = new Node(value, this);
        this[direction] = node;
        return node;
    }
    // If node is right of parent, return true
    dir() { return (this.parent.right === this ? 'right' : 'left'); }
}

function isBlack(node) {
    return (node === null || node.color === 'black');
}

function isRed(node) {
    return (node !== null && node.color === 'red');
}

class RBTree {
    constructor() {
        this.root = null;
    }

    rotate_subtree(sub_node, dir) {
        let opp = dir === 'left' ? 'right' : 'left';

        let sub_parent = sub_node.parent;
        let new_root = sub_node[opp];
        let new_child = new_root[dir];


        new_root[dir] = sub_node;
        new_root.parent = sub_parent;

        if (new_child !== null) {
            new_child.parent = sub_node;
        }

        if (sub_parent === null) {
            this.root = new_root;
        }
        else {
            let dir = sub_node.dir();
            sub_parent[dir] = new_root;
        }

        sub_node[opp] = new_child;
        sub_node.parent = new_root;

    }
    balance_insert(N) {
        let P = null;
        let G = null;
        let U = null;
        while (true) {
            P = N.parent;
            if (P === null) { // N is root
                N.color = 'black';
                return;
            }
            if (isBlack(P)) { // Req 3 is fixed
                return;
            }
            G = P.parent;
            if (G === null) { // P is root
                P.color = 'black';
                return;
            }
            let opp = (P.dir() === 'right' ? 'left' : 'right');
            U = G[opp];
            if (isBlack(P) || isBlack(U)) { // Can fix right now
                break;
            }
            // Move up
            P.color = 'black';
            U.color = 'black';
            G.color = 'red';
            N = G;
        }
        if (N.dir() != P.dir()) { // N is inner grandchild
            this.rotate_subtree(P, P.dir());
            N = P;
            P = N.parent;
        }
        // Now N is outer grandchild
        let opp = (P.dir() === 'right' ? 'left' : 'right');
        this.rotate_subtree(G, opp);
        P.color = 'black';
        G.color = 'red';
        return;
    }
    insert(value) {
        if (this.root === null) {
            this.root = new Node(value, null);
            this.root.color = 'black';
            return;
        }
        let iter_node = this.root;
        let parent = null;
        let direction = null;
        while (iter_node != null) {
            parent = iter_node;
            if (parent.value > value) {
                iter_node = parent.left;
                direction = 'left';
            } else if (parent.value < value) {
                iter_node = parent.right;
                direction = 'right';
            }
        }
        let node = parent.add_child(value, direction);

        this.balance_insert(node);
    }
    balance_remove(node) {
        if (node.left && node.right) {
            let succ = node.right;
            while (succ.left) {
                succ = succ.left;
            }
            node.value = succ.value;
            node = succ;
        }
        if (node.right || node.left) {
            let child = (node.right !== null ? node.right : node.left);
            if (node.parent != null) {
                node.parent[node.dir()] = child;
                child.parent = node.parent;
            }
            else {
                child.parent = null;
                this.root = child;
            }
            child.color = 'black';
            return;
        }
        if (!node.right && !node.left) { // Now deleting leaf node
            if (node === this.root) {
                this.root = null;
                return;
            }
            if (node.color === 'red') {
                node.parent[node.dir()] = null;
                return;
            }
            if (node.color === 'black') {
                let parent = node.parent;
                let sibling = null;
                let close_nephew = null;
                let distant_nephew = null;
                let dir = node.dir();
                node.parent[dir] = null;
                node = null;
                while (true) {
                    if (parent === null) {
                        node.color = 'black';
                        return;
                    }
                    if (node) {
                        dir = node.dir();
                    }
                    let opp = (dir === 'right' ? 'left' : 'right');
                    sibling = parent[opp];
                    close_nephew = sibling[dir];
                    distant_nephew = sibling[opp];
                    if (isBlack(parent) && isBlack(sibling) && isBlack(close_nephew) && isBlack(distant_nephew)) {
                        sibling.color = 'red';
                        node = parent;
                        parent = parent.parent;
                        continue;
                    }
                    if (isRed(sibling)) {
                        this.rotate_subtree(parent, dir);
                        parent.color = 'red';
                        sibling.color = 'black';
                        sibling = parent[opp];
                        close_nephew = sibling[dir];
                        distant_nephew = sibling[opp];
                    }
                    if (isRed(parent) && isBlack(sibling) && isBlack(close_nephew) && isBlack(distant_nephew)) {
                        parent.color = 'black';
                        sibling.color = 'red';
                        return;
                    }
                    if (isBlack(sibling) && isRed(close_nephew) && isBlack(distant_nephew)) {
                        this.rotate_subtree(sibling, opp);
                        sibling.color = 'red';
                        close_nephew.color = 'black';
                        sibling = close_nephew;
                        distant_nephew = sibling[opp];
                    }
                    if (isBlack(sibling) && isRed(distant_nephew)) {
                        this.rotate_subtree(parent, dir);
                        sibling.color = parent.color;
                        parent.color = 'black';
                        distant_nephew.color = 'black';
                        return;
                    }
                }
            }
        }
    }
    findNode(value) {
        let node = this.root;
        while (node != null && node.value != value) {
            if (node.value > value) {
                node = node.left;
            } else {
                node = node.right;
            }
        }
        return node;
    }
    remove(value) {
        let node = this.findNode(value);
        if (node === null) {
            return;
        }
        this.balance_remove(node);
    }
    hasElement(value) {
        let node = this.findNode(value);
        return (node !== null);
    }
}

function printTree(node, indent = "", last = true) {
    if (node !== null) {
        console.log(indent + (last ? "└── " : "├── ") + node.value + (node.color === 'black' ? ' (B)' : ' (R)'))
        indent += last ? "    " : "│   ";
        const children = [node.right, node.left];
        const hasRight = node.right !== null;
        const hasLeft = node.left !== null;
        const count = (hasRight ? 1 : 0) + (hasLeft ? 1 : 0);
        if (count === 0) return;
        if (hasRight) printTree(node.right, indent, !hasLeft);
        if (hasLeft) printTree(node.left, indent, true);
    }
}

function countBlackNodesFromLeaf(leaf) {
    let count = 0;
    let node = leaf;
    while (node !== null) {
        count += (node.color === 'black' ? 1 : 0);
        node = node.parent;
    }
    return count;
}

function maxTreeHeight(leaf) {
    if (leaf === null) {
        return 0;
    }
    return 1 + Math.max(maxTreeHeight(leaf.left), maxTreeHeight(leaf.right));
}


function verifyRBTree(root) {
    let isValid = true;
    let expectedBlackHeight = null;

    function countBlackHeight(node, currentBlackCount) {
        if (!isValid) return; // short-circuit if already invalid

        if (node === null) {
            // Reached a leaf/null child
            if (expectedBlackHeight === null) {
                expectedBlackHeight = currentBlackCount;
            } else if (currentBlackCount !== expectedBlackHeight) {
                console.error(`Black height mismatch: expected ${expectedBlackHeight}, but got ${currentBlackCount}`);
                isValid = false;
            }
            return;
        }

        // Red node cannot have red children
        if (node.color === 'red') {
            if (isRed(node.left) || isRed(node.right)) {
                console.error(`Red violation at node ${node.value}`);
                isValid = false;
            }
        }

        // Increment black count if this node is black
        if (node.color === 'black') currentBlackCount++;

        countBlackHeight(node.left, currentBlackCount);
        countBlackHeight(node.right, currentBlackCount);
    }

    countBlackHeight(root, 0);
    return isValid;
}


const faviconTabIds = new RBTree();

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
                let article_array_json = await sendMessage({ message: "scrape", "data": {} });
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
            { key: "todo_id", title: "📖 To Read" },
            { key: "in_progress_id", title: "📖 In Progress" },
            { key: "done_id", title: "📖 Done" },
        ];

        chrome.storage.local.get(bookmarks.map(b => b.key), (result) => {
            bookmarks.forEach(({ key, title }, index) => {
                if (result[key] === undefined) {
                    createAndStoreBookmark();
                }
                else {
                    const existingId = result[key];
                    chrome.bookmarks.get(existingId, (bookmark) => {
                        if (!bookmark || bookmark.length === 0) {
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
                        chrome.storage.local.set({ [key]: bookmark.id });
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

            if (!folder_id) {
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
    const folder_to_key = { "done": "done_id", "in_progress": "in_progress_id", "todo": "todo_id" };
    const folder_key = folder_to_key[folder];
    const storage_data = await chrome.storage.local.get(folder_key);

    const folder_id = storage_data[folder_key];
    chrome.bookmarks.move(bookmark.id, { index: 0, parentId: folder_id });
}

function loadFavicons(urls) {
    urls.forEach(url => {
        chrome.tabs.create({
            active: false,
            url: url
        }, (tab) => {
            faviconTabIds.insert(tab.id);

            const listener = (tabId, info) => {
                if (info.status === 'complete' && tabId === tab.id) {
                    setTimeout(() => {
                        if (chrome.tabs.onUpdated.hasListener(listener)) {
                            chrome.tabs.onUpdated.removeListener(listener);
                            chrome.tabs.remove(tab.id);
                            faviconTabIds.remove(tab.id);
                        }
                    }, 1000);
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
            setTimeout(() => {
                if (chrome.tabs.onUpdated.hasListener(listener)) {
                    chrome.tabs.onUpdated.removeListener(listener);
                    chrome.tabs.remove(tab.id);
                    faviconTabIds.remove(tab.id);
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

    let article_set = new RBTree();
    for (let i = 0; i < all_bookmarks.length; i += 1) {
        article_set.insert(all_bookmarks[i].url);
    }

    let added_articles_count = 0;
    let added_articles_list = new Array();
    for (let i = 0; i < article_array.length; i += 1) {
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
        if (!article_set.hasElement(article.link)) {
            added_articles_count += 1;
            added_articles_list.push(article);
            article_set.insert(article.link);
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
                parentId: parent_id
            });
            return article.link;
        });
        if (load_icons) {
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

    if (matching_in_progress) {
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
    if (message.command === "refreshNews") {
        await refreshNews(message);
    }
    else if (message.command === "clearTodo") {
        clearTodo();
    }
    else if (message.command === "doneReading") {
        await doneReading(message);
    }
});

// Inject content script in opened articles
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (faviconTabIds.hasElement(tabId)) {
        return;
    }
    let todo_bookmarks = await getTodoBookmarks();
    let in_progress_bookmarks = await getInProgressBookmarks();
    if (info.status === "complete") {
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