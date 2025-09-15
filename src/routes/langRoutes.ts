import { echoToolSchema } from "./../squemas/index";
import express from "express";
import { validateData } from "../middleware/validateData";
import { langController } from "../controller/langController";
import { indexingController } from "../controller/indexingController";

const userRouter = express.Router();

userRouter.post("/agent", validateData(echoToolSchema), langController);
userRouter.post("/index-repo", indexingController);
export default userRouter;
