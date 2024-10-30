//console.log("Start");

let playgroundSpace = document.getElementById('playground-side'),
    playground = document.querySelector('.playground-side .playground');

function getSizeIndicator(el) {
    //console.log(el.clientHeight);
    document.querySelector('.w-i').innerText = el.clientWidth;
    document.querySelector('.h-i').innerText = el.clientHeight;

    //default size
    let w = 1195, h = 649;
    let wx = el.clientWidth - (64 * 2), hx = (h * wx) / w;

    //console.log(wx, hx);
    playground.style.width = wx + 'px';
    playground.style.height = hx + 'px';

};

function init() {
    getSizeIndicator(playgroundSpace);
}

init();

window.addEventListener("resize", () => {
    //console.log('Resised')
    getSizeIndicator(playgroundSpace)
})
