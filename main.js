
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

let canvas = document.getElementById("canvas");

var stage = new createjs.Stage("canvas");
stage.enableMouseOver(10);
stage.canvas.width = window.innerWidth / 2.10;
stage.canvas.height = window.innerHeight * 0.9;


function draw() {

    for (let b of Block.blocks) {
        b.draw();
    }

    for (let c of Signal.connections) {
        c.draw();
    }
    
    stage.update();
    window.requestAnimationFrame(draw);
}

function error(message) {
    let errorElem = document.getElementById("linkError");

    errorElem.innerHTML = message

    setTimeout(() => {
        errorElem.innerHTML = "";
    }, 10000);
}

function save() {
    let data = {
        blocks: Block.blocks.map(b => b.save()),
        connections: Signal.connections.map(c => c.save())
    }

    localStorage.setItem("save", JSON.stringify(data));
}

function load() {
    let data = JSON.parse(localStorage.getItem("save"));

    console.log(data.connections);

    Block.blocks = [];
    Signal.connections = [];
    let signals = [];

    Block.blocks = data.blocks.map(b => Block.load(b));

    Signal.connections = data.connections.map(c => Connection.load(c));
}

load();

window.requestAnimationFrame(draw);
