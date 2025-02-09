import { getDBStatus } from "../database/db.js";

export const healthCheck = async (req, res) => {
  try {
    const dbStatus = getDBStatus();

    const healthStatus = {
      status: "OK",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus.isConnected ? "healthy" : "unhealthy",
          details: {
            ...dbStatus,
            readyState: getReadyStateText(dbStatus.readyState),
          },
        },
        server: {
          status: "healthy",
          process: process.uptime(),
          memoryUsage: process.memoryUsage(),
          details: {
            host: dbStatus.host,
            name: dbStatus.name,
          },
        },
      },
    };

    const httpStatus =
      healthStatus.services.database.status === "healthy" ? 200 : 503;

    res.status(httpStatus).json(healthStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

//utitlity method
function getReadyStateText(state) {
  switch (state) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting...";
    case 3:
      return "disconnected";
    default:
      return "Unknown";
  }
}
