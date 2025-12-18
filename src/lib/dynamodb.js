import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.COGNITO_REGION || 'us-east-1';
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'UXAttempts';

/**
 * Create a DynamoDB client with AWS credentials
 * @param {Object} credentials - AWS credentials { accessKeyId, secretAccessKey, sessionToken }
 * @returns {DynamoDBDocumentClient}
 */
export function createDynamoDBClient(credentials) {
  const client = new DynamoDBClient({
    region: REGION,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  return DynamoDBDocumentClient.from(client);
}

/**
 * Put an item in DynamoDB
 * @param {Object} credentials - AWS credentials
 * @param {Object} item - Item to put
 * @returns {Promise<Object>}
 */
export async function putItem(credentials, item) {
  const docClient = createDynamoDBClient(credentials);

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  });

  return await docClient.send(command);
}

/**
 * Get an item from DynamoDB
 * @param {Object} credentials - AWS credentials
 * @param {Object} key - Primary key { partitionKey: value, sortKey?: value }
 * @returns {Promise<Object|null>}
 */
export async function getItem(credentials, key) {
  const docClient = createDynamoDBClient(credentials);

  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: key,
  });

  const response = await docClient.send(command);
  return response.Item || null;
}

/**
 * Query items from DynamoDB
 * @param {Object} credentials - AWS credentials
 * @param {string} partitionKey - Partition key name
 * @param {string} partitionValue - Partition key value
 * @param {Object} options - Additional query options { sortKeyName?, sortKeyValue?, limit?, filterExpression? }
 * @returns {Promise<Array>}
 */
export async function queryItems(credentials, partitionKey, partitionValue, options = {}) {
  const docClient = createDynamoDBClient(credentials);

  const queryParams = {
    TableName: TABLE_NAME,
    KeyConditionExpression: `${partitionKey} = :pk`,
    ExpressionAttributeValues: {
      ':pk': partitionValue,
    },
  };

  // Add sort key condition if provided
  if (options.sortKeyName && options.sortKeyValue) {
    queryParams.KeyConditionExpression += ` AND ${options.sortKeyName} = :sk`;
    queryParams.ExpressionAttributeValues[':sk'] = options.sortKeyValue;
  } else if (options.sortKeyName && options.sortKeyCondition) {
    // Support for begins_with, between, etc.
    queryParams.KeyConditionExpression += ` AND ${options.sortKeyCondition}`;
    Object.assign(queryParams.ExpressionAttributeValues, options.sortKeyValues || {});
  }

  // Add filter expression if provided
  if (options.filterExpression) {
    queryParams.FilterExpression = options.filterExpression;
    Object.assign(queryParams.ExpressionAttributeValues, options.filterValues || {});
  }

  // Add limit if provided
  if (options.limit) {
    queryParams.Limit = options.limit;
  }

  const command = new QueryCommand(queryParams);
  const response = await docClient.send(command);
  return response.Items || [];
}

