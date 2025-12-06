import * as cdk from "aws-cdk-lib";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";
import * as agentcore from "@aws-cdk/aws-bedrock-agentcore-alpha";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";

export class StrandsBunCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const agentRuntimeArtifact = agentcore.AgentRuntimeArtifact.fromAsset(
      path.join(__dirname, "../agent")
    );

    const runtime = new agentcore.Runtime(this, "StrandsAgentsRuntime", {
      runtimeName: "StrandsAgentsTS",
      agentRuntimeArtifact: agentRuntimeArtifact,
      description: "Strands Agents for TypeScript",
    });

    runtime.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
        resources: [
          "arn:aws:bedrock:*::foundation-model/*",
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
        ],
      })
    );

    // =====================
    // Lambda 関数（AgentCore Proxy）
    // =====================

    // Lambda 関数用のロググループ
    const lambdaLogGroup = new logs.LogGroup(this, "LambdaLogGroup", {
      logGroupName: "/aws/lambda/agentcore-proxy",
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda関数の作成
    const proxyFunction = new nodejs.NodejsFunction(
      this,
      "AgentCoreProxyFunction",
      {
        functionName: "agentcore-proxy",
        entry: path.join(__dirname, "../lambda/agentcore-proxy/index.ts"),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_24_X,
        timeout: cdk.Duration.minutes(15),
        memorySize: 512,
        environment: {
          AGENT_ARN: runtime.agentRuntimeArn,
        },
        logGroup: lambdaLogGroup,
      }
    );

    // // AgentCore Runtime呼び出し権限を付与
    proxyFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["bedrock-agentcore:InvokeAgentRuntime"],
        resources: [
          runtime.agentRuntimeArn,
          `${runtime.agentRuntimeArn}/runtime-endpoint/*`,
        ],
      })
    );

    // =====================
    // Outputs
    // =====================

    new cdk.CfnOutput(this, "RuntimeName", {
      value: "StrandsAgentsTS",
      description: "Name of the AgentCore Runtime",
    });

    new cdk.CfnOutput(this, "RuntimeArn", {
      value: runtime.agentRuntimeArn,
      description: "ARN of the AgentCore Runtime",
      exportName: "AgentRuntimeArn",
    });

    new cdk.CfnOutput(this, "RuntimeId", {
      value: runtime.agentRuntimeId,
      description: "ID of the AgentCore Runtime",
      exportName: "AgentRuntimeId",
    });

    new cdk.CfnOutput(this, "ProxyFunctionName", {
      value: proxyFunction.functionName,
      description: "AgentCore Proxy Lambda Function Name",
    });

    new cdk.CfnOutput(this, "ProxyFunctionArn", {
      value: proxyFunction.functionArn,
      description: "AgentCore Proxy Lambda Function ARN",
    });
  }
}
