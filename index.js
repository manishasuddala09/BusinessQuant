const express = require('express');
const mysql = require('mysql');

// Create a MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'sqluser', 
  password: 'password', 
  database: 'mydb'
});

// Connect to MySQL
connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Create Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Start the Express server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Define endpoint to fetch ticker data by ticker symbol
app.get('/api/ticker/:symbol', (req, res) => {
    const symbol = req.params.symbol;
    const query = `SELECT * FROM quantfinaltable WHERE ticker = ?`;
    
    connection.query(query, [symbol], (err, results) => {
      if (err) {
        console.error('Error querying MySQL: ' + err.stack);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.json(results);
    });
  });

// Define endpoint to fetch ticker data by ticker symbol and specific columns
  app.get('/api/ticker/:symbol', (req, res) => {
    const symbol = req.params.symbol;
    let columns = req.query.columns.split(',');
    
    // Ensure ticker column is always included
    if (!columns.includes('ticker')) {
      columns.push('ticker');
    }
  
    // Remove any columns that don't exist in the table
    columns = columns.filter(column => ['ticker','newdate','revenue','gp','fcf','capex'].includes(column));
  
    const placeholders = columns.map(() => '?').join(',');
  
    const query = `SELECT ${columns.join(',')} FROM quantfinaltable WHERE ticker = ?`;
  
    connection.query(query, [symbol], (err, results) => {
      if (err) {
        console.error('Error querying MySQL: ' + err.stack);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.json(results);
    });
  });


// Define endpoint to fetch ticker data by ticker symbol, specific columns, and period
app.get('/api/ticker/:symbol', (req, res) => {
    const symbol = req.params.symbol;
    const columns = req.query.column ? req.query.column.split(',') : [];
    const period = req.query.period;
  
   
    console.log('Columns:', columns);
  
    
    if (!period) {
      res.status(400).send('Missing period parameter');
      return;
    }
  
    if (columns.length === 0) {
      res.status(400).send('Missing column parameter');
      return;
    }
  
    const query = `
    SELECT ${columns.join(',')} 
    FROM quantfinaltable
    WHERE ticker = ? 
    AND STR_TO_DATE(newdate, '%m/%d/%Y') >= DATE_SUB(NOW(), INTERVAL ${parseInt(period)} YEAR)
  `;
 console.log('Generated Query:', query); 

connection.query(query, [symbol], (err, results) => {
    if (err) {
      console.error('Error querying MySQL:', err.message);
      console.error('Query:', query);
      res.status(500).send('Internal Server Error: ' + err.message);
      return;
    }
    res.json(results);
});
})