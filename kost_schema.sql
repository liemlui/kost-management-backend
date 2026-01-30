--
-- PostgreSQL database dump
--

\restrict YRYBh3el6at2EwQItKLbmFxqHUDSl5K4RPnnREvhVlMWRDISgY6fQITAFqABUNV

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: kost; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA kost;


ALTER SCHEMA kost OWNER TO postgres;

--
-- Name: room_asset_status; Type: TYPE; Schema: kost; Owner: postgres
--

CREATE TYPE kost.room_asset_status AS ENUM (
    'IN_ROOM',
    'IN_REPAIR',
    'REMOVED'
);


ALTER TYPE kost.room_asset_status OWNER TO postgres;

--
-- Name: fn_recompute_invoice_total(bigint); Type: FUNCTION; Schema: kost; Owner: postgres
--

CREATE FUNCTION kost.fn_recompute_invoice_total(p_invoice_id bigint) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE kost.invoices i
  SET
    total_amount = COALESCE((
      SELECT SUM(ii.amount)
      FROM kost.invoice_items ii
      WHERE ii.invoice_id = p_invoice_id
    ), 0),
    updated_at = now()
  WHERE i.id = p_invoice_id;
END;
$$;


ALTER FUNCTION kost.fn_recompute_invoice_total(p_invoice_id bigint) OWNER TO postgres;

--
-- Name: fn_room_assets_touch_and_enforce(); Type: FUNCTION; Schema: kost; Owner: postgres
--

CREATE FUNCTION kost.fn_room_assets_touch_and_enforce() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Auto stamp updated_at
  NEW.updated_at := NOW();

  -- Enforce: kalau REMOVED, removed_at harus terisi (auto isi kalau null)
  IF NEW.status = 'REMOVED' THEN
    IF NEW.removed_at IS NULL THEN
      NEW.removed_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION kost.fn_room_assets_touch_and_enforce() OWNER TO postgres;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: kost; Owner: postgres
--

CREATE FUNCTION kost.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION kost.set_updated_at() OWNER TO postgres;

--
-- Name: tg_set_updated_at(); Type: FUNCTION; Schema: kost; Owner: postgres
--

CREATE FUNCTION kost.tg_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION kost.tg_set_updated_at() OWNER TO postgres;

--
-- Name: trg_invoice_items_recompute_total(); Type: FUNCTION; Schema: kost; Owner: postgres
--

CREATE FUNCTION kost.trg_invoice_items_recompute_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_invoice_id bigint;
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  PERFORM kost.fn_recompute_invoice_total(v_invoice_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION kost.trg_invoice_items_recompute_total() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: amenities; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.amenities (
    id bigint NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    unit_label text,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE kost.amenities OWNER TO postgres;

--
-- Name: amenities_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.amenities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.amenities_id_seq OWNER TO postgres;

--
-- Name: amenities_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.amenities_id_seq OWNED BY kost.amenities.id;


--
-- Name: announcement_ack; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.announcement_ack (
    id bigint NOT NULL,
    announcement_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    acknowledged_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kost.announcement_ack OWNER TO postgres;

--
-- Name: announcement_ack_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.announcement_ack_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.announcement_ack_id_seq OWNER TO postgres;

--
-- Name: announcement_ack_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.announcement_ack_id_seq OWNED BY kost.announcement_ack.id;


--
-- Name: announcements; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.announcements (
    id bigint NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    level text DEFAULT 'NORMAL'::text NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    starts_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_by bigint,
    updated_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_announcements_level CHECK ((level = ANY (ARRAY['NORMAL'::text, 'IMPORTANT'::text, 'URGENT'::text]))),
    CONSTRAINT chk_announcements_time_range CHECK (((expires_at IS NULL) OR (starts_at IS NULL) OR (expires_at > starts_at)))
);


ALTER TABLE kost.announcements OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.announcements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.announcements_id_seq OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.announcements_id_seq OWNED BY kost.announcements.id;


--
-- Name: common_amenities; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.common_amenities (
    id bigint NOT NULL,
    amenity_id bigint NOT NULL,
    qty smallint DEFAULT 1 NOT NULL,
    location_note text,
    condition text,
    notes text,
    CONSTRAINT chk_common_amenities_condition CHECK (((condition IS NULL) OR (condition = ANY (ARRAY['NEW'::text, 'GOOD'::text, 'FAIR'::text, 'DAMAGED'::text, 'MISSING'::text])))),
    CONSTRAINT chk_common_amenities_qty_positive CHECK ((qty >= 1))
);


ALTER TABLE kost.common_amenities OWNER TO postgres;

--
-- Name: common_amenities_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.common_amenities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.common_amenities_id_seq OWNER TO postgres;

--
-- Name: common_amenities_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.common_amenities_id_seq OWNED BY kost.common_amenities.id;


--
-- Name: credit_applications; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.credit_applications (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    amount_applied numeric(14,2) DEFAULT 0 NOT NULL,
    applied_by bigint NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL,
    note text,
    CONSTRAINT chk_credit_applications_amount_positive CHECK ((amount_applied > (0)::numeric))
);


ALTER TABLE kost.credit_applications OWNER TO postgres;

--
-- Name: credit_applications_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.credit_applications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.credit_applications_id_seq OWNER TO postgres;

--
-- Name: credit_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.credit_applications_id_seq OWNED BY kost.credit_applications.id;


--
-- Name: credit_movements; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.credit_movements (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    amount numeric(14,2) NOT NULL,
    movement_type text NOT NULL,
    source_type text,
    source_id bigint,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    note text,
    CONSTRAINT chk_credit_movements_amount_nonzero CHECK ((amount <> (0)::numeric)),
    CONSTRAINT chk_credit_movements_type CHECK ((movement_type = ANY (ARRAY['TOPUP'::text, 'APPLY'::text, 'ADJUST'::text, 'REFUND'::text, 'REVERSAL'::text])))
);


ALTER TABLE kost.credit_movements OWNER TO postgres;

--
-- Name: credit_movements_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.credit_movements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.credit_movements_id_seq OWNER TO postgres;

--
-- Name: credit_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.credit_movements_id_seq OWNED BY kost.credit_movements.id;


--
-- Name: deposit_movements; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.deposit_movements (
    id bigint NOT NULL,
    tenant_deposit_id bigint NOT NULL,
    amount numeric(14,2) NOT NULL,
    movement_type text NOT NULL,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    note text,
    CONSTRAINT chk_deposit_movements_amount_nonzero CHECK ((amount <> (0)::numeric)),
    CONSTRAINT chk_deposit_movements_type CHECK ((movement_type = ANY (ARRAY['HELD'::text, 'DEDUCT'::text, 'REFUND'::text, 'ADJUST'::text])))
);


ALTER TABLE kost.deposit_movements OWNER TO postgres;

--
-- Name: deposit_movements_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.deposit_movements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.deposit_movements_id_seq OWNER TO postgres;

--
-- Name: deposit_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.deposit_movements_id_seq OWNED BY kost.deposit_movements.id;


--
-- Name: electricity_tariffs; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.electricity_tariffs (
    id bigint NOT NULL,
    effective_from date NOT NULL,
    price_per_kwh numeric(12,2) NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT electricity_tariffs_price_per_kwh_check CHECK ((price_per_kwh > (0)::numeric))
);


ALTER TABLE kost.electricity_tariffs OWNER TO postgres;

--
-- Name: electricity_tariffs_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.electricity_tariffs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.electricity_tariffs_id_seq OWNER TO postgres;

--
-- Name: electricity_tariffs_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.electricity_tariffs_id_seq OWNED BY kost.electricity_tariffs.id;


--
-- Name: inventory_balances; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.inventory_balances (
    item_id bigint NOT NULL,
    location_id bigint NOT NULL,
    qty_on_hand numeric DEFAULT 0 NOT NULL,
    avg_unit_cost numeric,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kost.inventory_balances OWNER TO postgres;

--
-- Name: inventory_items; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.inventory_items (
    id bigint NOT NULL,
    sku text,
    name text NOT NULL,
    category text NOT NULL,
    item_type text NOT NULL,
    uom text DEFAULT 'PCS'::text NOT NULL,
    reorder_point numeric,
    reorder_qty numeric,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kost.inventory_items OWNER TO postgres;

--
-- Name: inventory_items_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.inventory_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.inventory_items_id_seq OWNER TO postgres;

--
-- Name: inventory_items_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.inventory_items_id_seq OWNED BY kost.inventory_items.id;


--
-- Name: inventory_locations; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.inventory_locations (
    id bigint NOT NULL,
    location_type text NOT NULL,
    room_id bigint,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kost.inventory_locations OWNER TO postgres;

--
-- Name: inventory_locations_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.inventory_locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.inventory_locations_id_seq OWNER TO postgres;

--
-- Name: inventory_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.inventory_locations_id_seq OWNED BY kost.inventory_locations.id;


--
-- Name: inventory_movements; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.inventory_movements (
    id bigint NOT NULL,
    item_id bigint NOT NULL,
    from_location_id bigint,
    to_location_id bigint,
    movement_type text NOT NULL,
    qty numeric NOT NULL,
    unit_cost numeric,
    condition_after text,
    notes text,
    source text DEFAULT 'MANUAL'::text NOT NULL,
    finance_txn_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kost.inventory_movements OWNER TO postgres;

--
-- Name: inventory_movements_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.inventory_movements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.inventory_movements_id_seq OWNER TO postgres;

--
-- Name: inventory_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.inventory_movements_id_seq OWNED BY kost.inventory_movements.id;


--
-- Name: invoice_electricity; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.invoice_electricity (
    id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    room_id bigint NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    start_reading_id bigint,
    end_reading_id bigint,
    start_kwh numeric(14,3),
    end_kwh numeric(14,3),
    kwh_used numeric(14,3),
    allowance_kwh numeric(14,3) DEFAULT 30 NOT NULL,
    overage_kwh integer,
    tariff_per_kwh numeric(12,2) NOT NULL,
    overage_amount numeric(14,2),
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT invoice_electricity_allowance_kwh_check CHECK ((allowance_kwh >= (0)::numeric)),
    CONSTRAINT invoice_electricity_end_kwh_check CHECK ((end_kwh >= (0)::numeric)),
    CONSTRAINT invoice_electricity_kwh_used_check CHECK ((kwh_used >= (0)::numeric)),
    CONSTRAINT invoice_electricity_overage_amount_check CHECK ((overage_amount >= (0)::numeric)),
    CONSTRAINT invoice_electricity_overage_kwh_check CHECK ((overage_kwh >= 0)),
    CONSTRAINT invoice_electricity_start_kwh_check CHECK ((start_kwh >= (0)::numeric)),
    CONSTRAINT invoice_electricity_tariff_per_kwh_check CHECK ((tariff_per_kwh > (0)::numeric))
);


ALTER TABLE kost.invoice_electricity OWNER TO postgres;

--
-- Name: invoice_electricity_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.invoice_electricity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.invoice_electricity_id_seq OWNER TO postgres;

--
-- Name: invoice_electricity_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.invoice_electricity_id_seq OWNED BY kost.invoice_electricity.id;


--
-- Name: invoice_items; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.invoice_items (
    id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    item_type character varying(32) NOT NULL,
    description text,
    qty numeric(12,2) DEFAULT 1 NOT NULL,
    unit_price numeric(14,2) DEFAULT 0 NOT NULL,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    ref_type character varying(32),
    ref_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    CONSTRAINT chk_invoice_items_amount_consistency CHECK ((amount = (qty * unit_price))),
    CONSTRAINT chk_invoice_items_prices_nonnegative CHECK (((unit_price >= (0)::numeric) AND (amount >= (0)::numeric))),
    CONSTRAINT chk_invoice_items_qty_positive CHECK ((qty > (0)::numeric)),
    CONSTRAINT chk_invoice_items_type CHECK (((item_type)::text = ANY (ARRAY['RENT'::text, 'ELECTRIC_OVERAGE'::text, 'WIFI_VOUCHER'::text, 'PENALTY'::text, 'DEPOSIT'::text])))
);


ALTER TABLE kost.invoice_items OWNER TO postgres;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.invoice_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.invoice_items_id_seq OWNER TO postgres;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.invoice_items_id_seq OWNED BY kost.invoice_items.id;


--
-- Name: invoice_status_history; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.invoice_status_history (
    id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    from_status character varying(20),
    to_status character varying(20) NOT NULL,
    changed_by bigint,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    note text
);


ALTER TABLE kost.invoice_status_history OWNER TO postgres;

--
-- Name: invoice_status_history_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.invoice_status_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.invoice_status_history_id_seq OWNER TO postgres;

--
-- Name: invoice_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.invoice_status_history_id_seq OWNED BY kost.invoice_status_history.id;


--
-- Name: invoices; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.invoices (
    id bigint NOT NULL,
    stay_id bigint NOT NULL,
    invoice_number character varying(32) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    due_date date NOT NULL,
    total_amount numeric(14,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    issued_at timestamp with time zone,
    paid_at timestamp with time zone,
    void_reason text,
    cancel_reason text,
    CONSTRAINT chk_invoice_period CHECK ((period_end > period_start)),
    CONSTRAINT chk_invoice_status CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'ISSUED'::character varying, 'PAID'::character varying, 'PARTIAL'::character varying, 'UNDERPAID'::character varying, 'OVERDUE'::character varying, 'FORCED_CHECKOUT'::character varying, 'VOID'::character varying, 'CANCELLED'::character varying])::text[]))),
    CONSTRAINT chk_invoice_total_nonnegative CHECK ((total_amount >= (0)::numeric)),
    CONSTRAINT chk_invoices_cancel_reason_required CHECK ((((status)::text <> 'CANCELLED'::text) OR (cancel_reason IS NOT NULL))),
    CONSTRAINT chk_invoices_issued_at_required CHECK ((((status)::text <> ALL ((ARRAY['ISSUED'::character varying, 'OVERDUE'::character varying, 'PAID'::character varying, 'PARTIAL'::character varying, 'UNDERPAID'::character varying, 'FORCED_CHECKOUT'::character varying])::text[])) OR (issued_at IS NOT NULL))),
    CONSTRAINT chk_invoices_paid_after_issued CHECK (((issued_at IS NULL) OR (paid_at IS NULL) OR (paid_at >= issued_at))),
    CONSTRAINT chk_invoices_paid_at_required CHECK ((((status)::text <> 'PAID'::text) OR (paid_at IS NOT NULL))),
    CONSTRAINT chk_invoices_void_reason_required CHECK ((((status)::text <> 'VOID'::text) OR (void_reason IS NOT NULL)))
);


ALTER TABLE kost.invoices OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.invoices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.invoices_id_seq OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.invoices_id_seq OWNED BY kost.invoices.id;


--
-- Name: meter_readings; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.meter_readings (
    id bigint NOT NULL,
    room_id bigint NOT NULL,
    reading_at timestamp with time zone DEFAULT now() NOT NULL,
    meter_value_kwh numeric(14,3) NOT NULL,
    captured_by bigint,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT meter_readings_meter_value_kwh_check CHECK ((meter_value_kwh >= (0)::numeric))
);


ALTER TABLE kost.meter_readings OWNER TO postgres;

--
-- Name: meter_readings_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.meter_readings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.meter_readings_id_seq OWNER TO postgres;

--
-- Name: meter_readings_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.meter_readings_id_seq OWNED BY kost.meter_readings.id;


--
-- Name: payment_submission_files; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.payment_submission_files (
    id bigint NOT NULL,
    submission_id bigint NOT NULL,
    file_id bigint NOT NULL,
    original_name text,
    mime_type text,
    file_size_bytes bigint,
    storage_key text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kost.payment_submission_files OWNER TO postgres;

--
-- Name: payment_submission_files_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.payment_submission_files_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.payment_submission_files_id_seq OWNER TO postgres;

--
-- Name: payment_submission_files_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.payment_submission_files_id_seq OWNED BY kost.payment_submission_files.id;


--
-- Name: payment_submissions; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.payment_submissions (
    id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    submitted_by_type text NOT NULL,
    submitted_by_tenant_id bigint,
    submitted_by_user_id bigint,
    declared_amount numeric(14,2) DEFAULT 0 NOT NULL,
    method text,
    transferred_at timestamp with time zone,
    note text,
    status text DEFAULT 'SUBMITTED'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_payment_submissions_amount_nonnegative CHECK ((declared_amount >= (0)::numeric)),
    CONSTRAINT chk_payment_submissions_status CHECK ((status = ANY (ARRAY['SUBMITTED'::text, 'CANCELLED'::text]))),
    CONSTRAINT chk_payment_submissions_submitter_consistency CHECK ((((submitted_by_type = 'TENANT'::text) AND (submitted_by_tenant_id IS NOT NULL) AND (submitted_by_user_id IS NULL)) OR ((submitted_by_type = 'ADMIN'::text) AND (submitted_by_user_id IS NOT NULL) AND (submitted_by_tenant_id IS NULL)))),
    CONSTRAINT chk_payment_submissions_submitter_type CHECK ((submitted_by_type = ANY (ARRAY['TENANT'::text, 'ADMIN'::text])))
);


ALTER TABLE kost.payment_submissions OWNER TO postgres;

--
-- Name: payment_submissions_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.payment_submissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.payment_submissions_id_seq OWNER TO postgres;

--
-- Name: payment_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.payment_submissions_id_seq OWNED BY kost.payment_submissions.id;


--
-- Name: payment_verifications; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.payment_verifications (
    id bigint NOT NULL,
    submission_id bigint NOT NULL,
    verified_by bigint NOT NULL,
    verified_at timestamp with time zone DEFAULT now() NOT NULL,
    verified_amount numeric(14,2) DEFAULT 0 NOT NULL,
    result text NOT NULL,
    note text,
    rejection_reason text,
    CONSTRAINT chk_payment_verifications_amount_nonnegative CHECK ((verified_amount >= (0)::numeric)),
    CONSTRAINT chk_payment_verifications_rejection_reason CHECK (((result <> 'REJECTED'::text) OR (rejection_reason IS NOT NULL))),
    CONSTRAINT chk_payment_verifications_result CHECK ((result = ANY (ARRAY['MATCH'::text, 'UNDERPAID'::text, 'OVERPAID'::text, 'REJECTED'::text])))
);


ALTER TABLE kost.payment_verifications OWNER TO postgres;

--
-- Name: payment_verifications_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.payment_verifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.payment_verifications_id_seq OWNER TO postgres;

--
-- Name: payment_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.payment_verifications_id_seq OWNED BY kost.payment_verifications.id;


--
-- Name: room_amenities; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.room_amenities (
    id bigint NOT NULL,
    room_id bigint NOT NULL,
    amenity_id bigint NOT NULL,
    qty smallint DEFAULT 1 NOT NULL,
    condition text,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    source text DEFAULT 'MANUAL'::text NOT NULL,
    CONSTRAINT chk_room_amenities_condition CHECK (((condition IS NULL) OR (condition = ANY (ARRAY['NEW'::text, 'GOOD'::text, 'FAIR'::text, 'DAMAGED'::text, 'MISSING'::text])))),
    CONSTRAINT chk_room_amenities_qty_positive CHECK ((qty >= 1)),
    CONSTRAINT chk_room_amenities_source CHECK ((source = ANY (ARRAY['DEFAULT'::text, 'MANUAL'::text])))
);


ALTER TABLE kost.room_amenities OWNER TO postgres;

--
-- Name: room_amenities_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.room_amenities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.room_amenities_id_seq OWNER TO postgres;

--
-- Name: room_amenities_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.room_amenities_id_seq OWNED BY kost.room_amenities.id;


--
-- Name: room_assets; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.room_assets (
    id bigint NOT NULL,
    room_id bigint NOT NULL,
    inventory_item_id bigint NOT NULL,
    qty numeric(12,2) DEFAULT 1 NOT NULL,
    status kost.room_asset_status DEFAULT 'IN_ROOM'::kost.room_asset_status NOT NULL,
    note text,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL,
    assigned_by bigint,
    removed_at timestamp without time zone,
    removed_by bigint,
    remove_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT room_assets_qty_check CHECK ((qty > (0)::numeric))
);


ALTER TABLE kost.room_assets OWNER TO postgres;

--
-- Name: room_assets_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.room_assets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.room_assets_id_seq OWNER TO postgres;

--
-- Name: room_assets_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.room_assets_id_seq OWNED BY kost.room_assets.id;


--
-- Name: room_types; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.room_types (
    id bigint NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    is_capsule boolean DEFAULT false NOT NULL,
    room_width_m numeric(4,2),
    room_length_m numeric(4,2),
    bathroom_location text DEFAULT 'OUTSIDE'::text NOT NULL,
    bathroom_width_m numeric(4,2),
    bathroom_length_m numeric(4,2),
    has_ac boolean DEFAULT false NOT NULL,
    has_fan boolean DEFAULT false NOT NULL,
    bed_type text NOT NULL,
    bed_size_cm smallint,
    base_monthly_price numeric(14,2) DEFAULT 0 NOT NULL,
    deposit_amount numeric(14,2) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_room_types_bathroom_location CHECK ((bathroom_location = ANY (ARRAY['INSIDE'::text, 'OUTSIDE'::text]))),
    CONSTRAINT chk_room_types_bathroom_size_logic CHECK (((bathroom_location = 'INSIDE'::text) OR ((bathroom_width_m IS NULL) AND (bathroom_length_m IS NULL)))),
    CONSTRAINT chk_room_types_bathroom_size_required CHECK (((bathroom_location <> 'INSIDE'::text) OR ((bathroom_width_m IS NOT NULL) AND (bathroom_length_m IS NOT NULL)))),
    CONSTRAINT chk_room_types_bed_size_range CHECK (((bed_size_cm IS NULL) OR ((bed_size_cm >= 60) AND (bed_size_cm <= 220)))),
    CONSTRAINT chk_room_types_bed_type CHECK ((bed_type = ANY (ARRAY['FOAM'::text, 'SPRINGBED'::text]))),
    CONSTRAINT chk_room_types_price_nonnegative CHECK (((base_monthly_price >= (0)::numeric) AND (deposit_amount >= (0)::numeric))),
    CONSTRAINT chk_room_types_room_length_positive CHECK (((room_length_m IS NULL) OR (room_length_m > (0)::numeric))),
    CONSTRAINT chk_room_types_room_width_positive CHECK (((room_width_m IS NULL) OR (room_width_m > (0)::numeric)))
);


ALTER TABLE kost.room_types OWNER TO postgres;

--
-- Name: room_types_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.room_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.room_types_id_seq OWNER TO postgres;

--
-- Name: room_types_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.room_types_id_seq OWNED BY kost.room_types.id;


--
-- Name: rooms; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.rooms (
    id bigint NOT NULL,
    code text NOT NULL,
    room_type_id bigint NOT NULL,
    floor smallint NOT NULL,
    position_zone text,
    status text DEFAULT 'AVAILABLE'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_rooms_floor CHECK ((floor = ANY (ARRAY[1, 2]))),
    CONSTRAINT chk_rooms_position_zone CHECK (((position_zone IS NULL) OR (position_zone = ANY (ARRAY['FRONT'::text, 'MIDDLE'::text, 'BACK'::text])))),
    CONSTRAINT chk_rooms_status CHECK ((status = ANY (ARRAY['AVAILABLE'::text, 'MAINTENANCE'::text, 'INACTIVE'::text])))
);


ALTER TABLE kost.rooms OWNER TO postgres;

--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.rooms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.rooms_id_seq OWNER TO postgres;

--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.rooms_id_seq OWNED BY kost.rooms.id;


--
-- Name: stays; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.stays (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    room_id bigint NOT NULL,
    status text NOT NULL,
    check_in_at date NOT NULL,
    planned_check_out_at date,
    check_out_at date,
    physical_check_out_at date,
    rent_period text NOT NULL,
    agreed_rent_amount numeric(14,2) NOT NULL,
    deposit_amount numeric(14,2) DEFAULT 0 NOT NULL,
    billing_anchor_day smallint,
    electricity_mode text DEFAULT 'METERED'::text NOT NULL,
    electricity_fixed_amount numeric(14,2) DEFAULT 0 NOT NULL,
    water_fixed_amount numeric(14,2) DEFAULT 0 NOT NULL,
    internet_fixed_amount numeric(14,2) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    base_rent_amount numeric(14,2) NOT NULL,
    discount_amount numeric(14,2) DEFAULT 0 NOT NULL,
    discount_reason text,
    additional_rent_amount numeric(14,2) DEFAULT 0 NOT NULL,
    additional_rent_reason text,
    room_variant text DEFAULT 'FAN'::text NOT NULL,
    CONSTRAINT chk_stays_amounts_non_negative CHECK (((base_rent_amount >= (0)::numeric) AND (additional_rent_amount >= (0)::numeric) AND (discount_amount >= (0)::numeric) AND (agreed_rent_amount >= (0)::numeric))),
    CONSTRAINT chk_stays_amounts_nonnegative CHECK (((agreed_rent_amount >= (0)::numeric) AND (deposit_amount >= (0)::numeric) AND (electricity_fixed_amount >= (0)::numeric) AND (water_fixed_amount >= (0)::numeric) AND (internet_fixed_amount >= (0)::numeric))),
    CONSTRAINT chk_stays_billing_anchor_day_consistency CHECK ((((rent_period = 'MONTHLY'::text) AND ((billing_anchor_day >= 1) AND (billing_anchor_day <= 31))) OR ((rent_period <> 'MONTHLY'::text) AND (billing_anchor_day IS NULL)))),
    CONSTRAINT chk_stays_billing_anchor_day_range CHECK (((billing_anchor_day IS NULL) OR ((billing_anchor_day >= 1) AND (billing_anchor_day <= 31)))),
    CONSTRAINT chk_stays_checkout_after_checkin CHECK (((check_out_at IS NULL) OR (check_out_at >= check_in_at))),
    CONSTRAINT chk_stays_contract_amounts_consistent CHECK ((agreed_rent_amount = ((base_rent_amount + COALESCE(additional_rent_amount, (0)::numeric)) - COALESCE(discount_amount, (0)::numeric)))),
    CONSTRAINT chk_stays_discount_nonnegative CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT chk_stays_discount_reason_required CHECK (((discount_amount = (0)::numeric) OR (discount_reason IS NOT NULL))),
    CONSTRAINT chk_stays_electricity_mode CHECK ((electricity_mode = ANY (ARRAY['INCLUDED'::text, 'METERED'::text, 'FIXED'::text]))),
    CONSTRAINT chk_stays_ended_has_checkout CHECK (((status <> ALL (ARRAY['ENDED'::text, 'FORCED_ENDED'::text])) OR (check_out_at IS NOT NULL))),
    CONSTRAINT chk_stays_physical_checkout_after_checkin CHECK (((physical_check_out_at IS NULL) OR (physical_check_out_at >= check_in_at))),
    CONSTRAINT chk_stays_planned_checkout_after_checkin CHECK (((planned_check_out_at IS NULL) OR (planned_check_out_at >= check_in_at))),
    CONSTRAINT chk_stays_rent_period CHECK ((rent_period = ANY (ARRAY['DAILY'::text, 'WEEKLY'::text, 'BIWEEKLY'::text, 'MONTHLY'::text]))),
    CONSTRAINT chk_stays_room_variant CHECK ((room_variant = ANY (ARRAY['FAN'::text, 'AC'::text]))),
    CONSTRAINT chk_stays_status CHECK ((status = ANY (ARRAY['ACTIVE'::text, 'ENDED'::text, 'FORCED_ENDED'::text, 'CANCELLED'::text])))
);


ALTER TABLE kost.stays OWNER TO postgres;

--
-- Name: stays_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.stays_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.stays_id_seq OWNER TO postgres;

--
-- Name: stays_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.stays_id_seq OWNED BY kost.stays.id;


--
-- Name: tenant_credits; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.tenant_credits (
    tenant_id bigint NOT NULL,
    balance numeric(14,2) DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_tenant_credits_balance_nonnegative CHECK ((balance >= (0)::numeric))
);


ALTER TABLE kost.tenant_credits OWNER TO postgres;

--
-- Name: tenant_deposits; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.tenant_deposits (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    stay_id bigint,
    deposit_amount numeric(14,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'HELD'::text NOT NULL,
    deduction_amount numeric(14,2) DEFAULT 0 NOT NULL,
    deduction_reason text,
    refunded_amount numeric(14,2) DEFAULT 0 NOT NULL,
    refunded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    CONSTRAINT chk_tenant_deposits_amounts_nonnegative CHECK (((deposit_amount >= (0)::numeric) AND (deduction_amount >= (0)::numeric) AND (refunded_amount >= (0)::numeric))),
    CONSTRAINT chk_tenant_deposits_deduction_logic CHECK (((deduction_amount = (0)::numeric) OR (deduction_reason IS NOT NULL))),
    CONSTRAINT chk_tenant_deposits_refund_time_consistency CHECK (((refunded_amount = (0)::numeric) OR (refunded_at IS NOT NULL))),
    CONSTRAINT chk_tenant_deposits_status CHECK ((status = ANY (ARRAY['HELD'::text, 'REFUND_PENDING'::text, 'REFUNDED'::text, 'PARTIAL_REFUNDED'::text, 'DEDUCTED'::text])))
);


ALTER TABLE kost.tenant_deposits OWNER TO postgres;

--
-- Name: tenant_deposits_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.tenant_deposits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.tenant_deposits_id_seq OWNER TO postgres;

--
-- Name: tenant_deposits_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.tenant_deposits_id_seq OWNED BY kost.tenant_deposits.id;


--
-- Name: tenants; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.tenants (
    id bigint NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    email text,
    id_number text,
    date_of_birth date,
    gender text,
    occupation text,
    organization_name text,
    origin_city text,
    stay_purpose text,
    lead_source text,
    home_address text,
    emergency_contact_name text,
    emergency_contact_phone text,
    emergency_contact_relation text,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    CONSTRAINT chk_tenants_phone_format CHECK ((phone ~ '^[+0-9]{8,20}$'::text))
);


ALTER TABLE kost.tenants OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.tenants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.tenants_id_seq OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.tenants_id_seq OWNED BY kost.tenants.id;


--
-- Name: ticket_attachments; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.ticket_attachments (
    id bigint NOT NULL,
    ticket_id bigint NOT NULL,
    message_id bigint,
    file_id bigint NOT NULL,
    original_name text,
    mime_type text,
    file_size_bytes bigint,
    storage_key text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_ticket_attachments_message_optional CHECK (((message_id IS NULL) OR (message_id > 0)))
);


ALTER TABLE kost.ticket_attachments OWNER TO postgres;

--
-- Name: ticket_attachments_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.ticket_attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.ticket_attachments_id_seq OWNER TO postgres;

--
-- Name: ticket_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.ticket_attachments_id_seq OWNED BY kost.ticket_attachments.id;


--
-- Name: ticket_messages; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.ticket_messages (
    id bigint NOT NULL,
    ticket_id bigint NOT NULL,
    sender_type text NOT NULL,
    sender_tenant_id bigint,
    sender_user_id bigint,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_ticket_messages_sender_consistency CHECK ((((sender_type = 'TENANT'::text) AND (sender_tenant_id IS NOT NULL) AND (sender_user_id IS NULL)) OR ((sender_type = 'ADMIN'::text) AND (sender_user_id IS NOT NULL) AND (sender_tenant_id IS NULL)))),
    CONSTRAINT chk_ticket_messages_sender_type CHECK ((sender_type = ANY (ARRAY['TENANT'::text, 'ADMIN'::text])))
);


ALTER TABLE kost.ticket_messages OWNER TO postgres;

--
-- Name: ticket_messages_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.ticket_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.ticket_messages_id_seq OWNER TO postgres;

--
-- Name: ticket_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.ticket_messages_id_seq OWNED BY kost.ticket_messages.id;


--
-- Name: tickets; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.tickets (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    stay_id bigint,
    category text NOT NULL,
    priority text DEFAULT 'NORMAL'::text NOT NULL,
    status text DEFAULT 'OPEN'::text NOT NULL,
    title text,
    description text NOT NULL,
    preferred_time_note text,
    assigned_to bigint,
    closed_at timestamp with time zone,
    closed_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_tickets_category CHECK ((category = ANY (ARRAY['AC'::text, 'BOCOR'::text, 'WIFI'::text, 'KUNCI'::text, 'LISTRIK'::text, 'AIR'::text, 'KEBERSIHAN'::text, 'LAINNYA'::text]))),
    CONSTRAINT chk_tickets_priority CHECK ((priority = ANY (ARRAY['LOW'::text, 'NORMAL'::text, 'HIGH'::text, 'URGENT'::text]))),
    CONSTRAINT chk_tickets_status CHECK ((status = ANY (ARRAY['OPEN'::text, 'IN_PROGRESS'::text, 'NEED_INFO'::text, 'DONE'::text, 'CLOSED'::text])))
);


ALTER TABLE kost.tickets OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.tickets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.tickets_id_seq OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.tickets_id_seq OWNED BY kost.tickets.id;


--
-- Name: users; Type: TABLE; Schema: kost; Owner: postgres
--

CREATE TABLE kost.users (
    id bigint NOT NULL,
    username text NOT NULL,
    full_name text NOT NULL,
    role text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_users_role CHECK ((role = ANY (ARRAY['ADMIN'::text, 'MANAGER'::text, 'STAFF'::text])))
);


ALTER TABLE kost.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: kost; Owner: postgres
--

CREATE SEQUENCE kost.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kost.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: kost; Owner: postgres
--

ALTER SEQUENCE kost.users_id_seq OWNED BY kost.users.id;


--
-- Name: v_electricity_tariff_current; Type: VIEW; Schema: kost; Owner: postgres
--

CREATE VIEW kost.v_electricity_tariff_current AS
 SELECT id,
    effective_from,
    price_per_kwh,
    note,
    created_at
   FROM kost.electricity_tariffs t1
  ORDER BY effective_from DESC
 LIMIT 1;


ALTER VIEW kost.v_electricity_tariff_current OWNER TO postgres;

--
-- Name: v_electricity_tariffs; Type: VIEW; Schema: kost; Owner: postgres
--

CREATE VIEW kost.v_electricity_tariffs AS
 SELECT effective_from,
    price_per_kwh
   FROM kost.electricity_tariffs
  ORDER BY effective_from DESC;


ALTER VIEW kost.v_electricity_tariffs OWNER TO postgres;

--
-- Name: v_invoice_electricity_debug; Type: VIEW; Schema: kost; Owner: postgres
--

CREATE VIEW kost.v_invoice_electricity_debug AS
 SELECT i.id AS invoice_id,
    i.stay_id,
    i.period_start,
    i.period_end,
    i.status,
    ie.room_id,
    ie.start_kwh,
    ie.end_kwh,
    ie.kwh_used,
    ie.overage_kwh,
    ie.tariff_per_kwh,
    ie.overage_amount
   FROM (kost.invoices i
     LEFT JOIN kost.invoice_electricity ie ON ((ie.invoice_id = i.id)));


ALTER VIEW kost.v_invoice_electricity_debug OWNER TO postgres;

--
-- Name: v_rooms_admin; Type: VIEW; Schema: kost; Owner: postgres
--

CREATE VIEW kost.v_rooms_admin AS
 SELECT r.id,
    r.code,
    r.floor,
    r.position_zone,
    r.status,
    r.notes,
    r.created_at,
    r.updated_at,
    rt.id AS room_type_id,
    rt.code AS room_type_code,
    rt.name AS room_type_name,
    rt.base_monthly_price,
    (s.id IS NOT NULL) AS is_occupied,
    s.tenant_id AS active_tenant_id,
    s.check_in_at AS active_check_in_at
   FROM ((kost.rooms r
     JOIN kost.room_types rt ON ((rt.id = r.room_type_id)))
     LEFT JOIN kost.stays s ON (((s.room_id = r.id) AND (s.status = 'ACTIVE'::text))));


ALTER VIEW kost.v_rooms_admin OWNER TO postgres;

--
-- Name: amenities id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.amenities ALTER COLUMN id SET DEFAULT nextval('kost.amenities_id_seq'::regclass);


--
-- Name: announcement_ack id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.announcement_ack ALTER COLUMN id SET DEFAULT nextval('kost.announcement_ack_id_seq'::regclass);


--
-- Name: announcements id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.announcements ALTER COLUMN id SET DEFAULT nextval('kost.announcements_id_seq'::regclass);


--
-- Name: common_amenities id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.common_amenities ALTER COLUMN id SET DEFAULT nextval('kost.common_amenities_id_seq'::regclass);


--
-- Name: credit_applications id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.credit_applications ALTER COLUMN id SET DEFAULT nextval('kost.credit_applications_id_seq'::regclass);


--
-- Name: credit_movements id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.credit_movements ALTER COLUMN id SET DEFAULT nextval('kost.credit_movements_id_seq'::regclass);


--
-- Name: deposit_movements id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.deposit_movements ALTER COLUMN id SET DEFAULT nextval('kost.deposit_movements_id_seq'::regclass);


--
-- Name: electricity_tariffs id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.electricity_tariffs ALTER COLUMN id SET DEFAULT nextval('kost.electricity_tariffs_id_seq'::regclass);


--
-- Name: inventory_items id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_items ALTER COLUMN id SET DEFAULT nextval('kost.inventory_items_id_seq'::regclass);


--
-- Name: inventory_locations id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_locations ALTER COLUMN id SET DEFAULT nextval('kost.inventory_locations_id_seq'::regclass);


--
-- Name: inventory_movements id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_movements ALTER COLUMN id SET DEFAULT nextval('kost.inventory_movements_id_seq'::regclass);


--
-- Name: invoice_electricity id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_electricity ALTER COLUMN id SET DEFAULT nextval('kost.invoice_electricity_id_seq'::regclass);


--
-- Name: invoice_items id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_items ALTER COLUMN id SET DEFAULT nextval('kost.invoice_items_id_seq'::regclass);


--
-- Name: invoice_status_history id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_status_history ALTER COLUMN id SET DEFAULT nextval('kost.invoice_status_history_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoices ALTER COLUMN id SET DEFAULT nextval('kost.invoices_id_seq'::regclass);


--
-- Name: meter_readings id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.meter_readings ALTER COLUMN id SET DEFAULT nextval('kost.meter_readings_id_seq'::regclass);


--
-- Name: payment_submission_files id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.payment_submission_files ALTER COLUMN id SET DEFAULT nextval('kost.payment_submission_files_id_seq'::regclass);


--
-- Name: payment_submissions id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.payment_submissions ALTER COLUMN id SET DEFAULT nextval('kost.payment_submissions_id_seq'::regclass);


--
-- Name: payment_verifications id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.payment_verifications ALTER COLUMN id SET DEFAULT nextval('kost.payment_verifications_id_seq'::regclass);


--
-- Name: room_amenities id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.room_amenities ALTER COLUMN id SET DEFAULT nextval('kost.room_amenities_id_seq'::regclass);


--
-- Name: room_assets id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.room_assets ALTER COLUMN id SET DEFAULT nextval('kost.room_assets_id_seq'::regclass);


--
-- Name: room_types id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.room_types ALTER COLUMN id SET DEFAULT nextval('kost.room_types_id_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.rooms ALTER COLUMN id SET DEFAULT nextval('kost.rooms_id_seq'::regclass);


--
-- Name: stays id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.stays ALTER COLUMN id SET DEFAULT nextval('kost.stays_id_seq'::regclass);


--
-- Name: tenant_deposits id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tenant_deposits ALTER COLUMN id SET DEFAULT nextval('kost.tenant_deposits_id_seq'::regclass);


--
-- Name: tenants id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tenants ALTER COLUMN id SET DEFAULT nextval('kost.tenants_id_seq'::regclass);


--
-- Name: ticket_attachments id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.ticket_attachments ALTER COLUMN id SET DEFAULT nextval('kost.ticket_attachments_id_seq'::regclass);


--
-- Name: ticket_messages id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.ticket_messages ALTER COLUMN id SET DEFAULT nextval('kost.ticket_messages_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tickets ALTER COLUMN id SET DEFAULT nextval('kost.tickets_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.users ALTER COLUMN id SET DEFAULT nextval('kost.users_id_seq'::regclass);


--
-- Name: amenities amenities_code_key; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.amenities
    ADD CONSTRAINT amenities_code_key UNIQUE (code);


--
-- Name: amenities amenities_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.amenities
    ADD CONSTRAINT amenities_pkey PRIMARY KEY (id);


--
-- Name: announcement_ack announcement_ack_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.announcement_ack
    ADD CONSTRAINT announcement_ack_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: common_amenities common_amenities_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.common_amenities
    ADD CONSTRAINT common_amenities_pkey PRIMARY KEY (id);


--
-- Name: credit_applications credit_applications_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.credit_applications
    ADD CONSTRAINT credit_applications_pkey PRIMARY KEY (id);


--
-- Name: credit_movements credit_movements_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.credit_movements
    ADD CONSTRAINT credit_movements_pkey PRIMARY KEY (id);


--
-- Name: deposit_movements deposit_movements_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.deposit_movements
    ADD CONSTRAINT deposit_movements_pkey PRIMARY KEY (id);


--
-- Name: electricity_tariffs electricity_tariffs_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.electricity_tariffs
    ADD CONSTRAINT electricity_tariffs_pkey PRIMARY KEY (id);


--
-- Name: inventory_balances inventory_balances_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_balances
    ADD CONSTRAINT inventory_balances_pkey PRIMARY KEY (item_id, location_id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_sku_key; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_items
    ADD CONSTRAINT inventory_items_sku_key UNIQUE (sku);


--
-- Name: inventory_locations inventory_locations_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_locations
    ADD CONSTRAINT inventory_locations_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: invoice_electricity invoice_electricity_invoice_id_key; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_electricity
    ADD CONSTRAINT invoice_electricity_invoice_id_key UNIQUE (invoice_id);


--
-- Name: invoice_electricity invoice_electricity_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_electricity
    ADD CONSTRAINT invoice_electricity_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoice_status_history invoice_status_history_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_status_history
    ADD CONSTRAINT invoice_status_history_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: meter_readings meter_readings_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.meter_readings
    ADD CONSTRAINT meter_readings_pkey PRIMARY KEY (id);


--
-- Name: payment_submission_files payment_submission_files_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.payment_submission_files
    ADD CONSTRAINT payment_submission_files_pkey PRIMARY KEY (id);


--
-- Name: payment_submissions payment_submissions_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.payment_submissions
    ADD CONSTRAINT payment_submissions_pkey PRIMARY KEY (id);


--
-- Name: payment_verifications payment_verifications_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.payment_verifications
    ADD CONSTRAINT payment_verifications_pkey PRIMARY KEY (id);


--
-- Name: room_amenities room_amenities_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.room_amenities
    ADD CONSTRAINT room_amenities_pkey PRIMARY KEY (id);


--
-- Name: room_assets room_assets_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.room_assets
    ADD CONSTRAINT room_assets_pkey PRIMARY KEY (id);


--
-- Name: room_types room_types_code_key; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.room_types
    ADD CONSTRAINT room_types_code_key UNIQUE (code);


--
-- Name: room_types room_types_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.room_types
    ADD CONSTRAINT room_types_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_code_key; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.rooms
    ADD CONSTRAINT rooms_code_key UNIQUE (code);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: stays stays_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.stays
    ADD CONSTRAINT stays_pkey PRIMARY KEY (id);


--
-- Name: tenant_credits tenant_credits_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tenant_credits
    ADD CONSTRAINT tenant_credits_pkey PRIMARY KEY (tenant_id);


--
-- Name: tenant_deposits tenant_deposits_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tenant_deposits
    ADD CONSTRAINT tenant_deposits_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: ticket_attachments ticket_attachments_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.ticket_attachments
    ADD CONSTRAINT ticket_attachments_pkey PRIMARY KEY (id);


--
-- Name: ticket_messages ticket_messages_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.ticket_messages
    ADD CONSTRAINT ticket_messages_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: amenities uniq_amenities_code; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.amenities
    ADD CONSTRAINT uniq_amenities_code UNIQUE (code);


--
-- Name: announcement_ack uniq_announcement_ack; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.announcement_ack
    ADD CONSTRAINT uniq_announcement_ack UNIQUE (announcement_id, tenant_id);


--
-- Name: electricity_tariffs uniq_electricity_tariffs_effective_from; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.electricity_tariffs
    ADD CONSTRAINT uniq_electricity_tariffs_effective_from UNIQUE (effective_from);


--
-- Name: payment_submission_files uniq_payment_submission_files; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.payment_submission_files
    ADD CONSTRAINT uniq_payment_submission_files UNIQUE (submission_id, file_id);


--
-- Name: room_amenities uniq_room_amenities_room_amenity; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.room_amenities
    ADD CONSTRAINT uniq_room_amenities_room_amenity UNIQUE (room_id, amenity_id);


--
-- Name: rooms uniq_rooms_code; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.rooms
    ADD CONSTRAINT uniq_rooms_code UNIQUE (code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_amenities_category; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_amenities_category ON kost.amenities USING btree (category);


--
-- Name: idx_amenities_is_active; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_amenities_is_active ON kost.amenities USING btree (is_active);


--
-- Name: idx_announcement_ack_announcement_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_announcement_ack_announcement_id ON kost.announcement_ack USING btree (announcement_id);


--
-- Name: idx_announcement_ack_tenant_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_announcement_ack_tenant_id ON kost.announcement_ack USING btree (tenant_id);


--
-- Name: idx_announcements_active_window; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_announcements_active_window ON kost.announcements USING btree (starts_at, expires_at);


--
-- Name: idx_announcements_pinned_created_at; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_announcements_pinned_created_at ON kost.announcements USING btree (is_pinned DESC, created_at DESC);


--
-- Name: idx_common_amenities_amenity_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_common_amenities_amenity_id ON kost.common_amenities USING btree (amenity_id);


--
-- Name: idx_credit_applications_applied_at; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_credit_applications_applied_at ON kost.credit_applications USING btree (applied_at DESC);


--
-- Name: idx_credit_applications_invoice_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_credit_applications_invoice_id ON kost.credit_applications USING btree (invoice_id);


--
-- Name: idx_credit_applications_tenant_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_credit_applications_tenant_id ON kost.credit_applications USING btree (tenant_id);


--
-- Name: idx_credit_movements_tenant_time; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_credit_movements_tenant_time ON kost.credit_movements USING btree (tenant_id, created_at DESC);


--
-- Name: idx_credit_movements_type_time; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_credit_movements_type_time ON kost.credit_movements USING btree (movement_type, created_at DESC);


--
-- Name: idx_deposit_movements_deposit_time; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_deposit_movements_deposit_time ON kost.deposit_movements USING btree (tenant_deposit_id, created_at DESC);


--
-- Name: idx_electricity_tariffs_effective_from; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_electricity_tariffs_effective_from ON kost.electricity_tariffs USING btree (effective_from DESC);


--
-- Name: idx_invoice_electricity_room_period; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_invoice_electricity_room_period ON kost.invoice_electricity USING btree (room_id, period_start);


--
-- Name: idx_invoice_items_invoice_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_invoice_items_invoice_id ON kost.invoice_items USING btree (invoice_id);


--
-- Name: idx_invoice_items_invoice_type; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_invoice_items_invoice_type ON kost.invoice_items USING btree (invoice_id, item_type);


--
-- Name: idx_invoice_items_type; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_invoice_items_type ON kost.invoice_items USING btree (item_type);


--
-- Name: idx_invoice_status_history_invoice_time; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_invoice_status_history_invoice_time ON kost.invoice_status_history USING btree (invoice_id, changed_at DESC);


--
-- Name: idx_invoices_due_date_status; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_invoices_due_date_status ON kost.invoices USING btree (due_date, status);


--
-- Name: idx_invoices_open_due_date; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_invoices_open_due_date ON kost.invoices USING btree (due_date) WHERE ((status)::text = ANY ((ARRAY['ISSUED'::character varying, 'OVERDUE'::character varying, 'UNDERPAID'::character varying, 'PARTIAL'::character varying])::text[]));


--
-- Name: idx_invoices_period; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_invoices_period ON kost.invoices USING btree (period_start, period_end);


--
-- Name: idx_invoices_stay_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_invoices_stay_id ON kost.invoices USING btree (stay_id);


--
-- Name: idx_invoices_stay_period_start_desc; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_invoices_stay_period_start_desc ON kost.invoices USING btree (stay_id, period_start DESC);


--
-- Name: idx_invoices_stay_status_due; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_invoices_stay_status_due ON kost.invoices USING btree (stay_id, status, due_date);


--
-- Name: idx_meter_readings_room_time; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_meter_readings_room_time ON kost.meter_readings USING btree (room_id, reading_at DESC);


--
-- Name: idx_payment_submission_files_storage_key; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_payment_submission_files_storage_key ON kost.payment_submission_files USING btree (storage_key);


--
-- Name: idx_payment_submission_files_submission_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_payment_submission_files_submission_id ON kost.payment_submission_files USING btree (submission_id);


--
-- Name: idx_payment_submissions_invoice_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_payment_submissions_invoice_id ON kost.payment_submissions USING btree (invoice_id);


--
-- Name: idx_payment_submissions_invoice_status_time; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_payment_submissions_invoice_status_time ON kost.payment_submissions USING btree (invoice_id, status, created_at DESC);


--
-- Name: idx_payment_submissions_status_created_at; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_payment_submissions_status_created_at ON kost.payment_submissions USING btree (status, created_at DESC);


--
-- Name: idx_payment_verifications_result; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_payment_verifications_result ON kost.payment_verifications USING btree (result);


--
-- Name: idx_payment_verifications_verified_at; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_payment_verifications_verified_at ON kost.payment_verifications USING btree (verified_at DESC);


--
-- Name: idx_room_amenities_amenity_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_room_amenities_amenity_id ON kost.room_amenities USING btree (amenity_id);


--
-- Name: idx_room_amenities_room_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_room_amenities_room_id ON kost.room_amenities USING btree (room_id);


--
-- Name: idx_room_assets_assigned_at; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_room_assets_assigned_at ON kost.room_assets USING btree (assigned_at DESC);


--
-- Name: idx_room_assets_inventory_item_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_room_assets_inventory_item_id ON kost.room_assets USING btree (inventory_item_id);


--
-- Name: idx_room_assets_room_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_room_assets_room_id ON kost.room_assets USING btree (room_id);


--
-- Name: idx_room_assets_status; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_room_assets_status ON kost.room_assets USING btree (status);


--
-- Name: idx_room_types_is_active; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_room_types_is_active ON kost.room_types USING btree (is_active);


--
-- Name: idx_room_types_is_capsule; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_room_types_is_capsule ON kost.room_types USING btree (is_capsule);


--
-- Name: idx_rooms_floor; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_rooms_floor ON kost.rooms USING btree (floor);


--
-- Name: idx_rooms_position_zone; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_rooms_position_zone ON kost.rooms USING btree (position_zone);


--
-- Name: idx_rooms_room_type_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_rooms_room_type_id ON kost.rooms USING btree (room_type_id);


--
-- Name: idx_rooms_status; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_rooms_status ON kost.rooms USING btree (status);


--
-- Name: idx_stays_active_room_checkin; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_stays_active_room_checkin ON kost.stays USING btree (room_id, check_in_at) WHERE (status = 'ACTIVE'::text);


--
-- Name: idx_stays_active_tenant_checkin; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_stays_active_tenant_checkin ON kost.stays USING btree (tenant_id, check_in_at) WHERE (status = 'ACTIVE'::text);


--
-- Name: idx_stays_check_in; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_stays_check_in ON kost.stays USING btree (check_in_at);


--
-- Name: idx_stays_checkin; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_stays_checkin ON kost.stays USING btree (check_in_at DESC);


--
-- Name: idx_stays_monthly_active_anchor; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_stays_monthly_active_anchor ON kost.stays USING btree (billing_anchor_day, check_in_at) WHERE ((status = 'ACTIVE'::text) AND (rent_period = 'MONTHLY'::text));


--
-- Name: idx_stays_room_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_stays_room_id ON kost.stays USING btree (room_id);


--
-- Name: idx_stays_status_checkin; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_stays_status_checkin ON kost.stays USING btree (status, check_in_at DESC);


--
-- Name: idx_stays_tenant_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_stays_tenant_id ON kost.stays USING btree (tenant_id);


--
-- Name: idx_tenant_credits_balance; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_tenant_credits_balance ON kost.tenant_credits USING btree (balance);


--
-- Name: idx_tenant_deposits_status; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_tenant_deposits_status ON kost.tenant_deposits USING btree (status);


--
-- Name: idx_tenant_deposits_stay_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_tenant_deposits_stay_id ON kost.tenant_deposits USING btree (stay_id);


--
-- Name: idx_tenant_deposits_tenant_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_tenant_deposits_tenant_id ON kost.tenant_deposits USING btree (tenant_id);


--
-- Name: idx_tenants_full_name; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_tenants_full_name ON kost.tenants USING btree (full_name);


--
-- Name: idx_tenants_occupation; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_tenants_occupation ON kost.tenants USING btree (occupation);


--
-- Name: idx_tenants_phone; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_tenants_phone ON kost.tenants USING btree (phone);


--
-- Name: idx_tenants_stay_purpose; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_tenants_stay_purpose ON kost.tenants USING btree (stay_purpose);


--
-- Name: idx_ticket_attachments_message_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_ticket_attachments_message_id ON kost.ticket_attachments USING btree (message_id);


--
-- Name: idx_ticket_attachments_storage_key; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_ticket_attachments_storage_key ON kost.ticket_attachments USING btree (storage_key);


--
-- Name: idx_ticket_attachments_ticket_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_ticket_attachments_ticket_id ON kost.ticket_attachments USING btree (ticket_id);


--
-- Name: idx_ticket_messages_ticket_id_created_at; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_ticket_messages_ticket_id_created_at ON kost.ticket_messages USING btree (ticket_id, created_at);


--
-- Name: idx_tickets_assigned_to_status; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_tickets_assigned_to_status ON kost.tickets USING btree (assigned_to, status);


--
-- Name: idx_tickets_category; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_tickets_category ON kost.tickets USING btree (category);


--
-- Name: idx_tickets_status_updated_at; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_tickets_status_updated_at ON kost.tickets USING btree (status, updated_at DESC);


--
-- Name: idx_tickets_tenant_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_tickets_tenant_id ON kost.tickets USING btree (tenant_id);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE INDEX idx_users_is_active ON kost.users USING btree (is_active);


--
-- Name: uniq_invoice_items_deposit_per_invoice; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE UNIQUE INDEX uniq_invoice_items_deposit_per_invoice ON kost.invoice_items USING btree (invoice_id) WHERE ((item_type)::text = 'DEPOSIT'::text);


--
-- Name: uniq_invoice_items_electric_overage_per_invoice; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE UNIQUE INDEX uniq_invoice_items_electric_overage_per_invoice ON kost.invoice_items USING btree (invoice_id) WHERE ((item_type)::text = 'ELECTRIC_OVERAGE'::text);


--
-- Name: uniq_invoice_items_rent_per_invoice; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE UNIQUE INDEX uniq_invoice_items_rent_per_invoice ON kost.invoice_items USING btree (invoice_id) WHERE ((item_type)::text = 'RENT'::text);


--
-- Name: uniq_invoices_stay_period; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE UNIQUE INDEX uniq_invoices_stay_period ON kost.invoices USING btree (stay_id, period_start, period_end);


--
-- Name: uniq_meter_readings_room_reading_at; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE UNIQUE INDEX uniq_meter_readings_room_reading_at ON kost.meter_readings USING btree (room_id, reading_at);


--
-- Name: uniq_payment_verifications_submission_id; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE UNIQUE INDEX uniq_payment_verifications_submission_id ON kost.payment_verifications USING btree (submission_id);


--
-- Name: uniq_room_assets_active_in_room; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE UNIQUE INDEX uniq_room_assets_active_in_room ON kost.room_assets USING btree (room_id, inventory_item_id) WHERE (status = 'IN_ROOM'::kost.room_asset_status);


--
-- Name: uniq_stays_active_room; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE UNIQUE INDEX uniq_stays_active_room ON kost.stays USING btree (room_id) WHERE (status = 'ACTIVE'::text);


--
-- Name: uniq_ticket_attachments_ticket_file_message; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE UNIQUE INDEX uniq_ticket_attachments_ticket_file_message ON kost.ticket_attachments USING btree (ticket_id, file_id, COALESCE(message_id, (0)::bigint));


--
-- Name: ux_kost_invoice_items_singleton; Type: INDEX; Schema: kost; Owner: postgres
--

CREATE UNIQUE INDEX ux_kost_invoice_items_singleton ON kost.invoice_items USING btree (invoice_id, item_type) WHERE ((item_type)::text = ANY ((ARRAY['RENT'::character varying, 'DEPOSIT'::character varying])::text[]));


--
-- Name: announcements trg_announcements_set_updated_at; Type: TRIGGER; Schema: kost; Owner: postgres
--

CREATE TRIGGER trg_announcements_set_updated_at BEFORE UPDATE ON kost.announcements FOR EACH ROW EXECUTE FUNCTION kost.set_updated_at();


--
-- Name: invoices trg_invoices_set_updated_at; Type: TRIGGER; Schema: kost; Owner: postgres
--

CREATE TRIGGER trg_invoices_set_updated_at BEFORE UPDATE ON kost.invoices FOR EACH ROW EXECUTE FUNCTION kost.set_updated_at();


--
-- Name: invoice_items trg_kost_invoice_items_recompute_total; Type: TRIGGER; Schema: kost; Owner: postgres
--

CREATE TRIGGER trg_kost_invoice_items_recompute_total AFTER INSERT OR DELETE OR UPDATE ON kost.invoice_items FOR EACH ROW EXECUTE FUNCTION kost.trg_invoice_items_recompute_total();


--
-- Name: payment_submissions trg_payment_submissions_set_updated_at; Type: TRIGGER; Schema: kost; Owner: postgres
--

CREATE TRIGGER trg_payment_submissions_set_updated_at BEFORE UPDATE ON kost.payment_submissions FOR EACH ROW EXECUTE FUNCTION kost.set_updated_at();


--
-- Name: room_assets trg_room_assets_touch_and_enforce; Type: TRIGGER; Schema: kost; Owner: postgres
--

CREATE TRIGGER trg_room_assets_touch_and_enforce BEFORE INSERT OR UPDATE ON kost.room_assets FOR EACH ROW EXECUTE FUNCTION kost.fn_room_assets_touch_and_enforce();


--
-- Name: room_types trg_room_types_set_updated_at; Type: TRIGGER; Schema: kost; Owner: postgres
--

CREATE TRIGGER trg_room_types_set_updated_at BEFORE UPDATE ON kost.room_types FOR EACH ROW EXECUTE FUNCTION kost.set_updated_at();


--
-- Name: room_types trg_room_types_updated_at; Type: TRIGGER; Schema: kost; Owner: postgres
--

CREATE TRIGGER trg_room_types_updated_at BEFORE UPDATE ON kost.room_types FOR EACH ROW EXECUTE FUNCTION kost.tg_set_updated_at();


--
-- Name: rooms trg_rooms_set_updated_at; Type: TRIGGER; Schema: kost; Owner: postgres
--

CREATE TRIGGER trg_rooms_set_updated_at BEFORE UPDATE ON kost.rooms FOR EACH ROW EXECUTE FUNCTION kost.set_updated_at();


--
-- Name: tenant_credits trg_tenant_credits_set_updated_at; Type: TRIGGER; Schema: kost; Owner: postgres
--

CREATE TRIGGER trg_tenant_credits_set_updated_at BEFORE UPDATE ON kost.tenant_credits FOR EACH ROW EXECUTE FUNCTION kost.set_updated_at();


--
-- Name: tenant_deposits trg_tenant_deposits_set_updated_at; Type: TRIGGER; Schema: kost; Owner: postgres
--

CREATE TRIGGER trg_tenant_deposits_set_updated_at BEFORE UPDATE ON kost.tenant_deposits FOR EACH ROW EXECUTE FUNCTION kost.set_updated_at();


--
-- Name: tenants trg_tenants_set_updated_at; Type: TRIGGER; Schema: kost; Owner: postgres
--

CREATE TRIGGER trg_tenants_set_updated_at BEFORE UPDATE ON kost.tenants FOR EACH ROW EXECUTE FUNCTION kost.set_updated_at();


--
-- Name: tickets trg_tickets_set_updated_at; Type: TRIGGER; Schema: kost; Owner: postgres
--

CREATE TRIGGER trg_tickets_set_updated_at BEFORE UPDATE ON kost.tickets FOR EACH ROW EXECUTE FUNCTION kost.set_updated_at();


--
-- Name: announcement_ack announcement_ack_announcement_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.announcement_ack
    ADD CONSTRAINT announcement_ack_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES kost.announcements(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: announcement_ack announcement_ack_tenant_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.announcement_ack
    ADD CONSTRAINT announcement_ack_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES kost.tenants(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: announcements announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.announcements
    ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: announcements announcements_updated_by_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.announcements
    ADD CONSTRAINT announcements_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: common_amenities common_amenities_amenity_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.common_amenities
    ADD CONSTRAINT common_amenities_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES kost.amenities(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: credit_applications credit_applications_applied_by_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.credit_applications
    ADD CONSTRAINT credit_applications_applied_by_fkey FOREIGN KEY (applied_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: credit_applications credit_applications_invoice_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.credit_applications
    ADD CONSTRAINT credit_applications_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES kost.invoices(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: credit_applications credit_applications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.credit_applications
    ADD CONSTRAINT credit_applications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES kost.tenants(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: credit_movements credit_movements_created_by_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.credit_movements
    ADD CONSTRAINT credit_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: credit_movements credit_movements_tenant_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.credit_movements
    ADD CONSTRAINT credit_movements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES kost.tenants(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: deposit_movements deposit_movements_created_by_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.deposit_movements
    ADD CONSTRAINT deposit_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: deposit_movements deposit_movements_tenant_deposit_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.deposit_movements
    ADD CONSTRAINT deposit_movements_tenant_deposit_id_fkey FOREIGN KEY (tenant_deposit_id) REFERENCES kost.tenant_deposits(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: stays fk_stays_created_by; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.stays
    ADD CONSTRAINT fk_stays_created_by FOREIGN KEY (created_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: tenants fk_tenants_created_by; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tenants
    ADD CONSTRAINT fk_tenants_created_by FOREIGN KEY (created_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: tenants fk_tenants_updated_by; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tenants
    ADD CONSTRAINT fk_tenants_updated_by FOREIGN KEY (updated_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: inventory_balances inventory_balances_item_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_balances
    ADD CONSTRAINT inventory_balances_item_id_fkey FOREIGN KEY (item_id) REFERENCES kost.inventory_items(id);


--
-- Name: inventory_balances inventory_balances_location_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_balances
    ADD CONSTRAINT inventory_balances_location_id_fkey FOREIGN KEY (location_id) REFERENCES kost.inventory_locations(id);


--
-- Name: inventory_locations inventory_locations_room_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_locations
    ADD CONSTRAINT inventory_locations_room_id_fkey FOREIGN KEY (room_id) REFERENCES kost.rooms(id);


--
-- Name: inventory_movements inventory_movements_from_location_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_movements
    ADD CONSTRAINT inventory_movements_from_location_id_fkey FOREIGN KEY (from_location_id) REFERENCES kost.inventory_locations(id);


--
-- Name: inventory_movements inventory_movements_item_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_movements
    ADD CONSTRAINT inventory_movements_item_id_fkey FOREIGN KEY (item_id) REFERENCES kost.inventory_items(id);


--
-- Name: inventory_movements inventory_movements_to_location_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.inventory_movements
    ADD CONSTRAINT inventory_movements_to_location_id_fkey FOREIGN KEY (to_location_id) REFERENCES kost.inventory_locations(id);


--
-- Name: invoice_electricity invoice_electricity_end_reading_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_electricity
    ADD CONSTRAINT invoice_electricity_end_reading_id_fkey FOREIGN KEY (end_reading_id) REFERENCES kost.meter_readings(id) ON DELETE RESTRICT;


--
-- Name: invoice_electricity invoice_electricity_invoice_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_electricity
    ADD CONSTRAINT invoice_electricity_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES kost.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_electricity invoice_electricity_room_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_electricity
    ADD CONSTRAINT invoice_electricity_room_id_fkey FOREIGN KEY (room_id) REFERENCES kost.rooms(id) ON DELETE RESTRICT;


--
-- Name: invoice_electricity invoice_electricity_start_reading_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_electricity
    ADD CONSTRAINT invoice_electricity_start_reading_id_fkey FOREIGN KEY (start_reading_id) REFERENCES kost.meter_readings(id) ON DELETE RESTRICT;


--
-- Name: invoice_items invoice_items_created_by_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_items
    ADD CONSTRAINT invoice_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES kost.invoices(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: invoice_status_history invoice_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_status_history
    ADD CONSTRAINT invoice_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: invoice_status_history invoice_status_history_invoice_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoice_status_history
    ADD CONSTRAINT invoice_status_history_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES kost.invoices(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: invoices invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoices
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: invoices invoices_stay_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoices
    ADD CONSTRAINT invoices_stay_id_fkey FOREIGN KEY (stay_id) REFERENCES kost.stays(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: invoices invoices_updated_by_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.invoices
    ADD CONSTRAINT invoices_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: meter_readings meter_readings_captured_by_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.meter_readings
    ADD CONSTRAINT meter_readings_captured_by_fkey FOREIGN KEY (captured_by) REFERENCES kost.users(id) ON DELETE SET NULL;


--
-- Name: meter_readings meter_readings_room_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.meter_readings
    ADD CONSTRAINT meter_readings_room_id_fkey FOREIGN KEY (room_id) REFERENCES kost.rooms(id) ON DELETE RESTRICT;


--
-- Name: payment_submission_files payment_submission_files_submission_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.payment_submission_files
    ADD CONSTRAINT payment_submission_files_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES kost.payment_submissions(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: payment_submissions payment_submissions_invoice_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.payment_submissions
    ADD CONSTRAINT payment_submissions_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES kost.invoices(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: payment_submissions payment_submissions_submitted_by_tenant_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.payment_submissions
    ADD CONSTRAINT payment_submissions_submitted_by_tenant_id_fkey FOREIGN KEY (submitted_by_tenant_id) REFERENCES kost.tenants(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: payment_submissions payment_submissions_submitted_by_user_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.payment_submissions
    ADD CONSTRAINT payment_submissions_submitted_by_user_id_fkey FOREIGN KEY (submitted_by_user_id) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: payment_verifications payment_verifications_submission_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.payment_verifications
    ADD CONSTRAINT payment_verifications_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES kost.payment_submissions(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: payment_verifications payment_verifications_verified_by_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.payment_verifications
    ADD CONSTRAINT payment_verifications_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: room_amenities room_amenities_amenity_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.room_amenities
    ADD CONSTRAINT room_amenities_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES kost.amenities(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: room_amenities room_amenities_room_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.room_amenities
    ADD CONSTRAINT room_amenities_room_id_fkey FOREIGN KEY (room_id) REFERENCES kost.rooms(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: room_assets room_assets_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.room_assets
    ADD CONSTRAINT room_assets_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES kost.inventory_items(id) ON DELETE RESTRICT;


--
-- Name: room_assets room_assets_room_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.room_assets
    ADD CONSTRAINT room_assets_room_id_fkey FOREIGN KEY (room_id) REFERENCES kost.rooms(id) ON DELETE RESTRICT;


--
-- Name: rooms rooms_room_type_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.rooms
    ADD CONSTRAINT rooms_room_type_id_fkey FOREIGN KEY (room_type_id) REFERENCES kost.room_types(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: stays stays_room_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.stays
    ADD CONSTRAINT stays_room_id_fkey FOREIGN KEY (room_id) REFERENCES kost.rooms(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: stays stays_tenant_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.stays
    ADD CONSTRAINT stays_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES kost.tenants(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: tenant_credits tenant_credits_tenant_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tenant_credits
    ADD CONSTRAINT tenant_credits_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES kost.tenants(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: tenant_deposits tenant_deposits_created_by_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tenant_deposits
    ADD CONSTRAINT tenant_deposits_created_by_fkey FOREIGN KEY (created_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: tenant_deposits tenant_deposits_stay_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tenant_deposits
    ADD CONSTRAINT tenant_deposits_stay_id_fkey FOREIGN KEY (stay_id) REFERENCES kost.stays(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: tenant_deposits tenant_deposits_tenant_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tenant_deposits
    ADD CONSTRAINT tenant_deposits_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES kost.tenants(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: ticket_attachments ticket_attachments_message_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.ticket_attachments
    ADD CONSTRAINT ticket_attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES kost.ticket_messages(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: ticket_attachments ticket_attachments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.ticket_attachments
    ADD CONSTRAINT ticket_attachments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES kost.tickets(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: ticket_messages ticket_messages_sender_tenant_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.ticket_messages
    ADD CONSTRAINT ticket_messages_sender_tenant_id_fkey FOREIGN KEY (sender_tenant_id) REFERENCES kost.tenants(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: ticket_messages ticket_messages_sender_user_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.ticket_messages
    ADD CONSTRAINT ticket_messages_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: ticket_messages ticket_messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.ticket_messages
    ADD CONSTRAINT ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES kost.tickets(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: tickets tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tickets
    ADD CONSTRAINT tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: tickets tickets_closed_by_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tickets
    ADD CONSTRAINT tickets_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES kost.users(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: tickets tickets_stay_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tickets
    ADD CONSTRAINT tickets_stay_id_fkey FOREIGN KEY (stay_id) REFERENCES kost.stays(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: tickets tickets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: kost; Owner: postgres
--

ALTER TABLE ONLY kost.tickets
    ADD CONSTRAINT tickets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES kost.tenants(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict YRYBh3el6at2EwQItKLbmFxqHUDSl5K4RPnnREvhVlMWRDISgY6fQITAFqABUNV

