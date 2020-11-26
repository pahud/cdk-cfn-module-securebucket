import { App, Construct, Stack, StackProps, CfnResource, ResourceProps, Resource, CfnOutput, Fn } from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';

export interface SecureBucketProps extends ResourceProps {
  readonly kmsKeyAlias?: string;
  readonly readWriteRole: iam.IRole;
  readonly readonlyArn?: string;
}

export class SecureBucket extends Resource {
  readonly attBucketName: string;
  readonly attBucketArn: string;
  constructor(scope: Construct, id: string, props: SecureBucketProps) {
    super(scope, id)
    const resource = new CfnResource(this, 'SecureBucket', {
      type: 'Pahud::S3::Bucket::MODULE',
      properties: {
        KMSKeyAlias: props.kmsKeyAlias ?? Stack.of(this).stackName,
        ReadWriteArn: props.readWriteRole.roleArn,
        ReadOnlyArn: props.readonlyArn ?? `arn:aws:iam::${Stack.of(this).account}:root`
      }
    })
    this.attBucketName = Fn.ref(`${resource.logicalId}Bucket`).toString()
    this.attBucketArn = Fn.getAtt(`${resource.logicalId}Bucket`, 'Arn').toString()
  }
}

export class Demo extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    const host = new ec2.BastionHostLinux(this, 'Bastion', {
      vpc: ec2.Vpc.fromLookup(this, 'Vpc', { isDefault: true })
    })

    const bucket = new SecureBucket(this, 'MySecureBucket', {
      readWriteRole: host.role, 
    })
    new CfnOutput(this, 'BucketName', { value: bucket.attBucketName })
    new CfnOutput(this, 'BucketArn', { value: bucket.attBucketArn })
  }
}



export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    new Demo(this, 'Demo')
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'my-stack-dev3', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();
