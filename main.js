
let lib = PS["Main"]

function compileToBlocks() {
    let defArea = document.getElementById("TypeHS");
    let errorP = document.getElementById("error");

    let parsed = lib.parse(defArea.value);
    console.log(parsed)

    if (parsed.constructor.name == "Right") {
        errorP.innerHTML = ""

        let blockdefs = parsed.value0;

        console.log(blockdefs)

        for (let blockdef of blockdefs) {
            Block.newOrUpdate(blockdef);
        }

        let blockIds = blockdefs.map(bd => bd.value0);

        let remove = [];

        
        for (let i = 0; i < Block.blocks.length; i++) {
            let block = Block.blocks[i];
            if (!blockIds.includes(block.id)) {
                remove.push(block);
            }
        }

        for (let block of remove) {
            block.destroy();
        }

    } else {
        let location = parsed.value0.value1
        let error = parsed.value0.value0
        errorP.innerHTML = error + ' at ' + location.line + ':' + location.column
    }

    save();
}

function compileToClash() {
    let blocks = Block.blocks.map(b => b.adt());
    let conns = Signal.connections.map(c => c.adt());

    let result = lib.gAll(blocks)(conns);

    let clashArea = document.getElementById("clash");

    clashArea.value = result;

    save();
}

function loadExample(name) {
    let defArea = document.getElementById("TypeHS");

    defArea.value = examples[name];
    
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
        connections: Signal.connections.map(c => c.save()),
        code: document.getElementById("TypeHS").value
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

    document.getElementById("TypeHS").value = data.code;
}

function deleteAll() {
    
    let done = false;

    while (!done) {
        let b = Block.blocks[0];

        if (b) {
            b.destroy();
        } else {
            done = true;
        }

    }

    done = false;

    while (!done) {
        let c = Signal.connections[0];
        
        if (c) {
            c.destroy()
        } else {
            done = true;
        }
    }

}


if (localStorage.getItem("save")) {
    load();
};

window.requestAnimationFrame(draw);
