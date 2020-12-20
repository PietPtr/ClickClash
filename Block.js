
const INPUT_HEIGHT = 48;
const BLOCK_EXTRA_WIDTH = 40;
const CONNSIZE = 10;

const IN = "IN";
const OUT = "OUT";

const FONT = "14px monospace";
const SFONT = "11px monospace";

class Connection {
    constructor(out, inp) {
        this.out = out;
        this.inp = inp;

        this.line = new createjs.Shape();

        // this.line.graphics.beginStroke("Black").moveTo(out.x, out.y).lineTo(inp.x, inp.y);

        stage.addChild(this.line);
        stage.setChildIndex(this.line, 0);
    }

    draw() {
        this.line.graphics.clear().beginStroke("Black")
            .moveTo(this.out.x, this.out.y).lineTo(this.inp.x + CONNSIZE, this.inp.y + CONNSIZE);
    }

    destroy() {
        let i = Signal.connections.indexOf(this);

        if (i >= 0) {
            Signal.connections.splice(i, 1);
            stage.removeChild(this.line);
        }
    }

    save() {
        return {
            out: this.out.save(),
            inp: this.inp.save()
        }
    }

    static load(data) {
        let allInputs = [].concat.apply([], Block.blocks.map(b => b.inputs));
        let allOutputs = [].concat.apply([], Block.blocks.map(b => b.outputs));

        let theInput = allInputs.filter(i => 
            i.blockId == data.inp.blockId && 
            i.number == data.inp.number &&
            i.type == data.inp.type &&
            i.dir == data.inp.dir)[0];

        let theOutput = allOutputs.filter(o => 
            o.blockId == data.out.blockId && 
            o.number == data.out.number &&
            o.type == data.out.type &&
            o.dir == data.out.dir)[0];

        return new Connection(theOutput, theInput);
    }
}

class Signal {
    constructor(blockId, number, type, dir) {
        this.blockId = blockId;
        this.number = number;
        this.type = type;
        this.dir = dir;

        this.name = new createjs.Text(type, SFONT, "#777777");
        stage.addChild(this.name);

        this.connector = new createjs.Shape();
        this.connectcmd = undefined;

        if (this.dir == IN) {
            // TODO: verander de kleur wanneer er een connectie bestaat
            this.connectcmd = this.connector.graphics.beginStroke("Black").beginFill("#aaaaaa");
            this.connectcmd.rect(0, 0, CONNSIZE*2, CONNSIZE*2);
        } else if (this.dir == OUT) {
            this.connectcmd = this.connector.graphics.beginStroke("Black").beginFill("#aaaaaa")
            this.connectcmd.drawCircle(0, 0, CONNSIZE);
        }

        stage.addChild(this.connector);

        this.selected = false;

        this.connector.on("click", () => {
            if (this.dir == IN) {
                if (Signal.sInput) {
                    Signal.sInput.selected = false;
                }
                Signal.sInput = this;
                this.selected = true;
                
            } else if (this.dir == OUT) {
                if (Signal.sOutput) {
                    Signal.sOutput.selected = false;
                }
                Signal.sOutput = this;
                this.selected = true;
            }

            if (Signal.sOutput && Signal.sInput) {
                Signal.tryConnect()
            }
        });

        this.connector.on("dblclick", () => {
            let destroyList = [];
            for (let conn of Signal.connections) {
                if (conn.inp == this || conn.out == this) {
                    destroyList.push(conn);
                }
            }

            for (let conn of destroyList) {
                conn.destroy();
            }
        });

    }

    draw(x, y, bw, mirror) {
        this.connected = Signal.connections.map(c => c.out == this || c.inp == this).includes(true);

        let w = this.name.getBounds().width;

        let leftnamex = x - w - 2;
        let leftconnx = x - CONNSIZE;
        let leftconny = y + INPUT_HEIGHT * this.number + 20;
        let rightnamex = x + bw + 2;
        let rightconnx = x + bw;
        let rightconny = y + INPUT_HEIGHT * this.number + 20;


        if (this.dir == IN) {
            this.name.x = mirror ? rightnamex : leftnamex;
            this.connector.x = mirror ? rightconnx - CONNSIZE: leftconnx;
            this.connector.y = mirror ? rightconny : leftconny;
        } else if (this.dir == OUT) {
            this.name.x = mirror ? leftnamex : rightnamex;
            this.connector.x = mirror ? leftconnx + CONNSIZE : rightconnx;
            this.connector.y = (mirror ? leftconny : rightconny) + CONNSIZE;
        }

        if (this.selected) {
            this.connectcmd._fill.style = "#ffff00";
        } else if (this.connected) {
            this.connectcmd._fill.style = "#00ff00";
        } else {
            this.connectcmd._fill.style = "#aaaaaa";
        }

        this.name.y = y + INPUT_HEIGHT * this.number + 2;
        this.x = this.connector.x;
        this.y = this.connector.y;
    }

    save() {
        return {
            blockId: this.blockId,
            number: this.number,
            type: this.type,
            dir: this.dir
        }
    }

    static load(data) {
        let sig = new Signal(data.blockId, data.number, data.type, data.dir);
        return sig;
    }

    static tryConnect() {
        if (Signal.sInput.type == Signal.sOutput.type) {

            let found = false;
            for (let conn of Signal.connections) {
                if (conn.inp == Signal.sInput) {
                    found = true;
                    error("Cannot connect two outputs to the same input.");
                }
            }

            if (!found) {
                Signal.connections.push(new Connection(Signal.sOutput, Signal.sInput));
            }
        } else {
            error("Cannot connect output to input of different type.");
        }

        Signal.sInput.selected = false;
        Signal.sOutput.selected = false;
        Signal.sInput = undefined;
        Signal.sOutput = undefined;
    }
}

Signal.sInput = undefined;
Signal.sOutput = undefined;
Signal.connections = []


class Block {

    constructor(id, inputs, outputs) {
        this.id = id;
        
        this.x = randomMinMax(0, 400);
        this.y = randomMinMax(0, 400);
        
        this.name = new createjs.Text(id, FONT, "#000000");

        this.mirrored = false;
        
        
        this.bw = this.name.getBounds().width + BLOCK_EXTRA_WIDTH
        this.bh = Math.max(inputs.length, outputs.length) * INPUT_HEIGHT
        
        this.rect = new createjs.Shape();
        this.rect.graphics.beginStroke("Black").beginFill("#dddddd")
        .rect(0, 0, this.bw, this.bh);
        stage.addChild(this.rect);
        
        
        this.rect.on("pressmove", (evt) => {
            this.x = evt.stageX - this.bw / 2;
            this.y = evt.stageY - this.bh / 2;
        });
        
        this.rect.on("dblclick", () => {
            this.mirrored = !this.mirrored;
        });
        
        stage.addChild(this.name);
        
        this.inputs = inputs.map((type, i) => new Signal(id, i, type, IN));
        this.outputs = outputs.map((type, i) => new Signal(id, i, type, OUT));

    }

    draw() {
        this.rect.x = this.x;
        this.rect.y = this.y;

        this.name.x = this.x + BLOCK_EXTRA_WIDTH / 2;
        this.name.y = this.y + 12;

        for (let i of this.inputs) {
            i.draw(this.x, this.y, this.bw, this.mirrored);
        }

        for (let o of this.outputs) {
            o.draw(this.x, this.y, this.bw, this.mirrored);
        }
    }


    save() {
        return {
            x: this.x,
            y: this.y,
            inputs: this.inputs.map(i => i.save()),
            outputs: this.outputs.map(o => o.save()),
            id: this.id,
            mirrored: this.mirrored
        };
    }

    static load(data) {
        let block = new Block(data.id, data.inputs.map(i => i.type), data.outputs.map(o => o.type));
        block.x = data.x;
        block.y = data.y;
        block.mirrored = data.mirrored;

        return block;
    }

    static newOrUpdate(def) {
        let id = def.value0;
        let inputs = def.value1;
        let outputs = def.value2;

        let fixed = false
        for (let b of Block.blocks) {
            if (b.id == id) {
                b.ins = inputs;
                b.outs = outputs;
                fixed = true
                break;
            }
        }

        if (!fixed) {
            let b = new Block(id, inputs, outputs);

            Block.blocks.push(b);
        }
    }

    static get(id) {
        found = undefined;
        for (let b of Block.blocks) {
            if (b.id == id) {
                return b;
            }
        }
    }

}

Block.blocks = [];