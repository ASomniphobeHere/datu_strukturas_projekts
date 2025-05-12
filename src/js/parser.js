chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command != "scrape") {
        console.log("Parser activated");
        (async () => {
            console.log("first call");
            const y_combinator_url = "https://news.ycombinator.com/news";
            const response = await fetch(y_combinator_url, {
                method: "GET"
            });
            console.log("second call");

            if (!response.ok) {
                console.log("Parser failed to fetch");
            }
            let response_text = await response.text();
            console.log(response);
            const parser = new DOMParser();
            console.log(response_text.length);
            const doc = parser.parseFromString(response_text, "text/html");
            let submissions = doc.querySelectorAll(".submission");
            let submission_contents = new Array();
            submissions.forEach((currentValue) => {
                let title = currentValue.querySelector("span.titleline>a");
                let article_link = title.href;
                let article_title = title.textContent;
                console.log(`Title: ${article_title}, Link: ${article_link}`);
                submission_contents.push({title: article_title, link: article_link});
            });
            let JSON_response = JSON.stringify(submission_contents);
            sendResponse(JSON_response);
        })();
        return true;
    }
});