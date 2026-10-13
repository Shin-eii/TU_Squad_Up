-- TU Squad Up database schema
-- Target: MySQL 8.0+
--
-- HOW TO RUN
--   Run the whole file in MySQL Workbench (lightning-bolt "Execute all") or the
--   mysql command-line client. It DELETES and recreates the tu_squad_up database,
--   so only run it on your own development computer.
--
-- DRAWSQL
--   DrawSQL only understands the CREATE TABLE statements in section 2.
--   Copy that section alone when importing; it cannot read the triggers or seed data.
--
-- CHANGES FROM THE FIRST VERSION
--   1. Removed ON UPDATE CASCADE from every foreign key. MySQL 8 refuses a CHECK
--      constraint on a column whose foreign key cascades (error 3823), which stopped
--      participations, cost_allocations, payment_submissions and reports (and the
--      tables that depend on them) from being created. All keys are AUTO_INCREMENT
--      numbers that never change, so ON UPDATE CASCADE had no use anyway.
--   2. reports.reported_activity_id no longer uses ON DELETE CASCADE, for the same
--      reason, and so deleting an activity cannot silently delete reports about it.
--   3. activity_locations: CIRCLE must have no boundary; RECTANGLE must have no radius.
--   4. The file can be run again: it drops and recreates the database.
--   5. Added triggers (section 3) for the cross-table rules in the design document,
--      section 8: rules 1-4 (rows must belong to the same activity / member),
--      rule 9 (capacity), rule 11 (paid activities), and self-reports.
--      The backend should still check these and show friendly messages; the triggers
--      are a safety net so bad data cannot be saved even if the backend has a bug.
--   6. activities.status now switches between OPEN and FULL automatically when the
--      number of confirmed participants changes, and writes a status-history row.
--   7. Seed data for activity categories and the Volunteer badge (section 4).


-- =====================================================================
-- 1. DATABASE
-- =====================================================================

DROP DATABASE IF EXISTS tu_squad_up;
CREATE DATABASE tu_squad_up
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;
USE tu_squad_up;


-- =====================================================================
-- 2. TABLES
-- =====================================================================

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
        ON DELETE CASCADE
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

    join_mode ENUM(
        'INSTANT',
        'APPROVAL',
        'INVITATION'
    ) NOT NULL DEFAULT 'APPROVAL',

    registration_deadline DATETIME NULL,
    cost_lock_at DATETIME NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,

    status ENUM(
        'DRAFT',
        'OPEN',
        'FULL',
        'CLOSED',
        'WAITING_HOST_DECISION',
        'ONGOING',
        'COMPLETED',
        'CANCELLED',
        'EXPIRED'
    ) NOT NULL DEFAULT 'DRAFT',

    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    minimum_reached_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (activity_id),

    KEY idx_activities_host (host_member_id),
    KEY idx_activities_category (category_id),
    KEY idx_activities_payment_account (payment_account_id),
    KEY idx_activities_discovery (
        status,
        start_at,
        category_id
    ),

    CONSTRAINT fk_activities_host
        FOREIGN KEY (host_member_id)
        REFERENCES members(member_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_activities_category
        FOREIGN KEY (category_id)
        REFERENCES activity_categories(category_id)
        ON DELETE RESTRICT,

    -- No ON DELETE / ON UPDATE action: this column is used in chk_activities_paid_configuration.
    CONSTRAINT fk_activities_payment_account
        FOREIGN KEY (payment_account_id)
        REFERENCES payment_accounts(payment_account_id),

    CONSTRAINT chk_activities_capacity
        CHECK (
            minimum_participants >= 1
            AND maximum_participants >= minimum_participants
        ),

    CONSTRAINT chk_activities_schedule
        CHECK (end_at > start_at),

    CONSTRAINT chk_activities_registration_deadline
        CHECK (
            registration_deadline IS NULL
            OR registration_deadline <= start_at
        ),

    CONSTRAINT chk_activities_paid_configuration
        CHECK (
            is_paid = FALSE
            OR (
                cost_lock_at IS NOT NULL
                AND payment_account_id IS NOT NULL
            )
        ),

    CONSTRAINT chk_activities_cost_lock
        CHECK (
            cost_lock_at IS NULL
            OR cost_lock_at <= start_at
        )
);

-- SRID 4326 means GPS latitude/longitude. MySQL 8 reads these points LATITUDE FIRST:
--   ST_GeomFromText('POINT(14.0697 100.6082)', 4326)   -- (latitude longitude), Rangsit campus
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
        ON DELETE CASCADE,
    CONSTRAINT chk_activity_locations_shape_data
        CHECK (
            (shape_type = 'MARKER'
                AND boundary IS NULL AND radius_meters IS NULL)
            OR (shape_type = 'CIRCLE'
                AND boundary IS NULL AND radius_meters IS NOT NULL AND radius_meters > 0)
            OR (shape_type = 'RECTANGLE'
                AND boundary IS NOT NULL AND radius_meters IS NULL)
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
        ON DELETE CASCADE,
    -- No ON DELETE / ON UPDATE action on the next two keys: both columns are used in
    -- chk_participations_member_or_guest. The default still blocks deleting the member.
    CONSTRAINT fk_participations_member
        FOREIGN KEY (member_id) REFERENCES members(member_id),
    CONSTRAINT fk_participations_sponsor
        FOREIGN KEY (sponsored_by_member_id) REFERENCES members(member_id),
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
        ON DELETE CASCADE
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
        ON DELETE CASCADE,
    CONSTRAINT fk_rule_acceptances_rule
        FOREIGN KEY (rule_id) REFERENCES activity_rules(rule_id)
        ON DELETE CASCADE
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
        ON DELETE CASCADE,
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
        ON DELETE CASCADE,
    CONSTRAINT fk_cost_allocations_participation
        FOREIGN KEY (participation_id) REFERENCES participations(participation_id)
        ON DELETE CASCADE,
    -- No ON DELETE / ON UPDATE action: this column is used in chk_cost_allocations_waiver.
    CONSTRAINT fk_cost_allocations_waived_by
        FOREIGN KEY (waived_by_member_id) REFERENCES members(member_id),
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
        ON DELETE CASCADE,
    CONSTRAINT fk_payment_submissions_participation
        FOREIGN KEY (participation_id) REFERENCES participations(participation_id)
        ON DELETE CASCADE,
    -- No ON DELETE / ON UPDATE action: this column is used in chk_payment_submissions_review.
    CONSTRAINT fk_payment_submissions_reviewer
        FOREIGN KEY (reviewed_by_member_id) REFERENCES members(member_id),
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
        ON DELETE CASCADE,
    CONSTRAINT fk_activity_status_history_member
        FOREIGN KEY (changed_by_member_id) REFERENCES members(member_id)
        ON DELETE RESTRICT
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
        ON DELETE CASCADE,
    CONSTRAINT fk_member_badges_badge
        FOREIGN KEY (badge_id) REFERENCES badges(badge_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_member_badges_participation
        FOREIGN KEY (participation_id) REFERENCES participations(participation_id)
        ON DELETE RESTRICT
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
        ON DELETE CASCADE,
    CONSTRAINT fk_notifications_activity
        FOREIGN KEY (activity_id) REFERENCES activities(activity_id)
        ON DELETE CASCADE
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
        ON DELETE RESTRICT,
    -- No ON DELETE / ON UPDATE action on the next two keys: both columns are used in
    -- chk_reports_exactly_one_target. The default blocks deleting a reported member or
    -- activity, so moderation evidence is kept.
    CONSTRAINT fk_reports_reported_member
        FOREIGN KEY (reported_member_id) REFERENCES members(member_id),
    CONSTRAINT fk_reports_reported_activity
        FOREIGN KEY (reported_activity_id) REFERENCES activities(activity_id),
    CONSTRAINT fk_reports_reviewer
        FOREIGN KEY (reviewed_by_member_id) REFERENCES members(member_id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_reports_exactly_one_target
        CHECK (
            (reported_member_id IS NOT NULL AND reported_activity_id IS NULL)
            OR
            (reported_member_id IS NULL AND reported_activity_id IS NOT NULL)
        )
);


-- =====================================================================
-- 3. TRIGGERS AND HELPER PROCEDURES
--    Cross-table rules from the design document, section 8.
--    Each rule is a small procedure, called from the INSERT and UPDATE triggers.
--    A broken rule stops the statement with SQLSTATE 45000 and a readable message.
-- =====================================================================

DELIMITER $$

-- Rule 11: a paid activity's PromptPay account must belong to the host.
CREATE PROCEDURE assert_payment_account_owner(
    IN p_payment_account_id BIGINT UNSIGNED,
    IN p_host_member_id BIGINT UNSIGNED
)
BEGIN
    IF p_payment_account_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM payment_accounts
        WHERE payment_account_id = p_payment_account_id
          AND member_id = p_host_member_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'The payment account must belong to the activity host.';
    END IF;
END$$

-- Rule 11: a cost above 0 is only allowed on an activity marked as paid
-- (which, by chk_activities_paid_configuration, has a cost lock and a payment account).
CREATE PROCEDURE assert_cost_item_allowed(
    IN p_activity_id BIGINT UNSIGNED,
    IN p_total_amount DECIMAL(10,2)
)
BEGIN
    IF p_total_amount > 0 AND EXISTS (
        SELECT 1 FROM activities
        WHERE activity_id = p_activity_id AND is_paid = FALSE
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Mark the activity as paid (with a cost lock time and payment account) before adding a cost above 0.';
    END IF;
END$$

-- Rule 9 and 10: confirming a participant must not go over maximum_participants.
-- Locking the activity row makes two approvals at the same moment wait for each other.
-- p_participation_id is the row being changed (NULL for a new row) so it is not counted twice.
CREATE PROCEDURE assert_capacity_available(
    IN p_activity_id BIGINT UNSIGNED,
    IN p_participation_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_maximum INT UNSIGNED;
    DECLARE v_confirmed INT UNSIGNED;

    SELECT maximum_participants INTO v_maximum
    FROM activities
    WHERE activity_id = p_activity_id
    FOR UPDATE;

    SELECT COUNT(*) INTO v_confirmed
    FROM participations
    WHERE activity_id = p_activity_id
      AND join_status = 'CONFIRMED'
      AND (p_participation_id IS NULL OR participation_id <> p_participation_id);

    IF v_confirmed >= v_maximum THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'This activity is full: confirming another participant would exceed maximum_participants.';
    END IF;
END$$

-- Keeps activities.status in step with the confirmed count: OPEN <-> FULL.
-- Only touches activities that are OPEN or FULL, and records the change in history.
CREATE PROCEDURE sync_activity_full_status(IN p_activity_id BIGINT UNSIGNED)
BEGIN
    DECLARE v_status VARCHAR(40);
    DECLARE v_maximum INT UNSIGNED;
    DECLARE v_confirmed INT UNSIGNED;
    DECLARE v_new_status VARCHAR(40);

    SELECT status, maximum_participants INTO v_status, v_maximum
    FROM activities
    WHERE activity_id = p_activity_id;

    IF v_status IN ('OPEN', 'FULL') THEN
        SELECT COUNT(*) INTO v_confirmed
        FROM participations
        WHERE activity_id = p_activity_id AND join_status = 'CONFIRMED';

        SET v_new_status = IF(v_confirmed >= v_maximum, 'FULL', 'OPEN');

        IF v_new_status <> v_status THEN
            UPDATE activities SET status = v_new_status WHERE activity_id = p_activity_id;
            INSERT INTO activity_status_history
                (activity_id, previous_status, new_status, changed_by_member_id, change_reason)
            VALUES
                (p_activity_id, v_status, v_new_status, NULL,
                 IF(v_new_status = 'FULL',
                    'Automatic: confirmed participants reached the maximum.',
                    'Automatic: a place opened up.'));
        END IF;
    END IF;
END$$

-- Rule 2: a rule acceptance must use a rule from the participation's own activity.
CREATE PROCEDURE assert_rule_matches_participation(
    IN p_rule_id BIGINT UNSIGNED,
    IN p_participation_id BIGINT UNSIGNED
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM activity_rules r
        JOIN participations p ON p.activity_id = r.activity_id
        WHERE r.rule_id = p_rule_id AND p.participation_id = p_participation_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'The rule and the participation must belong to the same activity.';
    END IF;
END$$

-- Rule 1: a cost allocation must charge a participant of the cost item's own activity.
CREATE PROCEDURE assert_cost_item_matches_participation(
    IN p_cost_item_id BIGINT UNSIGNED,
    IN p_participation_id BIGINT UNSIGNED
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM cost_items c
        JOIN participations p ON p.activity_id = c.activity_id
        WHERE c.cost_item_id = p_cost_item_id AND p.participation_id = p_participation_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'The cost item and the participation must belong to the same activity.';
    END IF;
END$$

-- Rule 3: a payment submission's participation must belong to its stated activity.
CREATE PROCEDURE assert_participation_in_activity(
    IN p_participation_id BIGINT UNSIGNED,
    IN p_activity_id BIGINT UNSIGNED
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM participations
        WHERE participation_id = p_participation_id AND activity_id = p_activity_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'The participation does not belong to this activity.';
    END IF;
END$$

-- Rule 4: a badge's evidence must be the receiving member's own participation.
CREATE PROCEDURE assert_badge_evidence(
    IN p_member_id BIGINT UNSIGNED,
    IN p_participation_id BIGINT UNSIGNED
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM participations
        WHERE participation_id = p_participation_id AND member_id = p_member_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'The badge evidence must be a participation of the member receiving the badge.';
    END IF;
END$$

-- ---------- activities ----------

CREATE TRIGGER trg_activities_before_insert
BEFORE INSERT ON activities
FOR EACH ROW
BEGIN
    CALL assert_payment_account_owner(NEW.payment_account_id, NEW.host_member_id);
END$$

CREATE TRIGGER trg_activities_before_update
BEFORE UPDATE ON activities
FOR EACH ROW
BEGIN
    DECLARE v_confirmed INT UNSIGNED;

    IF NOT (NEW.payment_account_id <=> OLD.payment_account_id)
       OR NEW.host_member_id <> OLD.host_member_id THEN
        CALL assert_payment_account_owner(NEW.payment_account_id, NEW.host_member_id);
    END IF;

    -- Rule 11: cannot switch back to free while costs above 0 exist.
    IF NEW.is_paid = FALSE AND OLD.is_paid = TRUE AND EXISTS (
        SELECT 1 FROM cost_items
        WHERE activity_id = NEW.activity_id AND total_amount > 0
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Remove the cost items above 0 before marking the activity as free.';
    END IF;

    -- Rule 9: the host cannot lower the maximum below the people already confirmed.
    IF NEW.maximum_participants <> OLD.maximum_participants THEN
        SELECT COUNT(*) INTO v_confirmed
        FROM participations
        WHERE activity_id = NEW.activity_id AND join_status = 'CONFIRMED';

        IF NEW.maximum_participants < v_confirmed THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'The maximum cannot be lower than the number of confirmed participants.';
        END IF;

        -- A new maximum can make an OPEN activity FULL or a FULL one OPEN again.
        IF NEW.status = OLD.status AND OLD.status IN ('OPEN', 'FULL') THEN
            SET NEW.status = IF(v_confirmed >= NEW.maximum_participants, 'FULL', 'OPEN');
            IF NEW.status <> OLD.status THEN
                INSERT INTO activity_status_history
                    (activity_id, previous_status, new_status, changed_by_member_id, change_reason)
                VALUES
                    (NEW.activity_id, OLD.status, NEW.status, NULL,
                     'Automatic: the maximum number of participants changed.');
            END IF;
        END IF;
    END IF;
END$$

-- ---------- participations ----------

CREATE TRIGGER trg_participations_before_insert
BEFORE INSERT ON participations
FOR EACH ROW
BEGIN
    IF NEW.join_status = 'CONFIRMED' THEN
        CALL assert_capacity_available(NEW.activity_id, NULL);
    END IF;
END$$

CREATE TRIGGER trg_participations_before_update
BEFORE UPDATE ON participations
FOR EACH ROW
BEGIN
    IF NEW.join_status = 'CONFIRMED'
       AND (OLD.join_status <> 'CONFIRMED' OR NEW.activity_id <> OLD.activity_id) THEN
        CALL assert_capacity_available(NEW.activity_id, OLD.participation_id);
    END IF;
END$$

CREATE TRIGGER trg_participations_after_insert
AFTER INSERT ON participations
FOR EACH ROW
BEGIN
    IF NEW.join_status = 'CONFIRMED' THEN
        CALL sync_activity_full_status(NEW.activity_id);
    END IF;
END$$

CREATE TRIGGER trg_participations_after_update
AFTER UPDATE ON participations
FOR EACH ROW
BEGIN
    IF NEW.join_status <> OLD.join_status OR NEW.activity_id <> OLD.activity_id THEN
        CALL sync_activity_full_status(NEW.activity_id);
        IF NEW.activity_id <> OLD.activity_id THEN
            CALL sync_activity_full_status(OLD.activity_id);
        END IF;
    END IF;
END$$

-- Rows removed by ON DELETE CASCADE do not fire triggers in MySQL; that only
-- happens when the whole activity is deleted, so there is no status to update.
CREATE TRIGGER trg_participations_after_delete
AFTER DELETE ON participations
FOR EACH ROW
BEGIN
    IF OLD.join_status = 'CONFIRMED' THEN
        CALL sync_activity_full_status(OLD.activity_id);
    END IF;
END$$

-- ---------- rule_acceptances ----------

CREATE TRIGGER trg_rule_acceptances_before_insert
BEFORE INSERT ON rule_acceptances
FOR EACH ROW
BEGIN
    CALL assert_rule_matches_participation(NEW.rule_id, NEW.participation_id);
END$$

CREATE TRIGGER trg_rule_acceptances_before_update
BEFORE UPDATE ON rule_acceptances
FOR EACH ROW
BEGIN
    CALL assert_rule_matches_participation(NEW.rule_id, NEW.participation_id);
END$$

-- ---------- cost_items ----------

CREATE TRIGGER trg_cost_items_before_insert
BEFORE INSERT ON cost_items
FOR EACH ROW
BEGIN
    CALL assert_cost_item_allowed(NEW.activity_id, NEW.total_amount);
END$$

CREATE TRIGGER trg_cost_items_before_update
BEFORE UPDATE ON cost_items
FOR EACH ROW
BEGIN
    CALL assert_cost_item_allowed(NEW.activity_id, NEW.total_amount);
END$$

-- ---------- cost_allocations ----------

CREATE TRIGGER trg_cost_allocations_before_insert
BEFORE INSERT ON cost_allocations
FOR EACH ROW
BEGIN
    CALL assert_cost_item_matches_participation(NEW.cost_item_id, NEW.participation_id);
END$$

CREATE TRIGGER trg_cost_allocations_before_update
BEFORE UPDATE ON cost_allocations
FOR EACH ROW
BEGIN
    CALL assert_cost_item_matches_participation(NEW.cost_item_id, NEW.participation_id);
END$$

-- ---------- payment_submissions ----------

CREATE TRIGGER trg_payment_submissions_before_insert
BEFORE INSERT ON payment_submissions
FOR EACH ROW
BEGIN
    CALL assert_participation_in_activity(NEW.participation_id, NEW.activity_id);
END$$

CREATE TRIGGER trg_payment_submissions_before_update
BEFORE UPDATE ON payment_submissions
FOR EACH ROW
BEGIN
    CALL assert_participation_in_activity(NEW.participation_id, NEW.activity_id);
END$$

-- ---------- member_badges ----------

CREATE TRIGGER trg_member_badges_before_insert
BEFORE INSERT ON member_badges
FOR EACH ROW
BEGIN
    CALL assert_badge_evidence(NEW.member_id, NEW.participation_id);
END$$

CREATE TRIGGER trg_member_badges_before_update
BEFORE UPDATE ON member_badges
FOR EACH ROW
BEGIN
    CALL assert_badge_evidence(NEW.member_id, NEW.participation_id);
END$$

-- ---------- reports ----------

CREATE TRIGGER trg_reports_before_insert
BEFORE INSERT ON reports
FOR EACH ROW
BEGIN
    IF NEW.reported_member_id = NEW.reporter_member_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Members cannot report themselves.';
    END IF;
END$$

CREATE TRIGGER trg_reports_before_update
BEFORE UPDATE ON reports
FOR EACH ROW
BEGIN
    IF NEW.reported_member_id = NEW.reporter_member_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Members cannot report themselves.';
    END IF;
END$$

DELIMITER ;


-- =====================================================================
-- 4. SEED DATA
-- =====================================================================

INSERT INTO activity_categories (category_name, description) VALUES
    ('Sports',       'Football, badminton, basketball, running and other games.'),
    ('Study',        'Study groups, tutoring and exam preparation.'),
    ('Food',         'Shared meals and group food orders.'),
    ('Volunteer',    'Volunteer work. Attending a completed one earns the Volunteer badge.'),
    ('Event',        'Social events, clubs and campus events.'),
    ('Help',         'Asking other members for a hand.');

INSERT INTO badges (badge_name, badge_type, description) VALUES
    ('Volunteer', 'VOLUNTEER', 'Attended a completed volunteer activity.');
