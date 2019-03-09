import {Request, Response, Application} from "express";
import {createOrbPuzzle, createLevel} from './../../main/orbPuzzleGenerator';
import {OrbPuzzle, OrbMove} from './../../main/orbPuzzle';
import {tryUntilSuccess} from '../../main/lib';

export class Routes {
    challengeMap:{[seed:number]:[OrbPuzzle[], OrbMove[]]} = {};

    public routes(app: Application): void {
        app.route('/')
          .get(async (req: Request, res: Response) => {
              res.status(200).send("Araane Orbs")
          })

        app.route('/levelFromSettings')
          .get(async (req: Request, res: Response) => {
            try{
              const level = await tryUntilSuccess(createOrbPuzzle, req.query, false)
              res.status(200).send(level)
            }catch(e){
                res.status(200).send({
                  "error":e,
                  ...e
                })
            }
          })

          app.route('/level')
            .get(async (req: Request, res: Response) => {
              try{
                console.log(req.query)
                let seed: number|undefined =  req.query['seed'] ? parseInt(req.query['seed']) : undefined;
                let level = req.query['level']
                console.log(Object.keys(this.challengeMap));
                if(level==="challenge" && seed && this.challengeMap[seed]){
                  const result = this.challengeMap[seed];
                  res.status(200).send(result)
                }else{
                  const result = await createLevel({level, seed})
                  if(level==="challenge" && result && seed){
                    this.challengeMap[seed] = result;
                  }
                  res.status(200).send(result)
                }
              }catch(e){
                  res.status(500).send({
                    "error":e,
                    ...e
                  })
              }
            })
    }
}
