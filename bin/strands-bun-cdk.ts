#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { StrandsBunCdkStack } from '../lib/strands-bun-cdk-stack';

const app = new cdk.App();
new StrandsBunCdkStack(app, 'StrandsBunCdkStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
});
