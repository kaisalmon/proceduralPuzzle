import _ from "lodash";

abstract class PuzzleState<MOVE>{
  abstract toString(): string;
  abstract hashString(): string;
  abstract apply(move: MOVE): PuzzleState<MOVE>;
  abstract reverse(move: MOVE): PuzzleState<MOVE>;
  abstract isValid(): boolean;
  abstract isSolved(): boolean;
  abstract getMoves(): MOVE[];
  abstract getReverseMoves(): MOVE[];


  solve(maxDepth: number = 5, curDepth: number = 1, solutionMap?: {[key:string]:[number, PuzzleState<MOVE>[]|null]}): PuzzleState<MOVE>[] | null {
    if(!solutionMap){
      solutionMap = {};
    }

    if (this.isSolved()) {
      return [this]
    }

    if (solutionMap[this.hashString()] !== undefined){
      let entry = solutionMap[this.hashString()];
      if (entry[0] >= (maxDepth-curDepth)){
        return entry[1];
      }
    }

    if (curDepth >= maxDepth) {
      solutionMap[this.hashString()] = [maxDepth-curDepth, null];
      console.log("Too deep", maxDepth);
      return null;
    }
    let shortestSolution: PuzzleState<MOVE>[] | undefined = undefined;
    for (let m of this.getMoves()) {
      let s = this.apply(m);

      console.log("Trying " + m)
      if (s.hashString() === this.hashString()) {
        console.log("No change")
        continue
      }
      let nextDepth = curDepth + 1;
      let ss = s.solve(maxDepth, nextDepth, solutionMap)
      if (ss) {
        if (shortestSolution === undefined || ss.length < shortestSolution.length) {
          shortestSolution = ss;
          nextDepth = shortestSolution.length - 1;
        } else {
          console.log('Nope')
        }
      }
    }
    if (shortestSolution) {
      let arr: PuzzleState<MOVE>[] = [this]
      arr = arr.concat(shortestSolution)
      solutionMap[this.hashString()] =  [maxDepth-curDepth, arr];
      return arr;
    }else{
      solutionMap[this.hashString()] =  [maxDepth-curDepth, null];
      return null;
    }
  }

  getStack(depth: number, debug: boolean = false): [PuzzleState<MOVE>[], MOVE[]] {
    let bad_states = []
    let bad_count = 0;
    let itr_count = 0;
    let stack: PuzzleState<MOVE>[] = [this]
    let moves: MOVE[] = [];
    while (stack.length < depth) {
      itr_count++;
      if (itr_count > 1000) {
        throw "Too many iterations"
      }

      let p = stack[stack.length - 1]

      let nexts: [PuzzleState<MOVE>, MOVE][] = [];
      for (let move of p.getReverseMoves()) {
        try {
          let next = p.reverse(move);
          if (!next.isValid()) {
            throw "Invalid state"
          }
          if (nexts.some(m => m[0].hashString() == next.hashString())) {
            console.error("Pointless move")
            throw "Pointless Move"
          }
          if (next.apply(move).hashString() != p.hashString()) {
            throw {
              "name": "FatalError",
              "message": "Reversing move and applying move have different results",
              "starting-point": next,
              "a": next.apply(move),
              "b": p,
              "a-hash": next.apply(move).hashString(),
              "b-hash": p.hashString(),
              "move": move
            }
          }
          nexts.push([next, move])
        } catch (e) {
          if (debug) {
            console.error(e)
          }
          if (e.name == "FatalError") {
            console.error(e)
            throw e;
          }
        }
      }
      if (nexts.length == 0) {
        bad_count++;
        if (bad_count > 30) {
          throw "Maximum bad states exceeded"
        }

        if (bad_states.indexOf(p.hashString()) === -1) {
          stack.pop()
          moves.pop()
          bad_states.push(p.hashString())
          if (stack.length == 0) {
            throw "Bad Solution"
          }
        } else {
          stack = [this]
          moves = []
          if (bad_states.indexOf(this.hashString()) !== -1) {
            throw "Bad Solution"
          }
        }
      } else {
        let next = _.sample(nexts);
        if (!next) {
          throw "No valid options"
        }
        stack.push(next[0])
        moves.push(next[1])
      }
    }
    return [stack.reverse(), moves.reverse()]
  }
}

export default PuzzleState;
