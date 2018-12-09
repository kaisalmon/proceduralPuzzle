import {Request, Response, Application} from "express";
import {createOrbPuzzle, createLevel} from './../../main/orbPuzzleGenerator';
import {tryUntilSuccess} from '../../main/lib';

export class Routes {
    public routes(app: Application): void {
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
                const level = await createLevel(req.query['level'])
                res.status(200).send(level)
              }catch(e){
                  res.status(500).send({
                    "error":e,
                    ...e
                  })
              }
            })
    }
}
