
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

    

        let text = new fabric.Textbox(this.type, {
            fontFamily: 'courier',
            fontSize: 14,
            left: 0,
            top: number * INPUT_HEIGHT
        });


        if (dir == IN) {
            text.left = - text.getBoundingRect().width - block.cobj.getBoundingRect().width / 2;
        } else if (dir == OUT) {
            text.left = block.cobj.getBoundingRect().width / 2;
        }
        text.top -= block.cobj.getBoundingRect().height / 2 - 4;

        block.cobj.add(text);
    }

    // draw() {
        
        
    //     if (this.dir == IN) {
    //         drawText(this.rect().x, 14 + this.rect().y, this.type, "#777777");
    //         drawArrow(this.rect().x, this.rect().y + 18, this.block.pos.x, this.rect().y + 18);
    //     } else if (this.dir == OUT) {
    //         drawText(this.rect().x, 14 + this.rect().y, this.type, "#777777");
    //         drawArrow(this.rect().x, this.rect().y + 18, this.rect().x + this.rect().w, this.rect().y + 18);
    //     }

    //     if (this.selected) {
    //         ctx.beginPath();
    //         ctx.lineWidth = "3";
    //         ctx.strokeStyle = "black";
    //         ctx.rect(this.rect().x, this.rect().y, this.rect().w, this.rect().h);
    //         ctx.stroke();
    //     }
    // }

}

class Block {

    constructor(id, inputs, outputs) {
        this.id = id;
        this.ins = inputs
        this.outs = outputs
        this.inputs = undefined;
        this.outputs = undefined;

        // this.pos = {
        //     x: randomMinMax(0, 400), 
        //     y: (randomMinMax(0, 400))
        // };

        // this.dim = {
        //     w: ctx.measureText(id).width + BLOCK_EXTRA_WIDTH, 
        //     h: Math.max(outputs.length, inputs.length) * INPUT_HEIGHT
        // };

        this.signalHitboxes = {in: {}, out: {}};

        
        let text = new fabric.Textbox(this.id, {
            fontFamily: 'courier',
            fontSize: 14,
            left: BLOCK_EXTRA_WIDTH / 2,
            top: 5,
        })

        let tw = text.getBoundingRect().width;

        let rect = new fabric.Rect({
            fill: '',
            stroke: 'black',
            strokeWidth: 2,
            width: tw + BLOCK_EXTRA_WIDTH, 
            height: Math.max(outputs.length, inputs.length) * INPUT_HEIGHT,
        });
        
        this.cobj = new fabric.Group([rect, text], {
            left: randomMinMax(0, 400),
            top: randomMinMax(0, 400),
            subTargetCheck: true,
        });


    }

    static newOrUpdate(def) {
        let id = def.value0;
        let inputs = def.value1;
        let outputs = def.value2;

        let fixed = false
        for (let b of Block.blocks) {
            if (b.id == id) {
                b.inputs = inputs;
                b.outputs = outputs;
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

            canvas.add(b.cobj);
        }
    }

    // draw() {
    //     drawText(this.pos.x + BLOCK_EXTRA_WIDTH / 2, this.pos.y + 16, this.id, "#000000");
        
    //     ctx.beginPath();
    //     ctx.lineWidth = "3";
    //     ctx.strokeStyle = "black";
    //     ctx.rect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
    //     ctx.stroke();

    //     for (let inp of this.inputs) {
    //         inp.draw();
    //     }

    //     for (let out of this.outputs) {
    //         out.draw();
    //     }


    // }
}

Block.blocks = [];