fetch('nav.html')
.then(res => res.text())
.then(text => {
    let oldelem = document.querySelector("script#replace_with_navbar");
    let newelem = document.createElement("div");
    newelem.innerHTML = text;
    oldelem.parentNode.replaceChild(newelem, oldelem);
    // bold the link for the page we're on
    let page = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("#nav-bar a").forEach(element => {
        if(element.getAttribute("href") == page) {
            element.classList.add("active");
        }
    });
});
// <script id="replace_with_navbar" src="nav.js"></script>
