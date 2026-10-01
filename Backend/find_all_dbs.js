const mongoose = require("mongoose");
require("dotenv").config();

const inspectCluster = async () => {
  try {
    console.log("Connecting to Cluster:", process.env.MONGODB_URL);
    const conn = await mongoose.createConnection(process.env.MONGODB_URL).asPromise();
    
    // Get Admin DB to list all databases in the cluster
    const adminDb = conn.db.admin();
    const dbsResult = await adminDb.listDatabases();
    
    console.log("\n==========================================");
    console.log("DATABASES IN YOUR MONGODB ATLAS CLUSTER:");
    console.log("==========================================");

    for (const dbInfo of dbsResult.databases) {
      console.log(`\n📁 Database: "${dbInfo.name}" (Size: ${(dbInfo.sizeOnDisk / 1024).toFixed(2)} KB)`);
      
      const db = conn.useDb(dbInfo.name).db;
      const collections = await db.listCollections().toArray();
      
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`   └── 📄 Collection: "${col.name}" (${count} documents)`);
        
        if (col.name === "users" || col.name === "user") {
          const docs = await db.collection(col.name).find({}).toArray();
          console.log(`       Documents inside "${dbInfo.name}.${col.name}":`, JSON.stringify(docs, null, 2));
        }
      }
    }

    console.log("\n==========================================\n");
    process.exit(0);
  } catch (err) {
    console.error("Inspection error:", err);
    process.exit(1);
  }
};

inspectCluster();
