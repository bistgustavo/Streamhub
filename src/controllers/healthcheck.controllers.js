import { ApiResponse } from "../utils/ApiRespnose.js";
import { asyncHanlder } from "../utils/asyncHandlers.js";

const healthCheck = asyncHanlder(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, "OK", "Healthcheck passed"));
});

export { healthCheck };
