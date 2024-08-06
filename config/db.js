const mysql = require('mysql2/promise');

class ConnectDatabase {
  constructor() {
    this.connection = null;
    this.mysql = mysql;
  }

  async connectMySQL() {
    try {
      this.connection = await this.mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        port: '3306'
      });
      console.log("Conexión creada a MySQL correctamente");
    } catch (error) {
      console.error("Error al crear la conexión: " + error);
      throw error;
    }
  }

  async closeConnection() {
    if (this.connection !== null) {
      try {
        await this.connection.end();
        console.log("Conexión cerrada de MySQL");
      } catch (error) {
        console.error("Error al cerrar la conexión: " + error);
        throw error;
      }
    } else {
      console.error("No existe una conexión");
    }
  }

  async query(sql, values) {
    try {
      const [rows, fields] = await this.connection.execute(sql, values);
      return rows;
    } catch (error) {
      console.error("Error al ejecutar la consulta: " + error);
      throw error;
    }
  }
}

module.exports = ConnectDatabase;
