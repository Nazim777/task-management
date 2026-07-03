# Zip the Lambda function
data "archive_file" "duckdns" {
  type        = "zip"
  source_file = "${path.module}/../lambda/duckdns_updater.py"
  output_path = "${path.module}/../lambda/duckdns_updater.zip"
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "${var.project}-lambda-duckdns"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Function
resource "aws_lambda_function" "duckdns" {
  filename         = data.archive_file.duckdns.output_path
  function_name    = "${var.project}-duckdns-updater"
  role             = aws_iam_role.lambda.arn
  handler          = "duckdns_updater.handler"
  runtime          = "python3.12"
  source_code_hash = data.archive_file.duckdns.output_base64sha256
  timeout          = 10

  environment {
    variables = {
      DUCKDNS_TOKEN  = var.duckdns_token
      DUCKDNS_DOMAIN = var.duckdns_domain
      ALB_DNS        = aws_lb.main.dns_name
    }
  }
}

# EventBridge — run every 5 minutes
resource "aws_cloudwatch_event_rule" "duckdns" {
  name                = "${var.project}-duckdns-updater"
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "duckdns" {
  rule      = aws_cloudwatch_event_rule.duckdns.name
  target_id = "duckdns-lambda"
  arn       = aws_lambda_function.duckdns.arn
}

resource "aws_lambda_permission" "duckdns" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.duckdns.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.duckdns.arn
}
