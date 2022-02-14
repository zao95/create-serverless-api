# Create Serverless API

Create Serverless APIs with no infra configuration.

It is an aws serverless-based backend api template created for beginners.

You can service api without knowing the cloud infrastructure.

And Create Serverless API works on macOS, Windows, and Linux.

Create Serverless API was inspired by the [create-react-app](https://github.com/facebook/create-react-app).

## 🚀Quick Overview

📌 Before we proceed with the work below, you must set [aws credential](#detail-usage)

    ```
    npx create-serverless-api my-api
    cd my-api
    npm bootstrap
    npm deploy
    ```

And Check the api endpoint output to the terminal.

You will have a fully operational api service.

For detail, please refer to the explanation below.

## ✨Feature

-   Automatic aws infrastructure completion through documents in the OpenAPI specification.
-   Install only essential packages for each API.

### Detail Feature

👍 The detail feature roughly say that this package is very cool.

-   Infrastructure distribution through IaC makes it easy to modify.
-   Using FaaS, monitoring is easy and stability can be obtained by horizontal expansion.
-   Supports monitoring and logging with aws X-ray and aws CloudWatch.
-   Babel settings are set for using typescript.
-   Can execute local test similar to the aws lambda.

## Environment in Lambda Container

✅ You can customize this.

-   Node 14.x

## Detail Usage

-   ⚠ Caution
    Following this usage, your api will be serviced as a cloud service.
    You spend money according to the amount of api calls.
    **so make sure to check out [AWS Pricing Policy](https://aws.amazon.com/pricing)**.

1.  Login to [aws console](https://signin.aws.amazon.com/console)

2.  Make iam user through [aws IAM users](https://console.aws.amazon.com/iamv2/home#/users).

    -   Need **Access key** credential type.
    -   Recommend **AdministratorAccess** policy through the attachment policies directy button for easy work.
    -   Save the access key ID and secret access key that came out like that.

3.  Configurate your aws credentials file

    ✅ **Windows** default path: C/Users/{userName}/.aws/credentials

    ✅ **Linux** or **macOS** default path: ~/.aws/credentials

    ```text
    [development]
    aws_access_key_id={your_aws_access_key_id}
    aws_secret_access_key={your_aws_secret_access_key}

    [production]
    aws_access_key_id={your_aws_access_key_id}
    aws_secret_access_key={your_aws_secret_access_key}
    ```

    📌 If you want to change the name, please change it with the script of package.json

4.  Creating an API

    ```
    npx create-serverless-api my-api
    ```

<p align='center'>
<img src='http://create-serverless-api.s3-website.ap-northeast-2.amazonaws.com/creating_an_api.gif' width='600' alt='npx create-serverless-api my-api'>
</p>

5.  Go the project directory.

    ```
    cd my-api
    ```

<p align='center'>
<img src='http://create-serverless-api.s3-website.ap-northeast-2.amazonaws.com/go_the_project_directory.gif' width='600' alt='npx create-serverless-api my-api'>
</p>

6.  Bootstrap for aws deployment.

    ```
    // Development
    npm run bootstrap

    // Production
    npm run bootstrap-prod
    ```

7.  Deploy to aws

    ✅ The api is served on the address output to the terminal, **so make sure to save it**.

    ```
    // Development
    npm run deploy

    // Production
    npm run deploy-prod
    ```

-   Local execute

    ```
    npm run offline
    ```

-   Destroy the api

    ```
    // Development
    npm run destroy

    // Production
    npm run destroy-prod
    ```

-   src directory tree description

    ```
    /your-project
    └─src
      ├─api - Directory where the entry point of your API is saved. The position should be placed in the x-cdk-lambda-handler of swagger.yaml.
      │ └─...
      └─modules - A directory that puts the code that we use in common.
        ├─...
    ```

## 👏 Contributing

Pull requests and 🌟 stars are always welcome.

For major changes, please [open an issue](https://github.com/zao95/create-serverless-api/issues/new) first to discuss what you would like to change.

## 📩 Contact

awmaker@kakao.com

## Others

👍 We recommend third-party services that suit the characteristics of serverless services.

-   We recommand [Dash Bird](https://app.dashbird.io/) service for watch lambda infomations.
-   We recommand [Planet Scale](https://planetscale.com/) service for database server.
