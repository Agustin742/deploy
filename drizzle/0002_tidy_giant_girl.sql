CREATE TABLE `allowed_emails` (
	`email` varchar(255) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`added_by` varchar(255),
	CONSTRAINT `allowed_emails_email` PRIMARY KEY(`email`)
);
