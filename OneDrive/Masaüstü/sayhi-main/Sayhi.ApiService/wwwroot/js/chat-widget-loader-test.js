(function ()
{
    var scripts = document.getElementsByTagName("script");
    var currentScript = Array.from(scripts).find(s => s.getAttribute("data-id") === "sayhi");
    var apiKey = currentScript.getAttribute("data-api-key");

    if (!apiKey)
    {
        console.error("Chat Widget: API key not found!");
        return;
    }

    var iframe = document.createElement("iframe");
    iframe.src = `http://localhost:5406/ChatWidget?apiKey=${encodeURIComponent(apiKey)}`;
    iframe.style.cssText = "position:fixed;bottom:0;right:0;width:420px;height:600px;border:none;z-index:9999;";
    iframe.setAttribute("allowtransparency", "true");

    document.body.appendChild(iframe);
})();