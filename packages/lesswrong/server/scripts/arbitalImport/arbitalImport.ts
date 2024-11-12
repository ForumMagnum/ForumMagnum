import mysql from 'mysql2/promise';
import { Globals } from "@/lib/vulcan-lib/config";

// Create the connection to database
Globals.importArbitalDb = async (mysqlConnectionString: string) => {
  let connection: mysql.Connection | null = null;

  try {
    // Create a connection
    connection = await mysql.createConnection(mysqlConnectionString);
  
    // Get list of tables
    const [tables] = await connection.query('SHOW TABLES');
  
    // Iterate through each table
    for (const table of tables as any[]) {
      const tableName = Object.values(table)[0] as string;
  
      // Get row count for the current table
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = (rows as any[])[0].count;
  
      console.log(`Table: ${tableName}, Row Count: ${rowCount}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    if (connection) {
      await connection.end();
    }
  }
}


/*
*/
