
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

    setTable();
}


function setTable() {
    let table = document.getElementById('connectTable');

    table.innerHTML = "<tr><th>input</th><th width=\"80%\">block</th><th>output</th></tr>"

    for (let block of Block.blocks) {
        for (let i = 0; i < Math.max(block.inputs.length, block.outputs.length); i++) {
            let row = document.createElement('tr');
            let inputCol = document.createElement('td');
            let nameCol = document.createElement('td');
            let outputCol = document.createElement('td');

            if (i == 0) {
                nameCol.innerHTML = block.id
            }

            if (i < block.inputs.length) {
                inputCol.innerHTML = block.inputs[i].type
                inputCol.id = `${block.id}${i}${IN}`
                
                inputCol.onclick = function(e) {
                    select(block.id, i, IN);
                };
            }

            if (i < block.outputs.length) {
                outputCol.innerHTML = block.outputs[i].type
                outputCol.id = `${block.id}${i}${OUT}`

                outputCol.onclick = function(e) {
                    select(block.id, i, OUT);
                };
                
            }

            row.appendChild(inputCol);
            row.appendChild(nameCol);
            row.appendChild(outputCol);

            table.appendChild(row);
        }
    }
}

function highlight(blockid, i, dir) {
    highlight_(`${blockid}${i}${dir}`);
}

function highlight_(id) {
    let elem = document.getElementById(id);
    elem.style.border = "3px solid #00ff00";
}

function lowlight(blockid, i, dir) {
    lowlight_(`${blockid}${i}${dir}`)
}

function lowlight_(id) {
    let elem = document.getElementById(id);
    elem.style.border = "";
}

function setColors(idIn, idOut) {
    let elem = document.getElementById(idOut);
    elem.style.background = colors[colorp];

    elem = document.getElementById(idIn);
    elem.style.background = colors[colorp];

    colorp++;

}

const colors = [
    "#b6d7a8",
    "#ffe599",
    "#f9cb9c",
    "#ea9999",
    "#a4c2f4",
    "#a2c4c9",
    "#b4a7d6",
    "#9fc5e8",
    "#d5a6bd",
]

let colorp = 0;

let selectedInput = undefined;
let selectedOutput = undefined;

function select(blockid, i, dir) {

    let id = `${blockid}${i}${dir}`;
    
    if (!selectedInput && !selectedOutput) {
        if (dir == OUT) {
            selectedOutput = id
            highlight(blockid, i, dir);
        } else if (dir == IN) {
            selectedInput = id
            highlight(blockid, i, dir);
        }
    }

    if (dir == IN) {
        if (!selectedInput) {
            selectedInput = id
            connect();
        }
    }


    console.log(selectedInput, selectedOutput)
}

function connect() {
    if (selectedInput && selectedOutput) {
        lowlight_(selectedOutput);
        lowlight_(selectedInput);
        setColors(selectedInput, selectedOutput);
        selectedInput = undefined;
        selectedOutput = undefined;
    }
}