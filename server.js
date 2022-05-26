const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const cors = require("cors");
const DiscoveryV1 = require('ibm-watson/discovery/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const discovery = new DiscoveryV1({
  version: '3019-04-30',
  authenticator: new IamAuthenticator({
    apikey: 'kwkguJ9mHc2AUfYuP1hZ_FANBh0I4fgWQ9tt9LxpEXpB',
  }),
  serviceUrl: 'https://api.eu-gb.discovery.watson.cloud.ibm.com/instances/fa3b274f-ec83-4a61-84fd-6959e49d5bda',
});

dotenv.config();

const server = express();

server.use(cors());
server.use(express.static("./src"));
server.use(express.json());

// To help process requests easier
const bodyParser = require("body-parser");
server.use(bodyParser.urlencoded({ extended: false }));

const port = process.env.PORT || 4000;

const connection = mysql.createConnection({
  host: process.env.HOST,
  database: process.env.DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.PASSWORD,
});

server.listen(port, () => {
  console.log('Listening to port', port);
});


// API to Receive Queries /
server.post('/submit_query', (req, res) => {
  const { pack } = req.body;
  
  const queryParams = {
    environmentId: 'dfc85c58-5f1f-4b7c-b4f4-f5ecdc9ce629',
    collectionId: '63ed94bb-bc7d-487b-a3e3-13981a6d19b6',
    query: pack,
  };

  discovery.query(queryParams)
    .then(queryResponse => {
      console.log(JSON.stringify(queryResponse, null, 2));
      res.send(JSON.stringify(queryResponse, null, 2));
    })
    .catch(err => {
      console.log('error:', err);
    });
});

// API to Create Quote
server.post("/create_quote", (req, res) => {
  const { first_name, last_name, email, phone_number, address,
          quote_number, already_customer, policy_start_date } = req.body;

  console.log(first_name, last_name, email, phone_number, address, already_customer, policy_start_date );

  connection.query(
    `INSERT INTO missio20_team4.Quote (QuoteNumber, PolicyStartDate, AlreadyCustomer) VALUES (?, ?, ?);`,
    [quote_number, policy_start_date, already_customer],
    (error, result) => { 
      if (error) {
        console.log("Failed to create quote:" + error);
        res.sendStatus(500);
        return;
      } 
      else {
        console.log(result);
      }
    }
  );

    connection.query(
    `INSERT INTO missio20_team4.Customers (EmailAddress, FirstName, LastName, Address, QuoteNumber, PhoneNumber) VALUES (?, ?, ?, ?, ?, ?);`,
    [email, first_name, last_name, address, quote_number, phone_number],
    (error, result) => { 
      if (error) {
        console.log("Failed to create new quote:" + error);
        res.sendStatus(500);
        return;
      } 
      else {
        console.log(result);
        res.send("Quote created successfully");
      }
    }
  );
});