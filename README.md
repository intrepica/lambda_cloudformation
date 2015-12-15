##AWS Lambda Cloudformation

1. uploads a zip file to s3, 
2. creates or updates a cloud formation template
3. Invokes the template

###Setup

```sh
npm install @literacyplanet/lambda_cloudformation --save
```

#### Usage

```js
var lambdaCloudformation = require('@literacyplanet/lambda_cloudformation');
var uploadParams = {
  stackRegion: 'us-east-1',
  stackName: 'test-stack',
  zipFilePath: path.join(__dirname, 'lambda.zip'),
  lambdaRole: 'arn:aws:iam::xxxxxxxxx:role/lambda_basic_execution',
  lambdaRoleSnsSubscription:
  'arn:aws:iam::xxxxxxxxx:role/lambda_basic_execution',
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
  ]
};

lambdaCloudformation.upload(uploadParams, done);
```

###Run tests

```sh
npm run test
```

###Cloudformation lambda template

```sh
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Resources": {
    "LambdaHandlerLambda": {      
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
          "S3Bucket": "devops.example.com",
          "S3Key": "lambda/handlers/demo_handler.zip"
        },
        "Description": "Demo Lambda Handler",
        "Handler": "index.handler",
        "MemorySize": 128,
        "Role": "arn:aws:iam::xxxxxxxxx:role/lambda_basic_execution",
        "Runtime": "nodejs",
        "Timeout": "3"
      }
    },
    "Subscription0": {
      "Type": "Custom::TopicSubscription",
      "DependsOn": ["FunctionTopicSubscription","LambdaHandlerLambda"],
      "Properties": {
        "ServiceToken": { "Fn::GetAtt": ["FunctionTopicSubscription", "Arn"] },
        "TopicArn": "arn:aws:sns:us-east-1:xxxxxxxxx:topic_a",
        "Endpoint": { "Fn::GetAtt": ["LambdaHandlerLambda", "Arn"] },
        "Protocol": "lambda"
      }
    },
    "Subscription1": {
      "Type": "Custom::TopicSubscription",
      "DependsOn": ["FunctionTopicSubscription","LambdaHandlerLambda"],
      "Properties": {
        "ServiceToken": { "Fn::GetAtt": ["FunctionTopicSubscription", "Arn"] },
        "TopicArn": "arn:aws:sns:us-east-1:xxxxxxxxx:topic_b",
        "Endpoint": { "Fn::GetAtt": ["LambdaHandlerLambda", "Arn"] },
        "Protocol": "lambda"
      }
    },    
    "FunctionTopicSubscription": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Handler": "index.handler",
        "Role": "arn:aws:iam::xxxxxxxxx:role/lambda_basic_execution",
        "Code": {
          "ZipFile":  { "Fn::Join": ["\n", [
            "var response = require('cfn-response');",
            "exports.handler = function(event, context) {",
            "  console.log('REQUEST RECEIVED:\\n', JSON.stringify(event));",
            "  var responseData = {};",
            "  if (event.RequestType == 'Delete') {",
            "    var subscriptionArn = event.PhysicalResourceId;",
            "    var aws = require('aws-sdk');",
            "    var sns = new aws.SNS();",
            "    sns.unsubscribe({SubscriptionArn: subscriptionArn}, function(err, data) {",
            "      if (err) {",
            "          responseData = {Error: 'Failed to unsubscribe from SNS Topic'};",
            "          response.send(event, context, response.FAILED, responseData);",
            "      } else {",
            "          response.send(event, context, response.SUCCESS, data, data.SubscriptionArn);",
            "      }",
            "    });",
            "    return;",
            "  }",
            "  if (event.RequestType == 'Create' || event.RequestType == 'Update') {",
            "    var topicArn = event.ResourceProperties.TopicArn;",
            "    var endpoint = event.ResourceProperties.Endpoint;",
            "    var protocol = event.ResourceProperties.Protocol;",
            "    if (topicArn && endpoint && protocol) {",
            "      var aws = require('aws-sdk');",
            "      var sns = new aws.SNS();",
            "      sns.subscribe({TopicArn: topicArn, Endpoint: endpoint, Protocol: protocol}, function(err, data) {",
            "        if (err) {",
            "          responseData = {Error: 'Failed to subscribe to SNS Topic'};",
            "          console.log(responseData.Error + ':\\n', err);",
            "          response.send(event, context, response.FAILED, responseData);",
            "        } else {",
            "          response.send(event, context, response.SUCCESS, data, data.SubscriptionArn);",
            "        }",
            "      });",
            "    } else {",
            "      responseData = {Error: 'Missing one of required arguments'};",
            "      console.log(responseData.Error);",
            "      response.send(event, context, response.FAILED, responseData);",
            "    }",
            "  }",
            "};"
          ]]}
        },
        "Runtime": "nodejs",
        "Timeout": "30"
      }
    }
  }
}
```