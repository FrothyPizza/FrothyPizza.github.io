fetch('nav.html')
.then(res => res.text())
.then(text => {
    let oldelem = document.querySelector("script#replace_with_navbar");
    let newelem = document.createElement("div");
    newelem.innerHTML = text;
    oldelem.parentNode.replaceChild(newelem, oldelem);
    // get tab title
    let title = document.querySelector("title").innerHTML;
    document.getElementById("nav-bar").childNodes.forEach(element => {
        if(element.innerHTML == title) {
            element.classList.add("active");
        }
    });
});
// <script id="replace_with_navbar" src="nav.js"></script>