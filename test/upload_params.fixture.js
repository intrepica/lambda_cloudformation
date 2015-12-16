module.exports = {
  stackRegion: 'us-east-1',
  stackName: 'demoStack',
  lambdaRole: 'lambda_basic_execution',
  lambdaRoleSnsSubscription:
  'lambda_topic_subscription',
  lambdaRoleDynamoSubscription:
  'lambda_event_source_subscription',
  lambdaRuntime: 'nodejs',
  lambdaMemorySize: 128,
  lambdaHandler: 'index.handler',
  lambdaDescription: 'Demo Lambda Handler',
  lambdaS3Bucket: 'devops.example.com',
  lambdaS3Key: 'lambda/handlers/demo_handler.zip',
  lambdaTimeout: '3',
  subscriptions: [
    {arn: 'arn:aws:sns:us-east-1:xxxxxxxxx:topic_a'},
    {arn: 'arn:aws:sns:us-east-1:xxxxxxxxx:topic_b'}
  ],
  eventSources: [
    {
      arn: 'arn:aws:dynamodb:us-east-1:xxxxxxxxx:table/my_dynamo/stream/2015-12-03T01:01:02.357',
      startingPosition: 'TRIM_HORIZON',
      enabled: true,
      batchSize: 1
    }
  ]
};
