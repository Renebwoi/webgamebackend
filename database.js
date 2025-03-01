import sql from 'mssql';

let database = null;

export default class Database {
  config = {};
  poolconnection = null;
  connected = false;

  constructor(config) {
    this.config = config;
  }

  async connect() {
    try {
      this.poolconnection = await sql.connect(this.config);
      this.connected = true;
      console.log('Database connected successfully.');
      return this.poolconnection;
    } catch (error) {
      console.error('Error connecting to the database:', error);
      this.connected = false;
    }
  }

  async disconnect() {
    try {
      if (this.connected) {
        await this.poolconnection.close();
        this.connected = false;
        console.log('Database disconnected successfully.');
      }
    } catch (error) {
      console.error('Error disconnecting from the database:', error);
    }
  }

  async executeQuery(query) {
    const request = this.poolconnection.request();
    const result = await request.query(query);

    return result.rowsAffected[0];
  }

  async create(data) {
    const request = this.poolconnection.request();

    request.input('userName', sql.NVarChar(255), data.userName);

    // Insert the new record and get the ID of the inserted row
    const result = await request.query(
      `INSERT INTO Person (userName) VALUES (@userName);
       SELECT SCOPE_IDENTITY() AS id;`
    );

    const newPersonId = result.recordset[0].id;

    // Retrieve the details of the newly inserted person
    const personResult = await this.poolconnection.request()
      .input('id', sql.Int, newPersonId)
      .query(`SELECT * FROM Person WHERE id = @id`);

    return personResult.recordset[0];
  }

  async readAll() {
    const request = this.poolconnection.request();
    const result = await request.query(`SELECT * FROM Person`);

    return result.recordsets[0];
  }

  async read(id) {
    const request = this.poolconnection.request();
    const result = await request
      .input('id', sql.Int, +id)
      .query(`SELECT * FROM Person WHERE id = @id`);

    return result.recordset[0];
  }

  async update(id, data) {
    const request = this.poolconnection.request();

    request.input('id', sql.Int, +id);
    request.input('userName', sql.NVarChar(255), data.userName);

    const result = await request.query(
      `UPDATE Person SET userName=@userName WHERE id = @id`
    );

    return result.rowsAffected[0];
  }

  async delete(id) {
    const idAsNumber = Number(id);

    const request = this.poolconnection.request();
    const result = await request
      .input('id', sql.Int, idAsNumber)
      .query(`DELETE FROM Person WHERE id = @id`);

    return result.rowsAffected[0];
  }

  async createTable() {
    if (process.env.NODE_ENV === 'development') {
      this.executeQuery(
        `IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Person')
         BEGIN
           CREATE TABLE Person (
             id int NOT NULL IDENTITY, 
             userName varchar(255) NOT NULL
           );
         END`
      )
        .then(() => {
          console.log('Person Table created');
        })
        .catch((err) => {
          // Table may already exist
          console.error(`Error creating Person table: ${err}`);
        });
    }
  }

  async createWinsTable() {
    if (process.env.NODE_ENV === 'development') {
      this.executeQuery(
        `IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Wins')
         BEGIN
        CREATE TABLE Wins (
          id INT PRIMARY KEY IDENTITY,
          personId INT NOT NULL,
          winTime BIGINT NOT NULL
           );
         END`
      )
        .then(() => {
          console.log('Wins Table created');
        })
        .catch((err) => {
          // Table may already exist
          console.error(`Error creating Wins table: ${err}`);
        });
    }
  }

  async createWin(win) {
    const request = this.poolconnection.request();

    console.log("personId", win.personId);
    request.input('personId', sql.Int, win.personId);
    request.input('winTime', sql.BigInt, win.winTime); // Ensure winTime is a UTC timestamp
    console.log('input', request.parameters);

    const result = await request.query(
      `INSERT INTO Wins (personId, winTime) VALUES (@personId, @winTime)`
    );

    return result.rowsAffected[0];
  }

  async readAllWins() {
    const query = `SELECT * FROM Wins`;
    const result = await this.poolconnection.request().query(query);
    return result.recordset;
  }

  async readWin(id) {
    const query = `SELECT * FROM Wins WHERE id = @id`;
    const request = this.poolconnection.request();
    request.input('id', id);
    const result = await request.query(query);
    return result.recordset[0];
  }

  async readWinsByPersonId(personId) {
    const query = `SELECT * FROM Wins WHERE personId = @personId`;
    const request = this.poolconnection.request();
    request.input('personId', sql.Int, personId);
    const result = await request.query(query);
    return result.recordset;
  }

  async updateWin(id, win) {
    const query = `UPDATE Wins SET personId = @personId, winTime = @winTime WHERE id = @id`;
    const request = this.poolconnection.request();
    request.input('id', id);
    request.input('personId', win.personId);
    request.input('winTime', sql.BigInt, win.winTime); // Ensure winTime is a UTC timestamp
    const result = await request.query(query);
    return result.rowsAffected;
  }

  async deleteWin(id) {
    const query = `DELETE FROM Wins WHERE id = @id`;
    const request = this.poolconnection.request();
    request.input('id', id);
    const result = await request.query(query);
    return result.rowsAffected;
  }
}

export const createDatabaseConnection = async (passwordConfig) => {
  database = new Database(passwordConfig);
  await database.connect();
  await database.createTable();
  await database.createWinsTable();
  return database;
};