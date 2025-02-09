import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; /// 5 secs

class DatabaseConnection {
  constructor() {
    this.retryCount = 0;
    this.isConnected = false;

    //configure mongoose settings
    mongoose.set("strictQuery", true);

    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
      this.isConnected = true;
    });

    mongoose.connection.on("error", () => {
      console.log("MongoDB connection failed");
      this.isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
      this.handleDisconnection();
    });

    process.on("SIGTERM", this.handleAppTermination.bind(this));
  }
  async connect() {
    try {
      if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI environment variable not set");
      }

      const connectionOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 4500,
        family: 4, //use IPv4
      };

      if (process.env.NODE_ENV === "development") {
        mongoose.set("debug", true);
      }

      await mongoose.connect(process.env.MONGO_URI, connectionOptions);
      this.retryCount = 0; //reset retry on success
    } catch (error) {
      console.log(error.message);
      await this.handleConnectionError();
    }
  }

  async handleConnectionError() {
    if (this.retryCount < MAX_RETRIES) {
      this.retryCount++;
      console.log(
        `Retrying MongoDB connection... Attempt ${this.retryCount}/${MAX_RETRIES}`
      );

      await new Promise((resolve) =>
        setTimeout(() => {
          resolve;
        }, RETRY_INTERVAL)
      );
      return this.connect();
    } else {
      console.error(
        `Failed to connect to MongoDB after ${MAX_RETRIES} attempts`
      );
      process.exit(1);
    }
  }

  async handleDisconnection() {
    if (!this.isConnected) {
      console.log("Attempting to reconnect to MongoDB....");
      await this.connect();
    }
  }

  async handleAppTermination() {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination!");
      process.exit(0);
    } catch (error) {
      console.log("Error during database connection", error);
      process.exit(1);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

//creata a singleton instance

const dbConnection = new DatabaseConnection();
export default dbConnection.connect.bind(dbConnection);
export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection);
