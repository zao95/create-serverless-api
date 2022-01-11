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

![Install example image](http://create-serverless-api.s3-website.ap-northeast-2.amazonaws.com/cli_initialize.png)

And Check the api endpoint output to the terminal.

You will have a fully operational api service.

For detail, please refer to the explanation below.

## ✨Feature

It is a feature that beginners can easily see.

Please look at "[Detail Feature](#detail-feature)" below to see the details.

-

### Detail Feature

The contents below roughly say that this library is very cool.

-   Creating an api document creates an aws infrastructure with a serverless structure.
-   Optimization due to install necessary libraries by API.
-   Enable import Syntax and typescript using the Babel.
-   Sets up local environment similar to the aws lambda.
-   IaC
-   FaaS

## Basic Environment

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

4.  nodeJS modules install

    ```
    npm i
    ```

5.  Bootstrap for aws deployment.

    ```
    // Development
    npm run bootstrap

    // Production
    npm run bootstrap-prod
    ```

6.  Deploy to aws

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

## 👏 Contributing

Pull requests and 🌟 stars are always welcome.

For major changes, please [open an issue](https://github.com/zao95/create-serverless-api/issues/new) first to discuss what you would like to change.

## 📩 Contact

awmaker@kakao.com

## Others

👍 We recommend third-party services that suit the characteristics of serverless services.

-   We recommand [Dash Bird](https://app.dashbird.io/) service for watch lambda infomations.
-   We recommand [Planet Scale](https://planetscale.com/) service for database server.
