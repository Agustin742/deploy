CREATE TABLE `account` (
	`id` varchar(36) NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp(3),
	`refresh_token_expires_at` timestamp(3),
	`scope` text,
	`password` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL,
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(36) NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(36) NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `career_base` (
	`user_id` varchar(36) NOT NULL,
	`activos` text NOT NULL DEFAULT (''),
	`aspiraciones` text NOT NULL DEFAULT (''),
	`mercado` text NOT NULL DEFAULT (''),
	`sintesis` text NOT NULL DEFAULT (''),
	`objetivo_laboral` text NOT NULL DEFAULT (''),
	CONSTRAINT `career_base_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `personal_brand` (
	`user_id` varchar(36) NOT NULL,
	`promesa` text NOT NULL DEFAULT (''),
	`audiencia` text NOT NULL DEFAULT (''),
	`historia` text NOT NULL DEFAULT (''),
	`titular` text NOT NULL DEFAULT (''),
	CONSTRAINT `personal_brand_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL DEFAULT '',
	`name_auto` boolean NOT NULL DEFAULT true,
	`share_name` boolean NOT NULL DEFAULT false,
	`headline` varchar(255) NOT NULL DEFAULT '',
	`years` varchar(255) NOT NULL DEFAULT '',
	`english` varchar(255) NOT NULL DEFAULT '',
	`extra_skills` text NOT NULL DEFAULT (''),
	`cv` mediumtext NOT NULL DEFAULT (''),
	`goal` int NOT NULL DEFAULT 0,
	`goal_set` boolean NOT NULL DEFAULT false,
	`rev_freq` varchar(64) NOT NULL DEFAULT '',
	CONSTRAINT `profiles_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `drafts` (
	`user_id` varchar(36) NOT NULL,
	`empresa` varchar(255) NOT NULL DEFAULT '',
	`puesto` varchar(255) NOT NULL DEFAULT '',
	`link` text NOT NULL DEFAULT (''),
	`fuente` varchar(255) NOT NULL DEFAULT '',
	`estado` varchar(255) NOT NULL DEFAULT '',
	`jd` mediumtext NOT NULL DEFAULT (''),
	CONSTRAINT `drafts_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `user_modules` (
	`user_id` varchar(36) NOT NULL,
	`valores` boolean NOT NULL DEFAULT false,
	`marca` boolean NOT NULL DEFAULT false,
	`empleadores` boolean NOT NULL DEFAULT false,
	`seguimiento` boolean NOT NULL DEFAULT false,
	`informativas` boolean NOT NULL DEFAULT false,
	`experimentos` boolean NOT NULL DEFAULT false,
	`visibilidad` boolean NOT NULL DEFAULT false,
	`ia` boolean NOT NULL DEFAULT false,
	CONSTRAINT `user_modules_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `application_checklist` (
	`user_id` varchar(36) NOT NULL,
	`application_id` varchar(64) NOT NULL,
	`item_key` varchar(128) NOT NULL,
	`ok` boolean NOT NULL DEFAULT false,
	`txt` text NOT NULL DEFAULT (''),
	CONSTRAINT `application_checklist_user_id_application_id_item_key_pk` PRIMARY KEY(`user_id`,`application_id`,`item_key`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`user_id` varchar(36) NOT NULL,
	`id` varchar(64) NOT NULL,
	`fecha` varchar(32) NOT NULL DEFAULT '',
	`empresa` varchar(255) NOT NULL DEFAULT '',
	`puesto` varchar(255) NOT NULL DEFAULT '',
	`link` text NOT NULL DEFAULT (''),
	`fuente` varchar(255) NOT NULL DEFAULT '',
	`estado` varchar(255) NOT NULL DEFAULT '',
	`respuesta` varchar(255) NOT NULL DEFAULT '',
	`reclutador` varchar(255) NOT NULL DEFAULT '',
	`contacto` varchar(255) NOT NULL DEFAULT '',
	`proximos` text NOT NULL DEFAULT (''),
	`comentarios` text NOT NULL DEFAULT (''),
	`jd` mediumtext NOT NULL DEFAULT (''),
	`match` json,
	`report` mediumtext NOT NULL DEFAULT (''),
	`revisado` boolean NOT NULL DEFAULT false,
	`hallazgos` text NOT NULL DEFAULT (''),
	`ficha_industria` varchar(255) NOT NULL DEFAULT '',
	`ficha_tamano` varchar(255) NOT NULL DEFAULT '',
	`ficha_modalidad` varchar(255) NOT NULL DEFAULT '',
	`ficha_valores` text NOT NULL DEFAULT (''),
	`ficha_cultura` text NOT NULL DEFAULT (''),
	`ficha_notas` text NOT NULL DEFAULT (''),
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `applications_user_id_id_pk` PRIMARY KEY(`user_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `interviews` (
	`user_id` varchar(36) NOT NULL,
	`application_id` varchar(64) NOT NULL,
	`id` varchar(64) NOT NULL,
	`fecha` varchar(32) NOT NULL DEFAULT '',
	`etapa` varchar(255) NOT NULL DEFAULT '',
	`preguntas` text NOT NULL DEFAULT (''),
	`respondi` text NOT NULL DEFAULT (''),
	`prep` text NOT NULL DEFAULT (''),
	`feedback` text NOT NULL DEFAULT (''),
	`aprendi` text NOT NULL DEFAULT (''),
	`proximo` text NOT NULL DEFAULT (''),
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `interviews_user_id_application_id_id_pk` PRIMARY KEY(`user_id`,`application_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `platforms` (
	`user_id` varchar(36) NOT NULL,
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL DEFAULT '',
	`url` text NOT NULL DEFAULT (''),
	`custom` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `platforms_user_id_id_pk` PRIMARY KEY(`user_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `search_checks` (
	`user_id` varchar(36) NOT NULL,
	`month` varchar(7) NOT NULL,
	`platform_id` varchar(64) NOT NULL,
	`day` tinyint NOT NULL,
	CONSTRAINT `search_checks_user_id_month_platform_id_day_pk` PRIMARY KEY(`user_id`,`month`,`platform_id`,`day`)
);
--> statement-breakpoint
CREATE TABLE `objectives` (
	`user_id` varchar(36) NOT NULL,
	`id` varchar(64) NOT NULL,
	`periodo` varchar(255) NOT NULL DEFAULT '',
	`semana` varchar(32) NOT NULL DEFAULT '',
	`mes` varchar(32) NOT NULL DEFAULT '',
	`variable` varchar(255) NOT NULL DEFAULT '',
	`objetivo` text NOT NULL DEFAULT (''),
	`valor` text NOT NULL DEFAULT (''),
	`adapt` text NOT NULL DEFAULT (''),
	`recursos` text NOT NULL DEFAULT (''),
	`plazo` varchar(32) NOT NULL DEFAULT '',
	`prioridad` varchar(255) NOT NULL DEFAULT '',
	`indicador` varchar(255) NOT NULL DEFAULT '',
	`tipo_ind` varchar(255) NOT NULL DEFAULT '',
	`meta` varchar(255) NOT NULL DEFAULT '',
	`estado` varchar(255) NOT NULL DEFAULT '',
	`done_at` varchar(32) NOT NULL DEFAULT '',
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `objectives_user_id_id_pk` PRIMARY KEY(`user_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `plan_targets` (
	`user_id` varchar(36) NOT NULL,
	`target_key` varchar(128) NOT NULL,
	`value` text NOT NULL DEFAULT (''),
	CONSTRAINT `plan_targets_user_id_target_key_pk` PRIMARY KEY(`user_id`,`target_key`)
);
--> statement-breakpoint
CREATE TABLE `plan_week_vars` (
	`user_id` varchar(36) NOT NULL,
	`week` varchar(10) NOT NULL,
	`var_id` varchar(128) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `plan_week_vars_user_id_week_var_id_pk` PRIMARY KEY(`user_id`,`week`,`var_id`)
);
--> statement-breakpoint
CREATE TABLE `employers` (
	`user_id` varchar(36) NOT NULL,
	`id` varchar(64) NOT NULL,
	`empresa` varchar(255) NOT NULL DEFAULT '',
	`quien` varchar(255) NOT NULL DEFAULT '',
	`motivacion` text NOT NULL DEFAULT (''),
	`posting` text NOT NULL DEFAULT (''),
	`prioridad` varchar(255) NOT NULL DEFAULT '',
	`notas` text NOT NULL DEFAULT (''),
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `employers_user_id_id_pk` PRIMARY KEY(`user_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `experiments` (
	`user_id` varchar(36) NOT NULL,
	`id` varchar(64) NOT NULL,
	`rol` varchar(255) NOT NULL DEFAULT '',
	`pregunta` text NOT NULL DEFAULT (''),
	`accion` text NOT NULL DEFAULT (''),
	`inicio` varchar(32) NOT NULL DEFAULT '',
	`fin` varchar(32) NOT NULL DEFAULT '',
	`aprendi` text NOT NULL DEFAULT (''),
	`decision` varchar(255) NOT NULL DEFAULT '',
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `experiments_user_id_id_pk` PRIMARY KEY(`user_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`user_id` varchar(36) NOT NULL,
	`id` varchar(64) NOT NULL,
	`fecha` varchar(32) NOT NULL DEFAULT '',
	`fortaleza` varchar(255) NOT NULL DEFAULT '',
	`conexiones` varchar(255) NOT NULL DEFAULT '',
	`seguidores` varchar(255) NOT NULL DEFAULT '',
	`vistas` varchar(255) NOT NULL DEFAULT '',
	`interaccion` varchar(255) NOT NULL DEFAULT '',
	`articulos` varchar(255) NOT NULL DEFAULT '',
	`ssi` varchar(255) NOT NULL DEFAULT '',
	`notas` text NOT NULL DEFAULT (''),
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `metrics_user_id_id_pk` PRIMARY KEY(`user_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `network_records` (
	`user_id` varchar(36) NOT NULL,
	`id` varchar(64) NOT NULL,
	`fecha` varchar(32) NOT NULL DEFAULT '',
	`conexiones` varchar(255) NOT NULL DEFAULT '',
	`paginas` varchar(255) NOT NULL DEFAULT '',
	`nota` text NOT NULL DEFAULT (''),
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `network_records_user_id_id_pk` PRIMARY KEY(`user_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`user_id` varchar(36) NOT NULL,
	`id` varchar(64) NOT NULL,
	`fecha` varchar(32) NOT NULL DEFAULT '',
	`tipo` varchar(255) NOT NULL DEFAULT '',
	`tema` text NOT NULL DEFAULT (''),
	`url` text NOT NULL DEFAULT (''),
	`interacciones` varchar(255) NOT NULL DEFAULT '',
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `posts_user_id_id_pk` PRIMARY KEY(`user_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `rest_days` (
	`user_id` varchar(36) NOT NULL,
	`id` varchar(64) NOT NULL,
	`fecha` varchar(32) NOT NULL DEFAULT '',
	`nota` text NOT NULL DEFAULT (''),
	`cumplido` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `rest_days_user_id_id_pk` PRIMARY KEY(`user_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`user_id` varchar(36) NOT NULL,
	`id` varchar(64) NOT NULL,
	`fecha` varchar(32) NOT NULL DEFAULT '',
	`desde` varchar(32) NOT NULL DEFAULT '',
	`hasta` varchar(32) NOT NULL DEFAULT '',
	`avanzo` text NOT NULL DEFAULT (''),
	`hice` text NOT NULL DEFAULT (''),
	`aprendi` text NOT NULL DEFAULT (''),
	`ajuste` text NOT NULL DEFAULT (''),
	`no` text NOT NULL DEFAULT (''),
	`aplicado` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `reviews_user_id_id_pk` PRIMARY KEY(`user_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `time_logs` (
	`user_id` varchar(36) NOT NULL,
	`id` varchar(64) NOT NULL,
	`fecha` varchar(32) NOT NULL DEFAULT '',
	`actividad` varchar(255) NOT NULL DEFAULT '',
	`est` varchar(255) NOT NULL DEFAULT '',
	`real` varchar(255) NOT NULL DEFAULT '',
	`nota` text NOT NULL DEFAULT (''),
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `time_logs_user_id_id_pk` PRIMARY KEY(`user_id`,`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `career_base` ADD CONSTRAINT `career_base_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `personal_brand` ADD CONSTRAINT `personal_brand_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drafts` ADD CONSTRAINT `drafts_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_modules` ADD CONSTRAINT `user_modules_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_checklist` ADD CONSTRAINT `application_checklist_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_checklist` ADD CONSTRAINT `application_checklist_application_fk` FOREIGN KEY (`user_id`,`application_id`) REFERENCES `applications`(`user_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_application_fk` FOREIGN KEY (`user_id`,`application_id`) REFERENCES `applications`(`user_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platforms` ADD CONSTRAINT `platforms_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `search_checks` ADD CONSTRAINT `search_checks_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `search_checks` ADD CONSTRAINT `search_checks_platform_fk` FOREIGN KEY (`user_id`,`platform_id`) REFERENCES `platforms`(`user_id`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `objectives` ADD CONSTRAINT `objectives_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_targets` ADD CONSTRAINT `plan_targets_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_week_vars` ADD CONSTRAINT `plan_week_vars_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employers` ADD CONSTRAINT `employers_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experiments` ADD CONSTRAINT `experiments_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `metrics` ADD CONSTRAINT `metrics_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `network_records` ADD CONSTRAINT `network_records_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rest_days` ADD CONSTRAINT `rest_days_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `time_logs` ADD CONSTRAINT `time_logs_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `metrics_date_idx` ON `metrics` (`user_id`,`fecha`);--> statement-breakpoint
CREATE INDEX `network_records_date_idx` ON `network_records` (`user_id`,`fecha`);--> statement-breakpoint
CREATE INDEX `posts_date_idx` ON `posts` (`user_id`,`fecha`);--> statement-breakpoint
CREATE INDEX `rest_days_date_idx` ON `rest_days` (`user_id`,`fecha`);--> statement-breakpoint
CREATE INDEX `reviews_date_idx` ON `reviews` (`user_id`,`fecha`);--> statement-breakpoint
CREATE INDEX `time_logs_date_idx` ON `time_logs` (`user_id`,`fecha`);