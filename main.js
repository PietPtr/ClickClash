
let lib = PS["Main"]

function compile() {
    let defArea = document.getElementById("TypeHS");
    let errorP = document.getElementById("error");

    let parsed = lib.parse(defArea.value);
    console.log(parsed)

    if (parsed.constructor.name == "Right") {
        errorP.innerHTML = ""

        let blockdefs = parsed.value0;

        for (let blockdef of blockdefs) {
            Block.newOrUpdate(blockdef);
        }

    } else {
        let location = parsed.value0.value1
        let error = parsed.value0.value0
        errorP.innerHTML = error + ' at ' + location.line + ':' + location.column
    }
}

var canvas = new fabric.Canvas('canvas');
canvas.setWidth(window.innerWidth / 2.1);
canvas.setHeight(window.innerHeight * 0.9);


fabric.Object.prototype.objectCaching = false;

function draw() {
    

    canvas.renderAll();

    window.requestAnimationFrame(draw);

}

window.requestAnimationFrame(draw);







// let c = document.getElementById("canvas");
// c.width = window.innerWidth / 2.1;
// c.height = window.innerHeight * 0.9;
// var ctx = c.getContext("2d");
// ctx.font = "14px Courier";


// function draw() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     for (let b of Block.blocks) {
//         b.draw();
//     }
//     window.requestAnimationFrame(draw);

// }

// window.requestAnimationFrame(draw);


// let dragged = undefined;

// canvas.onmousedown = function(e) {

//     for (let b of Block.blocks) {
//         let x = e.layerX;
//         let y = e.layerY;
//         if (x >= b.pos.x && x <= b.pos.x + b.dim.w && y >= b.pos.y && y <= b.pos.y + b.dim.h) {
//             console.log("hit", b.id);
//             dragged = b;
//         } else {
//         }
//     }
// }

// canvas.onmouseup = function(e) {
//     dragged = undefined;
// }

// canvas.onmousemove = function(e) {
//     let dx = e.movementX;
//     let dy = e.movementY;
    
//     if (dragged) {
//         dragged.pos = {x: e.layerX - dragged.dim.w / 2, y: e.layerY - dragged.dim.h / 2};
//     }
// }

// selectedInput = {
//     block: undefined,
//     signal: undefined
// }

// selectedOutput = {
//     block: undefined,
//     signal: undefined
// }

// canvas.onclick = function(e) {

// }