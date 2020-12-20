
const INPUT_HEIGHT = 24;
const BLOCK_EXTRA_WIDTH = 20;

const IN = "IN";
const OUT = "OUT";

class Signal {
    constructor(type, dir, block, number) {
        this.block = block;
        this.type = type;
        this.dir = dir;
        this.number = number;
        this.selected = false;
    }
}

class Block {

    constructor(id, inputs, outputs) {
        this.id = id;
        this.ins = inputs
        this.outs = outputs
        this.inputs = undefined;
        this.outputs = undefined;

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
                b.inputs = b.ins.map((inp, i) => {
                    return new Signal(inp, IN, b, i);
                });
    
                b.outputs = b.outs.map((out, i) => {
                    return new Signal(out, OUT, b, i);
                });
                fixed = true
                break;
            }
        }

        if (!fixed) {
            let b = new Block(id, inputs, outputs);
            
            b.inputs = b.ins.map((inp, i) => {
                return new Signal(inp, IN, b, i);
            });

            b.outputs = b.outs.map((out, i) => {
                return new Signal(out, OUT, b, i);
            });

            Block.blocks.push(b);
        }
    }

    static get(id) {
        for (let b of Block.blocks) {
            if (b.id == id) {
                return b;
            }
        }
    }

}

Block.blocks = [];