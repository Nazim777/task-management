# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-rds"
  subnet_ids = aws_subnet.private[*].id
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier        = "${var.project}-postgres"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp2"

  db_name  = var.db_name
  username = var.db_user
  password = var.db_pass

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 0
  skip_final_snapshot     = true
  deletion_protection     = false

  # Free tier eligible
  publicly_accessible = false
}
