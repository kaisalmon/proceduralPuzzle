import * as BP from './boulderpuzzle'
import * as $ from 'jquery'
/*
let p =new BoulderPuzzle(10,10)
p.grid[4][3] = Tile.Pit;
p.boulders.push(new Boulder(4,4))
stack.push(p)
p = p.reverse(BoulderMove.Up)
stack.push(p)
stack = stack.reverse();
*/
function sleep(ms:number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

class Boulder{
    $e:JQuery
    x:number
    y:number
    trueX:number
    trueY:number
    constructor($e:JQuery, x:number, y:number){
        this.$e = $e;
        this.x = x;
        this.y = y;
        this.trueX = x;
        this.trueY = y;
        this.updateTransform()
    }
    updateTransform():void{
        this.$e.css('transform','translate('+this.trueX*30+'px, '+this.trueY*30+'px)') 
    }
    async moveTo(x:number, y:number){
        this.x = x;
        this.y = y;
        this.trueX = x;
        this.trueY = y;
        return new Promise((resolve)=>{
            this.updateTransform();
            resolve();
        })
    }
}

let p =new BP.BoulderPuzzle({width: 10, height: 10, boulders:2})
let stack = p.getStack(4, true)
console.log(stack)
let level:BP.BoulderPuzzle = stack[0] as BP.BoulderPuzzle;
$(document).ready(()=>{
    let boulders:Boulder[] = [];

    let $wrapper = $('<div/>').addClass('puzzle-wrapper').appendTo('body');
    let $board = $('<div/>').addClass('puzzles').appendTo($wrapper);
    for(let x = 0; x < level.width;x++){
        for(let y = 0; y < level.height;y++){
            let className = level.getTile(x,y) == BP.Tile.Brick ? "tile brick" : "tile" 
            $board.append($('<div/>').addClass(className))
        }
       $board.append('<br>')
    }
    for(let b of level.boulders){
        let $e = $('<div/>').addClass('game-object boulder').appendTo('.puzzles')
        let o = new Boulder($e,b.x,b.y);
        boulders.push(o)
    }
})
