import * as _ from "lodash";
import * as $ from 'jquery'

abstract class PuzzleState<MOVE>{
    abstract toString():string;
    abstract hashString():string;
    abstract apply(move:MOVE): PuzzleState<MOVE>; 
    abstract reverse(move:MOVE): PuzzleState<MOVE>; 
    abstract isValid(): boolean;    
    abstract isSolved(): boolean;    
    abstract getMoves(): MOVE[]; 
    abstract getReverseMoves(): MOVE[]; 
     
    solve(maxDepth:number=5, curDepth:number=0):PuzzleState<MOVE>[]|undefined
    {     
        if(this.isSolved()){
            return [this]
        }
        if(curDepth>=maxDepth){
            return undefined;
        }
        let shortestSolution:PuzzleState<MOVE>[]|undefined = undefined;
        let nextDepth = maxDepth;
        for(let m of this.getMoves()){
            let s = this.apply(m);
            console.log("Trying "+m)
            if(s.hashString() === this.hashString()){
                console.log("No change")
                continue
            }
            let ss = s.solve(nextDepth, curDepth+1)
            if(ss){
                if(shortestSolution === undefined || ss.length < shortestSolution.length){
                    shortestSolution = ss;
                    nextDepth = shortestSolution.length - 1;
                }else{
                    console.log('Nope')
                } 
            }
        }
        if(shortestSolution){
            let arr:PuzzleState<MOVE>[] = [this]
            arr = arr.concat(shortestSolution)
            return arr;
        }
    }
    getStack(depth: number, debug:boolean=false):PuzzleState<MOVE>[]
    {
        let bad_states = [] 
        let bad_count = 0;
        let itr_count = 0;
        let stack:PuzzleState<MOVE>[] = [this]
        while(stack.length < depth){
            itr_count++;
            if(itr_count > 1000){
                throw "Too many iterations"
            }

            let p = stack[stack.length -1]

            let nexts:PuzzleState<MOVE>[] = [];
            for(let move of p.getReverseMoves()){
                try{
                    let next = p.reverse(move);
                    if(!next.isValid()){
                        throw "Invalid state"
                    }
                    if(next.apply(move).hashString() != p.hashString()){
                        throw {"name":"FatalError",
                                "message":"Reversing move and applying move have different results",
                                "starting-point":next,
                                "a":next.apply(move),
                                "b":p,
                                "a-hash":next.apply(move).hashString(),
                                "b-hash":p.hashString(),
                                "move":move
                            }
                    }
                    nexts.push(next)
                }catch(e){
                    if(debug){
                        console.error(e)
                    }
                    if(e.name == "FatalError"){
                        throw e;    
                    }
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
                let next = _.sample(nexts);
                if(!next){
                    throw "No valid options"
                }
                stack.push(next)
            }
        }
        return stack.reverse()
    }
}
/*******************************************/

export enum Tile{
    Empty=' ',
    Fragile='□',
    Brick='■',
    Crystal='◇',
    Portal='℗',
    Pit='▼',
    Target='◎'
}

export class Boulder{
    x: number;
    y: number;
    constructor(x:number, y:number){
        this.x = x;
        this.y = y;
    }
}
export class BoulderPuzzle extends PuzzleState<BoulderMove>{
    grid:Tile[][]     
    boulders: Boulder[];
    criticalTiles: {x:number, y:number}[] = []
    width: number; height: number;

    use_crystals: boolean = false;
    use_pits: boolean = false;
    use_portals: boolean = false;
    use_fragile: boolean = false;
    no_basic: boolean = false;

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
                if(this.grid[x][y] == Tile.Target){
                    result += this.boulders.some((b)=>b.x==x && b.y==y) ? "✓" : this.grid[x][y]
                }else if(this.grid[x][y] == Tile.Empty){
                    //result += this.boulders.some((b)=>b.x==x && b.y==y) ? "o" : (this.criticalTiles.some((t)=>t.x==x && t.y==y) ? this.grid[x][y] : ' ');
                    result += this.boulders.some((b)=>b.x==x && b.y==y) ? "o" : this.grid[x][y]
                }else{
                    result += this.boulders.some((b)=>b.x==x && b.y==y) ? "o" : this.grid[x][y]
                }
            }
            result +="\n";
        }
        return result;
    }
    hashString():string{
        return this.toString();
    }
    apply(move: BoulderMove): BoulderPuzzle{
        let state = _.cloneDeep(this);
        if(move == BoulderMove.Shatter){
            state.grid = state.grid.map(line=>line.map(t=> t==Tile.Crystal ? Tile.Empty : t )) 
            return state;
        }
        let vec = this.getVec(move);

        let toBeRemoved:Boulder[] =[]
        for(let b of state.bouldersInVecOrder(vec)){
            let ox = b.x;
            let oy = b.y;
            for(let mag = 1; mag < this.height; mag++){
                if(state.isPassable(ox+vec[0]*mag, oy+vec[1]*mag)){
                    b.x = ox+vec[0]*mag;
                    b.y = oy+vec[1]*mag;
                }else{
                    let t = state.getTile(ox+vec[0]*mag, oy+vec[1]*mag)
                    if(t == Tile.Pit){
                        toBeRemoved.push(b);
                        b.x = -1;
                        b.y = -1;
                        state.grid[ox+vec[0]*mag][oy+vec[1]*mag] = Tile.Empty;
                    }
                    //don't break if we didn't move
                    if(mag>1 && t == Tile.Fragile){
                        state.grid[ox+vec[0]*mag][oy+vec[1]*mag] = Tile.Empty;
                    }
                    break;
                }
            }
        }
        state.boulders = state.boulders.filter(b=>toBeRemoved.indexOf(b)==-1);
        return state;    
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

    reverseShatter(): BoulderPuzzle{
        if(this.criticalTiles.length < 8){
            throw "Not enough critical tiles for shatter"
        }
        if(this.grid.some(line=>line.some(tile=>tile==Tile.Crystal))){
            throw "Crystals already present"
        }
        for(var i = 0; i < randInt(1,4); i++){
            let coord = _.sample(this.criticalTiles);
            if(coord){
                if(this.getTile(coord.x,coord.y) == Tile.Empty){
                    this.grid[coord.x][coord.y] = Tile.Crystal;
                }
            }
        }
        for(var i = 0; i < Math.min(this.height, this.width); i++){
            let x = randInt(0, this.width)
            let y = randInt(0, this.height)
            if(this.getTile(x,y) == Tile.Empty){
                this.grid[x][y] = Tile.Crystal;
            }
        }
        return this; 
    }

    reverse(move: BoulderMove): BoulderPuzzle{
        let state = _.cloneDeep(this);
        if(move == BoulderMove.Shatter){
            return state.reverseShatter();
        }

        let vec = this.getVec(move);
        vec[0] = -vec[0]
        vec[1] = -vec[1]
        
        let haveMoved:Boulder[] = [];

        if(state.isPitMove(move)){
            let possibleCoords:{x:number, y:number}[] = [];
            for(let coord of this.criticalTiles){
                if(state.getTile(coord.x,coord.y) == Tile.Empty && state.isPassable(coord.x+vec[0],coord.y+vec[1])){
                    if(state.boulders.some(b=>b.x == coord.x && b.y==coord.y)){
                        continue; //Don't put a pit under an existing boulder
                    }
                    possibleCoords.push(coord)
                } 
            } 

            let pit = _.sample(possibleCoords);
            if(!pit){
                throw "No pit locations";
            }
            state.grid[pit.x][pit.y] = Tile.Pit;
            let b = new Boulder(pit.x, pit.y)
            state.boulders.push(b)
        }

        for(let b of state.bouldersInVecOrder(vec)){
            let ox = b.x;
            let oy = b.y;
            let mags = [];
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

            let mag = _.sample(mags)
            if(mag === undefined){
                throw "No options"
            }
            if(mag != 0){
                haveMoved.push(b)
            }
            b.x += vec[0]*mag      
            b.y += vec[1]*mag   

            //Add path to Critical Path
            for(var i = 1; i <= mag; i++){
                let criticalTile = {x:b.x-vec[0]*i, y:b.y-vec[1]*i}
                state.criticalTiles.push(criticalTile)
            }

            if(state.isPassable(ox - vec[0], oy - vec[1]) && state.getTile(ox,oy) != Tile.Pit){
                if(state.getTile(ox - vec[0], oy - vec[1]) == Tile.Empty){
                    if(!state.use_fragile){
                        throw "No Fragile supported"
                    }
                    state.grid[ox - vec[0]][oy - vec[1]] = Tile.Fragile; 
                }else if(state.getTile(ox - vec[0], oy - vec[1]) == Tile.Target){
                    throw "Would need to put fragile block on target";
                }
            }else if(state.getTile(ox - vec[0], oy - vec[1]) == Tile.Pit){
                throw "Would need to put fragile block where a pit ia pit is";
            }else if(state.getTile(ox - vec[0], oy - vec[1]) == Tile.Fragile){
                throw "Would need to put fragile block where there will already be one";
            }
        }


        if(state.isPortalMove(move)){
            if(this.hasPortals()){
                throw "Already has a portal pair"
            }

            let b = _.sample(haveMoved);
            if(b){
                state.grid[b.x][b.y] = Tile.Portal;
                
                let possibleCoords:{x:number, y:number}[] = [];
                for(var x = 0; x < this.width; x++){
                    for(var y = 0; y < this.height; y++){
                        if(state.getTile(x,y) == Tile.Empty && state.isPassable(x+vec[0],y+vec[1])){
                            possibleCoords.push({x:x, y:y})
                        }
                    } 
                } 
    
                let portal = _.sample(possibleCoords);
                if(!portal){
                    throw "No portal locations possible";
                }
                state.grid[portal.x][portal.y] = Tile.Portal;
                b.x = portal.x;
                b.y = portal.y;
                let mags = [];
                for(let mag = 1; mag < this.height; mag++){
                    if(state.isPassable(b.x+vec[0]*mag, b.y+vec[1]*mag)){
                        mags.push(mag) 
                    }else{
                        break;           
                    }
                }
                let mag = _.sample(mags);
                if(!mag){
                    throw "No where to enter portal from (Shouldn't happen)" 
                }
                b.x += vec[0]*mag;
                b.y += vec[1]*mag;
            }   
        }

        return state;
    }
    hasPortals():boolean{
        for(var x = 0; x < this.width; x++){
            for(var y = 0; y < this.height; y++){
                if(this.getTile(x,y) == Tile.Portal){
                    return true;
                }
            }
        }
        return false;
    }
    isPitMove(move:BoulderMove){
        return move == BoulderMove.UpPit ||  move == BoulderMove.RightPit ||  move == BoulderMove.LeftPit ||  move == BoulderMove.DownPit;
    }
    isPortalMove(move:BoulderMove){
        return move == BoulderMove.UpPortal ||  move == BoulderMove.RightPortal ||  move == BoulderMove.LeftPortal ||  move == BoulderMove.DownPortal;
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
        let moves =  [BoulderMove.Up, BoulderMove.Down, BoulderMove.Left, BoulderMove.Right]
        if(this.use_crystals){
            moves.push(BoulderMove.Shatter)
        }
        return moves;
    }
    getReverseMoves(): BoulderMove[]{
        let moves = [BoulderMove.Up, BoulderMove.Down, BoulderMove.Left, BoulderMove.Right]
        if(this.no_basic){
            moves = []
        }
        if(this.use_crystals){
            moves.push(BoulderMove.Shatter)
        }
        if(this.use_portals && !this.hasPortals() && randInt(0,3) == 0){
            moves.push(BoulderMove.UpPortal)
            moves.push(BoulderMove.RightPortal)
            moves.push(BoulderMove.LeftPortal)
            moves.push(BoulderMove.DownPortal)
        }
        if(this.use_pits){
            moves.push(BoulderMove.RightPit)
            moves.push(BoulderMove.LeftPit)
            moves.push(BoulderMove.UpPit)
            moves.push(BoulderMove.DownPit)
        }
        return moves;
    }
    getVec(move: BoulderMove): number[]{
        switch(move){
            case BoulderMove.Right:
                return [1,0]
            case BoulderMove.RightPortal:
                return [1,0]
            case BoulderMove.RightPit:
                return [1,0]
            case BoulderMove.Left:
                return [-1,0]
            case BoulderMove.LeftPortal:
                return [-1,0]
            case BoulderMove.LeftPit:
                return [-1,0]
            case BoulderMove.Up:
                return [0,-1]
            case BoulderMove.UpPortal:
                return [0,-1]
            case BoulderMove.UpPit:
                return [0,-1]
            case BoulderMove.Down:
                return [0,1]
            case BoulderMove.DownPortal:
                return [0,1]
            case BoulderMove.DownPit:
                return [0,1]
            default:
                throw "Error"
        }
    }
    isSolved():boolean{
        for(var x = 0; x < this.width; x++){
            for(var y = 0; y < this.height; y++){
                if(this.getTile(x,y) == Tile.Target){
                    if(!this.boulders.some(b=>b.x==x && b.y==y)){
                        return false
                    }
                }
            }
        }
        return true;
    }
}

enum BoulderMove{
    Up = "Up",
        UpPortal = "Up, using portal",
        UpPit = "Up, into pit",
    Down = "Down",
        DownPortal = "Down, using portal",
        DownPit = "Down, into pit",
    Left = "Left",
        LeftPortal = "Left, using portal",
        LeftPit = "Left, into pit",
    Right = "Right",
        RightPortal = "Right, using portal",
        RightPit = "Right, into pit",
    Shatter = "Shatter",
}

/*
let p =new BoulderPuzzle(5, 3)
p.boulders.push(new Boulder(2,1))
p.grid[1][1] = Tile.Fragile;
console.log(p.toString())
p = p.reverse(BoulderMove.Left);
console.log(p.toString())


*/
function randInt(min:number, max:number):number {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min; 
}

async function tryUntilSuccess<T>(f:()=>T): Promise<T>{
    return new Promise<T>((resolve, reject)=>{
        let i = 0;
        function _attempt():void{
            try{
                let result = f();
                resolve(result)
            }catch(e){
                console.error(e)
                i++;
                if(i%10){
                    console.warn("Over "+i+" attempts..")
                }
                if(i > 600){
                    reject();
                }else{
                    requestAnimationFrame(_attempt)
                }
            }
        }
        _attempt();
    })
}

/*
let stack:BoulderPuzzle[] = []
let p =new BoulderPuzzle(10,10)
p.grid[4][3] = Tile.Pit;
p.boulders.push(new Boulder(4,4))
stack.push(p)
p = p.reverse(BoulderMove.Up)
stack.push(p)
stack = stack.reverse();
*/
(async function(){
    function createPuzzle():PuzzleState<BoulderMove>[]{
        let p =new BoulderPuzzle(10, 10)
        for(let i = 0; i < p.width*p.height/5; i++){   
            let x= randInt(0, p.width);
            let y= randInt(0, p.height);
            p.grid[x][y] = Tile.Brick;
        }

        for(let i = 0; i < 3; i++){   
            let x= randInt(0, p.width);
            let y= randInt(0, p.height);
            p.grid[x][y] = Tile.Target
            p.boulders.push(new Boulder(x,y))
        }
        p.use_fragile = false;
        p.use_crystals = false;
        p.use_pits = false;

        let stack = p.getStack(6, true)
        let solution = stack[0].solve();
        console.log("Min Steps:",solution ? solution.length-1 : " > 5")
        if(solution && solution.length < 5){
            throw "too short"
        } 
        return stack;
    }

    let stack = await tryUntilSuccess(createPuzzle);
    let board = stack[0];
    $(document).ready(()=>{
        let $wrapper = $('<div/>').addClass('puzzle-wrapper').appendTo('body')
        let $div = $('<div/>').addClass('puzzles').appendTo($wrapper)
        $('<pre/>').text(board.toString()).appendTo($div);
        $('body').keyup((e)=>{
            let move:BoulderMove|undefined = undefined;
            switch(e.which){
                case 13:
                    move = BoulderMove.Shatter;
                    break;
                case 32:
                    move = BoulderMove.Shatter;
                    break;
                case 37:
                    move = BoulderMove.Left;
                    break;
                case 38:
                    move = BoulderMove.Up;
                    break;
                case 39:
                    move = BoulderMove.Right;
                    break;
                case 40:
                    move = BoulderMove.Down;
                    break;
            }
            if(move){
                board = board.apply(move)
                $div.empty()
                $('<pre/>').text(board.toString()).appendTo($div);
            }
        })
    })
})();
