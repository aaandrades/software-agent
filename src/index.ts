import express from "express";
import bodyParser from "body-parser";
import langRoutes from "./routes/langRoutes";

const app = express();
const PORT = 2905;

app.use(bodyParser.json());
app.use("/api", langRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
