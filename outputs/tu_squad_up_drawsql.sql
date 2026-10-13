-- TU Squad Up database schema
-- Target: MySQL 8.0+
-- Import this file into DrawSQL as MySQL DDL.

CREATE TABLE members (
    member_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    sso_subject VARCHAR(191) NOT NULL,
    university_email VARCHAR(255) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    member_type ENUM('STUDENT', 'PROFESSOR', 'STAFF', 'EMPLOYEE') NOT NULL,
    account_status ENUM('ACTIVE', 'SUSPENDED', 'DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
    is_administrator BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (member_id),
    UNIQUE KEY uq_members_sso_subject (sso_subject),
    UNIQUE KEY uq_members_university_email (university_email)
);

CREATE TABLE payment_accounts (
    payment_account_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    member_id BIGINT UNSIGNED NOT NULL,
    promptpay_identifier VARCHAR(64) NOT NULL,
    account_name VARCHAR(150) NOT NULL,
    qr_image_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_account_id),
    KEY idx_payment_accounts_member (member_id),
    CONSTRAINT fk_payment_accounts_member
        FOREIGN KEY (member_id) REFERENCES members(member_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE activity_categories (
    category_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_name VARCHAR(80) NOT NULL,
    description VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (category_id),
    UNIQUE KEY uq_activity_categories_name (category_name)
);

CREATE TABLE activities (
    activity_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    host_member_id BIGINT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    payment_account_id BIGINT UNSIGNED NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    minimum_participants INT UNSIGNED NOT NULL DEFAULT 1,
    maximum_participants INT UNSIGNED NOT NULL,
    join_mode ENUM('INSTANT', 'APPROVAL', 'INVITATION') NOT NULL DEFAULT 'APPROVAL',
    registration_deadline DATETIME NULL,
    cost_lock_at DATETIME NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    status ENUM(
        'DRAFT', 'OPEN', 'FULL', 'CLOSED', 'WAITING_HOST_DECISION',
        'ONGOING', 'COMPLETED', 'CANCELLED', 'EXPIRED'
    ) NOT NULL DEFAULT 'DRAFT',
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    minimum_reached_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (activity_id),
    KEY idx_activities_host (host_member_id),
    KEY idx_activities_category (category_id),
    KEY idx_activities_payment_account (payment_account_id),
    KEY idx_activities_discovery (status, start_at, category_id),
    CONSTRAINT fk_activities_host
        FOREIGN KEY (host_member_id) REFERENCES members(member_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_activities_category
        FOREIGN KEY (category_id) REFERENCES activity_categories(category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_activities_payment_account
        FOREIGN KEY (payment_account_id) REFERENCES payment_accounts(payment_account_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_activities_capacity
        CHECK (minimum_participants >= 1 AND maximum_participants >= minimum_participants),
    CONSTRAINT chk_activities_schedule
        CHECK (end_at > start_at),
    CONSTRAINT chk_activities_registration_deadline
        CHECK (registration_deadline IS NULL OR registration_deadline <= start_at),
    CONSTRAINT chk_activities_paid_configuration
        CHECK (is_paid = FALSE OR (cost_lock_at IS NOT NULL AND payment_account_id IS NOT NULL)),
    CONSTRAINT chk_activities_cost_lock
        CHECK (cost_lock_at IS NULL OR cost_lock_at <= start_at)
);

CREATE TABLE activity_locations (
    location_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    activity_id BIGINT UNSIGNED NOT NULL,
    venue_name VARCHAR(200) NULL,
    shape_type ENUM('MARKER', 'CIRCLE', 'RECTANGLE') NOT NULL,
    center_point POINT NOT NULL SRID 4326,
    boundary POLYGON NULL SRID 4326,
    radius_meters DECIMAL(10,2) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (location_id),
    UNIQUE KEY uq_activity_locations_activity (activity_id),
    SPATIAL KEY spx_activity_locations_center (center_point),
    CONSTRAINT fk_activity_locations_activity
        FOREIGN KEY (activity_id) REFERENCES activities(activity_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_activity_locations_shape_data
        CHECK (
            (shape_type = 'MARKER' AND boundary IS NULL AND radius_meters IS NULL)
            OR (shape_type = 'CIRCLE' AND radius_meters IS NOT NULL AND radius_meters > 0)
            OR (shape_type = 'RECTANGLE' AND boundary IS NOT NULL)
        )
);

CREATE TABLE participations (
    participation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    activity_id BIGINT UNSIGNED NOT NULL,
    member_id BIGINT UNSIGNED NULL,
    sponsored_by_member_id BIGINT UNSIGNED NULL,
    guest_name VARCHAR(150) NULL,
    join_status ENUM(
        'REQUESTED', 'INVITED', 'CONFIRMED', 'REJECTED',
        'WITHDRAWN', 'REMOVED'
    ) NOT NULL,
    attendance_status ENUM('PENDING', 'ATTENDED', 'NO_SHOW', 'EXCUSED') NOT NULL DEFAULT 'PENDING',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    withdrawn_at DATETIME NULL,
    withdrawal_after_cost_lock BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (participation_id),
    UNIQUE KEY uq_participations_member_activity (activity_id, member_id),
    KEY idx_participations_member (member_id),
    KEY idx_participations_sponsor (sponsored_by_member_id),
    KEY idx_participations_activity_status (activity_id, join_status),
    CONSTRAINT fk_participations_activity
        FOREIGN KEY (activity_id) REFERENCES activities(activity_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_participations_member
        FOREIGN KEY (member_id) REFERENCES members(member_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_participations_sponsor
        FOREIGN KEY (sponsored_by_member_id) REFERENCES members(member_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_participations_member_or_guest
        CHECK (
            (member_id IS NOT NULL AND guest_name IS NULL AND sponsored_by_member_id IS NULL)
            OR
            (member_id IS NULL AND guest_name IS NOT NULL AND sponsored_by_member_id IS NOT NULL)
        )
);

CREATE TABLE activity_rules (
    rule_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    activity_id BIGINT UNSIGNED NOT NULL,
    rule_type ENUM('PLATFORM_DEFAULT', 'CATEGORY_DEFAULT', 'HOST_CUSTOM') NOT NULL,
    rule_text VARCHAR(1000) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT UNSIGNED NOT NULL DEFAULT 1,
    PRIMARY KEY (rule_id),
    KEY idx_activity_rules_activity (activity_id),
    CONSTRAINT fk_activity_rules_activity
        FOREIGN KEY (activity_id) REFERENCES activities(activity_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE rule_acceptances (
    acceptance_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    participation_id BIGINT UNSIGNED NOT NULL,
    rule_id BIGINT UNSIGNED NOT NULL,
    accepted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (acceptance_id),
    UNIQUE KEY uq_rule_acceptances_participation_rule (participation_id, rule_id),
    KEY idx_rule_acceptances_rule (rule_id),
    CONSTRAINT fk_rule_acceptances_participation
        FOREIGN KEY (participation_id) REFERENCES participations(participation_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_rule_acceptances_rule
        FOREIGN KEY (rule_id) REFERENCES activity_rules(rule_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE cost_items (
    cost_item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    activity_id BIGINT UNSIGNED NOT NULL,
    description VARCHAR(250) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    allocation_method ENUM('EQUAL_SPLIT', 'INDIVIDUAL') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cost_item_id),
    KEY idx_cost_items_activity (activity_id),
    CONSTRAINT fk_cost_items_activity
        FOREIGN KEY (activity_id) REFERENCES activities(activity_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_cost_items_amount CHECK (total_amount >= 0)
);

CREATE TABLE cost_allocations (
    allocation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cost_item_id BIGINT UNSIGNED NOT NULL,
    participation_id BIGINT UNSIGNED NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    is_waived BOOLEAN NOT NULL DEFAULT FALSE,
    waived_by_member_id BIGINT UNSIGNED NULL,
    waived_at DATETIME NULL,
    PRIMARY KEY (allocation_id),
    UNIQUE KEY uq_cost_allocations_item_participation (cost_item_id, participation_id),
    KEY idx_cost_allocations_participation (participation_id),
    KEY idx_cost_allocations_waiver (waived_by_member_id),
    CONSTRAINT fk_cost_allocations_item
        FOREIGN KEY (cost_item_id) REFERENCES cost_items(cost_item_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_cost_allocations_participation
        FOREIGN KEY (participation_id) REFERENCES participations(participation_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_cost_allocations_waived_by
        FOREIGN KEY (waived_by_member_id) REFERENCES members(member_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_cost_allocations_amount CHECK (amount_due >= 0),
    CONSTRAINT chk_cost_allocations_waiver
        CHECK (
            (is_waived = FALSE AND waived_by_member_id IS NULL AND waived_at IS NULL)
            OR
            (is_waived = TRUE AND waived_by_member_id IS NOT NULL AND waived_at IS NOT NULL)
        )
);

CREATE TABLE payment_submissions (
    payment_submission_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    activity_id BIGINT UNSIGNED NOT NULL,
    participation_id BIGINT UNSIGNED NOT NULL,
    amount_claimed DECIMAL(10,2) NOT NULL,
    receipt_url VARCHAR(500) NOT NULL,
    review_status ENUM('SUBMITTED', 'CONFIRMED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    reviewed_by_member_id BIGINT UNSIGNED NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    rejection_reason VARCHAR(500) NULL,
    PRIMARY KEY (payment_submission_id),
    KEY idx_payment_submissions_activity (activity_id),
    KEY idx_payment_submissions_participation (participation_id),
    KEY idx_payment_submissions_reviewer (reviewed_by_member_id),
    CONSTRAINT fk_payment_submissions_activity
        FOREIGN KEY (activity_id) REFERENCES activities(activity_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_payment_submissions_participation
        FOREIGN KEY (participation_id) REFERENCES participations(participation_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_payment_submissions_reviewer
        FOREIGN KEY (reviewed_by_member_id) REFERENCES members(member_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_payment_submissions_amount CHECK (amount_claimed > 0),
    CONSTRAINT chk_payment_submissions_review
        CHECK (
            (review_status = 'SUBMITTED' AND reviewed_by_member_id IS NULL AND reviewed_at IS NULL)
            OR
            (review_status IN ('CONFIRMED', 'REJECTED') AND reviewed_by_member_id IS NOT NULL AND reviewed_at IS NOT NULL)
        )
);

CREATE TABLE activity_status_history (
    status_history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    activity_id BIGINT UNSIGNED NOT NULL,
    previous_status VARCHAR(40) NULL,
    new_status VARCHAR(40) NOT NULL,
    changed_by_member_id BIGINT UNSIGNED NULL,
    change_reason VARCHAR(500) NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (status_history_id),
    KEY idx_activity_status_history_activity (activity_id, changed_at),
    KEY idx_activity_status_history_member (changed_by_member_id),
    CONSTRAINT fk_activity_status_history_activity
        FOREIGN KEY (activity_id) REFERENCES activities(activity_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_activity_status_history_member
        FOREIGN KEY (changed_by_member_id) REFERENCES members(member_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE badges (
    badge_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    badge_name VARCHAR(100) NOT NULL,
    badge_type ENUM('VOLUNTEER', 'PARTICIPATION', 'SPECIAL') NOT NULL,
    description VARCHAR(500) NOT NULL,
    icon_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (badge_id),
    UNIQUE KEY uq_badges_name (badge_name)
);

CREATE TABLE member_badges (
    member_badge_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    member_id BIGINT UNSIGNED NOT NULL,
    badge_id INT UNSIGNED NOT NULL,
    participation_id BIGINT UNSIGNED NOT NULL,
    awarded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (member_badge_id),
    UNIQUE KEY uq_member_badges_evidence (member_id, badge_id, participation_id),
    KEY idx_member_badges_badge (badge_id),
    KEY idx_member_badges_participation (participation_id),
    CONSTRAINT fk_member_badges_member
        FOREIGN KEY (member_id) REFERENCES members(member_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_member_badges_badge
        FOREIGN KEY (badge_id) REFERENCES badges(badge_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_member_badges_participation
        FOREIGN KEY (participation_id) REFERENCES participations(participation_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE notifications (
    notification_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    member_id BIGINT UNSIGNED NOT NULL,
    activity_id BIGINT UNSIGNED NULL,
    notification_type ENUM(
        'JOIN_REQUEST', 'JOIN_APPROVED', 'JOIN_REJECTED', 'ACTIVITY_UPDATED',
        'ACTIVITY_CANCELLED', 'COST_LOCKED', 'PAYMENT_REVIEWED', 'REMINDER'
    ) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    PRIMARY KEY (notification_id),
    KEY idx_notifications_member_unread (member_id, read_at),
    KEY idx_notifications_activity (activity_id),
    CONSTRAINT fk_notifications_member
        FOREIGN KEY (member_id) REFERENCES members(member_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_notifications_activity
        FOREIGN KEY (activity_id) REFERENCES activities(activity_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE reports (
    report_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reporter_member_id BIGINT UNSIGNED NOT NULL,
    reported_member_id BIGINT UNSIGNED NULL,
    reported_activity_id BIGINT UNSIGNED NULL,
    reason VARCHAR(1000) NOT NULL,
    evidence_url VARCHAR(500) NULL,
    report_status ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    reviewed_by_member_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    PRIMARY KEY (report_id),
    KEY idx_reports_reporter (reporter_member_id),
    KEY idx_reports_reported_member (reported_member_id),
    KEY idx_reports_reported_activity (reported_activity_id),
    KEY idx_reports_reviewer (reviewed_by_member_id),
    CONSTRAINT fk_reports_reporter
        FOREIGN KEY (reporter_member_id) REFERENCES members(member_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reports_reported_member
        FOREIGN KEY (reported_member_id) REFERENCES members(member_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reports_reported_activity
        FOREIGN KEY (reported_activity_id) REFERENCES activities(activity_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_reports_reviewer
        FOREIGN KEY (reviewed_by_member_id) REFERENCES members(member_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_reports_exactly_one_target
        CHECK (
            (reported_member_id IS NOT NULL AND reported_activity_id IS NULL)
            OR
            (reported_member_id IS NULL AND reported_activity_id IS NOT NULL)
        )
);
