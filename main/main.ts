import * as _ from "lodash";

abstract class PuzzleState<MOVE>{
    abstract toString():string;
    abstract hashString():string;
    abstract apply(move:MOVE): PuzzleState<MOVE>; 
    abstract reverse(move:MOVE): PuzzleState<MOVE>; 
    abstract isValid(): boolean;    
    abstract getMoves(): MOVE[]; 
     
    print_stack(depth: number, debug:boolean=false){
        let bad_states = [] 
        let bad_count = 0;
        let stack:PuzzleState<MOVE>[] = [this]
        while(stack.length < depth){
            let p = stack[stack.length -1]

            let nexts:PuzzleState<MOVE>[] = [];
            for(let move of p.getMoves()){
                try{
                    let next = p.reverse(move);
                    if(!next.isValid()){
                        throw "Invalid state"
                    }
                    nexts.push(next)
                }catch(e){
                    if(debug)
                        console.error(e)
                }
            }
            if(nexts.length == 0){
                bad_count ++;
                if(bad_count > 30){
                    throw "Maximum bad states exceeded"
                } 

                if(bad_states.indexOf(p.hashString()) === -1){
                    stack.pop()
                    bad_states.push(p.hashString())
                    if(stack.length == 0){
                        throw "Bad Solution"
                    }
                }else{
                    stack = [this]
                    if(bad_states.indexOf(this.hashString()) !== -1){
                        throw "Bad Solution"
                    }
                }
            }else{
                stack.push(_.sample(nexts))
            }
        }
        stack.reverse().forEach((e)=>console.log(e.toString()))
    }
}
/*******************************************/

enum Tile{
    Empty='·',
    Fragile='□',
    Brick='■',
    Target='◎'
}

class Boulder{
    x: number;
    y: number;
    constructor(x:number, y:number){
        this.x = x;
        this.y = y;
    }
}
class BoulderPuzzle extends PuzzleState<BoulderMove>{
    grid:Tile[][]     
    boulders: Boulder[];
    width: number; height: number;

    constructor(width:number, height:number){
        super(); 
        this.width = width;
        this.height = height;
        this.grid = [];
        this.boulders = [];

        for(let y = 0; y < this.height; y++){
            for(let x = 0; x < this.width; x++){
                if(!this.grid[x]){
                    this.grid[x] = [] 
                }
                this.grid[x].push(Tile.Empty); 
            }
        }
    }
    
    bouldersInVecOrder(vec:number[]):Boulder[]{
        return this.boulders.sort((a,b)=>{
            let aVal = a.x * vec[0] + a.y * vec[1]
            let bVal = b.x * vec[0] + b.y * vec[1]
            if(aVal < bVal){
                return 1;
            }else{
                return -1;
            }
        })
    }

    toString():string{
        let result = "";
        for(let y = 0; y < this.height; y++){
            for(let x = 0; x < this.width; x++){
                result += this.boulders.some((b)=>b.x==x && b.y==y) ? "o" : this.grid[x][y]
            }
            result +="\n";
        }
        return result;
    }
    hashString():string{
        return this.toString();
    }
    apply(move: BoulderMove): BoulderPuzzle{
        let result = _.cloneDeep(this);
        return this;    
    }
    isTilePassable(tile:Tile|undefined):boolean{
        return tile == Tile.Empty || tile == Tile.Target
    }
    isPassable(x:number, y:number):boolean{
        if(!this.isTilePassable(this.getTile(x,y))){
            return false;
        }
        for(let b of this.boulders){
            if(b.x == x && b.y==y){
                return false;
            }
        }
        return true;
    }
    getTile(x:number, y:number): Tile|undefined{
        if(x<0 || x >= this.width || y<0 || y>=this.height){
            return undefined;
        }
        return this.grid[x][y];
    }


    reverse(move: BoulderMove): BoulderPuzzle{
        let vec = this.getVec(move);
        vec[0] = -vec[0]
        vec[1] = -vec[1]
        let state = _.cloneDeep(this);
        
        for(let b of state.bouldersInVecOrder(vec)){
            let ox = b.x;
            let oy = b.y;
            let mags = [];

            //Encapsulate some logic here
            {
                for(let mag = 1; mag < this.height; mag++){
                    if(state.isPassable(ox+vec[0]*mag, oy+vec[1]*mag)){
                        mags.push(mag) 
                    }else{
                        break;           
                    }
                }
                if(!state.isPassable(ox-vec[0], oy-vec[1])){
                    mags.push(0)
                }
            }

            if(mags.length == 0){
                throw "No options"
            }

            let mag = _.sample(mags)
            b.x += vec[0]*mag      
            b.y += vec[1]*mag   
            if(state.isPassable(ox - vec[0], oy - vec[1])){
                if(state.getTile(ox - vec[0], oy - vec[1]) == Tile.Empty){
                    state.grid[ox - vec[0]][oy - vec[1]] = Tile.Fragile; 
                }else if(state.getTile(ox - vec[0], oy - vec[1]) == Tile.Target){
                    throw "Would need to put fragile block on target";
                }else if(state.getTile(ox - vec[0], oy - vec[1]) == Tile.Fragile){
                    throw "Would need to put fragile block where there will already be one";
                }
            }
        }

        return state;
    }
    isValid():boolean{
        for (var i = 0; i < this.boulders.length - 1; i++) {
            let b1 = this.boulders[i];
            let tile = this.getTile(b1.x, b1.y);
            if(!this.isTilePassable(tile)){
                return false;
            }
            for (var j = i+1; j <= this.boulders.length - 1; j++) {
                let b2 = this.boulders[j];
                if(b1.x == b2.x && b1.y == b2.y){
                    return false;
                }
            }
        }
        return true;
    }
    getMoves(): BoulderMove[]{
        return [BoulderMove.Up, BoulderMove.Down, BoulderMove.Left, BoulderMove.Right]
    }
    getVec(move: BoulderMove): number[]{
        switch(move){
            case BoulderMove.Right:
                return [1,0]
            case BoulderMove.Left:
                return [-1,0]
            case BoulderMove.Up:
                return [0,-1]
            case BoulderMove.Down:
                return [0,1]
            default:
                throw "Error"
        }
    }
}

enum BoulderMove{
    Up = "Up",
    Down = "Down",
    Left = "Left",
    Right = "Right"
}

function randInt(min:number, max:number):number {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min; 
}

try{
    var p = new BoulderPuzzle(5, 6);
    p.boulders.push(new Boulder(2, 3));
    p.boulders.push(new Boulder(2, 2));
    console.log(p.toString());
    p = p.reverse(BoulderMove.Up);
    if (p.isValid()) {
        console.log(p.toString());
    }else {
        console.error("\n", p.toString());
    }
}catch(e){console.error(e)}
console.log('-------------------');
try{
    var p = new BoulderPuzzle(5, 6);
    p.boulders.push(new Boulder(2, 2));
    p.boulders.push(new Boulder(2, 3));
    console.log(p.toString());
    p = p.reverse(BoulderMove.Up);
    if (p.isValid()) {
        console.log(p.toString());
    }else {
        console.error("\n", p.toString());
    }
}catch(e){console.error(e)}

/*
let p =new BoulderPuzzle(10, 10)
for(let i = 0; i < 3; i++){   
    let x= randInt(0, p.width);
    let y= randInt(0, p.height);
    p.grid[x][y] = Tile.Target
    p.boulders.push(new Boulder(x,y))
}
for(let i = 0; i < 2; i++){   
    let x= randInt(0, p.width);
    let y= randInt(0, p.height);
    p.grid[x][y] = Tile.Fragile
}
for(let i = 0; i < 5; i++){   
    let x= randInt(0, p.width);
    let y= randInt(0, p.height);
    p.grid[x][y] = Tile.Brick;
}
p.print_stack(6, true)
*/
