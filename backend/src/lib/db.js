const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const config = require('./config');

const cliente = new DynamoDBClient({ region: config.region });

const db = DynamoDBDocumentClient.from(cliente, {
  marshallOptions: { removeUndefinedValues: true },
});

module.exports = db;
