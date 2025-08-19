import { echoToolSchema } from "./../squemas/index";
import express from "express";
import { validateData } from "../middleware/validateData";
import { langController } from "../controller/langController";

const userRouter = express.Router();

userRouter.post("/agent", validateData(echoToolSchema), langController);

export default userRouter;
