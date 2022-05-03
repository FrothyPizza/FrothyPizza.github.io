



let cursor = new Image();
cursor.src = 'cursors/xp_arrow.cur';
cursor.style.position = 'absolute';

document.addEventListener('mousemove', (e) => {
    let x = (e.pageY / window.innerHeight) * window.innerWidth;
    let y = (e.pageX / window.innerWidth) * window.innerHeight;
    cursor.style.top = y + 'px';
    cursor.style.left = x + 'px';

});

cursor.onload = () => {
    document.body.appendChild(cursor);
}

cursor.onclick = () => {
    window.open("cursors.html");
}